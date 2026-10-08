# 工单变更单 (wo.change) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only wo.change`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.wo.change.data.query.get`
- **读取服务**：`yf.oapi.wo.change.data.read.get`
- **新增服务**：`yf.oapi.wo.change.data.create`
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

- **构成**：`wo_doc_type_no` + `wo_doc_no` + `change_version`（**复合主键**）
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `wo_doc_type_no` | `~` | 工单单别 | string | 主键 |
| `wo_doc_no` | `~` | 工单单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `actual_complete_date` | `~` | 实际完工 | string | 可选（仅 update 中出现） |
| `actual_start_date` | `~` | 实际开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bom_date` | `~` | BOM日期 | string | 可写（create+update 均出现） |
| `bom_version` | `~` | BOM版本 | string | 可写（create+update 均出现） |
| `change_date` | `~` | 变更日期 | string | 可写（create+update 均出现） |
| `change_reason` | `~` | 变更原因 | string | 可写（create+update 均出现） |
| `configuration_no` | `~` | 配置方案 | string | 可写（create+update 均出现） |
| `configuration_seq` | `~` | 配置序号 | string | 可写（create+update 均出现） |
| `currency` | `~` | 币种 | string | 可写（create+update 均出现） |
| `customer_doc_no` | `~` | 客户单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_item_no` | `~` | 客户品号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_shortname` | `~` | 客户简称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `demand_date` | `~` | 需求日期 | string | 可写（create+update 均出现） |
| `department` | `~` | 部门 | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `emergency` | `~` | 急料 | string | 可写（create+update 均出现） |
| `exchange_rate` | `~` | 汇率 | number | 可写（create+update 均出现） |
| `issued_sets` | `~` | 已领套数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_name` | `~` | 入库仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_no` | `~` | 入库仓库 | string | 可写（create+update 均出现） |
| `lot_description` | `~` | 批号说明 | string | 可写（create+update 均出现） |
| `new_project_name` | `~` | 新项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_no` | `~` | 项目编号 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `new_tax_type` | `~` | 新税种 | string | 可写（create+update 均出现） |
| `new_type` | `~` | 新类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_doc_no` | `~` | 订单单号 | string | 可写（create+update 均出现） |
| `order_doc_type` | `~` | 订单单别 | string | 可写（create+update 均出现） |
| `order_issue_date` | `~` | 开单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_seq` | `~` | 订单序号 | string | 可写（create+update 均出现） |
| `original_actual_complete_date` | `~` | 原实际完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_actual_start_date` | `~` | 原实际开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_bom_date` | `~` | 原BOM日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_bom_version` | `~` | 原BOM版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_configuration_no` | `~` | 原配置方案 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_configuration_seq` | `~` | 原配置序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_currency` | `~` | 原币种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_demand_date` | `~` | 原需求日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department` | `~` | 原部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destroyed_package_qty` | `~` | 原破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destroyed_qty` | `~` | 原破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_emergency` | `~` | 原急料 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_exchange_rate` | `~` | 原汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_issued_sets` | `~` | 原已领套数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_item_production_stock_in_warehouse_name` | `~` | 原入库仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_item_production_stock_in_warehouse_no` | `~` | 原入库仓库 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_lot_description` | `~` | 原批号说明 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_doc_no` | `~` | 原订单单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_doc_type` | `~` | 原订单单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_issue_date` | `~` | 原开单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_seq` | `~` | 原订单序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_outsourcing_price` | `~` | 原委外单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_outsourcing_supplier_name` | `~` | 原委外供应商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_outsourcing_supplier_no` | `~` | 原委外供应商 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_package_unit` | `~` | 原包装单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_payment_condition_no` | `~` | 原付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_complete_date` | `~` | 原预计完工 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_lot_no` | `~` | 原计划批号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_package_qty` | `~` | 原预计产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_qty` | `~` | 原预计产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_seq` | `~` | 原计划序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_start_date` | `~` | 原预计开工 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_version` | `~` | 原计划版本 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_name` | `~` | 原出货工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_no` | `~` | 原出货工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plot_no` | `~` | 原生产批号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_process_print_times` | `~` | 原途程卡打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_process_qty` | `~` | 原加工数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_processing_unit` | `~` | 原加工单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_produced_package_qty` | `~` | 原已生产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_produced_qty` | `~` | 原已生产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_production_permission` | `~` | 原准产证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_project_no` | `~` | 原项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_property` | `~` | 原性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks` | `~` | 原备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_1` | `~` | 原备注一 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_2` | `~` | 原备注二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_3` | `~` | 原备注三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_4` | `~` | 原备注四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_root_source_doc_no` | `~` | 原根来源单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_root_source_doc_type` | `~` | 原根来源单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_root_source_seq` | `~` | 原根来源序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_scrap_package_qty` | `~` | 原报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_scrap_qty` | `~` | 原报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_wo_doc_no` | `~` | 原源工单编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_wo_doc_type_no` | `~` | 原源工单单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_status` | `~` | 原状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_rate` | `~` | 原税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_type` | `~` | 原税种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tree_code` | `~` | 原树状码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_type` | `~` | 原类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_unit` | `~` | 原单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_wo_item_name` | `~` | 原产品品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_wo_item_no` | `~` | 原产品品号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_wo_item_spec` | `~` | 原产品规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_workstation_name` | `~` | 原工作中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_workstation_no` | `~` | 原工作中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_price` | `~` | 委外单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_name` | `~` | 委外供应商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_no` | `~` | 委外供应商 | string | 可写（create+update 均出现） |
| `package_unit` | `~` | 包装单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | string | 可写（create+update 均出现） |
| `plan_complete_date` | `~` | 预计完工 | string | 可写（create+update 均出现） |
| `plan_lot_no` | `~` | 计划批号 | string | 可写（create+update 均出现） |
| `plan_package_qty` | `~` | 预计产包装量 | number | 可写（create+update 均出现） |
| `plan_qty` | `~` | 预计产量 | number | 可写（create+update 均出现） |
| `plan_seq` | `~` | 计划序号 | string | 可写（create+update 均出现） |
| `plan_start_date` | `~` | 预计开工 | string | 可写（create+update 均出现） |
| `plan_version` | `~` | 计划版本 | string | 可写（create+update 均出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | 可写（create+update 均出现） |
| `plot_no` | `~` | 生产批号 | string | 可写（create+update 均出现） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_print_times` | `~` | 途程卡打印次数 | int | 可写（create+update 均出现） |
| `process_qty` | `~` | 加工数量 | number | 可写（create+update 均出现） |
| `processing_unit` | `~` | 加工单位 | string | 可写（create+update 均出现） |
| `produced_package_qty` | `~` | 已生产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `produced_qty` | `~` | 已生产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `production_permission` | `~` | 准产证 | string | 可写（create+update 均出现） |
| `property` | `~` | 性质 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `remarks_1` | `~` | 备注一 | string | 可写（create+update 均出现） |
| `remarks_2` | `~` | 备注二 | string | 可写（create+update 均出现） |
| `remarks_3` | `~` | 备注三 | string | 可写（create+update 均出现） |
| `remarks_4` | `~` | 备注四 | string | 可写（create+update 均出现） |
| `root_source_doc_no` | `~` | 根来源单号 | string | 可写（create+update 均出现） |
| `root_source_doc_type` | `~` | 根来源单别 | string | 可写（create+update 均出现） |
| `root_source_seq` | `~` | 根来源序号 | string | 可写（create+update 均出现） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_no` | `~` | 源工单编号 | string | 可写（create+update 均出现） |
| `source_wo_doc_type_no` | `~` | 源工单单别 | string | 可写（create+update 均出现） |
| `status` | `~` | 状态码 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tree_code` | `~` | 树状码 | string | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_name` | `~` | 工单单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_name` | `~` | 产品品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_no` | `~` | 产品品号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_spec` | `~` | 产品规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_name` | `~` | 工作中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | string | 可写（create+update 均出现） |

## 单身字段：`wo_change_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `wo_doc_type_no` | `~` | 工单单别 | string | 主键 |
| `wo_doc_no` | `~` | 工单单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `actual_complete_date` | `~` | 实际完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `actual_start_date` | `~` | 实际开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bom_date` | `~` | BOM日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bom_version` | `~` | BOM版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_date` | `~` | 变更日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_reason` | `~` | 变更原因 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `configuration_no` | `~` | 配置方案 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `configuration_seq` | `~` | 配置序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_doc_no` | `~` | 客户单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_item_no` | `~` | 客户品号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_no` | `~` | 客户 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_shortname` | `~` | 客户简称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `demand_date` | `~` | 需求日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `emergency` | `~` | 急料 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issued_sets` | `~` | 已领套数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_name` | `~` | 入库仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_no` | `~` | 入库仓库 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lot_description` | `~` | 批号说明 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_name` | `~` | 新项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_tax_type` | `~` | 新税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `new_type` | `~` | 新类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_doc_no` | `~` | 订单单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_doc_type` | `~` | 订单单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_issue_date` | `~` | 开单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_seq` | `~` | 订单序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_actual_complete_date` | `~` | 原实际完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_actual_start_date` | `~` | 原实际开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_bom_date` | `~` | 原BOM日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_bom_version` | `~` | 原BOM版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_configuration_no` | `~` | 原配置方案 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_configuration_seq` | `~` | 原配置序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_currency` | `~` | 原币种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_demand_date` | `~` | 原需求日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_department` | `~` | 原部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destroyed_package_qty` | `~` | 原破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_destroyed_qty` | `~` | 原破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_emergency` | `~` | 原急料 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_exchange_rate` | `~` | 原汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_issued_sets` | `~` | 原已领套数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_item_production_stock_in_warehouse_name` | `~` | 原入库仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_item_production_stock_in_warehouse_no` | `~` | 原入库仓库 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_lot_description` | `~` | 原批号说明 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_doc_no` | `~` | 原订单单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_doc_type` | `~` | 原订单单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_issue_date` | `~` | 原开单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_order_seq` | `~` | 原订单序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_outsourcing_price` | `~` | 原委外单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_outsourcing_supplier_name` | `~` | 原委外供应商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_outsourcing_supplier_no` | `~` | 原委外供应商 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_package_unit` | `~` | 原包装单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_payment_condition_no` | `~` | 原付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_complete_date` | `~` | 原预计完工 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_lot_no` | `~` | 原计划批号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_package_qty` | `~` | 原预计产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_qty` | `~` | 原预计产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_seq` | `~` | 原计划序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_start_date` | `~` | 原预计开工 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plan_version` | `~` | 原计划版本 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_name` | `~` | 原工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plant_no` | `~` | 原工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_plot_no` | `~` | 原生产批号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_process_print_times` | `~` | 原途程卡打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_process_qty` | `~` | 原加工数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_processing_unit` | `~` | 原加工单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_produced_package_qty` | `~` | 原已生产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_produced_qty` | `~` | 原已生产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_production_permission` | `~` | 原准产证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_project_no` | `~` | 原项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_property` | `~` | 原性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks` | `~` | 原备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_1` | `~` | 原备注一 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_2` | `~` | 原备注二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_3` | `~` | 原备注三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_remarks_4` | `~` | 原备注四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_root_source_doc_no` | `~` | 原根来源单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_root_source_doc_type` | `~` | 原根来源单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_root_source_seq` | `~` | 原根来源序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_scrap_package_qty` | `~` | 原报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_scrap_qty` | `~` | 原报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_wo_doc_no` | `~` | 原源工单编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_source_wo_doc_type_no` | `~` | 原源工单单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_status` | `~` | 原状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_rate` | `~` | 原税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tax_type` | `~` | 原税种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_tree_code` | `~` | 原树状码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_type` | `~` | 原类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_unit` | `~` | 原单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_wo_item_name` | `~` | 原产品品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_wo_item_no` | `~` | 原产品品号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_wo_item_spec` | `~` | 原产品规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_workstation_name` | `~` | 原工作中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `original_workstation_no` | `~` | 原工作中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_price` | `~` | 委外单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_name` | `~` | 委外供应商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_no` | `~` | 委外供应商 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `package_unit` | `~` | 包装单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_complete_date` | `~` | 预计完工 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_lot_no` | `~` | 计划批号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_package_qty` | `~` | 预计产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_qty` | `~` | 预计产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_seq` | `~` | 计划序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_start_date` | `~` | 预计开工 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plan_version` | `~` | 计划版本 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plot_no` | `~` | 生产批号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_print_times` | `~` | 途程卡打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_qty` | `~` | 加工数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `processing_unit` | `~` | 加工单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `produced_package_qty` | `~` | 已生产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `produced_qty` | `~` | 已生产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `production_permission` | `~` | 准产证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `property` | `~` | 性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_1` | `~` | 备注一 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_2` | `~` | 备注二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_3` | `~` | 备注三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_4` | `~` | 备注四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `root_source_doc_no` | `~` | 根来源单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `root_source_doc_type` | `~` | 根来源单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `root_source_seq` | `~` | 根来源序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_no` | `~` | 源工单编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_type_no` | `~` | 源工单单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `status` | `~` | 状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tree_code` | `~` | 树状码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_name` | `~` | 工单单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_name` | `~` | 产品品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_no` | `~` | 产品品号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_spec` | `~` | 产品规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_name` | `~` | 工作中心名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "wo_change_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`wo_change_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `wo_doc_type_no` | `~` | 工单单别 | string | 主键 |
| `wo_doc_no` | `~` | 工单单号 | string | 主键 |
| `change_version` | `~` | 变更版本 | string | 主键 |
| `configuration_no` | `~` | 配置方案 | string | 可写（create+update 均出现） |
| `configuration_seq` | `~` | 配置序号 | string | 可写（create+update 均出现） |
| `consider_replaced` | `~` | 取替代料 | string | 可写（create+update 均出现） |
| `include_scrap_standard_required_package_qty` | `~` | 含损耗标准需领用包装量 | number | 可写（create+update 均出现） |
| `include_scrap_standard_required_qty` | `~` | 含损耗标准需领用量 | number | 可写（create+update 均出现） |
| `least_required_qty` | `~` | 最少需领用量 | number | 可写（create+update 均出现） |
| `material_item_name` | `~` | 材料品名 | string | 可写（create+update 均出现） |
| `material_item_no` | `~` | 材料品号 | string | 可写（create+update 均出现） |
| `material_item_spec` | `~` | 材料规格 | string | 可写（create+update 均出现） |
| `material_type` | `~` | 材料类型 | string | 可写（create+update 均出现） |
| `original_material_item_no` | `~` | 原材料品号 | string | 可写（create+update 均出现） |
| `original_routing_no` | `~` | 原工艺 | string | 可写（create+update 均出现） |
| `package_unit` | `~` | 包装单位 | object | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `picked_package_qty` | `~` | 已领用包装量 | number | 可写（create+update 均出现） |
| `plan_picking_date` | `~` | 预计领料 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `required_package_qty` | `~` | 需领用包装量 | number | 可写（create+update 均出现） |
| `required_qty` | `~` | 需领用量 | number | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `sub_rep_item_no` | `~` | 被取替代品号 | string | 可写（create+update 均出现） |
| `sub_rep_qty` | `~` | 被取替代数量 | number | 可写（create+update 均出现） |
| `warehouse_no` | `~` | 仓库 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "wo_change_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
