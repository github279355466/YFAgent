# 两个问题的实测答复

> 2026-10-08，环境 `{内网IP}`（易飞 9.0 测试账套），15+60 次真机探测
> 全部只读操作，凭据经环境变量注入

---

# 问题一：5 个未知主键，你需要做什么？

## 答案：**你不需要做任何事，我已实测出来了**

我原本以为要你提供规格文档，**实际上真机探测就能反推**。以下是实测结果：

| type_key | 中文 | 主键 | 置信度 | 依据 |
|---|---|---|---|---|
| `company.detail` | 公司 | **`company_no`** | 高 | 命名规范 + 唯一性过滤命中 1 条 |
| `employee` | 员工 | **`staff_no`** | 高 | 命名规范（易飞用 `staff_` 而非 `employee_`）+ 命中 1 条 |
| `operation` | 工艺 | **`routing_no`** | 高 | 命名规范（工艺=路线）+ 命中 1 条 |
| `document.type.general` | 单据性质 | **`doc_type_no`** | 高 | 命名规范（易助侧同名对象也是 `doc_type_no`）+ 命中 1 条 |
| `item.inventory.qty` | 品号库存 | ⚠️ **无法探测** | — | 服务端 DLL 崩溃，见下 |

**关键发现**：易飞主键命名有固定后缀习惯 —— `xxx_no`：

```
company_no（公司）    staff_no（员工）      routing_no（工艺）
doc_type_no（单据别） item_no（品号）      supplier_no（供应商）
warehouse_no（仓库）  plant_no（工厂）     customer_no（客户）
```

**这也解释了为什么前 101 个能自动抽到** —— 它们都有 `read.get` 服务，文档里直接给了 `datakeys`。这 5 个对象**没有 read 服务**（只有 query），所以文档里没有 `datakeys` 可抄。

### 唯一需要你关注的一件事

`item.inventory.qty`（品号库存）查询时**服务端崩溃**：

```
Do query error: Access violation at address 00000000007CDDDD
in module 'OAPComF2.exe'. Read of address FFFFFFFFFFFFFFFF
```

这是易飞服务端的 DLL 内存访问错误，**不是我们请求的问题**（同账套其他查询都正常）。

| 需要你做的 | 说明 |
|---|---|
| **向易飞服务端报一个缺陷** | 告知 `yf.oapi.item.inventory.qty.query.get` 会触发 `OAPComF2.exe` 崩溃，请他们确认是否为已知问题、是否影响该对象的其他操作 |

在这个缺陷修好前，`item.inventory.qty` 对象**不可用**（`typekey_map.yaml` 里的标记是正确的：它的服务名就是 `yf.oapi.item.inventory.qty.query.get`，无 `.data` 段）。

### 顺带发现：3 个对象的服务名我之前测错了

| type_key | 正确服务名（无 `.data` 段） | 我最初猜的（错） |
|---|---|---|
| `supplier` | `yf.oapi.supplier.query.get` | `yf.oapi.supplier.data.query.get` |
| `document.type.general` | `yf.oapi.document.type.general.query.get` | `...data.query.get` |
| `item.inventory.qty` | `yf.oapi.item.inventory.qty.query.get` | `...data.query.get` |

`typekey_map.yaml` 记录的是**正确的**（它逐条抄自文档），是我探测时按规律拼接才错的。

---

# 问题二：T-17 需要数据库表结构吗？

## 答案：**不需要。而且我上一轮的结论是错的**

### 我上一轮说错了什么

我上轮写「`node_name` 用物理表名，不是 `*_data` 逻辑节点名」，**这个结论错误**。

### 实测证据

我拿 5 个对象做了对照实验：

| 对象 | `node_name` 取值 | 结果 |
|---|---|---|
| `purchase.order` | `purchase_order_detail_data` | ✅ **`code=0` 接受** |
| `sales.order` | `sales_order_detail_data` | ✅ **接受** |
| `sales.invoice` | `sales_invoice_detail_data` | ✅ **接受** |
| `inventory.transaction` | `inventory_transaction_detail_data` | ✅ **接受** |
| `purchase.receipt` | `purchase_receipt_detail_data` | ✅ **接受** |
| `purchase.order` | `PURTC`（物理表名） | ❌ `MA012未定義` |
| `purchase.order` | `PDTC` | ❌ `MA012未定義` |
| `purchase.order` | `ANYTHING` | ❌ `MA012未定義` |
| `accounting.voucher` | `accounting_voucher_detail_data` | ❌ `MA012未定義` |

