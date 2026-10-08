/**
 * 条件构造类型 —— 易飞 `conditions` 的**对象形态**。
 *
 * 真机实测结论（docs/plans/yf-live-probe-report.md §三）：
 * - 对象形态 `{ operator, fields[] }`  → code=0，过滤生效
 * - 数组形态 `[{ groups:[...] }]`（易助写法） → code=-1，conditions not found.
 * - 扁平数组 `[{field,op,value}]`             → code=-1， conditions not found.
 *
 * OPEN-A3 已裁定不做双向兼容层，本构造器只产出易飞形态。
 */

/** 条件组之间的逻辑符。文档载 `and`（默认，可缺省）/ `or`。 */
export type YfLogicalOperator = 'and' | 'or' | 'AND' | 'OR';

/**
 * 条件字段支持的运算符全集。
 *
 * 取值需带 SQL 片段的高危运算符（yf-openapi-rules.md §3.2）已在
 * conditions/value-format.ts 中集中处理，构造器只暴露纯类型。
 */
export type YfFieldOperator =
  | '='
  | '<>'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'like'
  | 'LIKE'
  | 'NOT LIKE'
  | 'IN'
  | 'NOT IN'
  | 'BETWEEN'
  | 'EXISTS'
  | 'NOT EXISTS';

/**
 * 条件字段。
 *
 * - `field_name` 可用 `+` 拼接复合字段（如 `doc_type_no+doc_no`）
 * - `node_name` 为逻辑节点名（`*_data`），查单身字段时**必填**
 *   真机已验证 175 个节点名中 110 个可用；43 个报 MA012 未注册。
 *   **不可**改用物理表名（实测报 MA012）。
 * - `EXISTS` / `NOT EXISTS` 的 `field_name` 必须留空
 */
export interface YfConditionField {
  readonly field_name: string;
  readonly operator: YfFieldOperator;
  readonly value: string;
  readonly node_name?: string;
  /** 嵌套条件组，与本字段同级，可混合（文档「范例5」）。 */
  readonly group?: YfConditionGroup;
}

/** 条件组。`group` 可多层递归嵌套（文档「范例6」演示三层）。 */
export interface YfConditionGroup {
  readonly operator: YfLogicalOperator;
  readonly fields: readonly (YfConditionField | YfConditionGroup)[];
}

/**
 * 顶层 `conditions`。
 *
 * 「取全部资料」用**空对象** `{}` 表示，而非空数组或缺省。
 */
export type YfConditions = YfConditionGroup;

/** 排序项（`orders` 数组）。 */
export interface YfOrder {
  readonly field_name: string;
  readonly order_type: 'asc' | 'desc';
}

/**
 * 分页参数。
 *
 * 易飞**无 fastquery**（易助有），每次查询重查数据库，
 * 因此分页开销必须由调用方显式感知，不可假设 `has_next` 为 false 即终止全量扫描。
 */
export interface YfPagination {
  readonly page_no: number;
  /** 上限 10000（YF_PAGE_SIZE_MAX），构造时会夹紧并告警。 */
  readonly page_size: number;
  readonly use_has_next: boolean;
}

/**
 * 查询专用入参（对应 query 类服务的 `parameter`）。
 *
 * 除「取全部资料」外 `conditions` 皆必传。
 */
export interface YfQueryParameter extends YfPagination {
  readonly conditions: YfConditions;
  readonly orders?: readonly YfOrder[];
  /**
   * 20260401 新增的入参级回参裁剪，真机验证生效。
   * 不支持该入参的老服务端会忽略此字段（属向后兼容变更）。
   */
  readonly selectedColumns?: string;
}

/**
 * 主键定位入参（对应 read / delete / approve / disapprove / invalid 类服务）。
 *
 * 复合主键在易飞极普遍（如 `doc_type_no + doc_no`），
 * `datakeys` 单个元素必须含**全部**主键字段，缺一个即报「缺少[x]的鍵值參數」。
 */
export interface YfDataKeysParameter {
  readonly datakeys: readonly Record<string, unknown>[];
}

/**
 * 实体写入入参容器（对应 create / update 类服务）。
 *
 * 容器名即逻辑节点名，与对象名并非总是相关 —— 已知 5 个对象入参容器名与对象名无关，
 * 调用前须核实（见各字段对照表「文档异常」段）。
 */
export type YfEntityParameter = Record<string, readonly Record<string, unknown>[]>;