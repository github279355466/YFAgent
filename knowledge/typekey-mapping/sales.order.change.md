# 订单变更单 (sales.order.change) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only sales.order.change`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.sales.order.change.data.query.get`
- **读取服务**：`yf.oapi.sales.order.change.data.read.get`
- **新增服务**：`yf.oapi.sales.order.change.data.create`
- **标题来源**：目录名 8 个，取最高频：订单变更单(7) / 修改订单变更单(1)

> ⚠️ 易飞**无字段编号体系**（字段编号为易助 DLL 专有）。易飞为「节点名（小写，API 收发参实际使用）↔ 字段名（大写，数据库物理列名）」双轨。
>
> 本表「字段名称」列的判定规则：`description` **恰好等于节点名的大写形式**时才认定。
> 易飞文档中大量大写 desc（如 `CONSIGNEE` / `FAX_NO` / `NOTIFY`）是**未翻译的占位描述**而非物理列名，已排除。
> 无权威字段名时以 `~` 占位——**这是事实，不是缺失**。

> ⚠️ `not_null` 在 Apipost 全库均为 1（含只读字段与管理字段），**不可作为必填判据**。
> 本表「备注」列的可写性判定依据的是**该字段在 `create` / `update` 入参中是否出现**这一事实：
> `create` 中出现 = 必填（官方约束：必须提供业务主键及不可空白字段）；仅 `update` 中出现 = 可选。

## 业务主键

