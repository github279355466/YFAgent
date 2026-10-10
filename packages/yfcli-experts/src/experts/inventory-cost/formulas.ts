/**
 * 库存成本专家 —— 业务公式
 *
 * 核心公式（依据 docs/plans/inv-monthly-stats-spec.md §四）：
 *   期末成本 = 期初成本 + 本期入库 - 本期出库 + 本期调整
 *
 * ⚠️ 四要素(LC026+LC027+LC028+LC029)不可加进期末成本公式。
 *    它记录的是成本构成拆解，仅作成本分析维度。
 *
 * 数据来源模板：period_end_cost_by_item（P4 templates.ts #12）
 * 该模板从 vw_ai_period_end_cost 视图取数，字段映射 INVLC 月档。
 */
import type { FormulaDefinition, FormulaInputRow, FormulaResult } from "../../types.js";
import { ExpertError } from "../../errors.js";
import { INVENTORY_COST_CALIBER } from "./caliber.js";

/**
 * 将输入值安全转为数字。
 * null/undefined → 0；非数字 → 抛 ExpertError。
 */
function toNumber(
  value: unknown,
  fieldName: string,
  formulaId: string,
): number {
  if (value === null || value === undefined) return 0;
  // P0-13: 拒绝空字符串和布尔值，防止静默归零
  if (typeof value === "boolean") {
    throw new ExpertError({
      formulaId,
      message: `字段 "${fieldName}" 不接受布尔值`,
      expectedInput: "有限数字或 null",
      actualInput: String(value),
      caliber: INVENTORY_COST_CALIBER,
    });
  }
  if (typeof value === "string" && value.trim() === "") {
    throw new ExpertError({
      formulaId,
      message: `字段 "${fieldName}" 不接受空字符串`,
      expectedInput: "有限数字或 null",
      actualInput: "(empty string)",
      caliber: INVENTORY_COST_CALIBER,
    });
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new ExpertError({
      formulaId,
      message: `字段 "${fieldName}" 不是有效数字`,
      expectedInput: "有限数字或 null",
      actualInput: String(value),
      caliber: INVENTORY_COST_CALIBER,
    });
  }
  return num;
}

