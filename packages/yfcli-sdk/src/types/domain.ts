/**
 * 领域对象类型 —— 从知识产物 `knowledge/typekey/typekey_map.yaml` 投影而来。
 *
 * 该 YAML 由 scripts/extract-typekey-map.mjs 机械生成，是**服务名的唯一权威来源**。
 * 真机已证：按 `{type_key}.data.{op}.get` 拼接必错
 * （`supplier` 无 .data 段而 `customer` 有），故服务名只查表，不推导。
 */

/** 易飞八种标准操作（`invalid` 为易飞独有，易助侧仅七种）。 */
export type YfOperation =
  | 'query'
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'disapprove'
  | 'invalid';

/** 八种操作的全集，用于配置校验与映射表完整性检查。 */
export const YF_OPERATIONS: readonly YfOperation[] = [
  'query',
  'read',
  'create',
  'update',
  'delete',
  'approve',
  'disapprove',
  'invalid',
] as const;

/**
 * 操作别名映射。
 *
 * 易飞读取操作名为 `read`，易助为 `get`（易助另有 getMultiple）。
 * 此处保留映射位而非硬编码，便于未来接入共享层 erp-core 时按产品线切换。
 */
export type YfOperationAliasMap = Readonly<Partial<Record<YfOperation, string>>>;

/** 业务对象在 typekey_map.yaml 中的一条记录（运行时投影形态）。 */
export interface YfTypeKeyEntry {
  /** 稳定业务键，如 `purchase.order`。 */
  readonly typeKey: string;
  /** 中文名，如「采购订单」。 */
  readonly title: string;
  /** 操作 → 服务名。缺项表示该对象无此服务，调用前必须先查。 */
  readonly services: Readonly<Partial<Record<YfOperation, string>>>;
  /** 业务主键字段名，复合主键多元素。 */
  readonly primaryKey: readonly string[];
  /** 逻辑节点名（`*_data`），用于查单身字段时填 `node_name`。 */
  readonly detailNodes: readonly string[];
  /** 该对象是否被标记为已知不可用（如服务端 DLL 崩溃）。 */
  readonly unavailable: boolean;
  /** 不可用原因；`unavailable` 为 false 时为 undefined。 */
  readonly unavailableReason?: string;
  /** 同操作多服务名冲突记录（OPEN-F8）。来自 YAML service_conflicts 字段。 */
  readonly conflictCandidates?: readonly YfServiceConflictCandidate[];
}

/** 服务名冲突候选（同一操作对应多个服务名时的记录）。 */
export interface YfServiceConflictCandidate {
  /** 冲突的操作名，如 query / read。 */
  readonly op: string;
  /** 保留使用的服务名。 */
  readonly kept: string;
  /** 被弃用的服务名。 */
  readonly dropped: string;
}

/**
 * 服务名解析接口 —— 由知识层实现。
 *
 * 抽成接口的原因：知识来源可能有三种形态（YAML 文件 / 内嵌 JSON / 远端拉取），
 * 但上层只依赖「按 typeKey + operation 查到确切服务名」这一件事。
 */
export interface YfServiceNameResolver {
  /**
   * 返回该对象该操作的确切服务名。
   * 未登记时必须抛错，**不得**回落到任何拼接规则。
   */
  resolveServiceName(typeKey: string, operation: YfOperation): string;

  /** 返回该对象的完整条目；未登记时返回 undefined。 */
  findEntry(typeKey: string): YfTypeKeyEntry | undefined;

  /** 列出全部业务对象键，供 CLI 补全与 MCP 工具枚举使用。 */
  listTypeKeys(): readonly string[];
}

/** 查询结果信封（查询类数据通道收敛后的形态）。 */
export interface YfQueryResult {
  readonly rows: readonly Record<string, unknown>[];
  /** 服务端声明的总笔数；未返回时为 undefined（不可用 total_result 推断）。 */
  readonly totalResult?: number;
  readonly hasNext: boolean;
  /** 本页笔数；服务端未返回时回落到 rows.length。 */
  readonly count: number;
}

/**
 * 主键类结果信封（read / delete / approve / disapprove / invalid 数据通道）。
 *
 * `empty` 为 true 表示「服务端返回 code=0 但数据为空」——
 * 真机证明此情形**等价于「查无此单」而非「成功」**（主键全错即如此），
 * 上层必须据此告警，不可当作成功静默吞掉。
 */
export interface YfActionResult {
  readonly items: readonly unknown[];
  readonly empty: boolean;
  /** 本次调用命中的服务名，写入日志便于事后追溯。 */
  readonly serviceName: string;
}

/**
 * 枚举字段的编码提示。
 *
 * 真机实测：回参形如 `Y.已审核`，作为查询条件只认纯编码 `Y`；
 * 传完整串返回 code=0 + **0 条**（静默错误，最易误判）。
 * 数字型枚举（flag）无此问题。
 */
export interface YfEnumFieldSpec {
  /** 字段名，如 `approve_status`。 */
  readonly fieldName: string;
  /** 该字段是否为「编码.中文」形态的文本型枚举。 */
  readonly codedText: boolean;
}

/** 判定为「编码.中文」形态的最小正则锚点：首段非空 + 点 + 非空中文。 */
export const YF_CODE_TEXT_SEPARATOR = '.';