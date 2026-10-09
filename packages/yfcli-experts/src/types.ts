/**
 * 专家模块核心类型
 *
 * 每个公式必须声明三项：数据来源模板 id + 口径标签 + 适用范围。
 * 公式错误时不静默返回 0，抛 ExpertError（见 errors.ts）。
 */

/** 口径标签 —— 描述数据的筛选条件、单位和精度 */
export interface CaliberTag {
  /** 审核码过滤表达式，如 "approve_status='Y'" */
  approveFilter: string;
  /** 计量单位，如 "元"、"个" */
  unit: string;
  /** 小数精度 */
  precision: number;
  /** 人类可读的口径说明 */
  description: string;
}

/** 公式计算结果 */
export interface FormulaResult {
  /** 计算值 */
  value: number;
  /** 该结果对应的口径标签 */
  caliber: CaliberTag;
  /** 可选的分项明细（用于对账） */
  breakdown?: Record<string, number>;
}

/** 公式输入行（来自 P4 模板查询结果的单行） */
export type FormulaInputRow = Record<string, unknown>;

/** 公式作用域：限定公式适用的数据维度 */
export interface FormulaScope {
  /** 适用模板的参数约束（如需要 start_date/end_date） */
  requiredParams: string[];
  /** 公式输出的分组维度（如 item_no, warehouse） */
  groupBy: string[];
}

/** 公式定义 */
export interface FormulaDefinition {
  /** 公式唯一标识 */
  id: string;
  /** 公式中文名 */
  name: string;
  /** 数据来源的 P4 模板 id（必须在模板注册表中存在） */
  sourceTemplateId: string;
  /** 口径标签 */
  caliber: CaliberTag;
  /** 适用范围 */
  scope: FormulaScope;
  /**
   * 纯函数计算逻辑。
   * 接收模板查询返回的行数组，输出聚合结果。
   * 错误时抛 ExpertError，不静默返回 0。
   */
  compute: (rows: FormulaInputRow[]) => FormulaResult;
}

/** 专家定义 */
export interface ExpertDefinition {
  /** 专家唯一标识 */
  id: string;
  /** 专家中文名 */
  name: string;
  /** 业务域，如 "inventory-cost" */
  domain: string;
  /** 该专家包含的所有公式 */
  formulas: FormulaDefinition[];
}
