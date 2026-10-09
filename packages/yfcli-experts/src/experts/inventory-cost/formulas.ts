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
import type { FormulaDefinition, FormulaInputRow } from "../../types.js";
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
  },
};

/** 库存成本专家的所有公式 */
export const INVENTORY_COST_FORMULAS: FormulaDefinition[] = [
  PERIOD_END_COST_FORMULA,
];
