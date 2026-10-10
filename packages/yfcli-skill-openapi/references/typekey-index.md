# 完整 TypeKey 列表（107 个）

> 从 `typekey_map.yaml` 自动提取的精简索引。Agent 需要详细信息时调用 `yf_manifest` 或 `yf_help(type_key)`。
> 
> ⚠️ 本文件由脚本生成，禁止手工编辑。重新生成：`node scripts/gen-typekey-index.mjs`

| TypeKey | 中文名 | 主键 | 容器名 | 操作 | 服务名形状 |
|---------|--------|------|--------|------|-----------|
| account | 会计科目 | ac_no | - | query, read | standard |
| accounting.voucher | 会计凭证 | doc_type_no + doc_no | accounting_voucher_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| ap.refund.doc | 应付退款单 | doc_type_no + doc_no | ap_refund_doc_data ✅ | approve, create, delete, disapprove, invalid, query, read, update | standard |
| approve.price | 核价单 | doc_type_no + doc_no | detail_of_approve_price_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| ar.refund.doc | 应收退款单 | doc_type_no + doc_no | ar_refund_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| bad.cause | 不良原因 | bad_cause_no | - | query, read | standard |
| bom | 新增BOM | master_item_no | bom_requirement_detail_data | approve, create, delete, disapprove, invalid, query, read, update | mixed |
| borrow.doc | 借出单 | doc_type_no + doc_no | borrow_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| borrow.return | 借出归还单 | doc_type_no + doc_no | borrow_return_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| calendar | 假日表 | year + industry + shift | - | query, read | standard |
| collection.doc | 收款单 | doc_type_no + doc_no | collection_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| combination.order | 组合单 | doc_type_no + doc_no | combination_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| company.detail | 公司 | company_no | - | query | standard |
| computation.sampling.basis | 计量抽查基础 | inspection_level | - | query, read | standard |
| currency | 币种 | currency | - | query, read | standard |
| customer | 客户 | customer_no | customer_address_data | create, delete, query, read, update | standard |
| customer.item | 客户品号 | customer_no + item_no + customer_item_no | customer_item_data | create, delete, query, read, update | standard |
| department | 部门 | department_no | - | query, read | standard |
| destroy.order | 销毁单 | doc_type_no + doc_no | destroy_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| document.type.general | 单据性质 | doc_type_no | - | query | - |
| ebom | 查询EBOM | master_item_no | ebom_data | create, delete, query, read, update | standard |
| ebom.change | 变更单 | doc_type_no + doc_no | ebom_change_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| ecn | 变更单 | doc_type_no + doc_no | ecn_component_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| employee | 员工 | staff_no | - | query | standard |
| engineering.item | 工程品号 | engineering_item | engineering_items_header_data | create, delete, query, read, update | standard |
| expense.invoice | 费用发票 | doc_type_no + doc_no | expense_invoice_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| financial.institution | 金融机构 | financing_institution | - | create, delete, query, read, update | standard |
| function.category | 职务类别 | function_no | - | query, read | - |
| inquiry | 询价单 | doc_type_no + doc_no | inquiry_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| inspection | 检验项目 | inspection_no | - | query, read | standard |
| inventory.transaction | 库存交易单 | doc_type_no + doc_no | inventory_transaction_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| inventory.transaction.details | 库存交易明细 | doc_type_no + doc_no + seq + in_out_type | - | query, read | standard |
| item | 品号信息 | item_no | item_basic_data | create, delete, query, read, update | standard |
| item.classification | 品号类别 | classification_mode + item_classification_code | item_classification_data | create, delete, query, read, update | standard |
| item.count | 盘点 | count_manuscript_no | - | approve, disapprove, invalid, read | standard |
| item.customer.price | 客户商品价格 | customer_no + item_no + effective_date + pricing_unit + curr + first_trade_date | customer_products_pricing_detail_data | create, delete, query, read, update | - |
| item.inspection | 品号检验项目 | quality_control_category_no + item_no + routing_no | - | query, read | standard |
| item.inventory.qty | 品号库存 | - | - | query | - |
| item.lot | 批号 | item_no + lot_no | - | query, read | standard |
| item.supplier.price | 供应商料件价格 | item_no + supplier_no + currency + pricing_unit + effective_date | detail_note_of_item_factory_data | create, delete, query, read, update | - |
| monthly.item.statistics | 品号月档 | item_no + stock_month | - | query, read | standard |
| op.stockin | 工艺入库单 | doc_type_no + doc_no | op_stockin_data ✅ | approve, create, delete, disapprove, invalid, query, read, update | standard |
| operation | 工艺 | routing_no | operation_no_data | create, delete, query, update | standard |
| other.payable.doc | 其他应付单 | doc_type_no + doc_no | other_payable_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| other.receivable | 其他应收单 | doc_type_no + doc_no | other_receivable_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| outsourcing.approve.price | 委外核价单 | doc_type_no + doc_no | outsourcing_approve_price_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| outsourcing.price | 委外价格 | item_no + routing_no + outsourcing_supplier_no + pricing_unit + effective_date + currency | outsourcing_price_data | create, delete, query, read, update | standard |
| outsourcing.purchase.acceptance | 委外进货单验收 | doc_type_no + doc_no + seq | outsourcing_purchase_acceptance_data | approve, disapprove, query, read, update | standard |
| outsourcing.purchase.arrival | 委外到货单 | doc_type_no + doc_no | outsourcing_purchase_arrival_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| outsourcing.purchase.arrival.acceptance | 委外到货单验收 | doc_type_no + doc_no + seq + inspection_batch + times | outsourcing_purchase_arrival_acceptance_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| outsourcing.purchase.arrival.inspection | 委外到货检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| outsourcing.purchase.inspection | 委外进货检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| outsourcing.purchase.inspection.return | 退回委外验退件 | doc_type_no + doc_no + seq + return_date | outsourcing_purchase_inspection_return_data | create, delete, query, read, update | standard |
| outsourcing.purchase.receipt | 委外进货单 | doc_type_no + doc_no | outsourcing_purchase_receipt_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| outsourcing.purchase.return | 委外退货单 | doc_type_no + doc_no | outsourcing_purchase_return_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| payable.doc | 付款单 | doc_type_no + doc_no | payable_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| picking.receipt | 领料单 | doc_type_no + doc_no | picking_receipt_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| picking.return | 退料单 | doc_type_no + doc_no | picking_return_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| plant | 工厂 | plant_no | plant_data | create, delete, query, read, update | standard |
| precollection.doc | 预收款单 | doc_type_no + doc_no | precollection_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| prepayment.doc | 预付单 | doc_type_no + doc_no | prepayment_doc_data ✅ | approve, create, delete, disapprove, invalid, query, read, update | standard |
| product.process | 产品工艺路线 | routing_item_no + process_code | product_process_detail_data | create, delete, query, read, update | standard |
| project | 项目 | project_no | project_data | create, delete, query, read, update | standard |
| purchase.arrival | 到货单 | doc_type_no + doc_no | purchase_arrival_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| purchase.arrival.acceptance | 到货单验收 | doc_type_no + doc_no + seq + inspection_batch + times | purchase_arrival_acceptance_data | approve, create, delete, disapprove, query, read, update | standard |
| purchase.arrival.inspection | 到货检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| purchase.change | 采购变更单 | doc_type_no + doc_no + version | purchase_change_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| purchase.inspection.return | 退回验退件 | source_type_no + source_doc_no + source_seq + return_date | purchase_inspection_return_data | create, delete, query, read, update | standard |
| purchase.invoice | 采购发票 | doc_type_no + doc_no | purchase_invoice_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| purchase.order | 采购单 | doc_type_no + doc_no | purchase_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| purchase.receipt | 进货单 | doc_type_no + doc_no | purchase_receipt_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| purchase.receipt.acceptance | 修改进货单验收 | doc_type_no + doc_no + seq | purchase_receipt_acceptance_data | approve, disapprove, query, read, update | standard |
| purchase.receipt.inspection | 进货检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| purchase.requisitions | 请购单 | doc_type_no + doc_no | purchase_requisitions_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| purchase.return | 退货单 | doc_type_no + doc_no | purchase_return_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| quality.control.category | 品管类别 | quality_control_category_no | - | query, read | standard |
| quotation | 报价单 | doc_type_no + doc_no | quotation_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| receive.payment.term | 付款条件 | category + payment_condition_no | receive_payment_term_data | create, delete, query, read, update | standard |
| replace.substitute.item | 取替代料 | component + master_item + rep_sub_item | replace_substitute_items_detail_data | create, delete, query, read, update | standard |
| sales.forecast | 销售预测 | sales_forecast | sales_forecast_data | create, delete, query, read, update | standard |
| sales.invoice | 销售发票 | doc_type_no + doc_no | sales_invoice_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| sales.order | 数据重新加载刷新 | doc_type_no + doc_no | sales_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| sales.order.change | 修改订单变更单 | doc_type_no + doc_no + change_version | - | approve, create, delete, disapprove, invalid, query, read, update | standard |
| sales.return | 销退单 | doc_type_no + doc_no | sales_return_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| sales.return.inspection | 销退检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| sampling.basis | 抽查基础 | inspection_level + strictness_degree | - | query, read | standard |
| scrap.order | 报废单 | doc_type_no + doc_no | scrap_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| shipping.notice | 出货通知单 | doc_type_no + doc_no | shipping_notice_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| shipping.order | 销货单 | doc_type_no + doc_no | shipping_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| split.order | 拆解单 | doc_type_no + doc_no | combination_order_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| subscription | 查询订阅中心资料 | - | - | query, read | standard |
| supplier | 供应商 | supplier_no | supplier_basic_data | create, delete, query, read, update | mixed |
| team.personnel | 班组成员 | team_no | detail_note_of_team_personnel_data | create, delete, query, read, update | standard |
| transfer | 调拨单 | doc_type_no + doc_no | transfer_data ✅ | approve, create, delete, disapprove, invalid, query, read, update | standard |
| transfer.doc | 转移单 | doc_type_no + doc_no | transfer_doc_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| transfer.doc.inspection | 转移检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| unit | 单位 | unit | unit_data | create, query, read | standard |
| warehouse | 仓库 | warehouse_no | warehouse_data | create, delete, query, read, update | standard |
| wo | 工单 | doc_type_no + doc_no | wo_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| wo.change | 工单变更单 | wo_doc_type_no + wo_doc_no + change_version | wo_change_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| wo.commence | 投产单 | doc_type_no + doc_no | wo_commence_data ✅ | approve, create, delete, disapprove, invalid, query, read, update | standard |
| wo.routing | 工单工艺 | wo_doc_type_no + wo_doc_no | wo_routing_detail_data | create, delete, query, read, update | standard |
| wo.split | 工单拆分 | wo_doc_type_no + wo_doc_no | - | query, read | standard |
| wo.stockin | 生产入库单 | doc_type_no + doc_no | wo_stockin_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| wo.stockin.inspection | 生产入库检验单 | doc_type_no + doc_no + seq + inspection_batch + times | - | query, read | standard |
| work.report | 报工单 | doc_type_no + doc_no | work_report_data | approve, create, delete, disapprove, invalid, query, read, update | standard |
| workstation | 工作中心 | production_line_code | workstation_head_data | create, delete, query, read, update | standard |

## 列说明

- **容器名**：写操作（create/update）时 `parameter` 下的节点名。标 ✅ 表示经真机实测确认（文档标注有误的对象）
- **操作**：该对象支持的 MCP 操作类型
- **服务名形状**：`standard` = 含 `.data.` 段（如 `yf.oapi.plant.data.create`）；`mixed` = 部分操作含/不含；`undefined` = 需查表

## 统计

- 总对象数：107
- 有容器名（detail_nodes）：77
- 无容器名（仅 query/read）：30
- 容器名经实测修正：5
- 服务名形状分布：standard=100, mixed=2, undefined=5
