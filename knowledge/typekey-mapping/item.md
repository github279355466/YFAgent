# 品号 (item) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only item`

- **服务前缀**：`yf.oapi.`
- **操作集**：`create` / `delete` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.item.data.query.get`
- **读取服务**：`yf.oapi.item.data.read.get`
- **新增服务**：`yf.oapi.item.data.create`
- **标题来源**：目录名 6 个，取最高频：品号(5) / 品号信息(1)

> ⚠️ 易飞**无字段编号体系**（字段编号为易助 DLL 专有）。易飞为「节点名（小写，API 收发参实际使用）↔ 字段名（大写，数据库物理列名）」双轨。
>
> 本表「字段名称」列的判定规则：`description` **恰好等于节点名的大写形式**时才认定。
> 易飞文档中大量大写 desc（如 `CONSIGNEE` / `FAX_NO` / `NOTIFY`）是**未翻译的占位描述**而非物理列名，已排除。
> 无权威字段名时以 `~` 占位——**这是事实，不是缺失**。

> ⚠️ `not_null` 在 Apipost 全库均为 1（含只读字段与管理字段），**不可作为必填判据**。
> 本表「备注」列的可写性判定依据的是**该字段在 `create` / `update` 入参中是否出现**这一事实：
> `create` 中出现 = 必填（官方约束：必须提供业务主键及不可空白字段）；仅 `update` 中出现 = 可选。

## 业务主键

- **构成**：`item_no`
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `item_no` | `~` | 品号 | string | 主键 |
| `abc_level` | `~` | ABC等级 | string | 可写（create+update 均出现） |
| `add_multiple_qty` | `~` | 补货倍量 | number | 可写（create+update 均出现） |
| `allowed_delivery_overrun` | `~` | 允许超出发货清单发货 | string | 可写（create+update 均出现） |
| `article_no` | `~` | 货号 | string | 可写（create+update 均出现） |
| `barcode_manage` | `~` | 条码管理 | string | 可写（create+update 均出现） |
| `barcode_no` | `~` | 条码编号 | object | 可写（create+update 均出现） |
| `batch_qty` | `~` | 批量 | number | 可写（create+update 均出现） |
| `batch_sync_production` | `~` | 整批同步生产 | string | 可写（create+update 均出现） |
| `billing_name` | `~` | 开票品名 | object | 可写（create+update 均出现） |
| `billing_spec` | `~` | 开票规格 | object | 可写（create+update 均出现） |
| `bonded_goods` | `~` | 保税品 | string | 可写（create+update 均出现） |
| `character1` | `~` | 特征1 | string | 可写（create+update 均出现） |
| `character10` | `~` | 特征10 | string | 可写（create+update 均出现） |
| `character11` | `~` | 特征11 | string | 可写（create+update 均出现） |
| `character12` | `~` | 特征12 | string | 可写（create+update 均出现） |
| `character13` | `~` | 特征13 | string | 可写（create+update 均出现） |
| `character14` | `~` | 特征14 | string | 可写（create+update 均出现） |
| `character15` | `~` | 特征15 | string | 可写（create+update 均出现） |
| `character16` | `~` | 特征16 | string | 可写（create+update 均出现） |
| `character17` | `~` | 特征17 | string | 可写（create+update 均出现） |
| `character18` | `~` | 特征18 | string | 可写（create+update 均出现） |
| `character19` | `~` | 特征19 | string | 可写（create+update 均出现） |
| `character2` | `~` | 特征2 | string | 可写（create+update 均出现） |
| `character20` | `~` | 特征20 | string | 可写（create+update 均出现） |
| `character3` | `~` | 特征3 | string | 可写（create+update 均出现） |
| `character4` | `~` | 特征4 | string | 可写（create+update 均出现） |
| `character5` | `~` | 特征5 | string | 可写（create+update 均出现） |
| `character6` | `~` | 特征6 | string | 可写（create+update 均出现） |
| `character7` | `~` | 特征7 | string | 可写（create+update 均出现） |
| `character8` | `~` | 特征8 | string | 可写（create+update 均出现） |
| `character9` | `~` | 特征9 | string | 可写（create+update 均出现） |
| `chinese_herbal_medicine` | `~` | 中药饮片 | string | 可写（create+update 均出现） |
| `chinese_traditional_medicine` | `~` | 中药材 | string | 可写（create+update 均出现） |
| `configuration_mode` | `~` | 选配模式 | string | 可写（create+update 均出现） |
| `costing_mode` | `~` | 成本计价方式 | string | 可写（create+update 均出现） |
| `current_level_cost_labor` | `~` | 本阶人工 | number | 可写（create+update 均出现） |
| `current_level_cost_process` | `~` | 本阶加工 | number | 可写（create+update 均出现） |
| `current_level_manufacturing_overhead` | `~` | 本阶制费 | number | 可写（create+update 均出现） |
| `cycle_counting_code` | `~` | 循环盘点码 | object | 可写（create+update 均出现） |
| `document_no` | `~` | 文档编号 | object | 可写（create+update 均出现） |
| `drinking_or_external` | `~` | 内服外用 | string | 可写（create+update 均出现） |
| `effective_date` | `~` | 生效日 | object | 可写（create+update 均出现） |
| `effective_date_calculate_mode` | `~` | 有效日期推算方式 | string | 可写（create+update 均出现） |
| `effective_date-calculate_mode` | `~` | 有效日期推算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `effective_days` | `~` | 有效天数 | number | 可写（create+update 均出现） |
| `expense_department_no` | `~` | 费用部门编号 | string | 可写（create+update 均出现） |
| `expiration_date` | `~` | 失效日期 | object | 可写（create+update 均出现） |
| `fix_lead_days` | `~` | 固定前置天数 | number | 可写（create+update 均出现） |
| `fix_weight` | `~` | 存货双单位推算方式 | string | 可写（create+update 均出现） |
| `gmp_Certification` | `~` | GMP认证 | string | 可写（create+update 均出现） |
| `height_cm` | `~` | 高(CM) | number | 可写（create+update 均出现） |
| `imporant_item` | `~` | 重点品种 | string | 可写（create+update 均出现） |
| `imported_medicine` | `~` | 进口药 | string | 可写（create+update 均出现） |
| `inspection_days` | `~` | 检验天数 | number | 可写（create+update 均出现） |
| `install_that_acceptance` | `~` | 安装即验收 | string | 可写（create+update 均出现） |
| `interval_no` | `~` | 费用部门编号 | object | 可写（create+update 均出现） |
| `inventory_amount` | `~` | 库存金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_check_by` | `~` | 库存量检查对象 | string | 可写（create+update 均出现） |
| `inventory_control` | `~` | 库存管理 | string | 可写（create+update 均出现） |
| `inventory_package_qty` | `~` | 库存包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_qty` | `~` | 库存数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_unit` | `~` | 库存单位 | string | 可写（create+update 均出现） |
| `item_admit_code` | `~` | 认样检查 | string | 可写（create+update 均出现） |
| `item_attribute` | `~` | 品号属性 | string | 可写（create+update 均出现） |
| `item_character_no` | `~` | 品号属性编号 | object | 可写（create+update 均出现） |
| `item_classification_1` | `~` | 品号分类一 | string | 可写（create+update 均出现） |
| `item_classification_2` | `~` | 品号分类二 | object | 可写（create+update 均出现） |
| `item_classification_3` | `~` | 品号分类三 | object | 可写（create+update 均出现） |
| `item_classification_4` | `~` | 品号分类四 | object | 可写（create+update 均出现） |
| `item_classification1` | `~` | ~ | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `item_conversion_unit_data` | `~` | ~ | array | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `item_desc` | `~` | 商品描述 | object | 可写（create+update 均出现） |
| `item_graph_no` | `~` | 产品图号 | object | 可写（create+update 均出现） |
| `item_name` | `~` | 品名 | string | 可写（create+update 均出现） |
| `item_picture` | `~` | 品号图片 | string | 可写（create+update 均出现） |
| `item_spec` | `~` | 规格 | string | 可写（create+update 均出现） |
| `item_warehouse_data` | `~` | ~ | array | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `lack_picking_rate` | `~` | 缺领率 | number | 可写（create+update 均出现） |
| `latest_purchase_price_is_price_tax_included_trans_local` | `~` | 最近进价-单价含税(原/本币) | string | 可写（create+update 均出现） |
| `latest_purchase_price_local_curr_price` | `~` | 最近进价-本币单价 | number | 可写（create+update 均出现） |
| `latest_purchase_price_trans_curr_price` | `~` | 最近进价-原币单价 | number | 可写（create+update 均出现） |
| `latest_purchase_price_trans_currency` | `~` | 最近进价币别-原币别 | object | 可写（create+update 均出现） |
| `length_cm` | `~` | 长(CM) | number | 可写（create+update 均出现） |
| `liquid_acus_medicament` | `~` | 水针剂 | string | 可写（create+update 均出现） |
| `lot_control` | `~` | 批号管理 | string | 可写（create+update 均出现） |
| `low_level_code` | `~` | 低阶码 | string | 可写（create+update 均出现） |
| `lowest_add_qty` | `~` | 最低补量 | number | 可写（create+update 均出现） |
| `main_supplier` | `~` | 主供应商 | string | 可写（create+update 均出现） |
| `main_warehouse_no` | `~` | 主要库别 | string | 可写（create+update 均出现） |
| `maintenance medicine` | `~` | 养护药品 | string | 可写（create+update 均出现） |
| `maintenance_circle_no` | `~` | 养护周期 | string | 可写（create+update 均出现） |
| `medicine_first_business` | `~` | 首营品种 | string | 可写（create+update 均出现） |
| `min_qty` | `~` | 最小用量 | number | 可写（create+update 均出现） |
| `modify_item_name_spec` | `~` | 修改品名/规格 | string | 可写（create+update 均出现） |
| `mps_item` | `~` | MPS件 | string | 可写（create+update 均出现） |
| `mrp_production_allow_delivery_advance_days` | `~` | MRP生产允许交期提前天数 | number | 可写（create+update 均出现） |
| `mrp_purchase_allow_delivery_advance_days` | `~` | MRP采购允许交期提前天数 | number | 可写（create+update 均出现） |
| `need_check` | `~` | 需核销 | string | 可写（create+update 均出现） |
| `need_install` | `~` | 需安装 | string | 可写（create+update 均出现） |
| `OTC` | `OTC` | OTC | string | 可写（create+update 均出现） |
| `outer_package_cuft_size` | `~` | 外包装材积 | number | 可写（create+update 均出现） |
| `outer_package_gross_weight` | `~` | 外包装毛重 | number | 可写（create+update 均出现） |
| `outer_package_include_goods_qty` | `~` | 外包装含商品数 | number | 可写（create+update 均出现） |
| `outer_package_net_weight` | `~` | 外包装净重 | number | 可写（create+update 均出现） |
| `outer_package_unit` | `~` | 外包装单位 | string | 可写（create+update 均出现） |
| `over_deliver_rate` | `~` | 超交率 | number | 可写（create+update 均出现） |
| `over_delivery_manage` | `~` | 超交管理 | string | 可写（create+update 均出现） |
| `over_picking_rate` | `~` | 超领率 | number | 可写（create+update 均出现） |
| `over_receipt_manage` | `~` | 超收管理 | string | 可写（create+update 均出现） |
| `over_receipt_rate` | `~` | 超收率% | number | 可写（create+update 均出现） |
| `over_stock_in_rate` | `~` | 超入率 | number | 可写（create+update 均出现） |
| `package_unit` | `~` | 包装单位 | object | 可写（create+update 均出现） |
| `paid_warranty_months` | `~` | 有偿保修月数 | int | 可写（create+update 均出现） |
| `picking_code` | `~` | 领料码 | string | 可写（create+update 均出现） |
| `picking_multiple_qty` | `~` | 领用倍量 | number | 可写（create+update 均出现） |
| `planner` | `~` | 计划人员 | object | 可写（create+update 均出现） |
| `price_lower_limit_rate` | `~` | 单价下限率 | number | 可写（create+update 均出现） |
| `price_upper_limit_rate` | `~` | 单价上限率 | number | 可写（create+update 均出现） |
| `pricing_unit` | `~` | 计价单位 | string | 可写（create+update 均出现） |
| `product_barcode_format` | `~` | 产品条码格式 | object | 可写（create+update 均出现） |
| `product_serial_no_manage` | `~` | 产品序号管理 | string | 可写（create+update 均出现） |
| `purchase_plan_getting_minimum_price` | `~` | 采购计划取最低核价 | string | 可写（create+update 均出现） |
| `purchase_price_control` | `~` | 进价管制 | string | 可写（create+update 均出现） |
| `purchase_unit` | `~` | 采购单位 | string | 可写（create+update 均出现） |
| `purchaser` | `~` | 采购人员 | string | 可写（create+update 均出现） |
| `quality_control_category_no` | `~` | 品管类别 | object | 可写（create+update 均出现） |
| `quality_inspection_mode` | `~` | 检验方式 | string | 可写（create+update 均出现） |
| `quantity_barcode_format` | `~` | 数量条码格式 | string | 可写（create+update 均出现） |
| `reinspection_days` | `~` | 复检天数 | number | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | object | 可写（create+update 均出现） |
| `repair_main_item` | `~` | 维修主件 | string | 可写（create+update 均出现） |
| `repair_parts_item` | `~` | 维修配件 | string | 可写（create+update 均出现） |
| `replenish_period` | `~` | 补货周期 | string | 可写（create+update 均出现） |
| `replenishment_policy` | `~` | 补货政策 | string | 可写（create+update 均出现） |
| `required_acceptance` | `~` | 需验收 | string | 可写（create+update 均出现） |
| `reserved_sample_medicine` | `~` | 留样药品 | string | 可写（create+update 均出现） |
| `retail_price` | `~` | 零售价 | number | 可写（create+update 均出现） |
| `retail_price_tax_included` | `~` | 零售价含税 | string | 可写（create+update 均出现） |
| `s_n_coding_rule` | `~` | 序号编码原则 | object | 可写（create+update 均出现） |
| `sales_list_price_1` | `~` | 售价定价一 | number | 可写（create+update 均出现） |
| `sales_list_price_2` | `~` | 售价定价二 | number | 可写（create+update 均出现） |
| `sales_list_price_3` | `~` | 售价定价三 | number | 可写（create+update 均出现） |
| `sales_list_price_4` | `~` | 售价定价四 | number | 可写（create+update 均出现） |
| `sales_list_price_5` | `~` | 售价定价五 | number | 可写（create+update 均出现） |
| `sales_list_price_6` | `~` | 售价定价六 | number | 可写（create+update 均出现） |
| `sales_list_price1_tax_included` | `~` | 售价定价一含税 | string | 可写（create+update 均出现） |
| `sales_list_price2_tax_included` | `~` | 售价定价二含税 | string | 可写（create+update 均出现） |
| `sales_list_price3_tax_included` | `~` | 售价定价三含税 | string | 可写（create+update 均出现） |
| `sales_list_price4_tax_included` | `~` | 售价定价四含税 | string | 可写（create+update 均出现） |
| `sales_list_price5_tax_included` | `~` | 售价定价五含税 | string | 可写（create+update 均出现） |
| `sales_list_price6_tax_included` | `~` | 售价定价六含税 | string | 可写（create+update 均出现） |
| `sales_price_control` | `~` | 售价管制 | string | 可写（create+update 均出现） |
| `schedule_batch_qty` | `~` | 排程批量 | number | 可写（create+update 均出现） |
| `selling_limit_control` | `~` | 限销管理 | string | 可写（create+update 均出现） |
| `serial_no_manage` | `~` | 序号管理 | string | 可写（create+update 均出现） |
| `service_center` | `~` | 服务中心编号 | string | 可写（create+update 均出现） |
| `shelf_life_control` | `~` | 保质期管理 | string | 可写（create+update 均出现） |
| `shortcut` | `~` | 快捷码 | string | 可写（create+update 均出现） |
| `size` | `SIZE` | SIZE | object | 可写（create+update 均出现） |
| `small_unit` | `~` | 请购小单位 | string | 可写（create+update 均出现） |
| `special_medicine` | `~` | 特殊药品 | string | 可写（create+update 均出现） |
| `standard_machine_hours` | `~` | 标准机时 | number | 可写（create+update 均出现） |
| `standard_outsourcing_price` | `~` | 标准委外单价 | number | 可写（create+update 均出现） |
| `standard_outsourcing_price_tax_included` | `~` | 标准委外单价含税 | string | 可写（create+update 均出现） |
| `standard_process_route` | `~` | 标准工艺路线编号 | object | 可写（create+update 均出现） |
| `standard_product_process_route` | `~` | 标准工艺路线品号 | object | 可写（create+update 均出现） |
| `standard_purchase_price` | `~` | 标准进价 | number | 可写（create+update 均出现） |
| `standard_purchase_price_tax_included` | `~` | 标准进价含税 | string | 可写（create+update 均出现） |
| `standard_sales_price` | `~` | 标准售价 | number | 可写（create+update 均出现） |
| `standard_sales_price_tax_included` | `~` | 标准售价含税 | string | 可写（create+update 均出现） |
| `standard_work_hours` | `~` | 标准工时 | number | 可写（create+update 均出现） |
| `tariff_rate` | `~` | 关税率 | number | 可写（create+update 均出现） |
| `tax_policy_no` | `~` | 税收政策 | object | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `transfer_code` | `~` | 传送码 | string | 可写（create+update 均出现） |
| `transfer_date` | `~` | 传送日期 | string | 可写（create+update 均出现） |
| `udf_cost_distribute_factor2` | `~` | 自定义成本分配因子2 | number | 可写（create+update 均出现） |
| `udf_cost_distribute_factor3` | `~` | 自定义成本分配因子3 | number | 可写（create+update 均出现） |
| `udf_cost_distribute_factor4` | `~` | 自定义成本分配因子4 | number | 可写（create+update 均出现） |
| `udf_cost_distribute_factor5` | `~` | 自定义成本分配因子5 | number | 可写（create+update 均出现） |
| `unit_labor_standard_cost` | `~` | 单位标准人工成本 | number | 可写（create+update 均出现） |
| `unit_net_weight` | `~` | 单位净重 | number | 可写（create+update 均出现） |
| `unit_standard_manufacturing_overhead` | `~` | 单位标准制造费用 | number | 可写（create+update 均出现） |
| `unit_std_material_cost` | `~` | 单位标准材料成本 | number | 可写（create+update 均出现） |
| `unit_std_process_expense` | `~` | 单位标准加工费用 | number | 可写（create+update 均出现） |
| `universal_desc` | `~` | 通用名 | string | 可写（create+update 均出现） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `var_lead_days` | `~` | 变动前置天数 | number | 可写（create+update 均出现） |
| `warehouse_name` | `~` | 仓库名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `warranty_months` | `~` | 无偿保修月数 | int | 可写（create+update 均出现） |
| `weight_unit` | `~` | 重量单位 | string | 可写（create+update 均出现） |
| `width_cm` | `~` | 宽(CM) | number | 可写（create+update 均出现） |
| `work_hours_base_number` | `~` | 工时底数 | number | 可写（create+update 均出现） |
| `workstation_no` | `~` | 工作中心 | object | 可写（create+update 均出现） |

