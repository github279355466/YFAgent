/**
 * 配置类型 —— SDK 唯一不接受硬编码的入口。
 *
 * 设计前提（docs/COLLABORATION.md §五 + .env.example）：
 * - `base_url` / `company_id` / `token` 一律走配置，缺任一项**启动即失败**，
 *   不做静默降级（易助侧 client.ts 的硬编码前缀做法已被判定为待改造点）。
 * - `token` 只允许来自环境变量名，配置文件中不落明文。
 */

/** 配置来源。SDK 不读文件、不读环境变量，只接收已解析好的结构。 */
export interface YfSdkConfig {
  /**
   * OpenAPI 入口。
   * 易飞只有一个固定入口 URL 且**不带端口号**，路径大小写敏感。
   */
  readonly baseUrl: string;

  /**
   * 公司别（账套）编号，写入 `digi-datakey` 头。
   * 错误账套返回 `Can not found CompanyId(xxx) in DSCMB`。
   */
  readonly companyId: string;

  /**
   * 用户令牌，来源环境变量名。
   * 只存变量名，不存令牌值本身 —— 值在 resolve 阶段从 env 读出。
   */
  readonly tokenEnvVar: string;

  /**
   * 服务名前缀。易飞固定 `yf.`，与易助 `yz.` 互斥。
   * **必填**：缺省时启动失败，避免换产品线时全部调用失败而不自知。
   */
  readonly servicePrefix: string;

  /** 单次请求超时（毫秒）。文档未规定接口级超时，此为工程取值。 */
  readonly timeoutMs: number;

  /**
   * 是否在检测到静默错误特征（code=0 但空结果 / 枚举回传编码.中文）时输出 WARN。
   * 关闭仅用于批量压测，正式链路应保持开启。
   */
  readonly warnOnSilentError: boolean;
}

/** 配置校验结果。错误全部一次性收集，便于一次修完而非逐个撞。 */
export interface YfConfigValidation {
  readonly ok: boolean;
  readonly errors: readonly YfConfigViolation[];
}

export interface YfConfigViolation {
  /** 出错的配置字段名。 */
  readonly field: string;
  /** 人类可读的说明，含该字段的实测约束出处。 */
  readonly reason: string;
}

/** 校验失败抛出的错误。`violations` 非空，禁止只抛字符串。 */
export class YfConfigError extends Error {
  public readonly violations: readonly YfConfigViolation[];
  public readonly code = 'YF_CONFIG_INVALID';

  public constructor(violations: readonly YfConfigViolation[]) {
    const detail = violations.map((v) => `- ${v.field}: ${v.reason}`).join('\n');
    super(`易飞 SDK 配置校验失败，缺少 ${violations.length} 项：\n${detail}`);
    this.name = 'YfConfigError';
    this.violations = violations;
  }
}

/** 已解析、可直接发请求的运行时配置（令牌值已就位，base_url 已规范化）。 */
export interface ResolvedRuntimeConfig {
  readonly baseUrl: string;
  readonly endpoint: string;
  readonly companyId: string;
  readonly token: string;
  readonly servicePrefix: string;
  readonly timeoutMs: number;
  readonly warnOnSilentError: boolean;
}