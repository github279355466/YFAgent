import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  assertValidConfig,
  resolveRuntimeConfig,
} from '../../src/config/config.js';
import { YfConfigError } from '../../src/types/config.js';
import type { YfSdkConfig } from '../../src/types/config.js';

function validConfig(overrides: Partial<YfSdkConfig> = {}): YfSdkConfig {
  return {
    baseUrl: 'http://192.168.1.100',
    companyId: '50',
    tokenEnvVar: 'YF_TOKEN',
    servicePrefix: 'yf.',
    timeoutMs: 30000,
    warnOnSilentError: true,
    ...overrides,
  };
}

describe('validateConfig', () => {
  it('accepts valid config', () => {
    const result = validateConfig(validConfig());
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing baseUrl', () => {
    const result = validateConfig(validConfig({ baseUrl: '' }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'baseUrl')).toBe(true);
  });

  it('rejects baseUrl with trailing path', () => {
    const result = validateConfig(validConfig({ baseUrl: 'http://192.168.1.100/YFOAP/openapi.dll' }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'baseUrl' && e.reason.includes('路径'))).toBe(true);
  });

  it('rejects non-http baseUrl', () => {
    const result = validateConfig(validConfig({ baseUrl: 'ftp://server' }));
    expect(result.ok).toBe(false);
  });

  it('rejects missing companyId', () => {
    const result = validateConfig(validConfig({ companyId: '' }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'companyId')).toBe(true);
  });

  it('rejects missing tokenEnvVar', () => {
    const result = validateConfig(validConfig({ tokenEnvVar: '' }));
    expect(result.ok).toBe(false);
  });

  it('rejects invalid tokenEnvVar name', () => {
    const result = validateConfig(validConfig({ tokenEnvVar: '123INVALID' }));
    expect(result.ok).toBe(false);
  });

  it('rejects wrong servicePrefix', () => {
    const result = validateConfig(validConfig({ servicePrefix: 'yz.' }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.reason.includes('易飞'))).toBe(true);
  });

  it('rejects timeoutMs <= 0', () => {
    const result = validateConfig(validConfig({ timeoutMs: 0 }));
    expect(result.ok).toBe(false);
  });

  it('collects multiple violations at once', () => {
    const result = validateConfig(validConfig({ baseUrl: '', companyId: '', tokenEnvVar: '' }));
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('assertValidConfig', () => {
  it('does not throw for valid config', () => {
    expect(() => assertValidConfig(validConfig())).not.toThrow();
  });

  it('throws YfConfigError for invalid config', () => {
    expect(() => assertValidConfig(validConfig({ baseUrl: '' }))).toThrow(YfConfigError);
  });
});

describe('resolveRuntimeConfig', () => {
  it('resolves token from environment', () => {
    const env = { YF_TOKEN: 'my-secret-token' };
    const resolved = resolveRuntimeConfig(validConfig(), env);
    expect(resolved.token).toBe('my-secret-token');
    expect(resolved.endpoint).toContain('/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost');
  });

  it('strips trailing slash from baseUrl', () => {
    const env = { YF_TOKEN: 'tok' };
    const resolved = resolveRuntimeConfig(validConfig({ baseUrl: 'http://192.168.1.100/' }), env);
    expect(resolved.baseUrl).toBe('http://192.168.1.100');
  });

  it('throws when token env var is not set', () => {
    expect(() => resolveRuntimeConfig(validConfig(), {})).toThrow(YfConfigError);
  });

  it('throws when token env var is empty', () => {
    expect(() => resolveRuntimeConfig(validConfig(), { YF_TOKEN: '' })).toThrow(YfConfigError);
  });
});
