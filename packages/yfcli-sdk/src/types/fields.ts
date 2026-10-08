/**
 * 字段分层类型 —— 区分「OpenAPI 网关注入字段」与「业务表物理列」。
 *
 * 背景与实测依据（docs/decisions/OPEN-DECISIONS.md OPEN-F2 / OPEN-F3）：
 *
 * 1. 易飞回参固定带 7 个「管理字段」，但它们**不是业务表的物理列**。
 *    实测：ADMMD 全表 54842 个字段中，以管理字段名出现的仅 3 次，
 *    且其中 2 次是业务字段恰好重名（如某表的 `creator` 是真正的业务列）。
 *    而真机 query 回参**确实**返回这 7 项 —— 证明它们由网关层注入。
 *
 * 2. 因此不可仅凭字段名判定一个字段是不是管理字段。
 *    判定须三重判据全部满足，详见 `isGatewayInjectedFieldName`。
 *
 * 对 SDK 的直接影响：
 * - 构造写入请求时，这7 个字段**不可赋值**（写了会被网关忽略或报错）；
 * - 解析回参时，这7 个字段**必然出现**，即便底层表里没有对应列；
 * - 做字段映射（如回参 → 数据库列）时，必须先剥离这7 项，否则映射会失败。
 */

/**
 * 网关注入的 7 个管理字段。
 *
 * 易飞查询/读取回参通则返回，且**不可作为赋值目标**。
 * 依据：yf-openapi-rules.md §6.4（7 个管理字段，只读）。
 */
export interface GatewayInjectedFields {
  /** 公司编号，长度 10。对应大写物理名 COMPANY。 */
  readonly company: string;
  /** 录入者，长度 10。对应 CREATOR。 */
  readonly creator: string;
  /** 组编号，长度 10。对应 USR_GROUP。 */
  readonly usr_group: string;
  /**
   * 创建时间，长度 17，形如 `20250305181000333`。
   *
   * 注意：**非 ISO 8601**，不可直接 `new Date(str)` 解析。
   * 正确写法：`new Date(
   *   s.slice(0,4), s.slice(4,6)-1, s.slice(6,8),
   *   s.slice(8,10), s.slice(10,12), s.slice(12,14)
   * )`
   */
  readonly create_date: string;
  /** 更改者，长度 10。对应 MODIFIER。 */
  readonly modifier: string;
  /** 更改时间，长度 17，格式同 create_date。对应 MODI_DATE。 */
  readonly modi_date: string;
  /** 标识（版本标识），numeric(3,0)。**数字型枚举，无「编码.中文」问题。** */
  readonly flag: number;
}

/** 7 个网关注入字段的键名全集，顺序与文档一致。 */
export const GATEWAY_INJECTED_FIELD_NAMES = [
  'company',
  'creator',
  'usr_group',
  'create_date',
  'modifier',
  'modi_date',
  'flag',
] as const;

export type GatewayInjectedFieldName =
  (typeof GATEWAY_INJECTED_FIELD_NAMES)[number];

/**
 * 用户自定义字段（UDF）的命名与类型。
 *
 * 实测（14004 行全量统计，1168 张表 × 12 字段）：
 * | 范围 | 类型 | 实测行数 | 一致性 |
 * |---|---|---|---|
 * | `udf01` ~ `udf12` | varchar | 14004 / 14004 | 100% |
 * | `udf51` ~ `udf62` | numeric(16,6) | 14004 / 14004 | 100% |
 *
 * 编号规律：1~12 为文本型，51~62 为数值型（跳号是易飞历史设计，非缺陷）。
 *
 * 注意：命名互斥 —— 易助侧用 `udf_text*`，**易飞一律 `udfNN`**。
 * 套用易助命名会导致字段不存在（易飞对不存在的字段报 MA012 或返回空集）。
 */
export const YF_UDF_TEXT_FIELDS = [
  'udf01', 'udf02', 'udf03', 'udf04', 'udf05', 'udf06',
  'udf07', 'udf08', 'udf09', 'udf10', 'udf11', 'udf12',
] as const;

