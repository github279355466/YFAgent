# 供应商 (supplier) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only supplier`

- **服务前缀**：`yf.oapi.`
- **操作集**：`create` / `delete` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.supplier.query.get`
- **读取服务**：`yf.oapi.supplier.read.get`
- **新增服务**：`yf.oapi.supplier.data.create`
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

- **构成**：`supplier_no`
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `supplier_no` | `~` | 供应商 | string | 主键 |
| `1st_transaction` | `~` | 初次交易 | string | 可写（create+update 均出现） |
| `abc_level` | `~` | ABC等级 | string | 可写（create+update 均出现） |
| `allow_batch_delivery` | `~` | 允许分批交货 | string | 可写（create+update 均出现） |
| `bank_name` | `~` | 付款银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_account_name` | `~` | 票据科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_account_no` | `~` | 票据科目 | string | 可写（create+update 均出现） |
| `bill_addr_1` | `~` | 帐单地址(一) | string | 可写（create+update 均出现） |
| `bill_addr_2` | `~` | 帐单地址(二) | string | 可写（create+update 均出现） |
| `capital_amount` | `~` | 注册资金 | string | 可写（create+update 均出现） |
| `closing_date` | `~` | 开票__日 | string | 可写（create+update 均出现） |
| `closing_month` | `~` | 开票__月 | string | 可写（create+update 均出现） |
| `company_owner` | `~` | 负责人 | string | 可写（create+update 均出现） |
| `contact_address_1` | `~` | 联系地址(一) | string | 可写（create+update 均出现） |
| `contact_address_2` | `~` | 联系地址(二) | string | 可写（create+update 均出现） |
| `contact1` | `~` | 联系人(一) | string | 可写（create+update 均出现） |
| `contact2` | `~` | 联系人(二) | string | 可写（create+update 均出现） |
| `contact3` | `~` | 联系人(三) | string | 可写（create+update 均出现） |
| `country` | `~` | 国家 | string | 可写（create+update 均出现） |
| `country_name` | `~` | 国家名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency_name` | `~` | 币种名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `delivery_level` | `~` | 交货评等 | string | 可写（create+update 均出现） |
| `delivery_periods` | `~` | 交货时段数 | number | 可写（create+update 均出现） |
| `deposit_rate` | `~` | 订金比率 | number | 可写（create+update 均出现） |
| `doc_printing_format` | `~` | 凭证打印格式 | string | 可写（create+update 均出现） |
| `e_mail` | `~` | E-MAIL | string | 可写（create+update 均出现） |
| `ebc_apply_no` | `~` | EBC申请编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `expense_department_code` | `~` | 费用部门 | string | 可写（create+update 均出现） |
| `expense_department_name` | `~` | 费用部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `export_to_ebc` | `~` | 出货通知信用检查方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fax_no` | `FAX_NO` | FAX_NO | string | 可写（create+update 均出现） |
| `headcount` | `~` | 员工人数 | int | 可写（create+update 均出现） |
| `invoice_type` | `~` | 发票种类 | string | 可写（create+update 均出现） |
| `latest_trans_date` | `~` | 最近交易 | string | 可写（create+update 均出现） |
| `note_delivery_method` | `~` | 票据寄领 | string | 可写（create+update 均出现） |
| `open_date` | `~` | 开业日 | string | 可写（create+update 均出现） |
| `payable_account_name` | `~` | 应付科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payable_account_no` | `~` | 应付科目 | string | 可写（create+update 均出现） |
| `paying_date` | `~` | 付款__日 | string | 可写（create+update 均出现） |
| `paying_month` | `~` | 付款__月 | string | 可写（create+update 均出现） |
| `payment_condition_no` | `~` | 付款名称 | string | 可写（create+update 均出现） |
| `po_delivery_method` | `~` | 采购单发送方式 | string | 可写（create+update 均出现） |
| `prepayment_account_name` | `~` | 预付账款科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prepayment_account_no` | `~` | 预付账款科目 | string | 可写（create+update 均出现） |
| `price_condition` | `~` | 价格说明 | string | 可写（create+update 均出现） |
| `processing_account_name` | `~` | 费用科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `processing_account_no` | `~` | 加工费用科目 | string | 可写（create+update 均出现） |
| `purchaser` | `~` | 采购人员 | string | 可写（create+update 均出现） |
| `purchaser_name` | `~` | 采购人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `quality_rating` | `~` | 质量评等 | string | 可写（create+update 均出现） |
| `region` | `~` | 地区 | string | 可写（create+update 均出现） |
| `region_name` | `~` | 地区名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `remittance_account` | `~` | 汇款帐号 | string | 可写（create+update 均出现） |
| `remittance_bank` | `~` | 汇款银行 | string | 可写（create+update 均出现） |
| `settlement_method_name` | `~` | 结算方式名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_no` | `~` | 结算方式 | string | 可写（create+update 均出现） |
| `shortcut` | `~` | 快捷码 | string | 可写（create+update 均出现） |
| `supplier_classification` | `~` | 供应商分类 | string | 可写（create+update 均出现） |
| `supplier_classification_name` | `~` | 供应商分类名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_fullname` | `~` | 公司全名 | string | 可写（create+update 均出现） |
| `supplier_name` | `~` | 供应商简称 | string | 可写（create+update 均出现） |
| `tax_identification_no` | `~` | 税号 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `tax_type` | `~` | 税种 | string | 可写（create+update 均出现） |
| `taxed_code` | `~` | 税种 | string | 可写（create+update 均出现） |
| `telephone` | `~` | 电话 | string | 可写（create+update 均出现） |
| `telephone_1` | `~` | TEL(一) | string | 可写（create+update 均出现） |
| `telephone_2` | `~` | TEL(二) | string | 可写（create+update 均出现） |
| `trans_currency` | `~` | 交易币别 | string | 可写（create+update 均出现） |
| `usance_date` | `~` | 票期__日 | string | 可写（create+update 均出现） |
| `usance_month` | `~` | 票期__月 | string | 可写（create+update 均出现） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `warehouse` | `~` | 现场仓库 | string | 可写（create+update 均出现） |
| `warehouse_name` | `~` | 仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code1` | `~` | 邮编(一) | string | 可写（create+update 均出现） |
| `zip_code2` | `~` | 邮编(二) | string | 可写（create+update 均出现） |

