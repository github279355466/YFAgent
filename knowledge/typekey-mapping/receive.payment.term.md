# 付款条件 (receive.payment.term) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only receive.payment.term`

- **服务前缀**：`yf.oapi.`
- **操作集**：`create` / `delete` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.receive.payment.term.data.query.get`
- **读取服务**：`yf.oapi.receive.payment.term.data.read.get`
- **新增服务**：`yf.oapi.receive.payment.term.data.create`
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

- **构成**：`category` + `payment_condition_no`（**复合主键**）
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `category` | `~` | 类别 | string | 主键 |
| `payment_condition_no` | `~` | 付款名称 | string | 主键 |
| `acquire_discount` | `~` | 取得折扣 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `acquire_discount_mode` | `~` | 取得折扣方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `advance_pay_days` | `~` | 提早付款天数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `capital_realization_method_category` | `~` | 资金实现方式别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collect_from` | `~` | 收款日起算日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `collectpay_method` | `~` | 收(付)款方式别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `days_after_payment` | `~` | 付款后__天 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `days_after_settlement` | `~` | 开票后__天 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `early_usance_days` | `~` | 票期提前天数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `months_after_payment` | `~` | 付款后__月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `months_after_settlement` | `~` | 开票后_月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `name` | `~` | 名称 | string | 可选（仅 update 中出现） |
| `payment_date` | `~` | 付款逢__日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `realization_date_from` | `~` | 实现日起算日 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settling_date` | `~` | 开票逢_日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`receive_payment_term_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `category` | `~` | 类别 | string | 主键 |
| `payment_condition_no` | `~` | 付款名称 | string | 主键 |
| `acquire_discount` | `~` | 取得折扣 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `acquire_discount_mode` | `~` | 取得折扣方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `advance_pay_days` | `~` | 提早付款天数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `capital_realization_method_category` | `~` | 资金实现方式别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collect_from` | `~` | 收款日起算日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `collectpay_method` | `~` | 收(付)款方式别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `days_after_payment` | `~` | 付款后__天 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `days_after_settlement` | `~` | 开票后__天 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `early_usance_days` | `~` | 票期提前天数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `months_after_payment` | `~` | 付款后__月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `months_after_settlement` | `~` | 开票后_月 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `name` | `~` | 名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_date` | `~` | 付款逢__日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `realization_date_from` | `~` | 实现日起算日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `settling_date` | `~` | 开票逢_日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "receive_payment_term_data"`**，否则易飞无法识别为单身过滤条件。

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
