/**
 * yfcli-auth —— 易飞独立授权模块。
 *
 * 公开契约导出。外部消费者应只从此入口导入。
 */

// 类型
export type {
  AuthConfig,
  RateLimits,
  TokenState,
  HealthCheckResult,
  AuthProvider,
} from './types.js';

// 错误类
export {
  TokenExpiredError,
  TokenInvalidError,
  ErpConnectionError,
  CredentialViolationError,
} from './types.js';

// Token 管理
export { TokenManager } from './token-manager.js';

// 凭据守卫
export {
  FORBIDDEN_KEYS,
  scanForPlaintextCredentials,
  assertNoPlaintextCredentials,
  assertLimitsRequired,
  assertAllowedTemplatesNotEmpty,
  resolveCredentialFromEnv,
  validateCredentialPolicy,
} from './credential-guard.js';

// 错误分类
export {
  classifyHttpError,
  classifyHttpResponse,
  isHtmlResponse,
  type ClassifiedError,
} from './error-handler.js';

// 健康检查
export { checkErpConnectivity } from './health-check.js';

// 工厂
export { createAuth } from './auth-factory.js';
