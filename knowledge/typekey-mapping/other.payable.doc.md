# 预付单 (other.payable.doc) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only other.payable.doc`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.other.payable.doc.data.query.get`
- **读取服务**：`yf.oapi.other.payable.doc.data.read.get`
- **新增服务**：`yf.oapi.other.payable.doc.data.create`
- **标题来源**：目录名 18 个，取最高频：预付单(10) / 其他应付单(8)

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
| `accepted_package_qty` | `~` | 验收包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `accepted_qty` | `~` | 验收数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `account_name` | `~` | 户名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `account_no` | `~` | 银行账号 | string | 可写（create+update 均出现） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `auto_buckle_material_update_code` | `~` | 自动扣料更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_code` | `~` | 付款银行 | string | 可写（create+update 均出现） |
| `company` | `~` | 公司 | string | 管理字段（只读，不可赋值） |
| `cost_bear_center` | `~` | 费用承担中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cost_bear_center_name` | `~` | 费用承担中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cost_bear_type` | `~` | 费用承担中心类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `create_date` | `~` | 创建日期 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建者 | string | 管理字段（只读，不可赋值） |
| `currency` | `~` | 币种 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `data_type` | `~` | 单据类型 | string | 可写（create+update 均出现） |
| `department` | `~` | 部门 | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | number | 可写（create+update 均出现） |
| `discount_cashing_date` | `~` | 取得折扣兑现日 | string | 可写（create+update 均出现） |
| `discount_payment_date` | `~` | 取得折扣付款日 | string | 可写（create+update 均出现） |
| `doc_date` | `~` | 单据日期 | string | 可写（create+update 均出现） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_adjustment_amount` | `~` | 累计调汇金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `exp_cashing_date` | `~` | 预计兑现日 | string | 可写（create+update 均出现） |
| `exp_payment_date` | `~` | 预计付款日 | string | 可写（create+update 均出现） |
| `flag` | `~` | 标识位 | int | 管理字段（只读，不可赋值） |
| `freeze_payment` | `~` | 冻结付款 | string | 可写（create+update 均出现） |
| `generate_entry_code` | `~` | 生成分录 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_cost` | `~` | 生成分录(成本) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_cancelled_amount` | `~` | 本币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_payable_amount` | `~` | 本币应付金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `log_id` | `~` | 设备云log_id | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modi_date` | `~` | 修改日期 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改者 | string | 管理字段（只读，不可赋值） |
| `payable_object` | `~` | 应付对象 | string | 可写（create+update 均出现） |
| `payable_object_name` | `~` | 应付对象简称 | string | 可写（create+update 均出现） |
| `payable_object_no` | `~` | 应付对象编号 | string | 可写（create+update 均出现） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | 可写（create+update 均出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prod_record_update_code` | `~` | 生产记录更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `receipt_date` | `~` | 进货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_bank_account` | `~` | 收款银行账号 | string | 可写（create+update 均出现） |
| `receive_bank_name` | `~` | 汇款银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | 可写（create+update 均出现） |
| `return_package_qty` | `~` | 验退包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `return_qty` | `~` | 验退数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `revaluation_exchange_rate` | `~` | 上次重估汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate` | `~` | sMES产生 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate_doc_no` | `~` | sMES单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff` | `~` | 人员 | string | 可写（create+update 均出现） |
| `staff_name` | `~` | 人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `stock_in_package_qty` | `~` | 入库包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `stock_in_qty` | `~` | 入库数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_cancelled_amount` | `~` | 原币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_payable_amount` | `~` | 原币应付金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `udf01` | `~` | ~ | string | 自定义字段 |
| `udf02` | `~` | ~ | string | 自定义字段 |
| `udf03` | `~` | ~ | string | 自定义字段 |
| `udf04` | `~` | ~ | string | 自定义字段 |
| `udf05` | `~` | ~ | string | 自定义字段 |
| `udf06` | `~` | ~ | string | 自定义字段 |
| `udf07` | `~` | ~ | string | 自定义字段 |
| `udf08` | `~` | ~ | string | 自定义字段 |
| `udf09` | `~` | ~ | string | 自定义字段 |
| `udf10` | `~` | ~ | string | 自定义字段 |
| `udf11` | `~` | ~ | string | 自定义字段 |
| `udf12` | `~` | ~ | string | 自定义字段 |
| `udf51` | `~` | ~ | int | 自定义字段 |
| `udf52` | `~` | ~ | int | 自定义字段 |
| `udf53` | `~` | ~ | int | 自定义字段 |
| `udf54` | `~` | ~ | int | 自定义字段 |
| `udf55` | `~` | ~ | int | 自定义字段 |
| `udf56` | `~` | ~ | int | 自定义字段 |
| `udf57` | `~` | ~ | int | 自定义字段 |
| `udf58` | `~` | ~ | int | 自定义字段 |
| `udf59` | `~` | ~ | int | 自定义字段 |
| `udf60` | `~` | ~ | int | 自定义字段 |
| `udf61` | `~` | ~ | int | 自定义字段 |
| `udf62` | `~` | ~ | int | 自定义字段 |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `usr_group` | `~` | 用户组 | string | 管理字段（只读，不可赋值） |
| `verification_status` | `~` | 核销状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_name` | `~` | 工作中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`wo_stockin_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `accepted_package_qty` | `~` | 验收包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `accepted_qty` | `~` | 验收数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `auto_buckle_material_update_code` | `~` | 自动扣料更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code_cost` | `~` | 生成分录(成本) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `log_id` | `~` | 设备云log_id | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `prod_record_update_code` | `~` | 生产记录更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receipt_date` | `~` | 进货日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `return_package_qty` | `~` | 验退包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `return_qty` | `~` | 验退数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate` | `~` | sMES产生 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sMES_generate_doc_no` | `~` | sMES单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `stock_in_package_qty` | `~` | 入库包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `stock_in_qty` | `~` | 入库数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_name` | `~` | 工作中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "wo_stockin_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`other_payable_doc_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `department` | `~` | 部门 | string | 可写（create+update 均出现） |
| `exp_project_name` | `~` | 支出项目名称 | string | 可写（create+update 均出现） |
| `exp_type` | `~` | 支出类型 | string | 可写（create+update 均出现） |
| `expense_project_no` | `~` | 费用项目编号 | string | 可写（create+update 均出现） |
| `opposite_account_no` | `~` | 对方科目 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `staff` | `~` | 人员 | string | 可写（create+update 均出现） |
| `trans_curr_amount` | `~` | 进货金额 | number | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "other_payable_doc_detail_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`other_payable_doc_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `account_name` | `~` | 户名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `account_no` | `~` | 账款科目 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bank_code` | `~` | 汇款银行 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `company` | `~` | 公司账套 | string | 管理字段（只读，不可赋值） |
| `cost_bear_center` | `~` | 费用承担中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cost_bear_center_name` | `~` | 费用承担中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cost_bear_type` | `~` | 费用承担中心类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `create_date` | `~` | 创建日期 | string | 管理字段（只读，不可赋值） |
| `creator` | `~` | 创建者 | string | 管理字段（只读，不可赋值） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `data_type` | `~` | 单据类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount` | `~` | 折扣 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_cashing_date` | `~` | 取得折扣兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `discount_payment_date` | `~` | 取得折扣付款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `ebc_export_code` | `~` | EBC汇出码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_adjustment_amount` | `~` | 累计调汇金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_cashing_date` | `~` | 预计兑现日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exp_payment_date` | `~` | 预计付款日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `flag` | `~` | 标识位 | int | 管理字段（只读，不可赋值） |
| `freeze_payment` | `~` | 冻结付款 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code` | `~` | 生成分录 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_cancelled_amount` | `~` | 本币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `local_curr_payable_amount` | `~` | 本币应付金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modi_date` | `~` | 修改日期 | string | 管理字段（只读，不可赋值） |
| `modifier` | `~` | 修改者 | string | 管理字段（只读，不可赋值） |
| `payable_object` | `~` | 应付对象 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payable_object_name` | `~` | 应付对象简称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payable_object_no` | `~` | 应付对象编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_bank_account` | `~` | 汇款账号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `receive_bank_name` | `~` | 汇款银行名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `revaluation_exchange_rate` | `~` | 上次重估汇率 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff` | `~` | 人员 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `staff_name` | `~` | 人员名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_cancelled_amount` | `~` | 原币已核销金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trans_curr_payable_amount` | `~` | 原币应付金额 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `udf01` | `~` | ~ | string | 自定义字段 |
| `udf02` | `~` | ~ | string | 自定义字段 |
| `udf03` | `~` | ~ | string | 自定义字段 |
| `udf04` | `~` | ~ | string | 自定义字段 |
| `udf05` | `~` | ~ | string | 自定义字段 |
| `udf06` | `~` | ~ | string | 自定义字段 |
| `udf07` | `~` | ~ | string | 自定义字段 |
| `udf08` | `~` | ~ | string | 自定义字段 |
| `udf09` | `~` | ~ | string | 自定义字段 |
| `udf10` | `~` | ~ | string | 自定义字段 |
| `udf11` | `~` | ~ | string | 自定义字段 |
| `udf12` | `~` | ~ | string | 自定义字段 |
| `udf51` | `~` | ~ | int | 自定义字段 |
| `udf52` | `~` | ~ | int | 自定义字段 |
| `udf53` | `~` | ~ | int | 自定义字段 |
| `udf54` | `~` | ~ | int | 自定义字段 |
| `udf55` | `~` | ~ | int | 自定义字段 |
| `udf56` | `~` | ~ | int | 自定义字段 |
| `udf57` | `~` | ~ | int | 自定义字段 |
| `udf58` | `~` | ~ | int | 自定义字段 |
| `udf59` | `~` | ~ | int | 自定义字段 |
| `udf60` | `~` | ~ | int | 自定义字段 |
| `udf61` | `~` | ~ | int | 自定义字段 |
| `udf62` | `~` | ~ | int | 自定义字段 |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `usr_group` | `~` | 用户组 | string | 管理字段（只读，不可赋值） |
| `verification_status` | `~` | 核销状态 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "other_payable_doc_data"`**，否则易飞无法识别为单身过滤条件。

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