- **构成**：`doc_type_no` + `doc_no` + `change_version`（**复合主键**）
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `agent` | `~` | 代理商 | string | 可写（create+update 均出现） |
| `agent_name` | `~` | 代理商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker` | `~` | 报关行 | string | 可写（create+update 均出现） |
| `broker_name` | `~` | 报关行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_date` | `~` | 变更日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_reason` | `~` | 变更原因 | string | 可写（create+update 均出现） |
| `close_order` | `~` | 整张结束 | string | 可写（create+update 均出现） |
| `commission_rate` | `~` | 佣金比率 | number | 可写（create+update 均出现） |
| `consignee` | `CONSIGNEE` | CONSIGNEE | string | 可写（create+update 均出现） |
| `consignee_name` | `~` | CONSIGNEE名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact` | `~` | 连络人 | string | 可写（create+update 均出现） |
| `contract_type` | `~` | 合同类型 | string | 可写（create+update 均出现） |
| `correspondent_bank` | `~` | 往来银行 | string | 可写（create+update 均出现） |
| `correspondent_bank_name` | `~` | 往来银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_doc_no` | `~` | 客户单号 | string | 可写（create+update 均出现） |
| `customer_no` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_shortname` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `departure_port` | `~` | 起始港口 | string | 可写（create+update 均出现） |
| `deposit_rate` | `~` | 订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destination` | `~` | 目的地 | string | 可写（create+update 均出现） |
| `destination_port` | `~` | 目的港口 | string | 可写（create+update 均出现） |
| `doc_date` | `~` | 单据日期 | string | 可写（create+update 均出现） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `downstream_supplier_name` | `~` | 下游厂商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_so_change_no` | `~` | EBC订单变更单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_so_change_version` | `~` | EBC订单变更版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `fax_no` | `FAX_NO` | FAX_NO | string | 可写（create+update 均出现） |
| `inspection_company` | `~` | 验货公司 | string | 可写（create+update 均出现） |
| `inspection_company_name` | `~` | 验货公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_remarks` | `~` | INVOICE备注 | string | 可写（create+update 均出现） |
| `l_cno` | `~` | L/C_NO | string | 可写（create+update 均出现） |
| `mark` | `~` | 正唛 | string | 可写（create+update 均出现） |
| `mark_number` | `~` | 唛头编号 | string | 可写（create+update 均出现） |
| `negotiating_bank` | `~` | 押汇银行 | string | 可写（create+update 均出现） |
| `negotiating_bank_name` | `~` | 押汇银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_address1` | `~` | 新送货地址(一) | number | 可写（create+update 均出现） |
| `new_delivery_address2` | `~` | 新送货地址(二) | string | 可写（create+update 均出现） |
| `new_delivery_date` | `~` | 新交货日期 | string | 可写（create+update 均出现） |
| `new_installation_completion_date` | `~` | 新安装调试完成日期 | string | 可写（create+update 均出现） |
| `new_local_curr_not_tax_amount` | `~` | 新本币税前金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_local_curr_tax` | `~` | 新本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_name` | `~` | 新项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `notify` | `NOTIFY` | NOTIFY | string | 可写（create+update 均出现） |
| `notify_name` | `~` | NOTIFY名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_date` | `~` | 订单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_agent` | `~` | 原代理商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_agent_name` | `~` | 原代理商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_broker` | `~` | 原报关行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_broker_name` | `~` | 原报关行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_commission_rate` | `~` | 原佣金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_consignee` | `~` | 原CONSIGNEE | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_consignee_name` | `~` | 原CONSIGNEE名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_contact` | `~` | 原联系人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_correspondent_bank` | `~` | 原往来银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_correspondent_bank_name` | `~` | 原往来银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_doc_no` | `~` | 原客户单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_no` | `~` | 原客户编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_shortname` | `~` | 原客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_address1` | `~` | 原送货地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_address2` | `~` | 原送货地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_date` | `~` | 原交货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department` | `~` | 原部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department_name` | `~` | 原部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_departure_port` | `~` | 原起始港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_deposit_rate` | `~` | 原订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destination` | `~` | 原目的地 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destination_port` | `~` | 原目的港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_exchange_rate` | `~` | 原汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_fax_no` | `~` | 原传真 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_inspection_company` | `~` | 原验货公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_inspection_company_name` | `~` | 原验货公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_installation_completion_date` | `~` | 原安装调试完成日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_invoice_remarks` | `~` | 原INVOICE备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_l_cno` | `~` | 原L/CNO. | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_local_curr_not_tax_amount` | `~` | 原本币税前金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_local_curr_tax` | `~` | 原本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_mark` | `~` | 原正唛 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_mark_number` | `~` | 原唛头编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_negotiating_bank` | `~` | 原押汇银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_negotiating_bank_name` | `~` | 原押汇银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_notify` | `~` | 原NOTIFY | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_package_list_remarks` | `~` | 原PACKING-LIST备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_payment_condition_no` | `~` | 原付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_name` | `~` | 原出货工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_no` | `~` | 原出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_price_condition` | `~` | 原价格说明 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_project_no` | `~` | 原项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks` | `~` | 原备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_1` | `~` | 原备注一 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_2` | `~` | 原备注二 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_3` | `~` | 原备注三 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_4` | `~` | 原备注四 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_sales_name` | `~` | 原业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_salesman_no` | `~` | 原业务人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_side_mark` | `~` | 原侧唛 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_code` | `~` | 原来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_identification_no` | `~` | 原税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_rate` | `~` | 原税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_type` | `~` | 原税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_telephone` | `~` | 原电话 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_trans_currency` | `~` | 原交易币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transfer_times` | `~` | 原传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_company_name` | `~` | 原运输公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_company_no` | `~` | 原运输公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_mode` | `~` | 原运输方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_limit` | `~` | 超限放行 | string | 可写（create+update 均出现） |
| `package_list_remarks` | `~` | PACKING-LIST备注 | string | 可写（create+update 均出现） |
| `payment_condition_name` | `~` | 付款条件 | string | 可写（create+update 均出现） |
| `payment_condition_no` | `~` | 付款名称 | string | 可写（create+update 均出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_condition` | `~` | 价格说明 | string | 可写（create+update 均出现） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `remarks_1` | `~` | 备注一 | string | 可写（create+update 均出现） |
| `remarks_2` | `~` | 备注二 | string | 可写（create+update 均出现） |
| `remarks_3` | `~` | 备注三 | string | 可写（create+update 均出现） |
| `remarks_4` | `~` | 备注四 | string | 可写（create+update 均出现） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `salesman_no` | `~` | 业务人员 | string | 可写（create+update 均出现） |
| `side_mark` | `~` | 侧唛 | string | 可写（create+update 均出现） |
| `tax_identification_no` | `~` | 税号 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `tax_type` | `~` | 税种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `telephone` | `~` | 电话 | string | 可写（create+update 均出现） |
| `trans_currency` | `~` | 交易币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency_name` | `~` | 交易币种名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_company_name` | `~` | 运输公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_company_no` | `~` | 运输公司 | string | 可写（create+update 均出现） |
| `transport_mode` | `~` | 运输方式 | string | 可写（create+update 均出现） |

## 单身字段：`sales_order_change`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `agent` | `~` | 代理商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `agent_name` | `~` | 代理商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker` | `~` | 报关行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker_name` | `~` | 报关行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_date` | `~` | 变更日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_reason` | `~` | 变更原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `close_order` | `~` | 整张结束 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `commission_rate` | `~` | 佣金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `consignee` | `CONSIGNEE` | CONSIGNEE | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `consignee_name` | `~` | CONSIGNEE名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact` | `~` | 连络人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contract_type` | `~` | 合同类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `correspondent_bank` | `~` | 往来银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `correspondent_bank_name` | `~` | 往来银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_doc_no` | `~` | 客户单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_shortname` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `departure_port` | `~` | 起始港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deposit_rate` | `~` | 订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destination` | `~` | 目的地 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destination_port` | `~` | 目的港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `downstream_supplier_name` | `~` | 下游厂商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_so_change_no` | `~` | EBC订单变更单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_so_change_version` | `~` | EBC订单变更版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fax_no` | `FAX_NO` | FAX_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_company` | `~` | 验货公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_company_name` | `~` | 验货公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_remarks` | `~` | INVOICE备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `l_cno` | `~` | L/C_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mark` | `~` | 正唛 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mark_number` | `~` | 唛头编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `negotiating_bank` | `~` | 押汇银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `negotiating_bank_name` | `~` | 押汇银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_address1` | `~` | 新送货地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_address2` | `~` | 新送货地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_date` | `~` | 新交货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_installation_completion_date` | `~` | 新安装调试完成日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_local_curr_not_tax_amount` | `~` | 新本币税前金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_local_curr_tax` | `~` | 新本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_name` | `~` | 新项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `notify` | `NOTIFY` | NOTIFY | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `notify_name` | `~` | NOTIFY名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_date` | `~` | 订单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_agent` | `~` | 原代理商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_agent_name` | `~` | 原代理商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_broker` | `~` | 原报关行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_broker_name` | `~` | 原报关行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_commission_rate` | `~` | 原佣金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_consignee` | `~` | 原CONSIGNEE | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_consignee_name` | `~` | 原CONSIGNEE名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_contact` | `~` | 原联系人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_correspondent_bank` | `~` | 原往来银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_correspondent_bank_name` | `~` | 原往来银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_doc_no` | `~` | 原客户单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_no` | `~` | 原客户编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_shortname` | `~` | 原客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_address1` | `~` | 原送货地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_address2` | `~` | 原送货地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_date` | `~` | 原交货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department` | `~` | 原部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department_name` | `~` | 原部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_departure_port` | `~` | 原起始港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_deposit_rate` | `~` | 原订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destination` | `~` | 原目的地 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destination_port` | `~` | 原目的港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_exchange_rate` | `~` | 原汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_fax_no` | `~` | 原传真 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_inspection_company` | `~` | 原验货公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_inspection_company_name` | `~` | 原验货公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_installation_completion_date` | `~` | 原安装调试完成日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_invoice_remarks` | `~` | 原INVOICE备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_l_cno` | `~` | 原L/CNO. | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_local_curr_not_tax_amount` | `~` | 原本币税前金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_local_curr_tax` | `~` | 原本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_mark` | `~` | 原正唛 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_mark_number` | `~` | 原唛头编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_negotiating_bank` | `~` | 原押汇银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_negotiating_bank_name` | `~` | 原押汇银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_notify` | `~` | 原NOTIFY | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_package_list_remarks` | `~` | 原PACKING-LIST备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_payment_condition_no` | `~` | 原付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_name` | `~` | 原出货工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_no` | `~` | 原出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_price_condition` | `~` | 原价格说明 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_project_no` | `~` | 原项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks` | `~` | 原备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_1` | `~` | 原备注一 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_2` | `~` | 原备注二 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_3` | `~` | 原备注三 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_4` | `~` | 原备注四 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_sales_name` | `~` | 原业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_salesman_no` | `~` | 原业务人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_side_mark` | `~` | 原侧唛 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_code` | `~` | 原来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_identification_no` | `~` | 原税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_rate` | `~` | 原税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_type` | `~` | 原税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_telephone` | `~` | 原电话 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_trans_currency` | `~` | 原交易币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transfer_times` | `~` | 原传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_company_name` | `~` | 原运输公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_company_no` | `~` | 原运输公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_mode` | `~` | 原运输方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_limit` | `~` | 超限放行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `package_list_remarks` | `~` | PACKING-LIST备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_condition` | `~` | 价格说明 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_1` | `~` | 备注一 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_2` | `~` | 备注二 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_3` | `~` | 备注三 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_4` | `~` | 备注四 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `salesman_no` | `~` | 业务人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `side_mark` | `~` | 侧唛 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `telephone` | `~` | 电话 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency` | `~` | 交易币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency_name` | `~` | 交易币种名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_company_name` | `~` | 运输公司名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_company_no` | `~` | 运输公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_mode` | `~` | 运输方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "sales_order_change"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`sales_order_detail_change`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `change_reason` | `~` | 变更原因 | string | 可写（create+update 均出现） |
| `configuration_no` | `~` | 配置方案 | string | 可写（create+update 均出现） |
| `cuft_size` | `~` | 材积(CUFT) | number | 可写（create+update 均出现） |
| `customer_item_no` | `~` | 客户品号 | string | 可写（create+update 均出现） |
| `discount_rate` | `~` | 折扣率 | number | 可写（create+update 均出现） |
| `estimate_gross_amount` | `~` | 预估毛利 | number | 可写（create+update 均出现） |
| `estimate_gross_margin` | `~` | 预估毛利率 | number | 可写（create+update 均出现） |
| `forecast_seq` | `~` | 预测序号 | string | 可写（create+update 均出现） |
| `gift_package_qty` | `~` | 赠品包装量 | number | 可写（create+update 均出现） |
| `gift_qty` | `~` | 赠品量 | number | 可写（create+update 均出现） |
| `gross_weight_kg` | `~` | 毛重(Kg) | number | 可写（create+update 均出现） |
| `is_end` | `~` | 结束 | string | 可写（create+update 均出现） |
| `item_name` | `~` | 品名 | string | 可写（create+update 均出现） |
| `item_no` | `~` | 品号 | string | 可写（create+update 均出现） |
| `item_spec` | `~` | 规格 | string | 可写（create+update 均出现） |
| `order_package_qty` | `~` | 订单包装数量 | number | 可写（create+update 均出现） |
| `order_qty` | `~` | 订单数量 | number | 可写（create+update 均出现） |
| `original_seq` | `~` | 原序号 | string | 可写（create+update 均出现） |
| `package_method` | `~` | 包装方式 | string | 可写（create+update 均出现） |
| `plan_delivery_date` | `~` | 预交货日 | string | 可写（create+update 均出现） |
| `price` | `~` | 单价 | number | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `sales_forecast` | `~` | 预测编号 | string | 可写（create+update 均出现） |
| `seq` | `~` | 变更单序号 | string | 可写（create+update 均出现） |
| `simulation_cost` | `~` | 模拟成本 | number | 可写（create+update 均出现） |
| `simulation_unit_cost` | `~` | 模拟单位成本 | number | 可写（create+update 均出现） |
| `source_doc_no` | `~` | 来源单号 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | 可写（create+update 均出现） |
| `warehouse_no` | `~` | 仓库 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "sales_order_detail_change"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`sales_order_chang`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `agent` | `~` | 代理商 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `agent_name` | `~` | 代理商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker` | `~` | 报关行 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker_name` | `~` | 报关行名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_date` | `~` | 变更日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_reason` | `~` | 变更原因 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `close_order` | `~` | 整张结束 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `commission_rate` | `~` | 佣金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `consignee` | `CONSIGNEE` | CONSIGNEE | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `consignee_name` | `~` | CONSIGNEE名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact` | `~` | 连络人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contract_type` | `~` | 合同类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `correspondent_bank` | `~` | 往来银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `correspondent_bank_name` | `~` | 往来银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_doc_no` | `~` | 客户单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_shortname` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `departure_port` | `~` | 起始港口 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deposit_rate` | `~` | 订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destination` | `~` | 目的地 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destination_port` | `~` | 目的港口 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `downstream_supplier_name` | `~` | 下游厂商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_so_change_no` | `~` | EBC订单变更单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_so_change_version` | `~` | EBC订单变更版本 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fax_no` | `FAX_NO` | FAX_NO | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_company` | `~` | 验货公司 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_company_name` | `~` | 验货公司名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_remarks` | `~` | INVOICE备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `l_cno` | `~` | L/C_NO | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mark` | `~` | 正唛 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mark_number` | `~` | 唛头编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `negotiating_bank` | `~` | 押汇银行 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `negotiating_bank_name` | `~` | 押汇银行名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_address1` | `~` | 新送货地址(一) | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_address2` | `~` | 新送货地址(二) | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_delivery_date` | `~` | 新交货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_installation_completion_date` | `~` | 新安装调试完成日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_local_curr_not_tax_amount` | `~` | 新本币税前金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_local_curr_tax` | `~` | 新本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_name` | `~` | 新项目编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_no` | `~` | 项目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `notify` | `NOTIFY` | NOTIFY | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `notify_name` | `~` | NOTIFY名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_date` | `~` | 订单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_agent` | `~` | 原代理商 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_agent_name` | `~` | 原代理商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_broker` | `~` | 原报关行 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_broker_name` | `~` | 原报关行名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_commission_rate` | `~` | 原佣金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_consignee` | `~` | 原CONSIGNEE | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_consignee_name` | `~` | 原CONSIGNEE名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_contact` | `~` | 原联系人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_correspondent_bank` | `~` | 原往来银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_correspondent_bank_name` | `~` | 原往来银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_doc_no` | `~` | 原客户单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_no` | `~` | 原客户编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_customer_shortname` | `~` | 原客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_address1` | `~` | 原送货地址(一) | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_address2` | `~` | 原送货地址(二) | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_delivery_date` | `~` | 原交货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department` | `~` | 原部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department_name` | `~` | 原部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_departure_port` | `~` | 原起始港口 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_deposit_rate` | `~` | 原订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destination` | `~` | 原目的地 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destination_port` | `~` | 原目的港口 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_exchange_rate` | `~` | 原汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_fax_no` | `~` | 原传真 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_inspection_company` | `~` | 原验货公司 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_inspection_company_name` | `~` | 原验货公司名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_installation_completion_date` | `~` | 原安装调试完成日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_invoice_remarks` | `~` | 原INVOICE备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_l_cno` | `~` | 原L/CNO. | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_local_curr_not_tax_amount` | `~` | 原本币税前金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_local_curr_tax` | `~` | 原本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_mark` | `~` | 原正唛 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_mark_number` | `~` | 原唛头编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_negotiating_bank` | `~` | 原押汇银行 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_negotiating_bank_name` | `~` | 原押汇银行名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_notify` | `~` | 原NOTIFY | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_package_list_remarks` | `~` | 原PACKING-LIST备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_payment_condition_no` | `~` | 原付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_name` | `~` | 原出货工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_no` | `~` | 原出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_price_condition` | `~` | 原价格说明 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_project_no` | `~` | 原项目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks` | `~` | 原备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_1` | `~` | 原备注一 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_2` | `~` | 原备注二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_3` | `~` | 原备注三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_4` | `~` | 原备注四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_sales_name` | `~` | 原业务人员名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_salesman_no` | `~` | 原业务人员 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_side_mark` | `~` | 原侧唛 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_code` | `~` | 原来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_identification_no` | `~` | 原税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_rate` | `~` | 原税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_type` | `~` | 原税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_telephone` | `~` | 原电话 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_trans_currency` | `~` | 原交易币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transfer_times` | `~` | 原传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_company_name` | `~` | 原运输公司名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_company_no` | `~` | 原运输公司 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_transport_mode` | `~` | 原运输方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_limit` | `~` | 超限放行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `package_list_remarks` | `~` | PACKING-LIST备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_condition` | `~` | 价格说明 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_1` | `~` | 备注一 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_2` | `~` | 备注二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_3` | `~` | 备注三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_4` | `~` | 备注四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_name` | `~` | 业务人员名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `salesman_no` | `~` | 业务人员 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `side_mark` | `~` | 侧唛 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `telephone` | `~` | 电话 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency` | `~` | 交易币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency_name` | `~` | 交易币种名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_company_name` | `~` | 运输公司名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_company_no` | `~` | 运输公司 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_mode` | `~` | 运输方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "sales_order_chang"`**，否则易飞无法识别为单身过滤条件。

