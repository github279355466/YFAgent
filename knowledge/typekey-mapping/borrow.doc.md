# 借出 (borrow.doc) 字段对照表

## 来源与说明

> 由 `scripts/extract-field-metadata.mjs` 从 `docs/易飞OpenAPI.json` 机械抽取生成，请勿手工编辑。
> 重新生成：`node scripts/extract-field-metadata.mjs --only borrow.doc`

- **服务前缀**：`yf.oapi.`
- **操作集**：`approve` / `create` / `delete` / `disapprove` / `invalid` / `query` / `read` / `update`
- **查询服务**：`yf.oapi.borrow.doc.data.query.get`
- **读取服务**：`yf.oapi.borrow.doc.data.read.get`
- **新增服务**：`yf.oapi.borrow.doc.data.create`
- **标题来源**：目录名 11 个，取最高频：借出(9) / 借出单(1) / 借入单(1)

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
| `addrss_1` | `~` | 地址一 | object | 可写（create+update 均出现） |
| `addrss_2` | `~` | 地址二 | object | 可写（create+update 均出现） |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `COMPANY` | `~` | 公司 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `CREATE_DATE` | `~` | 创建时间 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `CREATOR` | `~` | 创建人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `currency` | `~` | 币种 | string | 可写（create+update 均出现） |
| `department` | `~` | 部门编号 | string | 可写（create+update 均出现） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段） |
| `doc_type` | `~` | 单据性质 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `exchange_rate` | `~` | 汇率 | number | 可写（create+update 均出现） |
| `FLAG` | `~` | 修改标志 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code` | `~` | 生成分录 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `MODI_DATE` | `~` | 修改时间 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `MODIFIER` | `~` | 修改人 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `object_full_name` | `~` | 其它备注 | object | 可写（create+update 均出现） |
| `object_no` | `~` | 对象编号 | string | 可写（create+update 均出现） |
| `object_type` | `~` | 借出类型 | string | 可写（create+update 均出现） |
| `other_remark` | `~` | 其它备注 | object | 可写（create+update 均出现） |
| `pieces` | `~` | 件数 | int | 可写（create+update 均出现） |
| `plant_name` | `~` | 工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 出货工厂 | string | 可写（create+update 均出现） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | 可写（create+update 均出现） |
| `register_book_no` | `~` | 海关手册 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | 可写（create+update 均出现） |
| `staff_no` | `~` | 人员 | string | 可写（create+update 均出现） |
| `tax_rate` | `~` | 税率 | number | 可写（create+update 均出现） |
| `tax_type` | `~` | 税种 | string | 可写（create+update 均出现） |
| `tot_amt` | `~` | 总金额 | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tot_qty` | `~` | 总数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_package_qty` | `~` | 总包装数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transaction_date` | `~` | 交易日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `USR_GROUP` | `~` | ~ | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

## 单身字段：`transfer_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 单号 | string | 主键 |
| `approval_status_code` | `~` | 签核状态码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approve_status` | `~` | 审核码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_name` | `~` | 审核者名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `approver_no` | `~` | 审核者 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department` | `~` | 部门编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `department_name` | `~` | 部门编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_date` | `~` | 单据日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type` | `~` | 单据性质码 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `doc_type_name` | `~` | 单别名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `generate_entry_code` | `~` | 生成分录 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `pieces` | `~` | 件数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_name` | `~` | 工厂名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `plant_no` | `~` | 工厂 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `print_times` | `~` | 打印次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_name` | `~` | 项目编号名称 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `project_no` | `~` | 项目编号 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `register_book_no` | `~` | 海关手册 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `remarks` | `~` | 备注 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tot_amt` | `~` | ~ | number | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `tot_qty` | `~` | 总数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `total_package_qty` | `~` | 总包装数量 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transaction_date` | `~` | 调拨日期 | string | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |
| `transfer_times` | `~` | 传送次数 | int | **只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成） |

> **查询此单身字段时必须带 `node_name: "transfer_data"`**，否则易飞无法识别为单身过滤条件。

## 单身字段：`borrow_doc_detail_data`

| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
|---|---|---|---|---|
| `doc_type_no` | `~` | 单别 | string | 主键 |
| `doc_no` | `~` | 变更单号 | string | 主键 |
| `expiry_date` | `~` | 有效日期 | string | 可写（create+update 均出现） |
| `item_no` | `~` | 品号 | string | 可写（create+update 均出现） |
| `lot_description` | `~` | 批号说明 | object | 可写（create+update 均出现） |
| `lot_no` | `~` | 批号 | string | 可写（create+update 均出现） |
| `package_qty` | `~` | 包装数量 | number | 可写（create+update 均出现） |
| `plan_return_date` | `~` | 预计归还日 | string | 可写（create+update 均出现） |
| `price` | `~` | 单价 | number | 可写（create+update 均出现） |
| `qty` | `~` | 数量 | number | 可写（create+update 均出现） |
| `reinspection_date` | `~` | 复检日期 | object | 可写（create+update 均出现） |
| `remarks` | `~` | 备注 | object | 可写（create+update 均出现） |
| `seq` | `~` | 序号 | string | 可写（create+update 均出现） |
| `source_doc_no` | `~` | 来源单号 | string | 可写（create+update 均出现） |
| `source_seq` | `~` | 来源序号 | string | 可写（create+update 均出现） |
| `source_type_no` | `~` | 来源单别 | string | 可写（create+update 均出现） |
| `transfer_in_location_no` | `~` | 转入库位 | string | 可写（create+update 均出现） |
| `transfer_in_warehouse_no` | `~` | 转入库 | string | 可写（create+update 均出现） |
| `transfer_out_location_no` | `~` | 转出库位 | string | 可写（create+update 均出现） |
| `transfer_out_warehouse_no` | `~` | 转出库 | string | 可写（create+update 均出现） |
| `unit` | `~` | 单位 | string | 可写（create+update 均出现） |

> **查询此单身字段时必须带 `node_name: "borrow_doc_detail_data"`**，否则易飞无法识别为单身过滤条件。

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
