/**
 * 内置 SQL 模板（易飞版 · 只查 vw_ai_* 视图）
 *
 * 所有模板的 FROM/JOIN 只引用 vw_ai_* 视图，禁止直查物理表。
 * 审核码默认 'Y'（易飞 Y/N/V，V=作废）。
 * 语法约束：SQL Server 2008+ 兼容，用 TOP(:max_rows)。
 *
 * 视图与易飞物理表的映射关系见 sql/views/*.sql DDL 文件头部注释。
 */
import { defineTemplate, type SqlTemplate } from "./template.js";

// ══════════ MVP 优先（前 5 个完整实现） ══════════

/** 1. 销售毛利按订单 */
export const SALES_MARGIN_BY_ORDER = defineTemplate({
  id: "sales_margin_by_order",
  label: "销售毛利（按订单）",
  description:
    "vw_ai_sales_margin：销货收入 − 销货成本。" +
    "口径：收入取 COPTG/COPTH 销货单无税金额，成本取 INVLA 出库异动实际成本。" +
    "审核码默认 Y（已审核）。cost_covered=0 表示成本缺失（严禁补 0 虚增毛利）。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y（只统计已审核）",
    },
  ],
  sql: `SELECT TOP (:max_rows) doc_no,
       doc_date,
       customer_code,
       approve_status,
       revenue,
       cost,
       cost_covered
FROM vw_ai_sales_margin
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
ORDER BY doc_date DESC`,
  max_rows: 1000,
  timeout_ms: 15_000,
});

/** 2. 库存成本按料号 */
export const INVENTORY_COST_BY_ITEM = defineTemplate({
  id: "inventory_cost_by_item",
  label: "现有库存成本（按料号）",
  description:
    "vw_ai_inventory_cost：INVMC 品号仓库档的现有库存量×成本。时点数据，无日期条件。",
  params: [
    { name: "warehouse", type: "string", required: false, description: "仓库代号；不传则全仓库" },
  ],
  sql: `SELECT TOP (:max_rows) item_no,
       SUM(quantity) AS inventory_qty,
       SUM(cost) AS inventory_cost
FROM vw_ai_inventory_cost
WHERE (:warehouse IS NULL OR warehouse = :warehouse)
GROUP BY item_no
ORDER BY SUM(cost) DESC`,
  max_rows: 1000,
  timeout_ms: 10_000,
});

