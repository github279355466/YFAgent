/**
 * 库存成本专家 —— 口径声明
 *
 * 依据 docs/plans/inv-monthly-stats-spec.md：
 *   - INVLC 是月变动统计档，没有存期末列，期末必须自己算
 *   - 审核码只筛 Y（已审核），不含作废(V)和未审核(N)
 *   - LC026+LC027+LC028+LC029 四要素不可加进期末成本公式
 */
import type { CaliberTag } from "../../types.js";

/** 库存成本统一口径 */
export const INVENTORY_COST_CALIBER: CaliberTag = {
  approveFilter: "approve_status='Y'",
  unit: "元",
  precision: 2,
  description: "按已审核单据统计，不含作废(V)和未审核(N)",
};
