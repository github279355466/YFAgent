# 进货单 (purchase.receipt) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only purchase.receipt`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.purchase.receipt.data.query.get`
- **读取服务**：`yf.oapi.purchase.receipt.data.read.get`
- **新增服务**：`yf.oapi.purchase.receipt.data.create`
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
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `deduction_amount` | `~` | 扣款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_shipping_notice_doc_no` | `~` | EBC出货通知单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_shipping_notice_version` | `~` | EBC出货通知版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_code` | `~` | 发票代码 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_date` | `~` | 发票日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `invoice_type` | `~` | 单据类型 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `pieces` | `~` | 件数 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `purchase_expenses` | `~` | 进货费用 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receipt_date` | `~` | 进货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `register_book_no` | `~` | 海关手册 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `remarks` | `~` | 备注 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `self_funding_offset_local_curr` | `~` | 本币冲自筹额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_code` | `~` | 来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_doc_no` | `~` | 来源单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_type_no` | `~` | 来源单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_full_name` | `~` | 供应商全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_name` | `~` | 供应商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_no` | `~` | 参考供应商 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `supplier_order_no` | `~` | 供应商单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_identification_no` | `~` | 税号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_rate` | `~` | 税率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `tax_type` | `~` | 税种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `total_accepted_package_qty` | `~` | 总验收包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_qty` | `~` | 总验收数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_package_qty` | `~` | 总进货包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_qty` | `~` | 总进货数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_local_curr_amount` | `~` | 本币金额合计 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_trans_curr_amount` | `~` | 原币金额合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_amount` | `~` | 进货金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`purchase_receipt_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deduction_amount` | `~` | 扣款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_shipping_notice_doc_no` | `~` | EBC出货通知单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_shipping_notice_version` | `~` | EBC出货通知版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_code` | `~` | 发票代码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_date` | `~` | 发票日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_tax` | `~` | 本币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `pieces` | `~` | 件数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchase_expenses` | `~` | 进货费用 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receipt_date` | `~` | 进货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `register_book_no` | `~` | 海关手册 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `self_funding_offset_local_curr` | `~` | 本币冲自筹额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_code` | `~` | 来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_doc_no` | `~` | 来源单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_type_no` | `~` | 来源单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_full_name` | `~` | 供应商全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_name` | `~` | 供应商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_no` | `~` | 参考供应商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_order_no` | `~` | 供应商单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_package_qty` | `~` | 总验收包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_accepted_qty` | `~` | 总验收数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_package_qty` | `~` | 总进货包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_arrival_qty` | `~` | 总进货数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_local_curr_amount` | `~` | 本币金额合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_trans_curr_amount` | `~` | 原币金额合计 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_amount` | `~` | 进货金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "purchase_receipt_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`purchase_receipt_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `accepted_date` | `~` | 验收日期 | string | 可写（create+update 均出现） |
| `accepted_gift_prepare_item_package_qty` | `~` | 赠备品验收包装量 | number | 可写（create+update 均出现） |
| `accepted_gift_prepare_item_qty` | `~` | 赠备品验收量 | number | 可写（create+update 均出现） |
| `accepted_package_qty` | `~` | 验收包装数量 | number | 可写（create+update 均出现） |
| `accepted_qty` | `~` | 验收数量 | number | 可写（create+update 均出现） |
| `arrival_doc_no` | `~` | 到货单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `arrival_package_qty` | `~` | 进货包装数量 | number | 可写（create+update 均出现） |
| `arrival_qty` | `~` | 进货数量 | number | 可写（create+update 均出现） |
| `arrival_seq` | `~` | 到货序号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `arrival_type_no` | `~` | 到货单别 | string | 可写（create+update 均出现） |
| `borrowing_doc_no` | `~` | 借入单号 | string | 可写（create+update 均出现） |
| `borrowing_seq` | `~` | 借入序号 | string | 可写（create+update 均出现） |
| `borrowing_type_no` | `~` | 借入单别 | string | 可写（create+update 均出现） |
| `deduction_amount` | `~` | 扣款金额 | number | 可写（create+update 均出现） |
| `deduction_desc` | `~` | 扣款说明 | string | 可写（create+update 均出现） |
| `delivery_period` | `~` | 交货时段 | string | 可写（create+update 均出现） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | 可写（create+update 均出现） |
| `destroyed_qty` | `~` | 破坏数量 | number | 可写（create+update 均出现） |
| `expiry_date` | `~` | 有效日期 | string | 可写（create+update 均出现） |
| `hold_payment` | `~` | 暂不付款 | string | 可选（仅 update 中出现） |
| `inspection_batch` | `~` | 检验批次 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `inventory_qty` | `~` | 采购库存数量 | number | 可选（仅 update 中出现） |
| `inventory_unit` | `~` | 库存单位 | string | 可选（仅 update 中出现） |
| `item_name` | `~` | 品名 | string | 可写（create+update 均出现） |
| `item_no` | `~` | 品号 | string | 可写（create+update 均出现） |
| `item_spec` | `~` | 规格 | string | 可写（create+update 均出现） |
| `local_curr_not_tax_amount` | `~` | 本币货款金额 | number | 可写（create+update 均出现） |
| `local_curr_tax` | `~` | 本币税额 | number | 可写（create+update 均出现） |
| `location_no` | `~` | 接收库位 | string | 可写（create+update 均出现） |
| `lot_description` | `~` | 批号说明 | string | 可写（create+update 均出现） |
| `lot_no` | `~` | 批号 | string | 可写（create+update 均出现） |
| `overdue_code` | `~` | 超期码 | string | 可写（create+update 均出现） |
| `package_unit` | `~` | 包装单位 | string | 可选（仅 update 中出现） |
| `pieces` | `~` | 件数 | int | 可写（create+update 均出现） |
| `pieces_per` | `~` | 件装 | int | 可写（create+update 均出现） |
| `price` | `~` | 单价 | number | 可写（create+update 均出现） |
| `pricing_qty` | `~` | 计价数量 | number | 可写（create+update 均出现） |
| `pricing_unit` | `~` | 计价单位 | string | 可写（create+update 均出现） |
| `production_date` | `~` | 生产日期 | string | 可写（create+update 均出现） |
| `project_no` | `~` | 项目编号 | string | 可选（仅 update 中出现） |
| `purchase_expenses` | `~` | 进货费用 | number | 可写（create+update 均出现） |
| `purchase_no` | `~` | 采购单号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `purchase_seq` | `~` | 采购序号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `purchase_type_no` | `~` | 采购单别 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `qc_status` | `~` | 检验状态 | string | 可写（create+update 均出现） |
| `reinspection_date` | `~` | 复检日期 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `return_package_qty` | `~` | 验退包装数量 | number | 可写（create+update 均出现） |
| `return_qty` | `~` | 验退数量 | number | 可写（create+update 均出现） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | 可写（create+update 均出现） |
| `scrap_qty` | `~` | 报废数量 | number | 可写（create+update 均出现） |
| `self_funding_offset_code` | `~` | 本币冲自筹额 | number | 可选（仅 update 中出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `small_unit` | `~` | 请购小单位 | string | 可选（仅 update 中出现） |
| `trans_curr_amount` | `~` | 进货金额 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `trans_curr_not_tax_amount` | `~` | 原币货款金额 | number | 可选（仅 update 中出现） |
| `trans_curr_tax` | `~` | 本次开票原币税额 | number | 可写（create+update 均出现） |
| `type` | `~` | 类型 | string | 可选（仅 update 中出现） |
| `unit` | `~` | 单位 | string | 可写（create+update 均出现） |
| `warehouse_no` | `~` | 仓库 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "purchase_receipt_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
