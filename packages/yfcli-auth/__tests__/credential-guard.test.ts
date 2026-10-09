import { describe, it, expect } from 'vitest';
import {
  FORBIDDEN_KEYS,
  scanForPlaintextCredentials,
  assertNoPlaintextCredentials,
  assertLimitsRequired,
  assertAllowedTemplatesNotEmpty,
  resolveCredentialFromEnv,
  validateCredentialPolicy,
} from '../src/credential-guard.js';
import { CredentialViolationError } from '../src/types.js';
import type { AuthConfig } from '../src/types.js';

// ---------------------------------------------------------------------------
// 辅助工厂
// ---------------------------------------------------------------------------

function makeValidConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  return {
    baseUrl: 'http://192.168.1.100',
    companyId: '50',
    tokenEnvVar: 'YF_TOKEN',
    timeoutMs: 30000,
    limits: { maxRequestsPerMinute: 60, maxBatchSize: 100 },
    allowedTemplates: ['sales_order_query'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// FORBIDDEN_KEYS
// ---------------------------------------------------------------------------

describe('FORBIDDEN_KEYS', () => {
  it('应包含常见凭据字段名', () => {
    expect(FORBIDDEN_KEYS).toContain('password');
    expect(FORBIDDEN_KEYS).toContain('secret');
    expect(FORBIDDEN_KEYS).toContain('token');
    expect(FORBIDDEN_KEYS).toContain('api_key');
    expect(FORBIDDEN_KEYS).toContain('private_key');
  });

  it('不应包含合法字段名如 tokenEnvVar', () => {
    expect(FORBIDDEN_KEYS).not.toContain('tokenenvvar');
    expect(FORBIDDEN_KEYS).not.toContain('baseurl');
    expect(FORBIDDEN_KEYS).not.toContain('companyid');
  });
});

// ---------------------------------------------------------------------------
// scanForPlaintextCredentials
// ---------------------------------------------------------------------------

describe('scanForPlaintextCredentials', () => {
  it('合法配置应返回空数组', () => {
    const config = { baseUrl: 'http://x', tokenEnvVar: 'MY_TOKEN', companyId: '50' };
    expect(scanForPlaintextCredentials(config)).toEqual([]);
  });

  it('含 password 字段应检出', () => {
    const config = { password: 'abc123', baseUrl: 'http://x' };
    const violations = scanForPlaintextCredentials(config);
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain('password');
  });

  it('嵌套对象中的 secret 应检出', () => {
    const config = { db: { host: 'localhost', secret: 's3cret' } };
    const violations = scanForPlaintextCredentials(config);
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain('db.secret');
  });

  it('多个违规应全部收集', () => {
    const config = { password: 'a', api_key: 'b', nested: { token: 'c' } };
    const violations = scanForPlaintextCredentials(config);
    expect(violations.length).toBe(3);
  });

  it('大小写不敏感匹配', () => {
    const config = { PASSWORD: 'x', Secret: 'y' };
    const violations = scanForPlaintextCredentials(config);
    expect(violations.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// assertNoPlaintextCredentials
// ---------------------------------------------------------------------------

describe('assertNoPlaintextCredentials', () => {
  it('合法配置不抛错', () => {
    expect(() => assertNoPlaintextCredentials({ baseUrl: 'http://x' })).not.toThrow();
  });

  it('含明文凭据抛 CredentialViolationError', () => {
    expect(() => assertNoPlaintextCredentials({ password: 'abc' }))
      .toThrow(CredentialViolationError);
  });
});

// ---------------------------------------------------------------------------
// assertLimitsRequired
// ---------------------------------------------------------------------------

describe('assertLimitsRequired', () => {
  it('有效 limits 不抛错', () => {
    const config = makeValidConfig();
    expect(() => assertLimitsRequired(config)).not.toThrow();
  });

  it('limits 缺失抛错', () => {
    const config = makeValidConfig({ limits: undefined as unknown as AuthConfig['limits'] });
    expect(() => assertLimitsRequired(config)).toThrow(CredentialViolationError);
  });

  it('maxRequestsPerMinute 为 0 抛错', () => {
    const config = makeValidConfig({ limits: { maxRequestsPerMinute: 0, maxBatchSize: 100 } });
    expect(() => assertLimitsRequired(config)).toThrow(CredentialViolationError);
  });

  it('maxBatchSize 为负数抛错', () => {
    const config = makeValidConfig({ limits: { maxRequestsPerMinute: 60, maxBatchSize: -1 } });
    expect(() => assertLimitsRequired(config)).toThrow(CredentialViolationError);
  });

  it('maxRequestsPerMinute 为 Infinity 抛错', () => {
    const config = makeValidConfig({ limits: { maxRequestsPerMinute: Infinity, maxBatchSize: 100 } });
    expect(() => assertLimitsRequired(config)).toThrow(CredentialViolationError);
  });
});

// ---------------------------------------------------------------------------
// assertAllowedTemplatesNotEmpty
// ---------------------------------------------------------------------------

describe('assertAllowedTemplatesNotEmpty', () => {
  it('非空列表不抛错', () => {
    const config = makeValidConfig();
    expect(() => assertAllowedTemplatesNotEmpty(config)).not.toThrow();
  });

  it('空数组抛错', () => {
    const config = makeValidConfig({ allowedTemplates: [] });
    expect(() => assertAllowedTemplatesNotEmpty(config)).toThrow(CredentialViolationError);
  });

  it('undefined 抛错', () => {
    const config = makeValidConfig({ allowedTemplates: undefined as unknown as string[] });
    expect(() => assertAllowedTemplatesNotEmpty(config)).toThrow(CredentialViolationError);
  });
});

// ---------------------------------------------------------------------------
// resolveCredentialFromEnv
// ---------------------------------------------------------------------------

describe('resolveCredentialFromEnv', () => {
  it('环境变量存在时返回值', () => {
    const env = { MY_TOKEN: 'abc123' };
    expect(resolveCredentialFromEnv('MY_TOKEN', env)).toBe('abc123');
  });

  it('环境变量不存在返回 undefined', () => {
    expect(resolveCredentialFromEnv('MISSING', {})).toBeUndefined();
  });

  it('环境变量为空串返回 undefined', () => {
    expect(resolveCredentialFromEnv('EMPTY', { EMPTY: '' })).toBeUndefined();
  });

  it('环境变量为纯空白返回 undefined', () => {
    expect(resolveCredentialFromEnv('WS', { WS: '   ' })).toBeUndefined();
  });

  it('默认使用 process.env', () => {
    // 不设特定变量，应返回 undefined
    expect(resolveCredentialFromEnv('__YFAUTH_TEST_NONEXISTENT__')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateCredentialPolicy（集成）
// ---------------------------------------------------------------------------

describe('validateCredentialPolicy', () => {
  it('完全合法的配置不抛错', () => {
    expect(() => validateCredentialPolicy(makeValidConfig())).not.toThrow();
  });

  it('同时含明文密码 + 空模板列表，一次性收集所有违规', () => {
    const config = makeValidConfig({
      allowedTemplates: [],
    }) as Record<string, unknown>;
    (config as Record<string, unknown>)['password'] = 'leaked';

    try {
      validateCredentialPolicy(config as unknown as AuthConfig);
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(CredentialViolationError);
      const cve = err as CredentialViolationError;
      // 至少包含 password 和 allowedTemplates 两条违规
      expect(cve.violations.length).toBeGreaterThanOrEqual(2);
    }
  });
});