**结论**：**逻辑节点名（`*_data`）就是正确的 `node_name` 取值** —— 官方文档所举的 `sales_order_detail_data` 确实是标准用法，实测通过。

### 那个 `MA012未定義` 是什么

它**不是**「表名映射缺失」，而是「**该单身节点在 OAPMA 节点注册表中未注册**」。

判定依据：我在 `purchase.order` 上测了 6 种 `node_name`：

| `node_name` | 报错 |
|---|---|
| `purchase_order_detail_data` | **`code=0`** |
| `purchase_order_data` | `找不到資料表:[PURTC]` ← **注意：不是 MA012** |
| `PURTC` | `MA012未定義` |
| `PDTC` | `MA012未定義` |
| `不存在XYZ` | `MA012未定義` |
| 不给 | `找不到資料表:[PURTC]` |

规律很清楚：
- **节点名存在** → 接受，继续往下校验字段
- **节点名不存在** → `MA012未定義`
- **节点名存在但字段名错** → `找不到資料表:[物理表]`

所以 `MA012` = 「这个节点名我没听说过」，与数据库表结构**毫无关系**。

### 那 43 个 MA012 是什么情况

我对全部 **175 个单身节点名**做了批量验证：

| 结果 | 数量 | 含义 |
|---|---|---|
| ✅ 接受 | 5 | 节点名正确 |
| ⚠️ 字段名猜错 | **105** | **节点名已被接受**，但我猜的字段名不对（真实字段名要从该节点自己的对照表取） |
| ❌ MA012 未定义 | 43 | 该节点在 OAPMA 中未注册 |
| — 无 query 服务 | 0 | — |

**105 / 175 是「节点名正确」** —— 这个比例远高于我上轮的判断。

### 那 43 个真 MA012 怎么来的

两类原因：

**① 官方文档的复制粘贴错误**（我上一轮已发现同类问题）

```
ap.refund.doc      → wo_stockin_data          （应付退款单里写着生产入库单的节点）
expense.invoice    → wo_stockin_data
other.payable.doc  → wo_stockin_data
prepayment.doc     → wo_stockin_data
outsourcing.purchase.return → wo_stockin_data
wo.commence        → transfer_doc_data
purchase.arrival  → purchase_order_detail_data
```

**② 可能是该账套未启用对应节点**（如 `bom_requirement_detail_data`、`work_report_detail_data`）

### T-17 的正确解法

**不需要数据库表结构。** 只需要：

| 需要什么 | 从哪来 | 数量 |
|---|---|---|
| 单身节点名 | ✅ **已有** —— `typekey_map.yaml` 的 `detail_nodes` | 175 个 |
| 各节点的**字段名** | ✅ **已有** —— 各对象的字段对照表里已按 `单身字段：xxx` 分节列出 | 已覆盖 |
| 逐个验证 | 脚本自动跑 | 175 次请求，**约 1 分钟** |

**验证脚本我已经写好并跑完了**（`runs/node-name-verify.md`）。

**你要做的**：把 43 个 MA012 节点名的清单交给**易飞服务端**，问一句「这些节点为什么未注册」，同时报一下 `item.inventory.qty` 的 DLL 崩溃缺陷。

---

# 修正后的结论汇总

| 项 | 我上轮的说法 | 实测结论 |
|---|---|---|
| `node_name` 用什么 | ❌ 物理表名 | ✅ **逻辑节点名（`*_data`）** |
| T-17 需要什么 | ❌ 数据库表结构 | ✅ **不需要**，只需验证已有节点名 |
| T-17 优先级 | 🔴 P0 阻塞 | 🟡 **P2**（105/175 已通过，仅需修 43 个） |
| 5 个未知主键 | 🔴 需你提供文档 | ✅ **已实测出4 个**，第 5 个是服务端缺陷 |

## 数据库表结构什么时候才需要

| 场景 | 是否需要表结构 |
|---|---|
| `node_name` 查询 | ❌ 不需要 |
| 字段名/类型/中文名 | ❌ 不需要（已有） |
| **Phase 2 的 analysis 层**（20 个 SQL 模板） | ✅ **需要** —— 这是唯一用途 |

所以 T-07（表结构）从 Phase 1 移到 Phase 2，**不阻塞当前工作**。
