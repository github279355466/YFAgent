/**
 * 凭据红线守卫。
 *
 * 三条硬规则（YZCLI 教训 + AGENTS.md §工程纪律）：
 * 1. 配置文件禁止明文凭据（password / secret / token 值等）。
 * 2. limits 必填 —— 缺失即抛错，避免压测打挂 ERP。
 * 3. allowedTemplates 非空 —— 空白名单 = 全放行，比没有更危险。
 *
 * 密码只从环境变量取：resolveCredentialFromEnv()。
 */

import type { AuthConfig } from './types.js';
import { CredentialViolationError } from './types.js';

/**
 * 禁止在配置对象中以明文出现的字段名（小写匹配）。
 * 扫描时递归检查嵌套对象的所有 key。
 */
export const FORBIDDEN_KEYS: readonly string[] = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'access_key',
  'private_key',
  'credential',
] as const;

/**
 * 扫描配置对象，发现明文密码字段即收集违规项。
 *
 * 注意：这里检查的是「字段名」而非「字段值」。
 * tokenEnvVar 是合法字段（只存变量名），不会被误报。
 */
export function scanForPlaintextCredentials(
  obj: Record<string, unknown>,
  path = '',
): string[] {
  const violations: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    const lowerKey = key.toLowerCase();

    if (FORBIDDEN_KEYS.includes(lowerKey)) {
      // tokenEnvVar 是合法的（只存环境变量名），但 token 作为值字段不合法
      // 这里按 key 名判断，tokenEnvVar 不在 FORBIDDEN_KEYS 中
      violations.push(
        `字段 "${currentPath}" 疑似明文凭据（匹配 forbidden key "${lowerKey}"），` +
        `请改用环境变量引用`,
      );
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      violations.push(...scanForPlaintextCredentials(value as Record<string, unknown>, currentPath));
    }
  }

  return violations;
}

/**
 * 断言配置不含明文凭据。违规时抛 CredentialViolationError。
 */
export function assertNoPlaintextCredentials(config: Record<string, unknown>): void {
  const violations = scanForPlaintextCredentials(config);
  if (violations.length > 0) {
    throw new CredentialViolationError(violations);
  }
}

/**
 * 断言 limits 字段存在且有效。
 */
export function assertLimitsRequired(config: AuthConfig): void {
  if (!config.limits) {
    throw new CredentialViolationError([
      'limits 必填。缺失速率限制会导致压测打挂 ERP（YZCLI 教训）',
    ]);
  }
  if (!Number.isFinite(config.limits.maxRequestsPerMinute) || config.limits.maxRequestsPerMinute <= 0) {
    throw new CredentialViolationError([
      `limits.maxRequestsPerMinute 必须是正有限数，收到 ${String(config.limits.maxRequestsPerMinute)}`,
    ]);
  }
  if (!Number.isFinite(config.limits.maxBatchSize) || config.limits.maxBatchSize <= 0) {
    throw new CredentialViolationError([
      `limits.maxBatchSize 必须是正有限数，收到 ${String(config.limits.maxBatchSize)}`,
    ]);
  }
}

/**
 * 断言 allowedTemplates 非空。
 * YZCLI 教训：空白名单 = 全放行，比没有白名单更危险。
 */
export function assertAllowedTemplatesNotEmpty(config: AuthConfig): void {
  if (!config.allowedTemplates || config.allowedTemplates.length === 0) {
    throw new CredentialViolationError([
      'allowedTemplates 不能为空。空白名单等同于全放行，违反最小权限原则',
    ]);
  }
}

/**
 * 从环境变量解析凭据值。
 * 未设置或为空时返回 undefined，由调用方决定是抛错还是降级。
 */
export function resolveCredentialFromEnv(
  envVarName: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  const value = env[envVarName];
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }
  return value;
}

/**
 * 完整凭据校验：明文检查 + limits + allowedTemplates。
 * 一次性收集所有违规项，便于一次修完。
 */
export function validateCredentialPolicy(config: AuthConfig): void {
  const violations: string[] = [];

  // 1. 明文扫描
  violations.push(...scanForPlaintextCredentials(config as unknown as Record<string, unknown>));

  // 2. limits 检查
  try {
    assertLimitsRequired(config);
  } catch (err) {
    if (err instanceof CredentialViolationError) {
      violations.push(...err.violations);
    }
  }

  // 3. allowedTemplates 检查
  try {
    assertAllowedTemplatesNotEmpty(config);
  } catch (err) {
    if (err instanceof CredentialViolationError) {
      violations.push(...err.violations);
    }
  }

  if (violations.length > 0) {
    throw new CredentialViolationError(violations);
  }
}
