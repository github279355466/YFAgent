# 易飞 AI 助手索引

> **产品线**: YF (易飞 E10) | **数据来源**: ai_agent.xls + ai_agent_node.xls + YZCLI Experts
> **生成时间**: 2026-10-09 | **助手总数**: 32（含通用查询助手）

---

## 原有分析助手（02~17）

| 序号 | 目录 | ID | 编码 | 名称 | 模块 | 触发关键词 |
|------|------|-----|------|------|------|-----------|
| 01 | [01-query-agent](./01-query-agent/) | 200 | QueryAgent | 通用查询助手 | — | 查询 / 接口 / API |
| 02 | [02-item-check-duplicate-agent](./02-item-check-duplicate-agent/) | 201 | ItemCheckDuplicateAgent | 品号智能查重助手 | TPAGC10 | 品号查重 / 重复品号 / 料号重复 |
| 03 | [03-slow-moving-inventory-query-agent](./03-slow-moving-inventory-query-agent/) | 202 | SlowMovingInventoryQueryAgent | 库存呆滞查询助手 | INVKR18 | 呆滞库存 / 库龄 / 库存周转 |
| 04 | [04-inventory-analysis-report-agent](./04-inventory-analysis-report-agent/) | 203 | InventoryAnalysisReportAgent | 盘点分析报告助手 | INVKC04 | 盘点分析 / 盘点报告 / 盘点差异 |
| 05 | [05-sales-order-follow-up-agent](./05-sales-order-follow-up-agent/) | 204 | SalesOrderFollowUpAgent | 销售订单跟单助手 | COPDC02 | 销售订单跟单 / 销单进度 / 出货进度 |
| 06 | [06-sales-order-summary-agent](./06-sales-order-summary-agent/) | 205 | SalesOrderSummaryAgent | 销售订单摘要助手 | COPDC02 | 销售摘要 / 销售订单汇总 / 销单概览 |
| 07 | [07-sales-order-compliance-agent](./07-sales-order-compliance-agent/) | 206 | SalesOrderComplianceAgent | 销售订单合规助手 | COPDC02 | 销售合规 / 合同比对 / 订单合规审查 |
| 08 | [08-sales-business-exception-query-agent](./08-sales-business-exception-query-agent/) | 207 | SalesBusinessExceptionQueryAgent | 销售业务异常查询助手 | — | 销售异常 / 销售波动 / 业绩异动 |
| 09 | [09-customer-sales-report-agent](./09-customer-sales-report-agent/) | 208 | CustomerSalesReportAgent | 客户销售报告助手 | TPAGC13 | 客户销售报告 / 客户分析 / 客户贡献 |
| 10 | [10-purchase-order-follow-up-agent](./10-purchase-order-follow-up-agent/) | 209 | PurchaseOrderFollowUpAgent | 采购订单跟单助手 | PURCC04 | 采购跟单 / 采购进度 / 到货跟踪 |
| 11 | [11-purchase-order-summary-agent](./11-purchase-order-summary-agent/) | 210 | PurchaseOrderSummaryAgent | 采购订单摘要助手 | PURCC04 | 采购摘要 / 采购汇总 / 采购概览 |
| 12 | [12-purchase-order-compliance-agent](./12-purchase-order-compliance-agent/) | 211 | PurchaseOrderComplianceAgent | 采购订单合规助手 | PURCC04 | 采购合规 / 采购合同比对 / 采购合规审查 |
| 13 | [13-purchase-business-exception-query-agent](./13-purchase-business-exception-query-agent/) | 212 | PurchaseBusinessExceptionQueryAgent | 采购业务异常查询助手 | — | 采购异常 / 采购波动 / 供应商风险 |
| 14 | [14-supplier-procurement-report-agent](./14-supplier-procurement-report-agent/) | 213 | SupplierProcurementReportAgent | 供应商采购报告助手 | TPAGC16 | 供应商报告 / 供应商分析 / 供应商表现 |
| 15 | [15-slow-moving-work-order-query-agent](./15-slow-moving-work-order-query-agent/) | 214 | SlowMovingWorkOrderQueryAgent | 呆滞工单查询助手 | — | 呆滞工单 / 工单停滞 / 在制超期 |
| 16 | [16-production-report-agent](./16-production-report-agent/) | 215 | ProductionReportAgent | 生产报告助手 | — | 生产报告 / 生产分析 / 发料分析 |
| 17 | [17-production-delay-exception-query-agent](./17-production-delay-exception-query-agent/) | 216 | ProductionDelayExceptionQueryAgent | 生产进度延迟查询助手 | — | 生产延迟 / 进度延迟 / 交期预警 |

