# 销退单 (sales.return) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only sales.return`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.sales.return.data.query.get`
- **读取服务**：`yf.oapi.sales.return.data.read.get`
- **新增服务**：`yf.oapi.sales.return.data.create`
- **标题来源**：目录名单一来源

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
| `accepted_gift_prepare_item_package_qty` | `~` | 赠备品验收包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `accepted_gift_prepare_item_qty` | `~` | 赠备品验收量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collector` | `~` | 收款业务员 | string | 可写（create+update 均出现） |
| `currency` | `~` | 币种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `customer_full_name` | `~` | 客户全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_name` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `damage_doc_no` | `~` | 报损单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `damage_doc_type` | `~` | 报损单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `declaration_month` | `~` | 申报年月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | 可写（create+update 均出现） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_sales_return_no` | `~` | EBC销退单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_sales_return_version` | `~` | EBC销退版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `generate_entry_code_cost` | `~` | 生成分录(成本) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_income` | `~` | 生成分录(收入) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `gift_prepare_item_package_qty` | `~` | 赠备品包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `gift_prepare_item_qty` | `~` | 赠备品量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_status` | `~` | 检验码 | string | 可写（create+update 均出现） |
| `invoice_type` | `~` | 单据类型 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | 可写（create+update 均出现） |
| `pieces` | `~` | 件数 | int | 可写（create+update 均出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | 可写（create+update 均出现） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_no` | `~` | 流程编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `receive_salesman_name` | `~` | 收款业务员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `register_book_no` | `~` | 海关手册 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `remarks_1` | `~` | 备注一 | string | 可写（create+update 均出现） |
| `remarks_2` | `~` | 备注二 | string | 可写（create+update 均出现） |
| `remarks_3` | `~` | 备注三 | string | 可写（create+update 均出现） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_no` | `~` | 业务员 | string | 可写（create+update 均出现） |
| `sales_return_date` | `~` | 销退日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_return_package_qty` | `~` | 总销退包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_code` | `~` | 来源码 | string | 可写（create+update 均出现） |
| `staff_name` | `~` | 人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_no` | `~` | 人员 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_type` | `~` | 税种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `total_accepted_package_qty` | `~` | 总验收包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_qty` | `~` | 总验收数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_sales_return_qty` | `~` | 总销退数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`sales_return_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `accepted_gift_prepare_item_package_qty` | `~` | 赠备品验收包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `accepted_gift_prepare_item_qty` | `~` | 赠备品验收量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collector` | `~` | 收款业务员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_full_name` | `~` | 客户全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_name` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `damage_doc_no` | `~` | 报损单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `damage_doc_type` | `~` | 报损单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `declaration_month` | `~` | 申报年月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_sales_return_no` | `~` | EBC销退单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_sales_return_version` | `~` | EBC销退版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_cost` | `~` | 生成分录(成本) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_income` | `~` | 生成分录(收入) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `gift_prepare_item_package_qty` | `~` | 赠备品包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `gift_prepare_item_qty` | `~` | 赠备品量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_status` | `~` | 检验码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `pieces` | `~` | 件数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `post_status` | `~` | 抛转状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_name` | `~` | 流程编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_no` | `~` | 流程编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_salesman_name` | `~` | 收款业务员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `register_book_no` | `~` | 海关手册 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_1` | `~` | 备注一 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_2` | `~` | 备注二 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_3` | `~` | 备注三 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_no` | `~` | 业务员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_return_date` | `~` | 销退日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_return_package_qty` | `~` | 总销退包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_code` | `~` | 来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_name` | `~` | 人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_no` | `~` | 人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_package_qty` | `~` | 总验收包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_qty` | `~` | 总验收数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_sales_return_qty` | `~` | 总销退数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "sales_return_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`sales_return_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `accepted_date` | `~` | 验收日期 | string | 可写（create+update 均出现） |
| `accepted_gift_prepare_item_package_qty` | `~` | 赠备品验收包装量 | int | 可写（create+update 均出现） |
| `accepted_gift_prepare_item_qty` | `~` | 赠备品验收量 | int | 可写（create+update 均出现） |
| `accepted_package_qty` | `~` | 验收包装数量 | int | 可写（create+update 均出现） |
| `accepted_qty` | `~` | 验收数量 | int | 可写（create+update 均出现） |
| `amount` | `~` | 金额 | int | 可写（create+update 均出现） |
| `customer_item_no` | `~` | 客户品号 | string | 可写（create+update 均出现） |
| `destroyed_gift_prepare_item_package_qty` | `~` | 赠备品破坏包装量 | int | 可写（create+update 均出现） |
| `destroyed_gift_prepare_item_qty` | `~` | 赠备品破坏量 | int | 可写（create+update 均出现） |
| `expiry_date` | `~` | 有效日期 | string | 可写（create+update 均出现） |
| `gift_prepare_item_package_qty` | `~` | 赠备品包装量 | int | 可写（create+update 均出现） |
| `gift_prepare_item_qty` | `~` | 赠备品量 | int | 可写（create+update 均出现） |
| `gift_prepare_item_type` | `~` | 赠备品类型 | string | 可写（create+update 均出现） |
| `item_name` | `~` | 品名 | string | 可写（create+update 均出现） |
| `item_no` | `~` | 品号 | string | 可写（create+update 均出现） |
| `item_spec` | `~` | 规格 | string | 可写（create+update 均出现） |
| `location_no` | `~` | 库位 | string | 可写（create+update 均出现） |
| `lot_description` | `~` | 批号说明 | string | 可写（create+update 均出现） |
| `lot_no` | `~` | 批号 | string | 可写（create+update 均出现） |
| `order_doc_no` | `~` | 订单单号 | string | 可写（create+update 均出现） |
| `order_doc_type` | `~` | 订单单别 | string | 可写（create+update 均出现） |
| `order_seq` | `~` | 订单序号 | string | 可写（create+update 均出现） |
| `original_customer_no` | `~` | 原客户编号 | string | 可写（create+update 均出现） |
| `package_qty` | `~` | 包装数量 | int | 可写（create+update 均出现） |
| `pieces` | `~` | 件数 | int | 可写（create+update 均出现） |
| `pieces_per` | `~` | 件装 | int | 可写（create+update 均出现） |
| `price` | `~` | 单价 | int | 可写（create+update 均出现） |
| `production_date` | `~` | 生产日期 | string | 可写（create+update 均出现） |
| `qc_status` | `~` | 检验状态 | string | 可写（create+update 均出现） |
| `qty` | `~` | 数量 | int | 可写（create+update 均出现） |
| `reinspection_date` | `~` | 复检日期 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `return_gift_prepare_item_package_qty` | `~` | 赠备品验退包装量 | int | 可写（create+update 均出现） |
| `return_gift_prepare_item_qty` | `~` | 赠备品验退量 | int | 可写（create+update 均出现） |
| `return_package_qty` | `~` | 验退包装数量 | int | 可写（create+update 均出现） |
| `return_qty` | `~` | 验退数量 | int | 可写（create+update 均出现） |
| `sales_doc_no` | `~` | 销货单号 | string | 可写（create+update 均出现） |
| `sales_doc_type` | `~` | 销货单别 | string | 可写（create+update 均出现） |
| `sales_seq` | `~` | 销货序号 | string | 可写（create+update 均出现） |
| `sampling_package_qty` | `~` | 取样包装数量 | int | 可写（create+update 均出现） |
| `sampling_qty` | `~` | 取样数量 | int | 可写（create+update 均出现） |
| `scrap_gift_prepare_item_package_qty` | `~` | 赠备品报废包装量 | int | 可写（create+update 均出现） |
| `scrap_gift_prepare_item_qty` | `~` | 赠备品报废量 | int | 可写（create+update 均出现） |
| `scrap_package_qty` | `~` | 报废包装数量 | int | 可写（create+update 均出现） |
| `scrap_qty` | `~` | 报废数量 | int | 可写（create+update 均出现） |
| `scrap_warehouse_no` | `~` | 报废仓库 | string | 可写（create+update 均出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `type` | `~` | 类型；若类型=2.折让时，则数量，包装数量等数量栏位不需传入节点，或是给值0即可；若类型=1.销退，则需传数量信息 | string | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | 可写（create+update 均出现） |
| `warehouse_no` | `~` | 仓库 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "sales_return_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
