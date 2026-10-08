# 查询BOM信息 (bom) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only bom`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.bom.data.query.get`
- **读取服务**：`yf.oapi.bom.data.read.get`
- **新增服务**：`yf.oapi.bom.create`
- **标题来源**：目录名 10 个，取最高频：查询BOM信息(1) / 读取BOM信息(1) / 新增BOM(1)

> ⚠️ 易飞**无字段编号体系**（字段编号为易助 DLL 专有）。易飞为「节点名（小写，API 收发参实际使用）↔ 字段名（大写，数据库物理列名）」双轨。
>
> 本表「字段名称」列的判定规则：`description` **恰好等于节点名的大写形式**时才认定。
> 易飞文档中大量大写 desc（如 `CONSIGNEE` / `FAX_NO` / `NOTIFY`）是**未翻译的占位描述**而非物理列名，已排除。
> 无权威字段名时以 `~` 占位——**这是事实，不是缺失**。

> ⚠️ `not_null` 在 Apipost 全库均为 1（含只读字段与管理字段），**不可作为必填判据**。
> 本表「备注」列的可写性判定依据的是**该字段在 `create` / `update` 入参中是否出现**这一事实：
> `create` 中出现 = 必填（官方约束：必须提供业务主键及不可空白字段）；仅 `update` 中出现 = 可选。

## 业务主键

- **构成**：`master_item_no`
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `master_item_no` | `~` | 主件品号 | string | 主键 |
| `approval_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_no` | `~` | 变更单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_sn` | `~` | 变更序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_type_no` | `~` | 变更单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `COMPANY` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `CREATE_DATE` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `CREATOR` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | 可写（create+update 均出现） |
| `doc_no` | `~` | 单号 | string | 可选（仅 update 中出现） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_no` | `~` | 单别 | string | 可写（create+update 均出现） |
| `FLAG` | `~` | ~ | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `is_constrain` | `~` | 约束存在 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_name` | `~` | 品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_spec` | `~` | 规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `MODI_DATE` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `MODIFIER` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `property` | `~` | 属性 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | 可写（create+update 均出现） |
| `small_unit` | `~` | 请购小单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_lot_size` | `~` | 标准批量 | number | 可写（create+update 均出现） |
| `sub_item_relation` | `~` | 子件关系 | string | 可写（create+update 均出现） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `USR_GROUP` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `version` | `~` | 版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_name` | `~` | 工单单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_no` | `~` | 工单单别 | string | 可写（create+update 均出现） |

## 单身字段：`bom_requirement_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `base_number` | `~` | 底数 | int | 可写（create+update 均出现） |
| `calculation_of_standard_cost` | `~` | 标准成本计算 | string | 可写（create+update 均出现） |
| `component_no` | `~` | 元件品号 | string | 可写（create+update 均出现） |
| `composition_qty` | `~` | 组成用量 | number | 可写（create+update 均出现） |
| `consider_parent_fix_lead_days` | `~` | 考虑上阶固定前置天数 | string | 可写（create+update 均出现） |
| `cross_schedule` | `~` | 交叉排程 | string | 可写（create+update 均出现） |
| `default_accessory` | `~` | 默认选择 | string | 可写（create+update 均出现） |
| `doc_no` | `~` | 单号 | string | 可选（仅 update 中出现） |
| `doc_type_no` | `~` | 单别 | string | 可写（create+update 均出现） |
| `effective_date` | `~` | 生效日 | string | 可写（create+update 均出现） |
| `expiration_date` | `~` | 失效日期 | string | 可写（create+update 均出现） |
| `feeding_time_distance` | `~` | 投料间距 | int | 可写（create+update 均出现） |
| `fix_loss_qty` | `~` | 固定损耗 | number | 可写（create+update 均出现） |
| `insert_position` | `~` | 插件位置 | string | 可写（create+update 均出现） |
| `is_loss_qty` | `~` | 分量损耗 | string | 可写（create+update 均出现） |
| `loss_rate` | `~` | 损耗率 | number | 可写（create+update 均出现） |
| `material_type` | `~` | 材料类型 | string | 可写（create+update 均出现） |
| `plug_position` | `~` | 插件位置 | string | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `substitution_method` | `~` | 新组合替代 | string | 可写（create+update 均出现） |
| `units_above` | `~` | 数量以上 | number | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "bom_requirement_detail_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`bom_requirement_header_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `master_item_no` | `~` | 主件品号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_date` | `~` | 审核日 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_no` | `~` | 变更单号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_sn` | `~` | 变更序号 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_type_no` | `~` | 变更单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_no` | `~` | 单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_no` | `~` | 单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `is_constrain` | `~` | 约束存在 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_name` | `~` | 品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_spec` | `~` | 规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `property` | `~` | 属性 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `small_unit` | `~` | 请购小单位 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_lot_size` | `~` | 标准批量 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sub_item_relation` | `~` | 子件关系 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `valid_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `version` | `~` | 版本 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_name` | `~` | 工单单别名称 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_no` | `~` | 工单单别 | object | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "bom_requirement_header_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`bom_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `master_item_no` | `~` | 主件品号 | string | 主键 |
| `approval_status` | `~` | 核准状况 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_no` | `~` | 变更单号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_sn` | `~` | 变更序号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_type_name` | `~` | 变更单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `change_type_no` | `~` | 变更单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `is_constrain` | `~` | 约束存在 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_name` | `~` | 品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_spec` | `~` | 规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `property` | `~` | 性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `small_unit` | `~` | 小单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `standard_lot_size` | `~` | 标准批量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `sub_item_relation` | `~` | 子件关系 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `version` | `~` | 版次 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_name` | `~` | 工单单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `wo_doc_type_no` | `~` | 工单单别 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "bom_data"`**，否则易飞无法识别为单身过滤条件。

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