export const YF_UDF_NUMERIC_FIELDS = [
  'udf51', 'udf52', 'udf53', 'udf54', 'udf55', 'udf56',
  'udf57', 'udf58', 'udf59', 'udf60', 'udf61', 'udf62',
] as const;

export type YfUdfTextField = (typeof YF_UDF_TEXT_FIELDS)[number];
export type YfUdfNumericField = (typeof YF_UDF_NUMERIC_FIELDS)[number];

/** UDF 字段名全集（文本 + 数值，共 24 个）。 */
export const YF_UDF_FIELDS: readonly string[] = [
  ...YF_UDF_TEXT_FIELDS,
  ...YF_UDF_NUMERIC_FIELDS,
];

/**
 * UDF 字段值的类型约束。
 *
 * 文本型传字符串、数值型传数字。**不强制** —— 易飞对数值字段的引号宽容度较高
 * （实测 `"100"` 与 `100` 结果相同），但文档要求「数值请勿使用双引号」，
 * 故类型上按推荐形态约束。
 */
export type YfUdfValue = string | number;

/** 业务表物理行：来自 ADMMD 的字段集合，不含网关注入的 7 项。 */
export type PhysicalRow = Readonly<Record<string, string | number | null>>;

/**
 * 回参行的完整形态 = 业务表物理列 + 网关注入字段。
 *
 * 真机 query/read 回参同时包含两者，且用户自建 UDF 也可能出现，
 * 故除已知项外仍留索引签名。
 */
export type ApiRow = Readonly<Record<string, unknown>> &
  Partial<GatewayInjectedFields>;

/**
 * 判定字段名是否属于网关注入的 7 项。
 *
 * 注意：这**只判名字，不判来源**。因 OPEN-F3 明确：同名可能为业务字段
 * （如某表的 `creator` 排在 UDF 之后、序号 0068，是真实业务列）。
 * 若需判定「某回参里的 creator 是不是管理字段」，
 * 须结合字段序号/ 位置等额外信息，SDK 当前不做该推断。
 */
export function isGatewayInjectedFieldName(
  fieldName: string,
): fieldName is GatewayInjectedFieldName {
  return (GATEWAY_INJECTED_FIELD_NAMES as readonly string[]).includes(fieldName);
}

/**
 * 判定字段名是否为 UDF。
 *
 * 命名互斥：易飞是 `udfNN`，易助是 `udf_text*`。
 * 后者在本函数返回 false —— 这正是「勿引入易助概念」的一道防线。
 */
export function isUdfFieldName(fieldName: string): boolean {
  return YF_UDF_FIELDS.includes(fieldName);
}

/**
 * 从回参行中剥离网关注入字段，得到业务表物理列视图。
 *
 * 用途：字段映射（如分析层回参 → 数据库列）前必须先剥离，
 * 否则 7 个网关注入项会被误当成物理列，导致映射失败或写入脏字段。
 */
export function stripGatewayInjectedFields(
  row: ApiRow,
): PhysicalRow {
  const out: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (isGatewayInjectedFieldName(key)) continue;
    if (value === undefined) continue;
    out[key] = typeof value === 'string' || typeof value === 'number' ? value : null;
  }
  return out;
}

/**
 * 校验一行数据里是否存在「不可赋值的网关注入字段」。
 *
 * 用于写入前预检：网关注入字段由网关生成，赋值无意义且可能被拒。
 *
 * @returns 违规字段名列表；空数组表示通过。
 */
export function findUnassignableFields(
  row: Readonly<Record<string, unknown>>,
): readonly string[] {
  return Object.keys(row).filter(isGatewayInjectedFieldName);
}

/**
 * 解析易飞的 17 位非 ISO 时间戳。
 *
 * 格式：`YYYYMMDDHHmmss` + 3 位百分秒（如 `20250305181000333`）。
 *末 3 位为百分秒，精度低于毫秒，转换时按毫秒处理会失真，
 * 故此处保留原始毫秒部分并说明。
 */
export function parseYfTimestamp(value: string): Date | undefined {
  if (!/^\d{17}$/.test(value)) return undefined;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? undefined : date;
}