/**
 * 库存成本专家定义（单域试点）
 *
 * 依据 docs/plans/inv-monthly-stats-spec.md，覆盖期末成本公式。
 */
import type { ExpertDefinition } from "../../types.js";
import { INVENTORY_COST_FORMULAS } from "./formulas.js";

export const inventoryCostExpert: ExpertDefinition = {
  id: "inventory-cost",
  name: "库存成本专家",
  domain: "inventory-cost",
  formulas: INVENTORY_COST_FORMULAS,
};
