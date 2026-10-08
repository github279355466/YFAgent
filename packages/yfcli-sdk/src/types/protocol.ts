/**
 * 协议层类型 —— 易飞 OpenAPI 线上字节的精确映射。
 *
 * 依据：docs/plans/yf-openapi-rules.md §2~§5、docs/plans/yf-live-probe-report.md。
 * 本文件只描述「易飞服务端真实回传的形状」，不含任何我方推断。
 * 禁止在此处出现 `any`：解析阶段允许 `unknown`，收敛后必须落到具体类型。
 */

/** 账套上下文 —— `digi-datakey` 头的载荷。易飞独有，易助无此机制。 */
export interface YfDataKey {
  readonly CompanyId: string;
}

/** `digi-service` 头的载荷。注意易飞侧服务名不可由type_key 拼接得出。 */
export interface YfServiceKey {
  readonly name: string;
}

/** 四个必填头（真机逐个验证过，缺任意一个均报错）。 */
export interface YfRequestHeaders {
  readonly 'digi-service': string;
  readonly 'digi-user-token': string;
  readonly 'digi-datakey': string;
  readonly 'Content-Type': string;
}

/**
 * 固定封包：`std_data` → `parameter`。
 * `parameter` 内容随服务而变，故以 unknown 承载，由各领域方法收敛。
 */
export interface YfRequestEnvelope<TParameter = unknown> {
  readonly std_data: {
    readonly parameter: TParameter;
  };
}

/**
 * `std_data.execution` —— 服务调用状态。
 *
 * 真机实测 `code` 仅两种取值：'0' 成功 / '-1' 失败。
 * '-0' 在易飞文档未记载，但存在于同类实现，按兼容处理。
 * 成功文案繁简混用（实测恒为繁体「查詢成功」），**禁止**以 description 判定成败。
 */
export interface YfExecution {
  readonly code: string;
  readonly sql_code: string;
  readonly description: string;
}

/** 回参根节点。 */
export interface YfResponseEnvelope {
  readonly std_data: YfResponseStdData;
}

export interface YfResponseStdData {
  readonly execution: YfExecution;
  readonly parameter?: YfResponseParameter;
}

/**
 * 查询类与主键类走**两条不同数据通道**（yf-openapi-rules.md §5.3）：
 * - 查询：`parameter.total_result` / `has_next` / `result.rows` / `result.cnt`
 * - 主键：`parameter.result.success[]` / `parameter.result.error[]`
 * 因此 `parameter` 内的键全部可选，由解析器按存在性判别。
 */
export interface YfResponseParameter {
  readonly total_result?: number;
  readonly has_next?: boolean;
  readonly result?: YfResultBlock;
}

/** 结果块。查询类给 `rows`，主键类给 `success` + `error`。 */
export interface YfResultBlock {
  readonly cnt?: number;
  readonly rows?: readonly YfRow[];
  readonly success?: readonly unknown[];
  readonly error?: readonly unknown[];
}

/**
 * 单行数据。字段集随业务对象变化，且易飞允许用户自建字段（udf*），
 * 无法穷举为静态键，故以 `Record<string, unknown>` 承载 + 由上层做具名收敛。
 *
 * 注意：回参中必然含 7 个**网关注入**的管理字段（company / creator /
 * create_date 等），它们不是业务表物理列。详见 `fields.ts` 的
 * `GatewayInjectedFields` 与 `stripGatewayInjectedFields`。
 */
export type YfRow = Record<string, unknown>;

/**
 * `error[]` 的两种实测结构（yf-openapi-rules.md §5.2）。
 *
 * 结构 A：`{ message, data }`
 * 结构 B：`{ information: [{ message, data }] }`
 *
 * 真机只复现过结构 A，结构 B 见于官方文档记载的其他操作/批量场景，
 * 解析器两者兼容，未识别形态必须抛 UnknownErrorItem 以免静默吞错。
 */
export interface YfFlatErrorItem {
  readonly message: string;
  readonly data?: unknown;
}

export interface YfInformationErrorItem {
  readonly information: readonly {
    readonly message: string;
    readonly data?: unknown;
  }[];
}

/** `error[].data` 会完整回显传入数据，日志落盘前必须脱敏。 */
export type YfErrorDataCarrier = YfFlatErrorItem | YfInformationErrorItem;

/** 成功判据常量。禁止以 description 文本匹配判定成功。 */
export const YF_SUCCESS_CODES = ['0', '-0'] as const;
export type YfSuccessCode = (typeof YF_SUCCESS_CODES)[number];

/** `page_size` 上限（真机验证 10000 可用，无报错）。 */
export const YF_PAGE_SIZE_MAX = 10000;

/** `page_no` 从1 开始（易助亦同，易飞无0 基约定）。 */
export const YF_PAGE_NO_MIN = 1;