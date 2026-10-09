/**
 * Auth 工厂函数。
 *
 * 组装 TokenManager + CredentialGuard + HealthCheck，
 * 返回统一的 AuthProvider 接口。
 *
 * 调用方只需：
 *   const auth = createAuth(config);
 *   auth.validateCredentials();  // 启动时校验
 *   auth.setToken(token);        // 注入 token
 *   const t = auth.getToken();   // 使用时获取
 */

import type { AuthConfig, AuthProvider, HealthCheckResult } from './types.js';
import { TokenManager } from './token-manager.js';
import { validateCredentialPolicy } from './credential-guard.js';
import { checkErpConnectivity } from './health-check.js';
import { resolveCredentialFromEnv } from './credential-guard.js';

/**
 * 创建 AuthProvider 实例。
 *
 * @param config auth 配置。必填字段已在类型层面约束。
 * @param env    环境变量容器。默认 process.env，测试时可注入 mock。
 */
export function createAuth(
  config: AuthConfig,
  env: Readonly<Record<string, string | undefined>> = process.env,
): AuthProvider {
  const tokenManager = new TokenManager();

  return {
    getToken(): string {
      return tokenManager.getToken();
    },

    setToken(token: string, expiresAt?: number): void {
      tokenManager.setToken(token, expiresAt);
    },

    clearToken(): void {
      tokenManager.clearToken();
    },

    isExpired(): boolean {
      return tokenManager.isExpired();
    },

    async checkHealth(): Promise<HealthCheckResult> {
      // 尝试从环境变量获取 token；若无则用空串（健康检查可能因 token 失败但能验证网络连通性）
      const token = resolveCredentialFromEnv(config.tokenEnvVar, env) ?? '';
      return checkErpConnectivity(
        config.baseUrl,
        config.companyId,
        token,
        config.timeoutMs,
      );
    },

    validateCredentials(): void {
      validateCredentialPolicy(config);
    },
  };
}
