# 工单 (wo) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only wo`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.wo.data.query.get`
- **读取服务**：`yf.oapi.wo.data.read.get`
- **新增服务**：`yf.oapi.wo.data.create`
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
| `actual_complete_date` | `~` | 实际完工 | object | 可写（create+update 均出现） |
| `actual_start_date` | `~` | 实际开工 | object | 可写（create+update 均出现） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `arrived_package_qty` | `~` | 到货包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `arrived_qty` | `~` | 到货数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `assembled_qty` | `~` | 已装配数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bom_date` | `~` | BOM日期 | string | 可写（create+update 均出现） |
| `bom_version` | `~` | BOM版本 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `complete_date_days` | `~` | 完工日占用天数 | number | 可写（create+update 均出现） |
| `configuration_no` | `~` | 配置方案 | object | 可写（create+update 均出现） |
| `configuration_seq` | `~` | 配置序号 | object | 可写（create+update 均出现） |
| `currency` | `~` | 币种 | object | 可写（create+update 均出现） |
| `customer_doc_no` | `~` | 客户单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `demand_date` | `~` | 需求日期 | object | 可写（create+update 均出现） |
| `department` | `~` | 部门编号 | object | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `emergency` | `~` | 急料 | string | 可写（create+update 均出现） |
| `exchange_rate` | `~` | 汇率 | number | 可写（create+update 均出现） |
| `issued_sets` | `~` | 已领套数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_name` | `~` | 入库仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_no` | `~` | 入库仓库 | string | 可写（create+update 均出现） |
| `lot_description` | `~` | 批号说明 | string | 可写（create+update 均出现） |
| `order_doc_no` | `~` | 订单单号 | object | 可写（create+update 均出现） |
| `order_doc_type` | `~` | 订单单别 | object | 可写（create+update 均出现） |
| `order_issue_date` | `~` | 开单日期 | string | 可写（create+update 均出现） |
| `order_seq` | `~` | 订单序号 | object | 可写（create+update 均出现） |
| `outsourcing_price` | `~` | 委外单价 | number | 可写（create+update 均出现） |
| `outsourcing_supplier_name` | `~` | 委外供应商名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `outsourcing_supplier_no` | `~` | 委外供应商 | object | 可写（create+update 均出现） |
| `package_unit` | `~` | 包装单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_name` | `~` | 付款条件 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `payment_condition_no` | `~` | 付款条件编号 | object | 可写（create+update 均出现） |
| `plan_complete_date` | `~` | 预计完工 | string | 可写（create+update 均出现） |
| `plan_lot_no` | `~` | 计划批号 | object | 可写（create+update 均出现） |
| `plan_package_qty` | `~` | 预计产包装量 | number | 可写（create+update 均出现） |
| `plan_qty` | `~` | 预计产量 | number | 可写（create+update 均出现） |
| `plan_seq` | `~` | 计划序号 | object | 可写（create+update 均出现） |
| `plan_start_date` | `~` | 预计开工 | string | 可写（create+update 均出现） |
| `plan_version` | `~` | 计划版本 | object | 可写（create+update 均出现） |
| `plant_name` | `~` | 厂别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | 可写（create+update 均出现） |
| `plot_no` | `~` | 生产批号 | string | 可写（create+update 均出现） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_code` | `~` | 工艺路线编号 | string | 可写（create+update 均出现） |
| `process_print_times` | `~` | 途程卡打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_qty` | `~` | 加工数量 | number | 可写（create+update 均出现） |
| `processing_unit` | `~` | 加工单位 | object | 可写（create+update 均出现） |
| `produced_package_qty` | `~` | 已生产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `produced_qty` | `~` | 已生产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `production_permission` | `~` | 准产证 | string | 可写（create+update 均出现） |
| `project_name` | `~` | 项目编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | object | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `property` | `~` | 属性 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | object | 可写（create+update 均出现） |
| `remarks_1` | `~` | 备注一 | object | 可写（create+update 均出现） |
| `remarks_2` | `~` | 备注二 | object | 可写（create+update 均出现） |
| `remarks_3` | `~` | 备注三 | object | 可写（create+update 均出现） |
| `remarks_4` | `~` | 其他备注四 | object | 可写（create+update 均出现） |
| `root_source_doc_no` | `~` | 根来源单号 | object | 可写（create+update 均出现） |
| `root_source_doc_type` | `~` | 根来源单别 | object | 可写（create+update 均出现） |
| `root_source_seq` | `~` | 根来源序号 | object | 可写（create+update 均出现） |
| `routing_exist` | `~` | 启用工艺 | string | 可写（create+update 均出现） |
| `routing_item_no` | `~` | 工艺路线品号 | string | 可写（create+update 均出现） |
| `routing_name` | `~` | 工艺路线名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_no` | `~` | 源工单编号 | string | 可写（create+update 均出现） |
| `source_wo_doc_type_no` | `~` | 源工单单别 | string | 可写（create+update 均出现） |
| `start_date_days` | `~` | 开工日占用天数 | number | 可写（create+update 均出现） |
| `status` | `~` | 状态码 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `tax_type` | `~` | 税种 | string | 可写（create+update 均出现） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tree_code` | `~` | 树状码 | object | 可写（create+update 均出现） |
| `type` | `~` | 类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_name` | `~` | 产品品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_no` | `~` | 产品品号 | string | 可写（create+update 均出现） |
| `wo_item_spec` | `~` | 产品规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_name` | `~` | 工作中心名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | object | 可写（create+update 均出现） |

## 单身字段：`wo_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `actual_complete_date` | `~` | 实际完工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `actual_start_date` | `~` | 实际开工 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `arrived_package_qty` | `~` | 到货包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `arrived_qty` | `~` | 到货数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `assembled_qty` | `~` | 已装配数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bom_date` | `~` | BOM日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `bom_version` | `~` | BOM版本 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `complete_date_days` | `~` | 完工日占用天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `configuration_no` | `~` | 配置方案 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `configuration_seq` | `~` | 配置序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `customer_doc_no` | `~` | 客户单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `demand_date` | `~` | 需求日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_package_qty` | `~` | 破坏包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `destroyed_qty` | `~` | 破坏数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `emergency` | `~` | 急料 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `issued_sets` | `~` | 已领套数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_name` | `~` | 入库仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_production_stock_in_warehouse_no` | `~` | 入库仓库 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lot_description` | `~` | 批号说明 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_doc_no` | `~` | 订单单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_doc_type` | `~` | 订单单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_issue_date` | `~` | 开单日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `order_seq` | `~` | 订单序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
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
| `process_code` | `~` | 工艺路线编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_print_times` | `~` | 途程卡打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `process_qty` | `~` | 加工数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `processing_unit` | `~` | 加工单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `produced_package_qty` | `~` | 已生产包装量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `produced_qty` | `~` | 已生产量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `production_permission` | `~` | 准产证 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `property` | `~` | 性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_1` | `~` | 备注一 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_2` | `~` | 备注二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_3` | `~` | 备注三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks_4` | `~` | 备注四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `root_source_doc_no` | `~` | 根来源单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `root_source_doc_type` | `~` | 根来源单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `root_source_seq` | `~` | 根来源序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `routing_exist` | `~` | 启用工艺 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `routing_item_no` | `~` | 工艺路线品号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `routing_name` | `~` | 工艺路线名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_package_qty` | `~` | 报废包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `scrap_qty` | `~` | 报废数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_no` | `~` | 源工单编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `source_wo_doc_type_no` | `~` | 源工单单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `start_date_days` | `~` | 开工日占用天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `status` | `~` | 状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_type` | `~` | 税种 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tree_code` | `~` | 树状码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `type` | `~` | 类型 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_name` | `~` | 产品品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_no` | `~` | 产品品号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_item_spec` | `~` | 产品规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_sub_data` | `~` | ~ | object | ~ |
| `workstation_name` | `~` | 工作中心名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "wo_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`wo_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `include_scrap_standard_required_package_qty` | `~` | 含损耗标准需领用包装量 | number | 可写（create+update 均出现） |
| `include_scrap_standard_required_qty` | `~` | 含损耗标准需领用量 | number | 可写（create+update 均出现） |
| `least_required_qty` | `~` | 最少需领用量 | number | 可写（create+update 均出现） |
| `material_item_no` | `~` | 材料品号 | string | 可写（create+update 均出现） |
| `material_type` | `~` | 材料类型 | string | 可写（create+update 均出现） |
| `new_plug_position_1` | `~` | 新插件位置1 | string | 可写（create+update 均出现） |
| `new_plug_position_2` | `~` | 新插件位置2 | string | 可写（create+update 均出现） |
| `new_plug_position_3` | `~` | 新插件位置3 | string | 可写（create+update 均出现） |
| `new_plug_position_4` | `~` | 新插件位置4 | string | 可写（create+update 均出现） |
| `new_plug_position_5` | `~` | 新插件位置5 | string | 可写（create+update 均出现） |
| `old_plan_picking_date` | `~` | 原预计领料 | string | 可写（create+update 均出现） |
| `plan_picking_date` | `~` | 预计领料 | string | 可写（create+update 均出现） |
| `plug_position` | `~` | 插件位置 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `required_package_qty` | `~` | 需领用包装量 | number | 可写（create+update 均出现） |
| `required_qty` | `~` | 需领用量 | number | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `sub_rep_item_no` | `~` | 被取替代品号 | string | 可写（create+update 均出现） |
| `sub_rep_qty` | `~` | 被取替代数量 | number | 可写（create+update 均出现） |
| `tree_code` | `~` | 树状码 | string | 可写（create+update 均出现） |
| `up_level_item_no` | `~` | 上阶主件品号 | string | 可写（create+update 均出现） |
| `warehouse_no` | `~` | 仓库 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "wo_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
