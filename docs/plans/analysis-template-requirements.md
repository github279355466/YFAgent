# analysis 模板表需求清单（易飞侧待填）

> **用途**：易助 20 个模板依赖 **16 张表 / 85 个字段引用**，易飞库**同名命中 0 张**。
> 本文按「表 → 字段 → 模板」三层展开，供填写易飞实际表名与字段名。

> 生成方式：脚本解析 `yzcli-analysis/src/runtime/sql/templates.ts`（591 行 / 20 个 `defineTemplate` 块），
> 字段按前缀归属（`LOA*` → `JSKLOA`），无自动归属的字段列为「未归属」。

> **裁定前提**：analysis 层目标场景直接复制易助产品线，模板 id / label / 参数签名保持一致，
> 仅改写表名、字段名、审核码取值与业务常量。

---

## 一、表级需求（16 张）

| # | 易助表 | 字段数 | 易飞表名 | 对应视图名 | 状态 |
|---|---|---|---|---|---|
| 1 | `DCSHDA` | 4 | _待填_ | _待填_ | 未确认 |
| 2 | `DCSHDB` | 4 | _待填_ | _待填_ | 未确认 |
| 3 | `JSKJDA` | 4 | _待填_ | _待填_ | 未确认 |
| 4 | `JSKJDB` | 4 | _待填_ | _待填_ | 未确认 |
| 5 | `JSKKEA` | 5 | _待填_ | _待填_ | 未确认 |
| 6 | `JSKKEB` | 5 | _待填_ | _待填_ | 未确认 |
| 7 | `JSKLNA` | 13 | _待填_ | _待填_ | 未确认 |
| 8 | `JSKLOA` | 4 | _待填_ | _待填_ | 未确认 |
| 9 | `JSKLPA` | 5 | _待填_ | _待填_ | 未确认 |
| 10 | `JSKLPB` | 6 | _待填_ | _待填_ | 未确认 |
| 11 | `KJSNFA` | 5 | _待填_ | _待填_ | 未确认 |
| 12 | `SGMQKA` | 8 | _待填_ | _待填_ | 未确认 |
| 13 | `YSFGCA` | 5 | _待填_ | _待填_ | 未确认 |
| 14 | `YSFGDA` | 4 | _待填_ | _待填_ | 未确认 |
| 15 | `YSFGPA` | 5 | _待填_ | _待填_ | 未确认 |
| 16 | `YSFGQA` | 4 | _待填_ | _待填_ | 未确认 |

## 二、字段级需求

### `DCSHDA`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `HDA001` | _待填_ | |
| `HDA003` | _待填_ | |
| `HDA004` | _待填_ | |
| `HDA021` | _待填_ | |

### `DCSHDB`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `HDB001` | _待填_ | |
| `HDB003` | _待填_ | |
| `HDB006` | _待填_ | |
| `HDB009` | _待填_ | |

### `JSKJDA`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `JDA001` | _待填_ | |
| `JDA003` | _待填_ | |
| `JDA004` | _待填_ | |
| `JDA026` | _待填_ | |

### `JSKJDB`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `JDB001` | _待填_ | |
| `JDB003` | _待填_ | |
| `JDB007` | _待填_ | |
| `JDB010` | _待填_ | |

### `JSKKEA`（5 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `KEA001` | _待填_ | |
| `KEA003` | _待填_ | |
| `KEA004` | _待填_ | |
| `KEA023` | _待填_ | |
| `KEA040` | _待填_ | |

### `JSKKEB`（5 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `KEB001` | _待填_ | |
| `KEB003` | _待填_ | |
| `KEB011` | _待填_ | |
| `KEB012` | _待填_ | |
| `KEB021` | _待填_ | |

### `JSKLNA`（13 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `LNA001` | _待填_ | |
| `LNA002` | _待填_ | |
| `LNA004` | _待填_ | |
| `LNA005` | _待填_ | |
| `LNA006` | _待填_ | |
| `LNA007` | _待填_ | |
| `LNA011` | _待填_ | |
| `LNA013` | _待填_ | |
| `LNA015` | _待填_ | |
| `LNA018` | _待填_ | |
| `LNA035` | _待填_ | |
| `LNA036` | _待填_ | |
| `LNA037` | _待填_ | |

### `JSKLOA`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `LOA001` | _待填_ | |
| `LOA002` | _待填_ | |
| `LOA003` | _待填_ | |
| `LOA004` | _待填_ | |

### `JSKLPA`（5 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `LPA001` | _待填_ | |
| `LPA002` | _待填_ | |
| `LPA003` | _待填_ | |
| `LPA004` | _待填_ | |
| `LPA005` | _待填_ | |

### `JSKLPB`（6 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `LPB001` | _待填_ | |
| `LPB002` | _待填_ | |
| `LPB003` | _待填_ | |
| `LPB004` | _待填_ | |
| `LPB005` | _待填_ | |
| `LPB012` | _待填_ | |

### `KJSNFA`（5 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `NFA001` | _待填_ | |
| `NFA002` | _待填_ | |
| `NFA003` | _待填_ | |
| `NFA011` | _待填_ | |
| `NFA012` | _待填_ | |

