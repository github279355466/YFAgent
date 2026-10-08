# 产品工艺路线 (product.process) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only product.process`

- **服务前缀**：`yf.oapi.`
- **操作集**：`create` / `delete` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.product.process.data.query.get`
- **读取服务**：`yf.oapi.product.process.data.read.get`
- **新增服务**：`yf.oapi.product.process.data.create`
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

- **构成**：`routing_item_no` + `process_code`（**复合主键**）
- **来源**：`read.get` 请求的 `datakeys` 机械抽取
- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」

## 单头字段

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `routing_item_no` | `~` | 工艺路线品号 | string | 主键 |
| `process_code` | `~` | 工艺路线编号 | string | 主键 |
| `item_name` | `~` | 品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_spec` | `~` | 规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `routing_name` | `~` | 工艺路线名称 | string | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`product_process_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `routing_item_no` | `~` | 工艺路线品号 | string | 主键 |
| `process_code` | `~` | 工艺路线编号 | string | 主键 |
| `complete_base` | `~` | 完工判断依据 | string | 可写（create+update 均出现） |
| `currency` | `~` | 币种 | string | 可写（create+update 均出现） |
| `fixed_days` | `~` | 固定天数 | number | 可写（create+update 均出现） |
| `fixed_labor_hours_sec` | `~` | 固定人时(秒) | int | 可写（create+update 均出现） |
| `fixed_machine_hours_sec` | `~` | 固定机时(秒) | int | 可写（create+update 均出现） |
| `inspection_days` | `~` | 检验天数 | int | 可写（create+update 均出现） |
| `lag_days` | `~` | 落后天数 | number | 可写（create+update 均出现） |
| `line_vendor_code` | `~` | 工作中心/供应商编号 | string | 可写（create+update 均出现） |
| `piece_price` | `~` | 计件单价 | number | 可写（create+update 均出现） |
| `process_step` | `~` | 工步 | string | 可写（create+update 均出现） |
| `processing_sequence` | `~` | 加工顺序 | string | 可写（create+update 均出现） |
| `processing_unit` | `~` | 加工单价 | string | 可写（create+update 均出现） |
| `production_line_vendor_name` | `~` | 工作中心/供应商名称 | string | 可写（create+update 均出现） |
| `property` | `~` | 性质 | string | 可写（create+update 均出现） |
| `quality_inspection_mode` | `~` | 检验方式 | string | 可选（仅 update 中出现） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `routing_desc` | `~` | 工艺说明 | string | 可写（create+update 均出现） |
| `routing_no` | `~` | 工艺 | string | 可写（create+update 均出现） |
| `seq` | `~` | 变更单序号 | string | 可写（create+update 均出现） |
| `tax_included` | `~` | 含税 | string | 可写（create+update 均出现） |
| `transfer_batch_qty` | `~` | 移转批量 | int | 可写（create+update 均出现） |
| `variable_days` | `~` | 变动天数 | number | 可写（create+update 均出现） |
| `variable_labor_hour_sec` | `~` | 变动人时(秒) | int | 可写（create+update 均出现） |
| `variable_machine_hour_sec` | `~` | 变动机时(秒) | int | 可写（create+update 均出现） |
| `work_hours_batch_qty` | `~` | 工时批量 | int | 可写（create+update 均出现） |
| `work_hours_wages_rate` | `~` | 工时工资率 | number | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "product_process_detail_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`product_process_header_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `routing_item_no` | `~` | 工艺路线品号 | string | 主键 |
| `process_code` | `~` | 工艺路线编号 | string | 主键 |
| `COMPANY` | `~` | 公司 | string | ~ |
| `CREATE_DATE` | `~` | 创建时间 | string | ~ |
| `CREATOR` | `~` | 创建人 | string | ~ |
| `FLAG` | `~` | 修改标志 | number | ~ |
| `item_name` | `~` | 品名 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `item_spec` | `~` | 规格 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `MODI_DATE` | `~` | 修改时间 | string | ~ |
| `MODIFIER` | `~` | 修改人 | string | ~ |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `routing_name` | `~` | 工艺名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `unit` | `~` | 单位 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `USR_GROUP` | `~` | ~ | object | ~ |

> **查询此单身字段时必须带 `node_name: "product_process_header_data"`**，否则易飞无法识别为单身过滤条件。

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
