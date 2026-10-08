# 销售发票 (sales.invoice) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only sales.invoice`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.sales.invoice.data.query.get`
- **读取服务**：`yf.oapi.sales.invoice.data.read.get`
- **新增服务**：`yf.oapi.sales.invoice.data.create`
- **标题来源**：目录名 16 个，取最高频：销售发票(7) / 销货跨月(1) / 兴达预开(1)

> ⚠️ 易飞**无字段编号体系**（字段编号为易助 DLL 专有）。易飞为「节点名（小写，API 收发参实际使用）↔ 字段名（大写，数据库物理列名）」双轨。
>
> 本表「字段名称」列的判定规则：`description` **恰好等于节点名的大写形式**时才认定。
> 易飞文档中大量大写 desc（如 `CONSIGNEE` / `FAX_NO` / `NOTIFY`）是**未翻译的占位描述**而非物理列名，已排除。
> 无权威字段名时以 `~` 占位——**这是事实，不是缺失**。

> ⚠️ `not_null` 在 Apipost 全库均为 1（含只读字段与管理字段），**不可作为必填判据**。
> 本表「备注」列的可写性判定依据的是**该字段在 `create` / `update` 入参中是否出现**这一事实：
> `create` 中出现 = 必填（官方约束：必须提供业务主键及不可空白字段）；仅 `update` 中出现 = 可选。

## 业务主键