## 单身字段：`supplier_basic_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `supplier_no` | `~` | 供应商 | string | 主键 |
| `1st_transaction` | `~` | 初次交易 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `abc_level` | `~` | ABC等级 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `allow_batch_delivery` | `~` | 允许分批交货 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_name` | `~` | 付款银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_account_name` | `~` | 票据科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_account_no` | `~` | 票据科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_addr_1` | `~` | 帐单地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_addr_2` | `~` | 帐单地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `capital_amount` | `~` | 注册资金 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `closing_date` | `~` | 开票__日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `closing_month` | `~` | 开票__月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `company_owner` | `~` | 负责人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact_address_1` | `~` | 联系地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact_address_2` | `~` | 联系地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact1` | `~` | 联系人(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact2` | `~` | 联系人(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact3` | `~` | 联系人(三) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `country` | `~` | 国家 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `country_name` | `~` | 国家名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency_name` | `~` | 币种名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `delivery_level` | `~` | 交货评等 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `delivery_periods` | `~` | 交货时段数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deposit_rate` | `~` | 订金比率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_printing_format` | `~` | 凭证打印格式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `e_mail` | `~` | E-MAIL | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_apply_no` | `~` | EBC申请编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `expense_department_code` | `~` | 费用部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `expense_department_name` | `~` | 费用部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `export_to_ebc` | `~` | 出货通知信用检查方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fax_no` | `FAX_NO` | FAX_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `headcount` | `~` | 员工人数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `latest_trans_date` | `~` | 最近交易 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `note_delivery_method` | `~` | 票据寄领 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `open_date` | `~` | 开业日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payable_account_name` | `~` | 应付科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payable_account_no` | `~` | 应付科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `po_delivery_method` | `~` | 采购单发送方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prepayment_account_name` | `~` | 预付账款科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prepayment_account_no` | `~` | 预付账款科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_condition` | `~` | 价格说明 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `processing_account_name` | `~` | 费用科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `processing_account_no` | `~` | 加工费用科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchaser` | `~` | 采购人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchaser_name` | `~` | 采购人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `quality_rating` | `~` | 质量评等 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `region` | `~` | 地区 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `region_name` | `~` | 地区名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remittance_account` | `~` | 汇款帐号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remittance_bank` | `~` | 汇款银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_name` | `~` | 结算方式名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settlement_method_no` | `~` | 结算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `shortcut` | `~` | 快捷码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_classification` | `~` | 供应商分类 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_classification_name` | `~` | 供应商分类名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_fullname` | `~` | 公司全名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_name` | `~` | 供应商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_identification_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `telephone` | `~` | 电话 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `telephone_1` | `~` | TEL(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `telephone_2` | `~` | TEL(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency` | `~` | 交易币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `warehouse` | `~` | 现场仓库 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `warehouse_name` | `~` | 仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code1` | `~` | 邮编(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code2` | `~` | 邮编(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "supplier_basic_data"`**，否则易飞无法识别为单身过滤条件。

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
