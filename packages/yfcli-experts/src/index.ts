/**
 * yfcli-experts —— 易飞专家模块（业务公式层）
 *
 * 引用 @digiwin/erp-experts 公共计算引擎（8域纯数学公式），
 * 加上易飞特有的注册表层（ExpertRegistry + 口径声明）。
 */

// ===== 公共计算引擎（从 @digiwin/erp-experts re-export）=====

// 应收
export { calcAgingReport, DEFAULT_AGING_BUCKETS } from "@digiwin/erp-experts/ar";
export type { ArDetail, AgingBucket, AgingReport, AgingDistribution, OverdueAnalysis, CustomerAgingMatrix } from "@digiwin/erp-experts/ar";
export { calcCollectionScores, DEFAULT_WEIGHTS } from "@digiwin/erp-experts/ar";
export type { CollectionInput, ScoreWeights, CollectionScore, ConcernLevel, ScoringParams } from "@digiwin/erp-experts/ar";

// 成本
export { explodeBom, aggregateMaterials } from "@digiwin/erp-experts/cost";
export type { BomRow, ExplodedMaterial, ExplodeParams, ExplodeResult } from "@digiwin/erp-experts/cost";
export { simulateCost, calcCostBreakdown } from "@digiwin/erp-experts/cost";
export type { MaterialPrice, CostBreakdown, CostReductionPlan, SimulationResult, SimulateParams } from "@digiwin/erp-experts/cost";
export { calcAttribution } from "@digiwin/erp-experts/cost";
export type { PeriodCostSnapshot, AttributionNode, AttributionResult, CostElement } from "@digiwin/erp-experts/cost";
export { diagnoseDeadstockBatch } from "@digiwin/erp-experts/cost";
export type { InventoryDetail, DeadstockDiagnosis, AgingZone, DeadstockReason } from "@digiwin/erp-experts/cost";
export { diagnoseMonthEnd } from "@digiwin/erp-experts/cost";

// 应付
export { analyzeAp } from "@digiwin/erp-experts/ap";
export { calcPaymentPriority } from "@digiwin/erp-experts/ap";
export { performThreeWayMatch } from "@digiwin/erp-experts/ap";
export type { MatchGroup, ThreeWayMatchResult, MatchThresholds, MatchDiff } from "@digiwin/erp-experts/ap";
export { planMonthEnd } from "@digiwin/erp-experts/ap";

// 总账
export { validateVoucher, canReview, canPost } from "@digiwin/erp-experts/gl";
export { checkPeriodClose, summarizeIncomeClosing } from "@digiwin/erp-experts/gl";
export { buildBalanceSheetTemplate, buildIncomeStatementTemplate, checkBalanceSheet } from "@digiwin/erp-experts/gl";

// 销售
export { parseStructuredPo } from "@digiwin/erp-experts/sales";
export { generateQuotation } from "@digiwin/erp-experts/sales";
export type { QuotationLineInput, QuotationLine, QuotationResult, QuotationParams, PricingRule, CustomerType, ProductType } from "@digiwin/erp-experts/sales";
export { reviewOrder } from "@digiwin/erp-experts/sales";

// 采购
export { compareQuotes } from "@digiwin/erp-experts/purchase";
export { reviewDelivery } from "@digiwin/erp-experts/purchase";

// 计划
export { checkKit } from "@digiwin/erp-experts/plan";
export { calcAtp } from "@digiwin/erp-experts/plan";

// 生产
export { summarizeProgress } from "@digiwin/erp-experts/production";
export { summarizeWorkReports } from "@digiwin/erp-experts/production";

// ===== 易飞特有：注册表层 =====

// 核心类型
export type {
  CaliberTag,
  FormulaResult,
  FormulaInputRow,
  FormulaScope,
  FormulaDefinition,
  ExpertDefinition,
} from "./types.js";

// 异常
export { ExpertError } from "./errors.js";

// 注册表
export { ExpertRegistry } from "./registry.js";
export type { TemplateResolver } from "./registry.js";

// 库存成本专家（单域试点）
export { inventoryCostExpert } from "./experts/inventory-cost/index.js";
export { PERIOD_END_COST_FORMULA, INVENTORY_COST_FORMULAS } from "./experts/inventory-cost/formulas.js";
export { INVENTORY_COST_CALIBER } from "./experts/inventory-cost/caliber.js";

