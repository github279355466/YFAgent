# 投产单 (wo.commence) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only wo.commence`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.wo.commence.data.query.get`
- **读取服务**：`yf.oapi.wo.commence.data.read.get`
- **新增服务**：`yf.oapi.wo.commence.data.create`
- **标题来源**：目录名单一来源

## ⚠️ 文档异常（官方 Apipost 文档问题，非抽取缺陷）

- 入参容器名 `transfer_doc_data` 与业务对象 `wo.commence` 无关（无共同词）——疑为官方文档复制粘贴错误，真机调用前须核实

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
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | 可写（create+update 均出现） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | 可选（仅 update 中出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | 可写（create+update 均出现） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `remarks` | `~` | 备注 | string | 可选（仅 update 中出现） |
| `tax_rate` | `~` | 税率 | number | 可选（仅 update 中出现） |
| `tax_type` | `~` | 税种 | string | 可选（仅 update 中出现） |
| `transfer_date` | `~` | 传送日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_in_address_name` | `~` | 移入地名称 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `transfer_in_address_no` | `~` | 移入地 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `transfer_in_department_name` | `~` | 移入部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_in_department_no` | `~` | 移入部门 | string | 可写（create+update 均出现） |
| `transfer_out_address_name` | `~` | 移出地名称 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `transfer_out_address_no` | `~` | 移出地 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `transfer_out_department_name` | `~` | 移出部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_out_department_no` | `~` | 移出部门 | string | 可写（create+update 均出现） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trs_in_category` | `~` | 移入类别 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `trs_out_category` | `~` | 移出类别 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`transfer_doc_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_date` | `~` | 传送日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_in_address_name` | `~` | 移入地名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_in_address_no` | `~` | 移入地 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_in_department_name` | `~` | 移入部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_in_department_no` | `~` | 移入部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_out_address_name` | `~` | 移出地名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_out_address_no` | `~` | 移出地 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_out_department_name` | `~` | 移出部门名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_out_department_no` | `~` | 移出部门 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trs_in_category` | `~` | 移入类别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `trs_out_category` | `~` | 移出类别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `update_code` | `~` | 更新码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "transfer_doc_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`transfer_doc_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `accepted_date` | `~` | 验收日期 | string | 可选（仅 update 中出现） |
| `accepted_package_qty` | `~` | 验收包装数量 | number | 可选（仅 update 中出现） |
| `accepted_qty` | `~` | 验收数量 | number | 可写（create+update 均出现） |
| `actual_labor_hour_seconds` | `~` | 实际人时(秒) | int | 可写（create+update 均出现） |
| `actual_machine_hours_seconds` | `~` | 实际机时(秒) | int | 可写（create+update 均出现） |
| `complete_qty` | `~` | 完成数量 | number | 可选（仅 update 中出现） |
| `currency` | `~` | 币种 | string | 可选（仅 update 中出现） |
| `deduction_amount` | `~` | 扣款金额 | number | 可选（仅 update 中出现） |
| `deduction_desc` | `~` | 扣款说明 | string | 可写（create+update 均出现） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | 可写（create+update 均出现） |
| `destroyed_qty` | `~` | 破坏数量 | number | 可写（create+update 均出现） |
| `emergency` | `~` | 急料 | string | 可写（create+update 均出现） |
| `exchange_rate` | `~` | 汇率 | number | 可选（仅 update 中出现） |
| `labor_hours_seconds_used` | `~` | 使用人时(秒) | int | 可写（create+update 均出现） |
| `machine_hours_seconds_used` | `~` | 使用机时(秒) | int | 可写（create+update 均出现） |
| `machine_no` | `~` | 机器编号 | string | 可写（create+update 均出现） |
| `outsourcing_doc_no` | `~` | 委外单号 | string | 可选（仅 update 中出现） |
| `outsourcing_doc_type` | `~` | 委外单别 | string | 可选（仅 update 中出现） |
| `outsourcing_price` | `~` | 委外单价 | number | 可选（仅 update 中出现） |
| `outsourcing_seq` | `~` | 委外序号 | string | 可选（仅 update 中出现） |
| `overdue_code` | `~` | 超期码 | string | 可选（仅 update 中出现） |
| `piece_price` | `~` | 计件单价 | number | 可选（仅 update 中出现） |
| `plan_delivery_date` | `~` | 预交货日 | string | 可写（create+update 均出现） |
| `pricing_qty` | `~` | 计价数量 | number | 可写（create+update 均出现） |
| `pricing_unit` | `~` | 计价单位 | string | 可选（仅 update 中出现） |
| `process_amount` | `~` | 加工金额 | number | 可选（仅 update 中出现） |
| `process_step` | `~` | 工步 | string | 可写（create+update 均出现） |
| `qc_status` | `~` | 检验状态 | string | 可写（create+update 均出现） |
| `qty` | `~` | 数量 | number | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `return_package_qty` | `~` | 验退包装数量 | number | 可选（仅 update 中出现） |
| `return_qty` | `~` | 验退数量 | number | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | 可选（仅 update 中出现） |
| `scrap_qty` | `~` | 报废数量 | number | 可写（create+update 均出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `staff_no` | `~` | 人员 | string | 可写（create+update 均出现） |
| `standard_operating_procedure_desc` | `~` | 标准作业程序说明 | string | 可选（仅 update 中出现） |
| `std_labor_hours_seconds` | `~` | 标准人时(秒) | int | 可写（create+update 均出现） |
| `std_machine_hours_seconds` | `~` | 标准机时(秒) | int | 可写（create+update 均出现） |
| `sub_seq` | `~` | 分批序号 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `tax_type` | `~` | 税种 | string | 可写（create+update 均出现） |
| `team_no` | `~` | 班组编号 | string | 可写（create+update 均出现） |
| `transfer_in_op_no` | `~` | 移入工艺 | string | 可写（create+update 均出现） |
| `transfer_in_op_seq` | `~` | 移入工序 | string | 可写（create+update 均出现） |
| `transfer_out_op_no` | `~` | 移出工艺 | string | 可写（create+update 均出现） |
| `transfer_out_op_seq` | `~` | 移出工序 | string | 可写（create+update 均出现） |
| `transfer_package_qty` | `~` | 转移包装数量 | number | 可选（仅 update 中出现） |
| `type` | `~` | 类型 | string | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | 可选（仅 update 中出现） |
| `wo_doc_no` | `~` | 工单单号 | string | 可写（create+update 均出现） |
| `wo_doc_type_no` | `~` | 工单单别 | string | 可写（create+update 均出现） |
| `wo_item_name` | `~` | 产品品名 | string | 可选（仅 update 中出现） |
| `wo_item_no` | `~` | 产品品号 | string | 可选（仅 update 中出现） |
| `wo_item_spec` | `~` | 产品规格 | string | 可选（仅 update 中出现） |
| `wo_op_seq` | `~` | 工单工艺序号 | string | 可选（仅 update 中出现） |
| `work_hours_batch_qty` | `~` | 工时批量 | int | 可写（create+update 均出现） |
| `work_hours_wages_rate` | `~` | 工时工资率 | number | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "transfer_doc_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
