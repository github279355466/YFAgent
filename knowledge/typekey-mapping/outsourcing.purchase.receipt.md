# 委外进货单 (outsourcing.purchase.receipt) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only outsourcing.purchase.receipt`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.outsourcing.purchase.receipt.data.query.get`
- **读取服务**：`yf.oapi.outsourcing.purchase.receipt.data.read.get`
- **新增服务**：`yf.oapi.outsourcing.purchase.receipt.data.create`
- **标题来源**：目录名 8 个，取最高频：委外进货单(7) / 生产入库单(1)

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
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `auto_buckle_material_update_code` | `~` | 自动扣料更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `company` | `~` | 公司 | string | 管理字段（只读，不可赋值） |
| `create_date` | `~` | 创建日期 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建者 | string | 管理字段（只读，不可赋值） |
| `currency` | `~` | 币种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `deduction_amount` | `~` | 扣款金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | 可写（create+update 均出现） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `factory_supplied_material_auto_buckle` | `~` | 厂供料自动扣料 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `flag` | `~` | 标识位 | int | 管理字段（只读，不可赋值） |
| `invoice_code` | `~` | 发票代码 | string | 可选（仅 update 中出现） |
| `invoice_date` | `~` | 发票日期 | string | 可写（create+update 均出现） |
| `invoice_no` | `INVOICE_NO` | INVOICE_NO | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_type` | `~` | 单据类型 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modi_date` | `~` | 修改日期 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改者 | string | 管理字段（只读，不可赋值） |
| `outsourcing_supplier_name` | `~` | 委外供应商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_no` | `~` | 委外供应商 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | 可写（create+update 均出现） |
| `pieces` | `~` | 件数 | int | 可写（create+update 均出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_amount` | `~` | 原币加工金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prod_record_update_code` | `~` | 生产记录更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `purchase_expenses` | `~` | 进货费用 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receipt_date` | `~` | 进货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `sMES_generate` | `~` | sMES产生 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate_doc_no` | `~` | sMES单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_order_no` | `~` | 供应商单号 | string | 可写（create+update 均出现） |
| `tax_identification_no` | `~` | 税号 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_type` | `~` | 税种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `total_accepted_package_qty` | `~` | 总验收包装量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_qty` | `~` | 总验收数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_package_qty` | `~` | 总进货包装量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_qty` | `~` | 总进货数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_local_curr_amount` | `~` | 本币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_trans_curr_amount` | `~` | 原币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
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
| `usr_group` | `~` | 用户组 | string | 管理字段（只读，不可赋值） |

## 单身字段：`outsourcing_purchase_receipt_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `auto_buckle_material_update_code` | `~` | 自动扣料更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `company` | `~` | 公司账套 | string | 管理字段（只读，不可赋值） |
| `create_date` | `~` | 创建日期 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建者 | string | 管理字段（只读，不可赋值） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deduction_amount` | `~` | 扣款金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `factory_supplied_material_auto_buckle` | `~` | 厂供料自动扣料 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `flag` | `~` | 标识位 | int | 管理字段（只读，不可赋值） |
| `invoice_date` | `~` | 发票日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_no` | `INVOICE_NO` | INVOICE_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modi_date` | `~` | 修改日期 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改者 | string | 管理字段（只读，不可赋值） |
| `outsourcing_supplier_name` | `~` | 委外供应商名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_no` | `~` | 委外供应商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `pieces` | `~` | 件数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_amount` | `~` | 原币加工金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prod_record_update_code` | `~` | 生产记录更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchase_expenses` | `~` | 进货费用 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receipt_date` | `~` | 进货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate` | `~` | sMES产生 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate_doc_no` | `~` | sMES单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_order_no` | `~` | 供应商单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_package_qty` | `~` | 总验收包装量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_qty` | `~` | 总验收数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_package_qty` | `~` | 总进货包装量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_qty` | `~` | 总进货数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_local_curr_amount` | `~` | 本币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_trans_curr_amount` | `~` | 原币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
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
| `usr_group` | `~` | 用户组 | string | 管理字段（只读，不可赋值） |

> **查询此单身字段时必须带 `node_name: "outsourcing_purchase_receipt_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`outsourcing_purchase_receipt_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `accepted_date` | `~` | 验收日期 | string | 可写（create+update 均出现） |
| `accepted_package_qty` | `~` | 验收包装数量 | number | 可写（create+update 均出现） |
| `accepted_qty` | `~` | 验收数量 | number | 可写（create+update 均出现） |
| `arrival_doc_no` | `~` | 到货单号 | string | 可写（create+update 均出现） |
| `arrival_package_qty` | `~` | 进货包装数量 | number | 可写（create+update 均出现） |
| `arrival_qty` | `~` | 进货数量 | number | 可写（create+update 均出现） |
| `arrival_seq` | `~` | 到货序号 | string | 可写（create+update 均出现） |
| `arrival_type_no` | `~` | 到货单别 | string | 可写（create+update 均出现） |
| `deduction_amount` | `~` | 扣款金额 | number | 可写（create+update 均出现） |
| `deduction_desc` | `~` | 扣款说明 | string | 可写（create+update 均出现） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | 可写（create+update 均出现） |
| `destroyed_qty` | `~` | 破坏数量 | number | 可写（create+update 均出现） |
| `emergency` | `~` | 急料 | string | 可写（create+update 均出现） |
| `expiry_date` | `~` | 有效日期 | string | 可写（create+update 均出现） |
| `hold_payment` | `~` | 暂不付款 | string | 可写（create+update 均出现） |
| `inspection_batch` | `~` | 检验批次 | string | 可选（仅 update 中出现） |
| `item_name` | `~` | 品名 | string | 可写（create+update 均出现） |
| `item_no` | `~` | 品号 | string | 可写（create+update 均出现） |
| `item_spec` | `~` | 规格 | string | 可写（create+update 均出现） |
| `location_no` | `~` | 库位 | string | 可写（create+update 均出现） |
| `lot_description` | `~` | 批号说明 | string | 可写（create+update 均出现） |
| `lot_no` | `~` | 批号 | string | 可写（create+update 均出现） |
| `outsourcing_price` | `~` | 委外单价 | number | 可写（create+update 均出现） |
| `overdue_code` | `~` | 超期码 | string | 可写（create+update 均出现） |
| `pricing_qty` | `~` | 计价数量 | number | 可写（create+update 均出现） |
| `pricing_unit` | `~` | 计价单位 | string | 可写（create+update 均出现） |
| `production_date` | `~` | 生产日期 | string | 可写（create+update 均出现） |
| `purchase_expenses` | `~` | 进货费用 | number | 可写（create+update 均出现） |
| `qc_status` | `~` | 检验状态 | string | 可写（create+update 均出现） |
| `reinspection_date` | `~` | 复检日期 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `return_package_qty` | `~` | 验退包装数量 | number | 可写（create+update 均出现） |
| `return_qty` | `~` | 验退数量 | number | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | 可写（create+update 均出现） |
| `scrap_qty` | `~` | 报废数量 | number | 可写（create+update 均出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | 可写（create+update 均出现） |
| `warehouse_no` | `~` | 仓库 | string | 可写（create+update 均出现） |
| `wo_doc_no` | `~` | 工单单号 | string | 可写（create+update 均出现） |
| `wo_doc_type_no` | `~` | 工单单别 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "outsourcing_purchase_receipt_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
