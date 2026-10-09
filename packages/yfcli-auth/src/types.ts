/**
 * yfcli-auth 类型定义与自定义错误类。
 *
 * 设计原则：
 * - auth 包不依赖 sdk，定义自己的配置类型。
 * - token_expired 与 token_invalid 必须区分（AGENTS.md §真机实测硬约束 #3）。
 * - 所有错误类携带结构化字段，禁止只抛字符串。
 */

// ---------------------------------------------------------------------------
// 配置类型
// ---------------------------------------------------------------------------

/** auth 模块配置。调用方显式注入，不从文件/环境变量自动读取。 */
export interface AuthConfig {
  /** ERP OpenAPI 基础 URL（不含路径），如 http://192.168.1.100 */
  readonly baseUrl: string;

  /** 公司别（账套）编号，健康检查时写入 digi-datakey 头。 */
  readonly companyId: string;

  /** Token 来源的环境变量名。auth 模块从该变量读取 token 值。 */
  readonly tokenEnvVar: string;

  /** 单次请求超时（毫秒）。健康检查使用此值。 */
  readonly timeoutMs: number;

  /**
   * 速率限制配置。
   * 必填：缺失即抛错（YZCLI 教训 —— 无 limits 导致压测打挂 ERP）。
   */
  readonly limits: RateLimits;

  /**
   * 允许的 SQL 模板白名单。
   * 必填且非空：为空即抛错（YZCLI 教训 —— 空白名单 = 全放行）。
   */
  readonly allowedTemplates: readonly string[];
}

/** 速率限制。 */
export interface RateLimits {
  /** 每分钟最大请求数。 */
  readonly maxRequestsPerMinute: number;
  /** 单次批量操作最大条数。 */
  readonly maxBatchSize: number;
}

// ---------------------------------------------------------------------------
// Token 状态
// ---------------------------------------------------------------------------

/** Token 缓存条目。 */
export interface TokenState {
  /** Token 值。 */
  readonly token: string;
  /** 过期时间戳（毫秒）。undefined 表示未知过期时间（MVP 阶段常见）。 */
  readonly expiresAt: number | undefined;
  /** 设置时间戳（毫秒）。 */
  readonly setAt: number;
}

// ---------------------------------------------------------------------------
// 健康检查结果
// ---------------------------------------------------------------------------

/** ERP 连通性检查结果。 */
export interface HealthCheckResult {
  /** 是否连通。 */
  readonly ok: boolean;
  /** 往返延迟（毫秒）。超时时为 timeoutMs 的值。 */
  readonly latencyMs: number;
  /** 失败时的错误描述。ok=true 时为 undefined。 */
  readonly error: string | undefined;
}

// ---------------------------------------------------------------------------
// AuthProvider 接口
// ---------------------------------------------------------------------------

/** auth 模块对外契约。由 createAuth() 工厂返回。 */
export interface AuthProvider {
  /** 获取当前缓存的 token。过期则抛 TokenExpiredError。 */
  getToken(): string;
  /** 设置 token + 可选过期时间。 */
  setToken(token: string, expiresAt?: number): void;
  /** 清除缓存的 token。 */
  clearToken(): void;
  /** 检查 token 是否已过期。无 token 时返回 true。 */
  isExpired(): boolean;
  /** ERP 连通性健康检查。 */
  checkHealth(): Promise<HealthCheckResult>;
  /** 校验配置中的凭据红线。通过时静默返回，违规时抛 CredentialViolationError。 */
  validateCredentials(): void;
}

// ---------------------------------------------------------------------------
// 自定义错误类
// ---------------------------------------------------------------------------

/** Token 已过期。HTTP 401/403 或本地过期检测触发。 */
export class TokenExpiredError extends Error {
  public readonly code = 'TOKEN_EXPIRED';
  public constructor(message = 'Token 已过期，请重新获取') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Token 无效（非过期）。HTTP 500+HTML 或服务端明确拒绝触发。
 * 与 TokenExpiredError 区分：expired 可刷新，invalid 需人工介入。
 */
export class TokenInvalidError extends Error {
  public readonly code = 'TOKEN_INVALID';
  public readonly statusCode: number | undefined;
  public constructor(message = 'Token 无效，请检查凭据', statusCode?: number) {
    super(message);
    this.name = 'TokenInvalidError';
    this.statusCode = statusCode;
  }
}

/** ERP 连接失败（网络/超时/DNS 等）。 */
export class ErpConnectionError extends Error {
  public readonly code = 'ERP_CONNECTION_ERROR';
  public readonly statusCode: number | undefined;
  public constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ErpConnectionError';
    this.statusCode = statusCode;
  }
}

/** 凭据红线违规。配置含明文密码 / limits 缺失 / allowedTemplates 为空。 */
export class CredentialViolationError extends Error {
  public readonly code = 'CREDENTIAL_VIOLATION';
  public readonly violations: readonly string[];
  public constructor(violations: readonly string[]) {
    const detail = violations.map((v) => `- ${v}`).join('\n');
    super(`凭据红线违规（${violations.length} 项）：\n${detail}`);
    this.name = 'CredentialViolationError';
    this.violations = violations;
  }
}
