# AI 助手索引（31 个）

> **产品线**: YF (易飞 E10) | **生成时间**: 2026-10-10
> **数据来源**: `_routes.yaml` + `knowledge/official/ai-assistants/_index.md`

## 原有分析助手（02~17）

| 编号 | 名称 | 触发关键词 | MCP服务名 | 状态 |
|------|------|-----------|----------|------|
| 02 | 品号智能查重 | 品号查重, 重复品号, 料号重复 | yf.ai.ItemCheckDuplicate | pending |
| 03 | 库存呆滞查询 | 呆滞库存, 库龄, 库存周转, 滞料 | yf.ai.AIDeadStockInventory | pending |
| 04 | 盘点分析报告 | 盘点分析, 盘点报告, 盘点差异 | yf.ai.InventoryAnalysisReport | pending |
| 05 | 销售订单跟单 | 销售订单跟单, 销单进度, 出货进度 | yf.ai.SalesOrderTracking | pending |
| 06 | 销售订单摘要 | 销售摘要, 销售订单汇总, 销单概览 | yf.ai.SalesOrderSummary | pending |
| 07 | 销售订单合规 | 销售合规, 合同比对, 订单合规审查 | yf.ai.SalesOrderCompliance | pending |
| 08 | 销售业务异常查询 | 销售异常, 销售波动, 业绩异动 | yf.ai.SalesbusinessWarning | ✅ confirmed |
| 09 | 客户销售报告 | 客户销售报告, 客户分析, 客户贡献 | yf.ai.CustomerSalesDataGet | pending |
| 10 | 采购订单跟单 | 采购跟单, 采购进度, 到货跟踪 | yf.ai.PurchaseOrderTracking | pending |
| 11 | 采购订单摘要 | 采购摘要, 采购汇总, 采购概览 | yf.ai.PurchaseOrderSummary | pending |
| 12 | 采购订单合规 | 采购合规, 采购合同比对, 采购合规审查 | yf.ai.PurchaseOrderCompliance | pending |
| 13 | 采购业务异常查询 | 采购异常, 采购波动, 供应商风险 | yf.ai.PurchaseBusinessWarning | ✅ confirmed |
| 14 | 供应商采购报告 | 供应商报告, 供应商分析, 供应商表现 | yf.ai.SupplierPurchaseGet | pending |
| 15 | 呆滞工单查询 | 呆滞工单, 工单停滞, 在制超期 | yf.ai.WoinactiveWarning | pending |
| 16 | 生产报告 | 生产报告, 生产分析, 发料分析 | yf.ai.ProdReportQuery | pending |
| 17 | 生产进度延迟查询 | 生产延迟, 进度延迟, 交期预警 | yf.ai.ProdDelayQuery | pending |

## 专家助手（18~25，引擎驱动）

| 编号 | 名称 | 触发关键词 | 引擎模块 | 状态 |
|------|------|-----------|---------|------|
| 18 | 应收会计专家 | 应收, 对账, 账龄, 催收 | yfcli-experts/ar | expert |
| 19 | 成本会计专家 | 成本模拟, BOM成本, 月结检查 | yfcli-experts/cost | expert |
| 20 | 应付会计专家 | 应付分析, 付款优先级, 三单匹配 | yfcli-experts/ap | expert |
| 21 | 总账会计专家 | 凭证, 结账, 报表, 内部对账 | yfcli-experts/gl | expert |
| 22 | 销售专家 | 解析PO, 报价, 评审 | yfcli-experts/sales | expert |
| 23 | 采购专家 | 询价, 比价, 交期评审 | yfcli-experts/purchase | expert |
| 24 | 计划专家 | 齐套分析, ATP, 交付承诺 | yfcli-experts/plan | expert |
| 25 | 生产专家 | 工单进度, 报工统计, 良率 | yfcli-experts/production | expert |

## 财务操作助手（26~30，走 typekey）

| 编号 | 名称 | 触发关键词 | 服务 | 状态 |
|------|------|-----------|------|------|
| 26 | 会计凭证操作 | 凭证, 录凭证, 过账, 凭证查询 | account | ✅ confirmed |
| 27 | 科目余额查询 | 科目余额, 余额表, 科目汇总 | account | ✅ confirmed |
| 28 | 财务报表 | 资产负债表, 利润表, 现金流量表 | account | ✅ confirmed |
| 29 | 应收应付对账 | 对账, 核销, 匹配, AR/AP | account | ✅ confirmed |
| 30 | 期末结转结账 | 结转损益, 结账, 期末处理 | account | ✅ confirmed |

## 高级分析助手（31~32）

| 编号 | 名称 | 触发关键词 | 服务 | 状态 |
|------|------|-----------|------|------|
| 31 | 业务分析师 | 为什么, 归因, 异常分析, 原因 | yfcli_analysis_plan/step | expert |
| 32 | 智能问数 | 统计, 趋势, 排名, 同比环比 | yfcli_ask | ✅ confirmed |

---

## 使用说明

1. Agent 根据用户输入匹配触发关键词 → 调用 `yf_service_route(keywords=[...])`
2. 获取 assistant_id 和 service 后，调用 `yf_analysis_prompt(assistant_id, kind)` 加载完整 prompt
3. 按 prompt 中的工作流执行 ERP 操作
4. status 说明：confirmed=端点已验证可用，pending=服务名待确认，expert=引擎驱动不走 AI 端点