/** 3. 采购汇总按供应商 */
export const PURCHASE_SUMMARY_BY_SUPPLIER = defineTemplate({
  id: "purchase_summary_by_supplier",
  label: "采购汇总（按供应商）",
  description:
    "vw_ai_purchase_summary：PURTC/PURTD 采购单头×身聚合。审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
  ],
  sql: `SELECT TOP (:max_rows) supplier_code,
       SUM(quantity) AS total_qty,
       SUM(amount) AS total_amount,
       COUNT(DISTINCT doc_no) AS order_count
FROM vw_ai_purchase_summary
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY supplier_code
ORDER BY SUM(amount) DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 4. 应收余额按客户 */
export const AR_BALANCE_BY_CUSTOMER = defineTemplate({
  id: "ar_balance_by_customer",
  label: "应收账款余额（按客户）",
  description:
    "vw_ai_ar_balance：ACRLB 应收异动明细档聚合。" +
    "余额 = SUM(借方本币) − SUM(已冲本币)。direction=1 为借方（增项）。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
  ],
  sql: `SELECT TOP (:max_rows) customer_code,
       SUM(CASE WHEN direction = 1 THEN ISNULL(local_amount, 0) ELSE 0 END)
         - SUM(ISNULL(writeoff_amount, 0)) AS balance
FROM vw_ai_ar_balance
WHERE doc_date >= :start_date AND doc_date <= :end_date
GROUP BY customer_code
ORDER BY balance DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 5. 应付余额按供应商 */
export const AP_BALANCE_BY_SUPPLIER = defineTemplate({
  id: "ap_balance_by_supplier",
  label: "应付账款余额（按供应商）",
  description:
    "vw_ai_ap_balance：ACPLB 应付异动明细档聚合。" +
    "余额 = SUM(贷方本币) − SUM(已冲本币)。direction=1 为贷方（增项）。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
  ],
  sql: `SELECT TOP (:max_rows) supplier_code,
       SUM(CASE WHEN direction = 1 THEN ISNULL(local_amount, 0) ELSE 0 END)
         - SUM(ISNULL(writeoff_amount, 0)) AS balance
FROM vw_ai_ap_balance
WHERE doc_date >= :start_date AND doc_date <= :end_date
GROUP BY supplier_code
ORDER BY balance DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

// ══════════ 其余 15 个模板 ══════════

/** 6. 生产成本按工单 */
export const PRODUCTION_COST_BY_WORKORDER = defineTemplate({
  id: "production_cost_by_workorder",
  label: "生产成本（按工单）",
  description:
    "vw_ai_production_cost：MOCTG×INVLA 工单入库成本聚合。" +
    "口径：按工单单号聚合材料+人工+制费+委外成本。审核码默认 Y。" +
    "注意：视图为入库批次级，无独立日期字段，通过 approve_status 过滤。",
  params: [
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
  ],
  sql: `SELECT TOP (:max_rows) wo_doc_type,
       wo_doc_no,
       product_no,
       SUM(inbound_qty) AS total_inbound_qty,
       SUM(material_cost) AS total_material_cost,
       SUM(labor_cost) AS total_labor_cost,
       SUM(overhead_cost) AS total_overhead_cost,
       SUM(outsourcing_cost) AS total_outsourcing_cost,
       SUM(total_cost) AS sum_total_cost
FROM vw_ai_production_cost
WHERE approve_status = :approve_status
GROUP BY wo_doc_type, wo_doc_no, product_no
ORDER BY SUM(total_cost) DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 7. 科目借贷方发生额按期间 */
export const GL_BALANCE_BY_PERIOD = defineTemplate({
  id: "gl_balance_by_period",
  label: "科目借贷方发生额（按期间）",
  description:
    "vw_ai_gl_balance：ACTLE 会计科目余额档。" +
    "按科目聚合指定年度+期间的借方/贷方本币发生额。",
  params: [
    { name: "year", type: "string", required: true, description: "会计年度" },
    { name: "period", type: "string", required: true, description: "会计期间（如 01~12）" },
  ],
  sql: `SELECT TOP (:max_rows) account_code,
       SUM(ISNULL(debit_amount, 0)) AS debit_total,
       SUM(ISNULL(credit_amount, 0)) AS credit_total
FROM vw_ai_gl_balance
WHERE fiscal_year = :year AND fiscal_period = :period
GROUP BY account_code
ORDER BY debit_total DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 8. 收款金额按客户 */
export const COLLECTION_BY_CUSTOMER = defineTemplate({
  id: "collection_by_customer",
  label: "收款金额（按客户）",
  description: "vw_ai_collection：ACRTK 收款单头档聚合。审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
  ],
  sql: `SELECT TOP (:max_rows) customer_code,
       SUM(ISNULL(local_amount, 0)) AS collection_amount,
       COUNT(DISTINCT doc_no) AS receipt_count
FROM vw_ai_collection
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY customer_code
ORDER BY collection_amount DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 9. 付款金额按供应商 */
export const PAYMENT_BY_SUPPLIER = defineTemplate({
  id: "payment_by_supplier",
  label: "付款金额（按供应商）",
  description: "vw_ai_payment：ACPTK 付款单头档聚合。审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
  ],
  sql: `SELECT TOP (:max_rows) supplier_code,
       SUM(ISNULL(local_amount, 0)) AS payment_amount,
       COUNT(DISTINCT doc_no) AS payment_count
FROM vw_ai_payment
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY supplier_code
ORDER BY payment_amount DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 10. 销售毛利按销货单别 */
export const SALES_MARGIN_BY_PRODUCT = defineTemplate({
  id: "sales_margin_by_product",
  label: "销售毛利（按销货单别）",
  description:
    "vw_ai_sales_margin 按销货单别聚合毛利。" +
    "注意：视图不含产品品号字段，无法按单品拆分；如需产品维度请结合 COPTH 另行查询。" +
    "口径：毛利 = SUM(revenue) − SUM(cost)。审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    { name: "approve_status", type: "string", required: false, default: "Y", description: "审核码" },
  ],
  sql: `SELECT TOP (:max_rows) doc_type,
       SUM(revenue) AS total_revenue,
       SUM(cost) AS total_cost,
       SUM(revenue) - SUM(cost) AS gross_profit,
       COUNT(DISTINCT doc_no) AS order_count
FROM vw_ai_sales_margin
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY doc_type
ORDER BY gross_profit DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 11. 库存时点按仓库 */
export const INVENTORY_ASOF_BY_WAREHOUSE = defineTemplate({
  id: "inventory_asof_by_warehouse",
  label: "库存时点（按仓库）",
  description:
    "vw_ai_inventory_cost：INVMC 品号仓库档按仓库聚合。" +
    "时点口径（当前快照），不支持变化分析。",
  params: [],
  sql: `SELECT TOP (:max_rows) warehouse,
       SUM(quantity) AS total_qty,
       SUM(cost) AS total_cost,
       COUNT(DISTINCT item_no) AS item_count
FROM vw_ai_inventory_cost
GROUP BY warehouse
ORDER BY total_cost DESC`,
  max_rows: 500,
  timeout_ms: 10_000,
});

/** 12. 期末库存成本按料号（时点快照） */
export const PERIOD_END_COST_BY_ITEM = defineTemplate({
  id: "period_end_cost_by_item",
  label: "库存成本（按料号·时点快照）",
  description:
    "vw_ai_inventory_cost：INVMC 当前库存快照按料号聚合。" +
    "时点口径，不支持按期间过滤或变化分析（视图无日期/期间字段）。",
  params: [],
  sql: `SELECT TOP (:max_rows) item_no,
       SUM(quantity) AS snapshot_qty,
       SUM(cost) AS snapshot_cost
FROM vw_ai_inventory_cost
GROUP BY item_no
ORDER BY snapshot_cost DESC`,
  max_rows: 1000,
  timeout_ms: 10_000,
});

/** 13. 期末库存成本按仓库（时点快照） */
export const PERIOD_END_COST_BY_WAREHOUSE = defineTemplate({
  id: "period_end_cost_by_warehouse",
  label: "库存成本（按仓库·时点快照）",
  description:
    "vw_ai_inventory_cost：INVMC 当前库存快照按仓库聚合。" +
    "时点口径，不支持按期间过滤或变化分析（视图无日期/期间字段）。",
  params: [],
  sql: `SELECT TOP (:max_rows) warehouse,
       SUM(quantity) AS snapshot_qty,
       SUM(cost) AS snapshot_cost,
       COUNT(DISTINCT item_no) AS item_count
FROM vw_ai_inventory_cost
GROUP BY warehouse
ORDER BY snapshot_cost DESC`,
  max_rows: 500,
  timeout_ms: 10_000,
});

/** 14. 库存成本按料号+仓库（时点快照） */
export const PERIOD_END_COST_BY_BATCH = defineTemplate({
  id: "period_end_cost_by_batch",
  label: "库存成本（按料号+仓库·时点快照）",
  description:
    "vw_ai_inventory_cost：INVMC 当前库存快照按料号+仓库明细展开。" +
    "时点口径，不支持按期间过滤。原设计为按批号，但视图无 lot_no 字段，改为料号+仓库维度。",
  params: [],
  sql: `SELECT TOP (:max_rows) item_no,
       warehouse,
       quantity AS snapshot_qty,
       cost AS snapshot_cost
FROM vw_ai_inventory_cost
ORDER BY cost DESC`,
  max_rows: 1000,
  timeout_ms: 10_000,
});

/** 15. 平均单位成本按料号（时点快照） */
export const PERIOD_AVG_UNIT_COST_BY_ITEM = defineTemplate({
  id: "period_avg_unit_cost_by_item",
  label: "平均单位成本（按料号·时点快照）",
  description:
    "vw_ai_inventory_cost：平均单位成本 = SUM(cost) / SUM(quantity)。" +
    "时点口径，不支持按期间过滤。除零保护：quantity<=0 时返回 0。",
  params: [],
  sql: `SELECT TOP (:max_rows) item_no,
       SUM(quantity) AS total_qty,
       SUM(cost) AS total_cost,
       CASE WHEN SUM(quantity) > 0 THEN SUM(cost) / SUM(quantity) ELSE 0 END AS avg_unit_cost
FROM vw_ai_inventory_cost
GROUP BY item_no
ORDER BY avg_unit_cost DESC`,
  max_rows: 500,
  timeout_ms: 10_000,
});

/** 16. 销货成本按客户 */
export const SALES_COST_BY_CUSTOMER = defineTemplate({
  id: "sales_cost_by_customer",
  label: "销货成本（按客户）",
  description:
    "vw_ai_sales_margin 按客户聚合销货成本。" +
    "口径：成本取 INVLA 出库异动实际成本。审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
  ],
  sql: `SELECT TOP (:max_rows) customer_code,
       SUM(cost) AS total_cost,
       COUNT(DISTINCT doc_no) AS order_count
FROM vw_ai_sales_margin
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY customer_code
ORDER BY total_cost DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 17. 材料耗用成本按工单 */
export const MATERIAL_USAGE_BY_WORKORDER = defineTemplate({
  id: "material_usage_by_workorder",
  label: "材料耗用成本（按工单）",
  description:
    "vw_ai_production_cost 按工单聚合材料成本。" +
    "口径：material_cost 来自 INVLA.LA017（出库成本中的材料部分）。审核码默认 Y。" +
    "注意：视图为入库批次级，不含独立领料明细；如需材料级耗用需另查 INVLA。",
  params: [
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
  ],
  sql: `SELECT TOP (:max_rows) wo_doc_type,
       wo_doc_no,
       product_no,
       SUM(inbound_qty) AS total_inbound_qty,
       SUM(material_cost) AS total_material_cost
FROM vw_ai_production_cost
WHERE approve_status = :approve_status
GROUP BY wo_doc_type, wo_doc_no, product_no
ORDER BY total_material_cost DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 18. 工单成本明细 */
export const WORKORDER_COST_DETAIL = defineTemplate({
  id: "workorder_cost_detail",
  label: "工单成本明细",
  description:
    "vw_ai_production_cost 按入库批次展开成本明细。" +
    "口径：每行对应一笔 MOCTG 入库记录，含材料/人工/制费/委外四项成本。审核码默认 Y。",
  params: [
    {
      name: "approve_status",
      type: "string",
      required: false,
      default: "Y",
      description: "审核码过滤，默认 Y",
    },
    {
      name: "wo_doc_no",
      type: "string",
      required: false,
      description: "工单单号过滤；不传则全部工单",
    },
  ],
  sql: `SELECT TOP (:max_rows) wo_doc_type,
       wo_doc_no,
       receipt_doc_type,
       receipt_doc_no,
       seq_no,
       product_no,
       inbound_qty,
       material_cost,
       labor_cost,
       overhead_cost,
       outsourcing_cost,
       total_cost
FROM vw_ai_production_cost
WHERE approve_status = :approve_status
  AND (:wo_doc_no IS NULL OR wo_doc_no = :wo_doc_no)
ORDER BY total_cost DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 19. 采购金额按供应商（基于采购单） */
export const PURCHASE_RECEIPT_BY_SUPPLIER = defineTemplate({
  id: "purchase_receipt_by_supplier",
  label: "采购金额（按供应商·基于采购单）",
  description:
    "vw_ai_purchase_summary 按供应商聚合采购金额。" +
    "注意：数据来源为采购单（PURTC/PURTD），非进货验收单；如需进货口径请另建视图。" +
    "审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    { name: "approve_status", type: "string", required: false, default: "Y", description: "审核码" },
  ],
  sql: `SELECT TOP (:max_rows) supplier_code,
       SUM(quantity) AS total_qty,
       SUM(amount) AS total_amount,
       COUNT(DISTINCT doc_no) AS order_count
FROM vw_ai_purchase_summary
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY supplier_code
ORDER BY total_amount DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 20. 采购金额按供应商+品号 */
export const PURCHASE_ORDER_BY_SUPPLIER_ITEM = defineTemplate({
  id: "purchase_order_by_supplier_item",
  label: "采购金额（按供应商+品号）",
  description:
    "vw_ai_purchase_summary 按供应商+品号二维聚合。" +
    "口径：采购单（PURTC/PURTD）金额。审核码默认 Y。",
  params: [
    { name: "start_date", type: "string", required: true, description: "起始日期 YYYYMMDD" },
    { name: "end_date", type: "string", required: true, description: "截止日期 YYYYMMDD" },
    { name: "approve_status", type: "string", required: false, default: "Y", description: "审核码" },
  ],
  sql: `SELECT TOP (:max_rows) supplier_code,
       product_no,
       SUM(quantity) AS total_qty,
       SUM(amount) AS total_amount,
       COUNT(DISTINCT doc_no) AS order_count
FROM vw_ai_purchase_summary
WHERE approve_status = :approve_status
  AND doc_date >= :start_date AND doc_date <= :end_date
GROUP BY supplier_code, product_no
ORDER BY total_amount DESC`,
  max_rows: 500,
  timeout_ms: 15_000,
});

/** 内置模板全集（20 个） */
export const BUILTIN_TEMPLATES: SqlTemplate[] = [
  SALES_MARGIN_BY_ORDER,
  INVENTORY_COST_BY_ITEM,
  PURCHASE_SUMMARY_BY_SUPPLIER,
  AR_BALANCE_BY_CUSTOMER,
  AP_BALANCE_BY_SUPPLIER,
  PRODUCTION_COST_BY_WORKORDER,
  GL_BALANCE_BY_PERIOD,
  COLLECTION_BY_CUSTOMER,
  PAYMENT_BY_SUPPLIER,
  SALES_MARGIN_BY_PRODUCT,
  INVENTORY_ASOF_BY_WAREHOUSE,
  PERIOD_END_COST_BY_ITEM,
  PERIOD_END_COST_BY_WAREHOUSE,
  PERIOD_END_COST_BY_BATCH,
  PERIOD_AVG_UNIT_COST_BY_ITEM,
  SALES_COST_BY_CUSTOMER,
  MATERIAL_USAGE_BY_WORKORDER,
  WORKORDER_COST_DETAIL,
  PURCHASE_RECEIPT_BY_SUPPLIER,
  PURCHASE_ORDER_BY_SUPPLIER_ITEM,
];