- **构成**：`doc_type_no` + `doc_no`（**复合主键**）
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `address` | `~` | 地址 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_account` | `~` | 付款账号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `bank_code` | `~` | 付款银行 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `bank_name` | `~` | 付款银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_settlement` | `~` | 现结 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `cash_settlement_no` | `~` | 现结收款单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `cash_settlement_type` | `~` | ~ | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `currency` | `~` | 币种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `customer_full_name` | `~` | 客户全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_name` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `data_type` | `~` | 1.蓝字；2.红字 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `department` | `~` | 部门 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `discount_cashing_date` | `~` | 取得折扣兑现日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `discount_collection_date` | `~` | 取得折扣收款日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `doc_date` | `~` | 单据日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `due_date` | `~` | 到期日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `e_invoice` | `~` | 电子发票 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `error_seasons` | `~` | 错误原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_adjustment_amount` | `~` | 本币汇兑损失金额 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `exchange_rate` | `~` | 汇率 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `exp_cashing_date` | `~` | 预计兑现日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `generate_entry_code_cost` | `~` | 生成分录(成本) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_income` | `~` | 生成分录(收入) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `golden_tax_code` | `~` | 金税开票码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `instalment_source_doc_type` | `~` | 分期收款来源单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `instalment_source_no` | `~` | 分期收款来源单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `instalment_source_type` | `~` | 分期收款来源类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_code` | `~` | 发票代码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_date` | `~` | 发票日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_issuance_result` | `~` | 开票结果 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_issuer_name` | `~` | 开票人名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_issuer_no` | `~` | 开票人 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_no` | `INVOICE_NO` | INVOICE_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_number` | `~` | ~ | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_printing` | `~` | 发票打印 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_url` | `~` | 发票URL地址 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `is_print_list` | `~` | 是否需打印清单 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issuer_qty` | `~` | 开票数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `l_c_no` | `~` | L/C_NO | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `local_curr_cancelled_amount` | `~` | 本币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `plan_receive_date` | `~` | 预计收款日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_error_reasons` | `~` | 打印报错原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_invoice_list` | `~` | 发票清单打印 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_result` | `~` | 打印结果 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_no` | `~` | 流程编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `receive_bank` | `~` | 收款银行 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `receive_bank_account` | `~` | 收款银行账号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `receive_bank_name` | `~` | 收款行名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `recipient_customer_no` | `~` | ~ | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `red_invoice_information` | `~` | 红字发票信息表编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `revaluation_exchange_rate` | `~` | 上次重估汇率 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `reverse` | `~` | 红冲 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `reverse_invoice_no` | `~` | 红冲发票单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `reverse_invoice_type_no` | `~` | 红冲发票单别 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `reverse_reason` | `~` | 红冲原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_no` | `~` | 业务员 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `settlement_acct` | `~` | 结算科目 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `settlement_acct_name` | `~` | 结算科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_name` | `~` | 结算方式名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_no` | `~` | 结算方式 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `settlement_name` | `~` | 结算号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_no` | `~` | 结算号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source` | `~` | 1.销货销退 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `split_labels` | `~` | 拆分标签 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_disk_data` | `~` | 税盘信息 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_rate` | `~` | 税率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_type` | `~` | 税种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `total_local_curr_amount` | `~` | 本币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_trans_curr_amount` | `~` | 原币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_cancelled_amount` | `~` | 原币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_offseted_amount` | `~` | 原币已冲减金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_offseted_tax` | `~` | 原币已冲减税额 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_invoice_code` | `~` | 正票发票代码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_invoice_no` | `~` | 正票发票号码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `verification_status` | `~` | 核销状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`sales_invoice_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `address` | `~` | 地址 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_account` | `~` | 付款账号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_code` | `~` | 付款银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_name` | `~` | 付款银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_settlement` | `~` | 现结 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_settlement_no` | `~` | 现结收款单号 | string | ~ |
| `cash_settlement_type` | `~` | 现结收款单别 | string | ~ |
| `company` | `~` | 公司 | string | 管理字段（只读，不可赋值） |
| `create_date` | `~` | 创建时间 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建人 | string | 管理字段（只读，不可赋值） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_full_name` | `~` | 客户全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_name` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `data_type` | `~` | 单据类型 | string | ~ |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_cashing_date` | `~` | 取得折扣兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_collection_date` | `~` | 取得折扣收款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `due_date` | `~` | 到期日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `e_invoice` | `~` | 电子发票 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `error_seasons` | `~` | 错误原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_adjustment_amount` | `~` | 本币汇兑损失金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_cashing_date` | `~` | 预计兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `flag` | `~` | 修改次数 | int | 管理字段（只读，不可赋值） |
| `generate_entry_code_cost` | `~` | 生成分录(成本) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_income` | `~` | 生成分录(收入) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `golden_tax_code` | `~` | 金税开票码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `instalment_source_doc_type` | `~` | 分期收款来源单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `instalment_source_no` | `~` | 分期收款来源单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `instalment_source_type` | `~` | 分期收款来源类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_code` | `~` | 发票代码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_date` | `~` | 发票日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_issuance_result` | `~` | 开票结果 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_issuer_name` | `~` | 开票人名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_issuer_no` | `~` | 开票人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_no` | `INVOICE_NO` | INVOICE_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_no_data` | `~` | 发票号码查询 | array | ~ |
| `invoice_number` | `~` | INVOICE_NO | string | ~ |
| `invoice_printing` | `~` | 发票打印 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_url` | `~` | 发票URL地址 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `is_print_list` | `~` | 是否需打印清单 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issuer_qty` | `~` | 开票数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `l_c_no` | `~` | L/C_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_cancelled_amount` | `~` | 本币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modi_date` | `~` | 修改时间 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改人 | string | 管理字段（只读，不可赋值） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_receive_date` | `~` | 预计收款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_error_reasons` | `~` | 打印报错原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_invoice_list` | `~` | 发票清单打印 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_result` | `~` | 打印结果 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_no` | `~` | 流程编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_bank` | `~` | 收款银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_bank_account` | `~` | 收款银行账号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_bank_name` | `~` | 收款行名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `recipient_customer_name` | `~` | 销货客户名称 | string | ~ |
| `recipient_customer_no` | `~` | 销货客户编号 | string | ~ |
| `red_invoice_information` | `~` | 红字发票信息表编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `revaluation_exchange_rate` | `~` | 上次重估汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse` | `~` | 红冲 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_invoice_no` | `~` | 红冲发票单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_invoice_type_no` | `~` | 红冲发票单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_reason` | `~` | 红冲原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_invoice_instalment_data` | `~` | 分期收款信息查询 | array | ~ |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_no` | `~` | 业务员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_acct` | `~` | 结算科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_acct_name` | `~` | 结算科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_name` | `~` | 结算方式名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_no` | `~` | 结算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_name` | `~` | 结算号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_no` | `~` | 结算号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source` | `~` | 来源 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `split_labels` | `~` | 拆分标签 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_disk_data` | `~` | 税盘信息 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_local_curr_amount` | `~` | 本币金额合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_trans_curr_amount` | `~` | 原币金额合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_cancelled_amount` | `~` | 原币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_offseted_amount` | `~` | 原币已冲减金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_offseted_tax` | `~` | 原币已冲减税额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `udf01` | `~` | 用户自定义字段1 | string | 自定义字段 |
| `udf02` | `~` | 用户自定义字段2 | string | 自定义字段 |
| `udf03` | `~` | 用户自定义字段3 | string | 自定义字段 |
| `udf04` | `~` | 用户自定义字段4 | string | 自定义字段 |
| `udf05` | `~` | 用户自定义字段5 | string | 自定义字段 |
| `udf06` | `~` | 用户自定义字段6 | string | 自定义字段 |
| `udf07` | `~` | 用户自定义字段13 | string | 自定义字段 |
| `udf08` | `~` | 用户自定义字段14 | string | 自定义字段 |
| `udf09` | `~` | 用户自定义字段15 | string | 自定义字段 |
| `udf10` | `~` | 用户自定义字段16 | string | 自定义字段 |
| `udf11` | `~` | 用户自定义字段17 | string | 自定义字段 |
| `udf12` | `~` | 用户自定义字段18 | string | 自定义字段 |
| `udf51` | `~` | 用户自定义字段7 | int | 自定义字段 |
| `udf52` | `~` | 用户自定义字段8 | int | 自定义字段 |
| `udf53` | `~` | 用户自定义字段9 | int | 自定义字段 |
| `udf54` | `~` | 用户自定义字段10 | int | 自定义字段 |
| `udf55` | `~` | 用户自定义字段11 | int | 自定义字段 |
| `udf56` | `~` | 用户自定义字段12 | int | 自定义字段 |
| `udf57` | `~` | 用户自定义字段19 | int | 自定义字段 |
| `udf58` | `~` | 用户自定义字段20 | int | 自定义字段 |
| `udf59` | `~` | 用户自定义字段21 | int | 自定义字段 |
| `udf60` | `~` | 用户自定义字段22 | int | 自定义字段 |
| `udf61` | `~` | 用户自定义字段23 | int | 自定义字段 |
| `udf62` | `~` | 用户自定义字段24 | int | 自定义字段 |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `usr_group` | `~` | 组别 | string | 管理字段（只读，不可赋值） |
| `valid_invoice_code` | `~` | 正票发票代码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_invoice_no` | `~` | 正票发票号码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `verification_status` | `~` | 核销状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "sales_invoice_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`sales_invoice_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `issuer_qty` | `~` | 开票数量 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `remarks` | `~` | 备注 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `seq` | `~` | 变更单序号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source` | `~` | 1.销货 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source_doc_no` | `~` | 来源单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source_seq` | `~` | 来源序号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source_type_no` | `~` | 来源单别 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |

> **查询此单身字段时必须带 `node_name: "sales_invoice_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