/** 四舍五入到指定精度 */
function roundTo(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * 期末成本公式
 *
 * 期末成本 = 期初成本 + 本期入库金额 - 本期出库金额 + 本期调整金额
 *
 * 对应 INVLC 字段：
 *   期初成本     = LC005 (月初成本)
 *   本期入库金额 = LC007 (本月入库金额)
 *   本期出库金额 = LC017 (本月出库金额)
 *   本期调整金额 = LC015 (本月调整入金额) - LC025 (本月调整出金额)
 *
 * 注意：不含 LC026~LC029 四要素。
 */
/** 内部聚合函数（不含 groupBy 逻辑，避免递归） */
function aggregateRows(rows: FormulaInputRow[], formulaId: string) {
  let openingCost = 0;
  let inboundCost = 0;
  let outboundCost = 0;
  let adjustInCost = 0;
  let adjustOutCost = 0;

  for (const row of rows) {
    openingCost += toNumber(row["opening_cost"], "opening_cost", formulaId);
    inboundCost += toNumber(row["inbound_cost"], "inbound_cost", formulaId);
    outboundCost += toNumber(row["outbound_cost"], "outbound_cost", formulaId);
    adjustInCost += toNumber(row["adjust_in_cost"], "adjust_in_cost", formulaId);
    adjustOutCost += toNumber(row["adjust_out_cost"], "adjust_out_cost", formulaId);
  }

  const periodEndCost = openingCost + inboundCost - outboundCost + adjustInCost - adjustOutCost;

  return {
    value: roundTo(periodEndCost, INVENTORY_COST_CALIBER.precision),
    caliber: INVENTORY_COST_CALIBER,
    breakdown: {
      opening_cost: roundTo(openingCost, INVENTORY_COST_CALIBER.precision),
      inbound_cost: roundTo(inboundCost, INVENTORY_COST_CALIBER.precision),
      outbound_cost: roundTo(outboundCost, INVENTORY_COST_CALIBER.precision),
      adjust_in_cost: roundTo(adjustInCost, INVENTORY_COST_CALIBER.precision),
      adjust_out_cost: roundTo(adjustOutCost, INVENTORY_COST_CALIBER.precision),
    },
  };
}

export const PERIOD_END_COST_FORMULA: FormulaDefinition = {
  id: "period_end_cost",
  name: "期末成本",
  sourceTemplateId: "period_end_cost_by_item",
  caliber: INVENTORY_COST_CALIBER,
  scope: {
    requiredParams: ["year_month"],
    groupBy: ["item_no"],
  },
  compute(rows: FormulaInputRow[]) {
    const formulaId = "period_end_cost";

    // P0-10: 空结果集不得静默返回 0
    if (rows.length === 0) {
      throw new ExpertError({
        formulaId,
        message: "输入行数为空，无法计算期末成本",
        expectedInput: "至少一行数据",
        actualInput: "0 rows",
        caliber: INVENTORY_COST_CALIBER,
      });
    }

    // P0-11: 检查字段是否存在（防止字段改名导致静默归零）
    const requiredFields = ["opening_cost", "inbound_cost", "outbound_cost", "adjust_in_cost", "adjust_out_cost"];
    for (const row of rows) {
      for (const field of requiredFields) {
        if (!(field in row)) {
          throw new ExpertError({
            formulaId,
            message: `输入行缺少必需字段 "${field}"（可能字段已改名）`,
            expectedInput: requiredFields.join(", "),
            actualInput: Object.keys(row).join(", ") || "(empty)",
            caliber: INVENTORY_COST_CALIBER,
          });
        }
      }
    }

    // compute 的语义固定为「全部行并成一个总额」。
    // 需要按 item_no 等维度拆分时用 computeGrouped（显式 API，P1-B 修复）。
    return aggregateRows(rows, formulaId);
  },
  /**
   * 按 scope.groupBy[0]（item_no）分组的期末成本。
   *
   * 为什么独立成方法而不是让 compute 返回联合类型：
   *   调用方必须能静态判断拿到的是「一个结果」还是「结果字典」。
   *   隐藏的类型切换（曾用 `as never` 绕过）会让消费方只能运行时探测，
   *   也会掩盖「groupBy 声明与实现不一致」这类契约漂移。
   */
  computeGrouped(rows: FormulaInputRow[]) {
    const formulaId = "period_end_cost";
    const groupByField = this.scope.groupBy[0];

    if (!groupByField) {
      throw new ExpertError({
        formulaId,
        message: "公式未声明 scope.groupBy，无法分组计算",
        expectedInput: "scope.groupBy 至少一项",
        actualInput: "(empty)",
        caliber: INVENTORY_COST_CALIBER,
      });
    }

    if (rows.length === 0) {
      throw new ExpertError({
        formulaId,
        message: "输入行数为空，无法计算期末成本",
        expectedInput: "至少一行数据",
        actualInput: "0 rows",
        caliber: INVENTORY_COST_CALIBER,
      });
    }

    // groupBy 字段缺失 = 契约漂移，必须报错而不是静默并成一组
    const missing = rows.filter((r) => !(groupByField in r));
    if (missing.length > 0) {
      throw new ExpertError({
        formulaId,
        message: `scope.groupBy 声明的字段 "${groupByField}" 在 ${missing.length} 行中缺失`,
        expectedInput: groupByField,
        actualInput: Object.keys(rows[0] ?? {}).join(", ") || "(empty)",
        caliber: INVENTORY_COST_CALIBER,
      });
    }

    const groups = new Map<string, FormulaInputRow[]>();
    for (const row of rows) {
      const key = String((row as Record<string, unknown>)[groupByField]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const result: Record<string, FormulaResult> = {};
    for (const [key, groupRows] of groups) {
      result[key] = aggregateRows(groupRows, formulaId);
    }
    return result;
  },
};

/** 库存成本专家的所有公式 */
export const INVENTORY_COST_FORMULAS: FormulaDefinition[] = [
  PERIOD_END_COST_FORMULA,
];
