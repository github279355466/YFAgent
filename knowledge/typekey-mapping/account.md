# 会计科目 (account) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only account`

- **服务前缀**：`yf.oapi.`
- **操作集**：`query` / `read`
- **查询服务**：`yf.oapi.account.data.query.get`
- **读取服务**：`yf.oapi.account.data.read.get`
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

- **构成**：`ac_no`
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `ac_no` | `~` | 科目编号 | string | 主键 |
| `ac_alias` | `~` | 科目别名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_category` | `~` | 科目类别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_level` | `~` | 科目层级 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_property` | `~` | 科目性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `account_page_format` | `~` | 账页格式 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `acct_title` | `~` | 科目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `annual_settlement_method` | `~` | 年结方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `asset_profit_loss` | `~` | 资产损益别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `budget` | `~` | 预算 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_ac` | `~` | 现金类科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_bank_deposit_account` | `~` | 现金银行存款科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c1_control_method` | `~` | 核算项目(一)控制方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c1_source` | `~` | 核算项目(一)来源 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c2_control_method` | `~` | 核算项目(二)控制方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c2_source` | `~` | 核算项目(二)来源 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_method` | `~` | 数量控制 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `current_profit_and_loss_ac_no` | `~` | 本期损益科目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_management` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `dearptment_management` | `~` | 部门管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `debit_credit_balance` | `~` | 余额借贷别 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `default_currency` | `~` | 惯用币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `distribution_function_analysis` | `~` | 下发功能解析 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `effective_ac` | `~` | 科目有效 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `financial_ratio_analysis_category` | `~` | 财务比率分析类别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `foreign_currency_accounting` | `~` | 外币核算 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `items_affects_cash_flow` | `~` | 现金流量表项目 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `monetary_account` | `~` | 货币性科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `names_of_ac` | `~` | 科目名称(一级到末级) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `names_of_items_affects_cash_flow` | `~` | 影响现金流量表项目名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `participate_in_foreign_exchange_adjustment` | `~` | 参与调汇 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `participate_in_transfer` | `~` | 参与结转 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project__management` | `~` | 项目号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `report_debit_credit_cate` | `~` | 报表借贷别 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_debit_and_credit_in_red_letters` | `~` | 金额红字借贷反向 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `shortcut` | `~` | 快捷码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_management` | `~` | 人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_management` | `~` | 供应商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`account_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `ac_no` | `~` | 科目编号 | string | 主键 |
| `ac_alias` | `~` | 科目别名 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_category` | `~` | 科目类别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_level` | `~` | 科目层级 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ac_property` | `~` | 科目性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `account_page_format` | `~` | 账页格式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `acct_title` | `~` | 科目名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `annual_settlement_method` | `~` | 年结方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `asset_profit_loss` | `~` | 资产损益别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `budget` | `~` | 预算 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_ac` | `~` | 现金类科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cash_bank_deposit_account` | `~` | 现金银行存款科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c1_control_method` | `~` | 核算项目(一)控制方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c1_source` | `~` | 核算项目(一)来源 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c2_control_method` | `~` | 核算项目(二)控制方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_a_c2_source` | `~` | 核算项目(二)来源 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `contra_method` | `~` | 数量控制 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `current_profit_and_loss_ac_no` | `~` | 本期损益科目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_management` | `~` | 客户 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `dearptment_management` | `~` | 部门管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `debit_credit_balance` | `~` | 余额借贷别 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `default_currency` | `~` | 惯用币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `distribution_function_analysis` | `~` | 下发功能解析 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `effective_ac` | `~` | 科目有效 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `financial_ratio_analysis_category` | `~` | 财务比率分析类别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `foreign_currency_accounting` | `~` | 外币核算 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `items_affects_cash_flow` | `~` | 现金流量表项目 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `monetary_account` | `~` | 货币性科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `names_of_ac` | `~` | 科目名称(一级到末级) | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `names_of_items_affects_cash_flow` | `~` | 影响现金流量表项目名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `participate_in_foreign_exchange_adjustment` | `~` | 参与调汇 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `participate_in_transfer` | `~` | 参与结转 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project__management` | `~` | 项目号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `report_debit_credit_cate` | `~` | 报表借贷别 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reverse_debit_and_credit_in_red_letters` | `~` | 金额红字借贷反向 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `shortcut` | `~` | 快捷码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_management` | `~` | 人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `supplier_management` | `~` | 供应商 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "account_data"`**，否则易飞无法识别为单身过滤条件。

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