## 通则字段（所有对象适用）

### 管理字段（只读，不可赋值）

| 节点名称 | 字段名称 | 类型 | 长度 | 说明 |
|---|---|---|---|---|
| `company` | `COMPANY` | string | 10 | 公司编号（多公司隔离依据） |
| `creator` | `CREATOR` | string | 10 | 录入者 |
| `usr_group` | `USR_GROUP` | string | 10 | 组编号 |
| `create_date` | `CREATE_DATE` | string | 17 | 创建时间（格式 `20241008153342862`，**非 ISO**） |
| `modifier` | `MODIFIER` | string | 10 | 更改者 |
| `modi_date` | `MODI_DATE` | string | 17 | 更改时间 |
| `flag` | `FLAG` | numeric | 3.0 | 标识（版本标识） |

### 自定义字段

| 节点名称 | 字段名称 | 类型 | 长度 | 说明 |
|---|---|---|---|---|
| `udf01` ~ `udf12` | `UDF01` ~ `UDF12` | string | 255 | 用户自定义字段（文本型） |
| `udf51` ~ `udf62` | `UDF51` ~ `UDF62` | numeric | 16.6 | 用户自定义字段（数值型） |

> ⚠️ 易助的自定义字段是 `udf_text1~16` / `udf_no1~16`，**与易飞命名体系互斥**，写错即幻觉。

## 写操作约束（官方通则）

| 操作 | 约束 |
|---|---|
| 新增 `create` | 必须提供业务主键 + 不可空白字段；支持单别自动审核 |
| 更新 `update` | ① 按业务主键定位；② 更新单身时须含**所有**输入字段；③ 单身按主键「存在则更新、不存在则新增」；④ **不支持删除单身**；⑤ 单头与单身 key 值必须一致 |
| 删除 `delete` | 按业务主键定位 |
| 审核/撤审/作废 | 按业务主键定位 |
