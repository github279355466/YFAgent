# 客户 (customer) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only customer`

- **服务前缀**：`yf.oapi.`
- **操作集**：`create` / `delete` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.customer.data.query.get`
- **读取服务**：`yf.oapi.customer.data.read.get`
- **新增服务**：`yf.oapi.customer.data.create`
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

- **构成**：`customer_no`
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `customer_no` | `~` | 客户 | string | 主键 |
| `ac_name` | `~` | 帐款科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_no1` | `~` | 银行帐号 | string | 可写（create+update 均出现） |
| `ac_no2` | `~` | 银行帐号(二) | string | 可写（create+update 均出现） |
| `ac_no3` | `~` | 银行帐号(三) | string | 可写（create+update 均出现） |
| `ac_title` | `~` | 帐款科目 | string | 可写（create+update 均出现） |
| `accounts_receivable_subject` | `~` | 预收账款科目 | string | 可写（create+update 均出现） |
| `agent` | `~` | 代理商 | string | 可写（create+update 均出现） |
| `agent_abbr` | `~` | 代理商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `air_freight_abbrev` | `~` | 空运公司简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `airlines` | `~` | 空运公司 | string | 可写（create+update 均出现） |
| `airport` | `~` | 空运机场 | string | 可写（create+update 均出现） |
| `annual_atm` | `~` | 年营业额 | int | 可写（create+update 均出现） |
| `ar_date` | `~` | 开票日期 | string | 可写（create+update 均出现） |
| `ar_ratio` | `~` | 应收帐款比率 | int | 可写（create+update 均出现） |
| `bill_to_headquarter` | `~` | 总公司请款 | string | 可写（create+update 均出现） |
| `branches` | `~` | 分店数 | string | 可写（create+update 均出现） |
| `brand` | `~` | 品牌 | string | 可写（create+update 均出现） |
| `broker` | `~` | 报关行 | string | 可写（create+update 均出现） |
| `broker_abbr` | `~` | 报关行简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `business_license` | `~` | 营业执照 | string | 可写（create+update 均出现） |
| `capital_amount` | `~` | 注册资金 | int | 可写（create+update 均出现） |
| `channel` | `~` | 渠道 | string | 可写（create+update 均出现） |
| `channel_abbr` | `~` | 渠道简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collector` | `~` | 收款业务员 | string | 可写（create+update 均出现） |
| `commission_rate` | `~` | 佣金比率 | int | 可写（create+update 均出现） |
| `company` | `~` | 公司 | string | 管理字段（只读，不可赋值） |
| `company_closed_on` | `~` | 歇业日期 | string | 可写（create+update 均出现） |
| `company_owner` | `~` | 负责人 | string | 可写（create+update 均出现） |
| `consignment_customers` | `~` | 寄售客户 | string | 可写（create+update 均出现） |
| `contact` | `~` | 连络人 | string | 可写（create+update 均出现） |
| `country` | `~` | 国家 | string | 可写（create+update 均出现） |
| `create_date` | `~` | 创建日期 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建者 | string | 管理字段（只读，不可赋值） |
| `credit_limit_1` | `~` | 信用额度管制 | string | 可写（create+update 均出现） |
| `credit_limit_2` | `~` | 信用额度 | int | 可写（create+update 均出现） |
| `credit_limit_is_controlled_by_headquarter` | `~` | 信用额度依总公司控管 | string | 可写（create+update 均出现） |
| `credit_rating` | `~` | 信用评等 | string | 可写（create+update 均出现） |
| `customer_name` | `~` | 客户全称 | string | 可写（create+update 均出现） |
| `customer_shortname` | `~` | 客户简称 | string | 可写（create+update 均出现） |
| `dearptment` | `~` | 部门 | string | 可写（create+update 均出现） |
| `delivery_address1` | `~` | 送货地址(一) | string | 可写（create+update 均出现） |
| `delivery_address2` | `~` | 送货地址(二) | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deposit_rate` | `~` | 订金比率 | int | 可写（create+update 均出现） |
| `destination` | `~` | 目的地 | string | 可写（create+update 均出现） |
| `discount_rate` | `~` | 折扣率 | int | 可写（create+update 均出现） |
| `e_mail` | `~` | E-MAIL | string | 可写（create+update 均出现） |
| `ebc` | `~` | 汇至EBC | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_application_no` | `~` | EBC申请编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fax_no` | `FAX_NO` | FAX_NO | string | 可写（create+update 均出现） |
| `file_address_1` | `~` | 文件地址(一) | string | 可写（create+update 均出现） |
| `file_address_2` | `~` | 文件地址(二) | string | 可写（create+update 均出现） |
| `fin_institution_name_1` | `~` | 开户银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fin_institution_name_2` | `~` | 付款银行(二)名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fin_institution_name_3` | `~` | 付款银行(三)名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `first_trade_date` | `~` | 初次交易日 | string | 可写（create+update 均出现） |
| `flag` | `~` | 标识位 | int | 管理字段（只读，不可赋值） |
| `gmp_gsp` | `~` | GSP认证 | string | 可写（create+update 均出现） |
| `headcount` | `~` | 员工人数 | int | 可写（create+update 均出现） |
| `headquarter_no` | `~` | 总公司 | string | 可写（create+update 均出现） |
| `insp_comp_abbr` | `~` | 验货公司简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_company` | `~` | 验货公司 | string | 可写（create+update 均出现） |
| `installment_no` | `~` | 分期收款条件编号 | string | 可写（create+update 均出现） |
| `insurance_ratio` | `~` | 保险费率 | int | 可写（create+update 均出现） |
| `invoice_address1` | `~` | 发票地址(一) | string | 可写（create+update 均出现） |
| `invoice_address2` | `~` | 发票地址(二) | string | 可写（create+update 均出现） |
| `invoice_customer_name` | `~` | 开票客户名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_e_mail` | `~` | 开票推送邮箱 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_phone` | `~` | 开票推送手机号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 发票种类 | string | 可写（create+update 均出现） |
| `invoicing_rules` | `~` | 开票规则 | string | 可写（create+update 均出现） |
| `invoicing_rules_name` | `~` | 开票规则名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lately_trade_date` | `~` | 最近交易日 | string | 可写（create+update 均出现） |
| `marine_comp_abbr` | `~` | 海运公司简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `marine_company` | `~` | 海运公司 | string | 可写（create+update 均出现） |
| `marine_port` | `~` | 海运港口 | string | 可写（create+update 均出现） |
| `modi_date` | `~` | 修改日期 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改者 | string | 管理字段（只读，不可赋值） |
| `nation_abbr` | `~` | 国家简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `note_ac_title` | `~` | 票据科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `note_delivery_method` | `~` | 票据寄领 | string | 可写（create+update 均出现） |
| `notes_ac` | `~` | 票据科目 | string | 可写（create+update 均出现） |
| `nr_ratio_non_cashed` | `~` | 未兑现应收票据比率 | int | 可写（create+update 均出现） |
| `operating_date` | `~` | 开业日期 | string | 可写（create+update 均出现） |
| `order_credit_auditing` | `~` | 订单信用查核方式 | string | 可写（create+update 均出现） |
| `other_abbr` | `~` | 其他简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `other_ratio` | `~` | 其它比率 | int | 可写（create+update 均出现） |
| `other_type` | `~` | 其他 | string | 可写（create+update 均出现） |
| `overrun_rate` | `~` | 可超出率 | int | 可写（create+update 均出现） |
| `payment_bank1` | `~` | 开户银行 | string | 可写（create+update 均出现） |
| `payment_bank2` | `~` | 付款银行(二) | string | 可写（create+update 均出现） |
| `payment_bank3` | `~` | 付款银行(三) | string | 可写（create+update 均出现） |
| `payment_condition_name` | `~` | 付款条件名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款条件编号 | string | 可写（create+update 均出现） |
| `phone` | `~` | 手机 | string | 可写（create+update 均出现） |
| `price_condition` | `~` | 价格说明 | string | 可写（create+update 均出现） |
| `pricing_order` | `~` | 定价顺序//1.计价单价、2.标准售价、3.零售价、4.售价定价一、5.售价定价二、6.售价定价三、7.售价定价四、8.售价定价五、9.售价定价六、A.折扣后客户计价、B.折扣后标准售价、C.折扣后零售价、D.折扣后售价定价一、E.折扣后售价定价二、F.折扣后售价定价三、G.折扣后售价定价四、H.折扣后售价定价五、I.折扣后售价定价 | string | 可写（create+update 均出现） |
| `production_business_license` | `~` | 经营许可证 | string | 可写（create+update 均出现） |
| `quick_code` | `~` | 快捷码 | string | 可写（create+update 均出现） |
| `rate_of_sales_unclosed` | `~` | 未结帐销货金额比率 | int | 可写（create+update 均出现） |
| `rate_of_unshipped_orders` | `~` | 未出货订单金额比率 | int | 可写（create+update 均出现） |
| `receive_method` | `~` | 结算方式 | string | 可写（create+update 均出现） |
| `receive_salesman_name` | `~` | 收款业务员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `region` | `~` | 地区 | string | 可写（create+update 均出现） |
| `region_abbr` | `~` | 地区简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `registration_address_1` | `~` | 注册地址(一) | string | 可写（create+update 均出现） |
| `registration_address_2` | `~` | 注册地址(二) | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `route` | `~` | 路线 | string | 可写（create+update 均出现） |
| `route_abbr` | `~` | 路线简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_credit_auditing` | `~` | 销货信用查核方式 | string | 可写（create+update 均出现） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_ranking` | `~` | 销售评等 | string | 可写（create+update 均出现） |
| `salesman_no` | `~` | 业务人员 | string | 可写（create+update 均出现） |
| `tax` | `~` | 税额计算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_no` | `~` | 税号 | string | 可写（create+update 均出现） |
| `taxed_code` | `~` | 税种 | string | 可写（create+update 均出现） |
| `tel_no1` | `~` | TEL_NO(一) | string | 可写（create+update 均出现） |
| `tel_no2` | `~` | TEL_NO(二) | string | 可写（create+update 均出现） |
| `trans_currency` | `~` | 交易币别 | string | 可写（create+update 均出现） |
| `transport_mode_no` | `~` | 运输方式 | string | 可写（create+update 均出现） |
| `type` | `~` | 类型 | string | 可写（create+update 均出现） |
| `type_abbrev` | `~` | 型态简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
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
| `valid_status` | `~` | 核准状况 | string | 可写（create+update 均出现） |
| `zip_code_1` | `~` | 邮编 | string | 可写（create+update 均出现） |
| `zip_code_2` | `~` | 邮编 | string | 可写（create+update 均出现） |
| `zip_code_3` | `~` | 邮编 | string | 可写（create+update 均出现） |
| `zip_code_4` | `~` | 邮编 | string | 可写（create+update 均出现） |

## 单身字段：`customer_address_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `customer_no` | `~` | 客户 | string | 主键 |
| `adrss_1` | `~` | 地址一 | string | 可写（create+update 均出现） |
| `adrss_2` | `~` | 地址二 | string | 可写（create+update 均出现） |
| `adrss_all_name` | `~` | 地址全称 | string | 可写（create+update 均出现） |
| `adrss_no` | `~` | 地址编号 | string | 可写（create+update 均出现） |
| `contact` | `~` | 连络人 | string | 可写（create+update 均出现） |
| `fax_no` | `FAX_NO` | FAX_NO | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `tax_code` | `~` | 税号 | string | 可写（create+update 均出现） |
| `tel_no` | `TEL_NO` | TEL_NO | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "customer_address_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`customer_basic_data_file_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `customer_no` | `~` | 客户 | string | 主键 |
| `ac_name` | `~` | 帐款科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_no1` | `~` | 银行帐号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_no2` | `~` | 银行帐号(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_no3` | `~` | 银行帐号(三) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_title` | `~` | 帐款科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `accounts_receivable_subject` | `~` | 预收账款科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `agent` | `~` | 代理商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `agent_abbr` | `~` | 代理商简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `air_freight_abbrev` | `~` | 空运公司简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `airlines` | `~` | 空运公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `airport` | `~` | 空运机场 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `annual_atm` | `~` | 年营业额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ar_date` | `~` | 开票日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ar_ratio` | `~` | 应收帐款比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bill_to_headquarter` | `~` | 总公司请款 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `branches` | `~` | 分店数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `brand` | `~` | 品牌 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker` | `~` | 报关行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `broker_abbr` | `~` | 报关行简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `business_license` | `~` | 营业执照 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `capital_amount` | `~` | 注册资金 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `channel` | `~` | 渠道 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `channel_abbr` | `~` | 渠道简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collector` | `~` | 收款业务员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `commission_rate` | `~` | 佣金比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `company` | `~` | 公司 | string | 管理字段（只读，不可赋值） |
| `company_closed_on` | `~` | 歇业日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `company_owner` | `~` | 负责人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `consignment_customers` | `~` | 寄售客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contact` | `~` | 连络人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `country` | `~` | 国家 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `create_date` | `~` | 创建时间 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建人 | string | 管理字段（只读，不可赋值） |
| `credit_limit_1` | `~` | 信用额度管制 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `credit_limit_2` | `~` | 信用额度 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `credit_limit_is_controlled_by_headquarter` | `~` | 信用额度依总公司控管 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `credit_rating` | `~` | 信用评等 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_contact_data` | `~` | 客户银行账号信息 | array | ~ |
| `customer_name` | `~` | 客户全称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_shortname` | `~` | 客户简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `dearptment` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `delivery_address1` | `~` | 送货地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `delivery_address2` | `~` | 送货地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `deposit_rate` | `~` | 订金比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destination` | `~` | 目的地 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_rate` | `~` | 折扣率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `e_mail` | `~` | E-MAIL | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc` | `~` | 汇至EBC | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_application_no` | `~` | EBC申请编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fax_no` | `FAX_NO` | FAX_NO | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `file_address_1` | `~` | 文件地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `file_address_2` | `~` | 文件地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fin_institution_name_1` | `~` | 金融机构名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fin_institution_name_2` | `~` | 金融机构名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fin_institution_name_3` | `~` | 金融机构名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `first_trade_date` | `~` | 初次交易日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `flag` | `~` | 修改次数 | int | 管理字段（只读，不可赋值） |
| `gmp_gsp` | `~` | GSP认证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `headcount` | `~` | 员工人数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `headquarter_no` | `~` | 总公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `insp_comp_abbr` | `~` | 验货公司简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_company` | `~` | 验货公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `installment_no` | `~` | 分期收款条件编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `insurance_ratio` | `~` | 保险费率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_address1` | `~` | 发票地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_address2` | `~` | 发票地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_customer_name` | `~` | 开票客户名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_e_mail` | `~` | 开票推送邮箱 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_phone` | `~` | 开票推送手机号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoice_type` | `~` | 发票种类 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoicing_rules` | `~` | 开票规则 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `invoicing_rules_name` | `~` | 开票规则名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lately_trade_date` | `~` | 最近交易日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `marine_comp_abbr` | `~` | 海运公司简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `marine_company` | `~` | 海运公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `marine_port` | `~` | 海运港口 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modi_date` | `~` | 修改时间 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改人 | string | 管理字段（只读，不可赋值） |
| `nation_abbr` | `~` | 国家简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `note_ac_title` | `~` | 票据科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `note_delivery_method` | `~` | 票据寄领 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `notes_ac` | `~` | 票据科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `nr_ratio_non_cashed` | `~` | 未兑现应收票据比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `operating_date` | `~` | 开业日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_credit_auditing` | `~` | 订单信用查核方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `other_abbr` | `~` | 其他简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `other_ratio` | `~` | 其它比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `other_type` | `~` | 其他 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `overrun_rate` | `~` | 可超出率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_bank1` | `~` | 开户银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_bank2` | `~` | 付款银行(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_bank3` | `~` | 付款银行(三) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款条件编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `phone` | `~` | 手机 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_condition` | `~` | 价格说明 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `pricing_order` | `~` | 定价顺序//1.计价单价、2.标准售价、3.零售价、4.售价定价一、5.售价定价二、6.售价定价三、7.售价定价四、8.售价定价五、9.售价定价六、A.折扣后客户计价、B.折扣后标准售价、C.折扣后零售价、D.折扣后售价定价一、E.折扣后售价定价二、F.折扣后售价定价三、G.折扣后售价定价四、H.折扣后售价定价五、I.折扣后售价定价 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `production_business_license` | `~` | 经营许可证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `quick_code` | `~` | 快捷码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rate_of_sales_unclosed` | `~` | 未结帐销货金额比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rate_of_unshipped_orders` | `~` | 未出货订单金额比率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_method` | `~` | 结算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_salesman_name` | `~` | 收款业务员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `region` | `~` | 地区 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `region_abbr` | `~` | 地区简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `registration_address_1` | `~` | 注册地址(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `registration_address_2` | `~` | 注册地址(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `route` | `~` | 路线 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `route_abbr` | `~` | 路线简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_credit_auditing` | `~` | 销货信用查核方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_name` | `~` | 业务人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_ranking` | `~` | 销售评等 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `salesman_no` | `~` | 业务人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax` | `~` | 税额计算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_no` | `~` | 税号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `taxed_code` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tel_no1` | `~` | TEL_NO(一) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tel_no2` | `~` | TEL_NO(二) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_currency` | `~` | 交易币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transport_mode_no` | `~` | 运输方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `type` | `~` | 类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `type_abbrev` | `~` | 型态简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
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
| `usr_group` | `~` | 组别 | string | 管理字段（只读，不可赋值） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code_1` | `~` | 邮编 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code_2` | `~` | 邮编 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code_3` | `~` | 邮编 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `zip_code_4` | `~` | 邮编 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "customer_basic_data_file_data"`**，否则易飞无法识别为单身过滤条件。

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