---

## 专家助手（18~32，从 YZCLI 移植）

| 序号 | 目录 | 编码 | 名称 | 模块 | 触发关键词 |
|------|------|------|------|------|-----------|
| 18 | [18-ar-accountant](./18-ar-accountant/) | ArAccountantExpert | 应收会计专家 | yfcli-experts/ar | 应收 / 对账 / 账龄 / 催收 |
| 19 | [19-cost-accountant](./19-cost-accountant/) | CostAccountantExpert | 成本会计专家 | yfcli-experts/cost | 成本模拟 / BOM成本 / 月结检查 |
| 20 | [20-ap-accountant](./20-ap-accountant/) | ApAccountantExpert | 应付会计专家 | yfcli-experts/ap | 应付分析 / 付款优先级 / 三单匹配 |
| 21 | [21-gl-accountant](./21-gl-accountant/) | GlAccountantExpert | 总账会计专家 | yfcli-experts/gl | 凭证 / 结账 / 报表 / 内部对账 |
| 22 | [22-sales-expert](./22-sales-expert/) | SalesExpert | 销售专家 | yfcli-experts/sales | 解析PO / 报价 / 评审 |
| 23 | [23-purchase-expert](./23-purchase-expert/) | PurchaseExpert | 采购专家 | yfcli-experts/purchase | 询价 / 比价 / 交期评审 |
| 24 | [24-plan-expert](./24-plan-expert/) | PlanExpert | 计划专家 | yfcli-experts/plan | 齐套分析 / ATP / 交付承诺 |
| 25 | [25-production-expert](./25-production-expert/) | ProductionExpert | 生产专家 | yfcli-experts/production | 工单进度 / 报工统计 / 良率 |
| 26 | [26-accounting-voucher](./26-accounting-voucher/) | AccountingVoucher | 会计凭证操作 | yfcli-experts/finance | 凭证 / 录凭证 / 过账 / 凭证查询 |
| 27 | [27-account-balance](./27-account-balance/) | AccountBalance | 科目余额查询 | yfcli-experts/finance | 科目余额 / 余额表 / 科目汇总 |
| 28 | [28-financial-report](./28-financial-report/) | FinancialReport | 财务报表 | yfcli-experts/finance | 资产负债表 / 利润表 / 现金流量表 |
| 29 | [29-ar-ap-reconcile](./29-ar-ap-reconcile/) | ArApReconcile | 应收应付对账 | yfcli-experts/finance | 对账 / 核销 / 匹配 / AR/AP |
| 30 | [30-period-close](./30-period-close/) | PeriodClose | 期末结转结账 | yfcli-experts/finance | 结转损益 / 结账 / 期末处理 |
| 31 | [31-business-analyst](./31-business-analyst/) | BusinessAnalyst | 业务分析师 | yfcli_analysis_plan/step | 为什么 / 归因 / 异常分析 / 原因 |
| 32 | [32-intelligent-query](./32-intelligent-query/) | IntelligentQuery | 智能问数 | yfcli_ask | 统计 / 趋势 / 排名 / 同比环比 |

---

## 使用说明

1. 每个助手目录包含 `_workflow.md`（工作流定义）和 `_spec.md`（PRD规格）两个文件
2. 提示词内容完整保留原始文本，未做任何删减或改写
3. Agent 根据用户输入匹配触发关键词后，加载对应文档并按工作流执行
4. 所有助手通过 `yfcli_run` 的 `service` 模式调用易飞侧 AI 端点（`yf.ai.*`，服务名待 Q-02 确认）
5. 专家助手（18~32）从 YZCLI 易助专家模块移植，引擎模块名已改为 yfcli-experts

---

## ⚠️ 商业化提醒

当前 MVP 阶段，prompt 内嵌在各助手文档中。后续商业化时需对齐易助架构：
- prompt 需通过授权服务器切片下放（参照 YZCLI 的 license-server knowhow 端点）
- prompt 不应直接打包在 Skill 中分发，而应通过 API 按需获取
- 详见 YZCLI `packages/yzcli-license-server/src/routes/knowhow.ts` 的设计
