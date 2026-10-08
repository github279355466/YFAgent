# 工单工艺 (wo.routing) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only wo.routing`

- **服务前缀**：`yf.oapi.`
- **操作集**：`create` / `delete` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.wo.routing.data.query.get`
- **读取服务**：`yf.oapi.wo.routing.data.read.get`
- **新增服务**：`yf.oapi.wo.routing.data.create`
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

- **构成**：`wo_doc_type_no` + `wo_doc_no`（**复合主键**）
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `wo_doc_type_no` | `~` | 工单单别 | string | 主键 |
| `wo_doc_no` | `~` | 工单单号 | string | 主键 |
| `actual_complete_date` | `~` | 实际完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `actual_labor_hour_seconds` | `~` | 实际人时(秒) | number | 可写（create+update 均出现） |
| `actual_machine_hours_seconds` | `~` | 实际机时(秒) | number | 可写（create+update 均出现） |
| `actual_start_date` | `~` | 实际开工 | object | 可写（create+update 均出现） |
| `complete_base` | `~` | 完工判断依据 | string | 可写（create+update 均出现） |
| `complete_package_qty` | `~` | 完成包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `complete_qty` | `~` | 完成数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `completion_code` | `~` | 完工码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `counting_gain_loss_package_qty` | `~` | 盘盈亏包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `counting_gain_loss_qty` | `~` | 盘盈亏量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | 可写（create+update 均出现） |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | 可写（create+update 均出现） |
| `fixed_manufacturing_days` | `~` | 固定制造天数 | number | 可写（create+update 均出现） |
| `input_package_qty` | `~` | 投入包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `input_qty` | `~` | 投入数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_days` | `~` | 检验天数 | number | 可写（create+update 均出现） |
| `line_vendor_code` | `~` | 工作中心/供应商编号 | string | 可写（create+update 均出现） |
| `op_control` | `~` | 工艺控管 | string | 可写（create+update 均出现） |
| `op_description` | `~` | 工艺说明 | object | 可写（create+update 均出现） |
| `op_property` | `~` | 工艺性质 | string | 可写（create+update 均出现） |
| `outsourcing_price` | `~` | 委外单价 | number | 可写（create+update 均出现） |
| `piece_price` | `~` | 计件单价 | number | 可写（create+update 均出现） |
| `plan_complete_date` | `~` | 预计完工 | string | 可写（create+update 均出现） |
| `plan_start_date` | `~` | 预计开工 | string | 可写（create+update 均出现） |
| `pricing_unit` | `~` | 计价单位 | string | 可写（create+update 均出现） |
| `processing_sequence` | `~` | 加工顺序 | string | 可写（create+update 均出现） |
| `production_line_vendor_name` | `~` | 工作中心/供应商名称 | string | 可写（create+update 均出现） |
| `production_permission` | `~` | 准产证 | string | 可写（create+update 均出现） |
| `project_no` | `~` | 项目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `return_input_qty` | `~` | 退回已投入数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_complete_package_qty` | `~` | 返工完成包装 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_complete_qty` | `~` | 返工完成 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_destroyed_package_qty` | `~` | 返工破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_destroyed_qty` | `~` | 返工破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_input_package_qty` | `~` | 返工投入包装 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_input_qty` | `~` | 返工投入 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_scrap_package_qty` | `~` | 返工报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `rework_scrap_qty` | `~` | 返工报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `routing_name` | `~` | 工艺路线名称 | string | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `std_labor_hours_seconds` | `~` | 标准人时(秒) | number | 可写（create+update 均出现） |
| `std_machine_hours_seconds` | `~` | 标准机时(秒) | number | 可写（create+update 均出现） |
| `tax_included` | `~` | 含税 | string | 可写（create+update 均出现） |
| `to_be_transferred_package_qty` | `~` | 待转包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `to_be_transferred_qty` | `~` | 待转数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_batch_qty` | `~` | 移转批量 | number | 可写（create+update 均出现） |
| `transferred_package_qty` | `~` | 拨转包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transferred_qty` | `~` | 拨转数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `variable_manufacture_days` | `~` | 变动制造天数 | number | 可写（create+update 均出现） |
| `verification_mode` | `~` | 检验方式 | string | 可写（create+update 均出现） |
| `work_hours_batch_qty` | `~` | 工时批量 | number | 可写（create+update 均出现） |
| `work_hours_wages_rate` | `~` | 工时工资率 | number | 可写（create+update 均出现） |

## 单身字段：`wo_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `wo_doc_type_no` | `~` | 工单单别 | string | 主键 |
| `wo_doc_no` | `~` | 工单单号 | string | 主键 |
| `actual_complete_date` | `~` | 实际完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `actual_start_date` | `~` | 实际开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | ~ |
| `approve_date` | `~` | 审核日 | string | ~ |
| `approve_status` | `~` | 审核码 | string | ~ |
| `approver_no` | `~` | 审核者 | string | ~ |
| `arrived_package_qty` | `~` | 到货包装数量 | number | ~ |
| `arrived_qty` | `~` | 到货数量 | number | ~ |
| `assembled_qty` | `~` | 已装配数量 | number | ~ |
| `bom_date` | `~` | BOM日期 | string | ~ |
| `bom_version` | `~` | BOM版本 | object | ~ |
| `complete_date_days` | `~` | 完工日占用天数 | number | ~ |
| `configuration_no` | `~` | 配置方案 | object | ~ |
| `configuration_seq` | `~` | 配置序号 | object | ~ |
| `currency` | `~` | 币种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_doc_no` | `~` | 客户单号 | object | ~ |
| `customer_item_no` | `~` | 客户品号 | object | ~ |
| `customer_shortname` | `~` | 客户简称 | object | ~ |
| `demand_date` | `~` | 需求日期 | object | ~ |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `emergency` | `~` | 急料 | string | ~ |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issued_sets` | `~` | 已领套数 | number | ~ |
| `item_production_stock_in_warehouse_name` | `~` | 入库仓库名称 | string | ~ |
| `item_production_stock_in_warehouse_no` | `~` | 入库仓库 | string | ~ |
| `lot_description` | `~` | 批号说明 | string | ~ |
| `order_doc_no` | `~` | 订单单号 | string | ~ |
| `order_doc_type` | `~` | 订单单别 | string | ~ |
| `order_issue_date` | `~` | 开单日期 | string | ~ |
| `order_seq` | `~` | 订单序号 | string | ~ |
| `outsourcing_price` | `~` | ~ | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_name` | `~` | 委外供应商名称 | object | ~ |
| `outsourcing_supplier_no` | `~` | 委外供应商 | object | ~ |
| `package_unit` | `~` | 包装单位 | object | ~ |
| `payment_condition_no` | `~` | 付款名称 | object | ~ |
| `plan_complete_date` | `~` | 预计完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_lot_no` | `~` | 计划批号 | object | ~ |
| `plan_package_qty` | `~` | 预计产包装量 | number | ~ |
| `plan_qty` | `~` | 预计产量 | number | ~ |
| `plan_seq` | `~` | 计划序号 | object | ~ |
| `plan_start_date` | `~` | 预计开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_version` | `~` | 计划版本 | object | ~ |
| `plant_name` | `~` | 厂别名称 | string | ~ |
| `plant_no` | `~` | 出货工厂 | string | ~ |
| `plot_no` | `~` | 生产批号 | string | ~ |
| `print_times` | `~` | 打印次数 | number | ~ |
| `process_code` | `~` | 工艺路线编号 | object | ~ |
| `process_print_times` | `~` | 途程卡打印次数 | number | ~ |
| `process_qty` | `~` | 加工数量 | number | ~ |
| `processing_unit` | `~` | 加工单位 | object | ~ |
| `produced_package_qty` | `~` | 已生产包装量 | number | ~ |
| `produced_qty` | `~` | 已生产量 | number | ~ |
| `production_permission` | `~` | 准产证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | object | ~ |
| `project_no` | `~` | 项目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `property` | `~` | 属性 | string | ~ |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_1` | `~` | 备注一 | object | ~ |
| `remarks_2` | `~` | 备注二 | object | ~ |
| `remarks_3` | `~` | 备注三 | object | ~ |
| `remarks_4` | `~` | 备注四 | object | ~ |
| `root_source_doc_no` | `~` | 根来源单号 | object | ~ |
| `root_source_doc_type` | `~` | 根来源单别 | object | ~ |
| `root_source_seq` | `~` | 根来源序号 | object | ~ |
| `routing_exist` | `~` | 启用工艺 | string | ~ |
| `routing_item_no` | `~` | 工艺路线品号 | object | ~ |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_no` | `~` | 源工单编号 | string | ~ |
| `source_wo_doc_type_no` | `~` | 源工单单别 | string | ~ |
| `start_date_days` | `~` | 开工日占用天数 | number | ~ |
| `status` | `~` | 状态码 | string | ~ |
| `tax_rate` | `~` | 税率 | number | ~ |
| `tax_type` | `~` | 税种 | string | ~ |
| `transfer_times` | `~` | 传送次数 | number | ~ |
| `tree_code` | `~` | 树状码 | object | ~ |
| `type` | `~` | 类型 | string | ~ |
| `unit` | `~` | 单位 | string | ~ |
| `wo_doc_type_name` | `~` | 工单单别名称 | string | ~ |
| `wo_item_name` | `~` | 产品品名 | string | ~ |
| `wo_item_no` | `~` | 产品品号 | string | ~ |
| `wo_item_spec` | `~` | 产品规格 | string | ~ |
| `workstation_name` | `~` | 工作中心名称 | string | ~ |
| `workstation_no` | `~` | 工作中心 | string | ~ |

> **查询此单身字段时必须带 `node_name: "wo_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`wo_routing_sub_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `wo_doc_type_no` | `~` | 工单单别 | string | 主键 |
| `wo_doc_no` | `~` | 工单单号 | string | 主键 |
| `actual_labor_hour_seconds` | `~` | 实际人时(秒) | int | 可写（create+update 均出现） |
| `actual_machine_hours_seconds` | `~` | 实际机时(秒) | int | 可写（create+update 均出现） |
| `line_vendor_code` | `~` | 工作中心/供应商编号 | string | 可写（create+update 均出现） |
| `piece_price` | `~` | 计件单价 | number | 可写（create+update 均出现） |
| `pricing_unit` | `~` | 计价单位 | string | 可写（create+update 均出现） |
| `process_step` | `~` | 工步 | string | 可写（create+update 均出现） |
| `processing_sequence` | `~` | 加工顺序 | string | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `seq` | `~` | 变更单序号 | string | 可写（create+update 均出现） |
| `standard_operating_procedure_desc` | `~` | 标准作业程序说明 | string | 可写（create+update 均出现） |
| `std_labor_hours_seconds` | `~` | 标准人时(秒) | int | 可写（create+update 均出现） |
| `std_machine_hours_seconds` | `~` | 标准机时(秒) | int | 可写（create+update 均出现） |
| `work_hours_batch_qty` | `~` | 工时批量 | int | 可写（create+update 均出现） |
| `work_hours_wages_rate` | `~` | 工时工资率 | number | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "wo_routing_sub_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