## 单身字段：`item_basic_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `item_no` | `~` | 品号 | string | 主键 |
| `abc_level` | `~` | ABC等级 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `add_multiple_qty` | `~` | 补货倍量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `allowed_delivery_overrun` | `~` | 允许超出发货清单发货 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `article_no` | `~` | 货号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `barcode_manage` | `~` | 条码管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `barcode_no` | `~` | 条码编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `batch_qty` | `~` | 批量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `batch_sync_production` | `~` | 整批同步生产 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `billing_name` | `~` | 开票品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `billing_spec` | `~` | 开票规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `configuration_mode` | `~` | 选配模式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `costing_mode` | `~` | 成本计价方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `current_level_cost_labor` | `~` | 本阶人工 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `current_level_cost_process` | `~` | 本阶加工 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `current_level_manufacturing_overhead` | `~` | 本阶制费 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `cycle_counting_code` | `~` | 循环盘点码 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `document_no` | `~` | 文档编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `effective_date` | `~` | 生效日 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `effective_date-calculate_mode` | `~` | 有效日期推算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `effective_days` | `~` | 有效天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `expiration_date` | `~` | 失效日期 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fix_lead_days` | `~` | 固定前置天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `fix_weight` | `~` | 存货双单位推算方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inspection_days` | `~` | 检验天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `interval_no` | `~` | 费用部门编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_amount` | `~` | 库存金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_check_by` | `~` | 库存量检查对象 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_control` | `~` | 库存管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_package_qty` | `~` | 库存包装数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_qty` | `~` | 库存数量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `inventory_unit` | `~` | 库存单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_attribute` | `~` | 品号属性 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_character_no` | `~` | 品号属性编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_classification_1` | `~` | 品号分类一 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_classification_2` | `~` | 品号分类二 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_classification_3` | `~` | 品号分类三 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_classification_4` | `~` | 品号分类四 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_desc` | `~` | 商品描述 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_graph_no` | `~` | 产品图号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_name` | `~` | 品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_spec` | `~` | 规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lack_picking_rate` | `~` | 缺领率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `latest_purchase_price_is_price_tax_included_trans_local` | `~` | 最近进价-单价含税(原/本币) | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `latest_purchase_price_local_curr_price` | `~` | 最近进价-本币单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `latest_purchase_price_trans_curr_price` | `~` | 最近进价-原币单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `latest_purchase_price_trans_currency` | `~` | 最近进价币别-原币别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lot_control` | `~` | 批号管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `low_level_code` | `~` | 低阶码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `lowest_add_qty` | `~` | 最低补量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `main_supplier` | `~` | 主供应商 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `min_qty` | `~` | 最小用量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `modify_item_name_spec` | `~` | 修改品名/规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mps_item` | `~` | MPS件 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mrp_production_allow_delivery_advance_days` | `~` | MRP生产允许交期提前天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `mrp_purchase_allow_delivery_advance_days` | `~` | MRP采购允许交期提前天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_deliver_rate` | `~` | 超交率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_delivery_manage` | `~` | 超交管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_receipt_manage` | `~` | 超收管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_receipt_rate` | `~` | 超收率% | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `over_stock_in_rate` | `~` | 超入率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `package_unit` | `~` | 包装单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `picking_code` | `~` | 领料码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `picking_multiple_qty` | `~` | 领用倍量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `planner` | `~` | 计划人员 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_lower_limit_rate` | `~` | 单价下限率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `price_upper_limit_rate` | `~` | 单价上限率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `pricing_unit` | `~` | 计价单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `product_barcode_format` | `~` | 产品条码格式 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `product_serial_no_manage` | `~` | 产品序号管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchase_plan_getting_minimum_price` | `~` | 采购计划取最低核价 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchase_price_control` | `~` | 进价管制 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchase_unit` | `~` | 采购单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `purchaser` | `~` | 采购人员 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `quality_control_category_no` | `~` | 品管类别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `quality_inspection_mode` | `~` | 检验方式 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `reinspection_days` | `~` | 复检天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `replenish_period` | `~` | 补货周期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `replenishment_policy` | `~` | 补货政策 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `retail_price` | `~` | 零售价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `retail_price_tax_included` | `~` | 零售价含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `s_n_coding_rule` | `~` | 序号编码原则 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price_1` | `~` | 售价定价一 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price_2` | `~` | 售价定价二 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price_3` | `~` | 售价定价三 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price_4` | `~` | 售价定价四 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price_5` | `~` | 售价定价五 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price_6` | `~` | 售价定价六 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price1_tax_included` | `~` | 售价定价一含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price2_tax_included` | `~` | 售价定价二含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price3_tax_included` | `~` | 售价定价三含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price4_tax_included` | `~` | 售价定价四含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price5_tax_included` | `~` | 售价定价五含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_list_price6_tax_included` | `~` | 售价定价六含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sales_price_control` | `~` | 售价管制 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `schedule_batch_qty` | `~` | 排程批量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `serial_no_manage` | `~` | 序号管理 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `shortcut` | `~` | 快捷码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `size` | `SIZE` | SIZE | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_machine_hours` | `~` | 标准机时 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_outsourcing_price` | `~` | 标准委外单价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_outsourcing_price_tax_included` | `~` | 标准委外单价含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_process_route` | `~` | 标准工艺路线编号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_product_process_route` | `~` | 标准工艺路线品号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_purchase_price` | `~` | 标准进价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_purchase_price_tax_included` | `~` | 标准进价含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_sales_price` | `~` | 标准售价 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_sales_price_tax_included` | `~` | 标准售价含税 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_work_hours` | `~` | 标准工时 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tariff_rate` | `~` | 关税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_policy_no` | `~` | 税收政策 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tax_rate` | `~` | 税率 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit_labor_standard_cost` | `~` | 单位标准人工成本 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit_standard_manufacturing_overhead` | `~` | 单位标准制造费用 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit_std_material_cost` | `~` | 单位标准材料成本 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit_std_process_expense` | `~` | 单位标准加工费用 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `var_lead_days` | `~` | 变动前置天数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `work_hours_base_number` | `~` | 工时底数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `workstation_no` | `~` | 工作中心 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "item_basic_data"`**，否则易飞无法识别为单身过滤条件。

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
