# 会计凭证 (accounting.voucher) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only accounting.voucher`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.accounting.voucher.data.query.get`
- **读取服务**：`yf.oapi.accounting.voucher.data.read.get`
- **新增服务**：`yf.oapi.accounting.voucher.data.create`
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
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `attachments` | `~` | 附件数 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `carryover_code` | `~` | 结转码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier` | `~` | 出纳 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier_code` | `~` | 出纳码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier_day` | `~` | 出纳日 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier_name` | `~` | 出纳名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `check_cash_flow` | `~` | 现金流量对象 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `copy_classification` | `~` | 复制分类 | object | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `doc_date` | `~` | 单据日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `general_no` | `~` | 总号 | object | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `posting_code` | `~` | 过账码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_date` | `~` | 过账日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_staff` | `~` | 过账者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_staff_name` | `~` | 过账者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | 可写（create+update 均出现） |
| `source_code` | `~` | 来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_credit_local_curr` | `~` | 本币贷方总金额 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `total_debit_local_curr` | `~` | 本币借方总金额 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`accounting_voucher_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `attachments` | `~` | 附件数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `carryover_code` | `~` | 结转码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier` | `~` | 出纳 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier_code` | `~` | 出纳码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier_day` | `~` | 出纳日 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cashier_name` | `~` | 出纳名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `check_cash_flow` | `~` | 现金流量对象 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `copy_classification` | `~` | 复制分类 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `general_no` | `~` | 总号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_code` | `~` | 过账码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_date` | `~` | 过账日 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_staff` | `~` | 过账者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `posting_staff_name` | `~` | 过账者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_code` | `~` | 来源码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_credit_local_curr` | `~` | 本币贷方总金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_debit_local_curr` | `~` | 本币借方总金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "accounting_voucher_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`accounting_voucher_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 变更单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `ac_no` | `~` | 科目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `calculation_item1` | `~` | 核算项目一 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `calculation_item2` | `~` | 核算项目二 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `cash_flow_statement_item` | `~` | 现金流量表项目 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `currency` | `~` | 币种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `customer_no` | `~` | 客户 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `debit_credit` | `~` | 借贷类型 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `department` | `~` | 部门 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `description` | `~` | 信息说明 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `exchange_rate` | `~` | 汇率 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `local_curr_amount` | `~` | 本币采购金额 | int | 可写（create+update 均出现） |
| `personnel_no` | `~` | 人员编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `price` | `~` | 单价 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `qty` | `~` | 数量 | int | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `remarks` | `~` | 备注 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `seq` | `~` | 变更单序号 | string | 可写（create+update 均出现） |
| `settlement_date` | `~` | 结算日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `settlement_method_no` | `~` | 结算方式 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `settlement_no` | `~` | 结算号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `staff_no` | `~` | 人员 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `supplier_no` | `~` | 参考供应商 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `trans_curr_amount` | `~` | 进货金额 | int | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "accounting_voucher_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