### `SGMQKA`（8 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `QKA001` | _待填_ | |
| `QKA002` | _待填_ | |
| `QKA004` | _待填_ | |
| `QKA005` | _待填_ | |
| `QKA006` | _待填_ | |
| `QKA007` | _待填_ | |
| `QKA008` | _待填_ | |
| `QKA009` | _待填_ | |

### `YSFGCA`（5 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `GCA003` | _待填_ | |
| `GCA004` | _待填_ | |
| `GCA016` | _待填_ | |
| `GCA017` | _待填_ | |
| `GCA020` | _待填_ | |

### `YSFGDA`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `GDA003` | _待填_ | |
| `GDA004` | _待填_ | |
| `GDA013` | _待填_ | |
| `GDA022` | _待填_ | |

### `YSFGPA`（5 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `GPA003` | _待填_ | |
| `GPA004` | _待填_ | |
| `GPA016` | _待填_ | |
| `GPA017` | _待填_ | |
| `GPA020` | _待填_ | |

### `YSFGQA`（4 字段）

| 字段 | 易飞字段名 | 说明 |
|---|---|---|
| `GQA003` | _待填_ | |
| `GQA004` | _待填_ | |
| `GQA013` | _待填_ | |
| `GQA022` | _待填_ | |

## 三、模板级需求（20 个）

| # | 模板 id | label | 依赖表 | 参数 | max_rows | timeout_ms |
|---|---|---|---|---|---|---|
| 1 | `inventory_cost_by_item` | 现有库存成本（按品号） | `JSKLOA` | warehouse | 1000 | 10 |
| 2 | `inventory_cost_by_warehouse` | 现有库存成本（按仓库） | `JSKLOA` | 无 | 500 | 10 |
| 3 | `period_end_cost_by_item` | 期末库存成本（按品号 + 年月） | `JSKLPA` | year_month | 1000 | 10 |
| 4 | `gross_profit_by_order` | 销货毛利（按单据） | `JSKKEA`, `JSKLNA` | start_date, end_date, approve_status | 1000 | 15 |
| 5 | `sales_cost_by_customer` | 销货成本（按客户） | `JSKLNA` | start_date, end_date | 500 | 15 |
| 6 | `material_usage_by_workorder` | 材料耗用成本（按工单/材料） | `JSKLNA` | start_date, end_date | 500 | 15 |
| 7 | `workorder_cost_detail` | 工单成本明细 | `SGMQKA` | year_month | 500 | 15 |
| 8 | `purchase_order_by_supplier` | 采购金额（按供应商/品号） | `DCSHDA`, `DCSHDB` | start_date, end_date, approve_status | 500 | 15 |
| 9 | `purchase_receipt_by_supplier` | 进货金额（按供应商/品号） | `JSKJDA`, `JSKJDB` | start_date, end_date, approve_status | 500 | 15 |
| 10 | `gross_profit_by_product` | 销货毛利（按品号） | `JSKKEB`, `JSKLNA`, `JSKKEA` | start_date, end_date, approve_status | 500 | 15 |
| 11 | `inventory_asof_by_item` | 指定时点库存（按品号） | `JSKLPB`, `JSKLPB`, `JSKLNA`, `JSKLPB` | as_of_ym, as_of_date | 1000 | 20 |
| 12 | `inventory_asof_by_warehouse` | 指定时点库存（按仓库） | `JSKLPB`, `JSKLPB`, `JSKLNA`, `JSKLPB` | as_of_ym, as_of_date | 500 | 20 |
| 13 | `period_end_cost_by_warehouse` | 期末库存（按仓库） | `JSKLPB` | year_month | 500 | 15 |
| 14 | `period_end_cost_by_batch` | 期末库存（按品号+批号） | `JSKLPB` | year_month | 1000 | 15 |
| 15 | `period_avg_unit_cost_by_item` | 品号平均单位成本（按年月） | `JSKLPA` | year_month | 1000 | 15 |
| 16 | `ar_balance_by_customer` | 应收账款余额（按客户） | `YSFGCA` | start_date, end_date | 500 | 15 |
| 17 | `ap_balance_by_supplier` | 应付账款余额（按供应商） | `YSFGPA` | start_date, end_date | 500 | 15 |
| 18 | `account_balance_by_period` | 科目借贷方发生额（按期间） | `KJSNFA` | year, month | 500 | 15 |
| 19 | `collection_by_customer` | 收款金额（按客户） | `YSFGDA` | start_date, end_date | 500 | 15 |
| 20 | `payment_by_supplier` | 付款金额（按供应商） | `YSFGQA` | start_date, end_date | 500 | 15 |

---

## 四、改写时必须同步调整的易助专有常量

| 常量 | 出现位置 | 易助取值 | 易飞取值 |
|---|---|---|---|
| 审核码 | `KEA040` / 各单据 | `T`（已审核）/ `F` | _待确认_ |
| 单据类型码 | `LNA001` | `33`=销货 `84/85`=生产耗用 | _待确认_ |
| 出库标志 | `LNA004` | `O` | _待确认_ |
| 成本字段 | `LNA013` / `QKA006~009` | 本币成本 | _待确认_ |
| 人工/制造/委外 | `LNA035/036/037` | 易助特有列 | _易飞是否存在等价列待确认_ |
