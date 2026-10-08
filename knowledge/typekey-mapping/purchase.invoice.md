# 采购发票 (purchase.invoice) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only purchase.invoice`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.purchase.invoice.data.query.get`
- **读取服务**：`yf.oapi.purchase.invoice.data.read.get`
- **新增服务**：`yf.oapi.purchase.invoice.data.create`
- **标题来源**：目录名 14 个，取最高频：采购发票(7) / 产品(5) / 单据(2)

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
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_account` | `~` | 付款账号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_code` | `~` | 付款银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `data_type` | `~` | 单据类型 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_cashing_date` | `~` | 取得折扣兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_payment_date` | `~` | 取得折扣付款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_adjustment_amount` | `~` | 本币汇兑损失金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_cashing_date` | `~` | 预计兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_payment_date` | `~` | 预计付款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `freeze_payment` | `~` | 冻结付款 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code` | `~` | 生成分录 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_code` | `~` | 发票代码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_date` | `~` | 发票日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issuer_qty` | `~` | 开票数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_cancelled_amount` | `~` | 本币已核销金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `offseted_tax` | `~` | 已冲税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `revaluation_exchange_rate` | `~` | 上次重估汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse` | `~` | 红冲 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_invoice_no` | `~` | 红冲发票单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_invoice_type_no` | `~` | 红冲发票单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source` | `~` | 来源 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `staff` | `~` | 人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_name` | `~` | 人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_name` | `~` | 供应商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_no` | `~` | 参考供应商 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_identification_no` | `~` | 税号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_amt_fc` | `~` | 本币价税合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_amt_tc` | `~` | 原币价税合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_cancelled_amount` | `~` | 原币已核销金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_offseted_amount` | `~` | 原币已冲减金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `verification_status` | `~` | 核销状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`purchase_invoice_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_account` | `~` | 付款账号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_code` | `~` | 付款银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_cashing_date` | `~` | 取得折扣兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_payment_date` | `~` | 取得折扣付款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_adjustment_amount` | `~` | 本币汇兑损失金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_cashing_date` | `~` | 预计兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_payment_date` | `~` | 预计付款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `freeze_payment` | `~` | 冻结付款 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code` | `~` | 生成分录 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_code` | `~` | 发票代码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_date` | `~` | 发票日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_no_data` | `~` | ~ | object | ~ |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issuer_qty` | `~` | 开票数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_cancelled_amount` | `~` | 本币已核销金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `offseted_tax` | `~` | 已冲税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `revaluation_exchange_rate` | `~` | 上次重估汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse` | `~` | 红冲 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_invoice_no` | `~` | 红冲发票单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_invoice_type_no` | `~` | 红冲发票单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source` | `~` | 来源 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff` | `~` | 人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_name` | `~` | 人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_name` | `~` | 供应商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_no` | `~` | 参考供应商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_amt_fc` | `~` | 本币价税合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_amt_tc` | `~` | 原币价税合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_cancelled_amount` | `~` | 原币已核销金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_offseted_amount` | `~` | 原币已冲减金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `verification_status` | `~` | 核销状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "purchase_invoice_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`purchase_invoice_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `remarks` | `~` | 备注 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `seq` | `~` | 序号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source` | `~` | 来源 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source_doc_no` | `~` | 来源单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `source_type_no` | `~` | 来源单别 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |

> **查询此单身字段时必须带 `node_name: "purchase_invoice_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
