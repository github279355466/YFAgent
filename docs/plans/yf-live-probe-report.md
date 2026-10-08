# 易飞(E10) OpenAPI 真机探测报告

> 探测时间：2026-10-08 18:44~ 18:52 (GMT+8)
> 环境：`http://{内网IP}`（易飞 9.0测试环境）｜账套 `{账套编号}`｜令牌已脱敏
> 脚本：`scripts/probe-live-env.mjs`（可复现，只读操作）
> 结果：**15/15 PASS**，另做 4 组深度验证

---

## 一、连通性与鉴权

| 项 | 实测 |
|---|---|
| 入口可达 | ✅ HTTP 200，ping 30~32ms（内网直连，**不走代理**） |
| 首次响应 | 1623ms（含连接建立），后续 ~70~300ms |
| 鉴权 | ✅ `code=0` 查詢成功 |
| 协议 | `Content-Type: application/json`；**成功时恒为 HTTP 200** |

⚠️ **URL 大小写敏感已实测确认**：`/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost` 的大小写必须完全一致（官方文档明确标注，此处实测通过）。

---

## 二、四个公共头 —— 真机逐个验证

| 头 | 缺失时的真机响应 |
|---|---|
| `digi-service` | `code=-1`，`无效的身份令牌，请联系管理员分配身份令牌！`（**空服务名被当作令牌问题**，非「服务不存在」） |
| `digi-user-token` | `code=-1`，`无效的身份令牌,请检查是否传入身份令牌.` |
| `digi-datakey` | `code=-1`，**`digi-datakey is not valid.`** ← 证实为必填（易助无此头） |
| `Content-Type` | 未测（推断必填） |

**账套隔离生效**：错误 `CompanyId` → `Can not found CompanyId(NOT_EXIST_CO) in DSCMB`（`code=-1`）。

### 🔴 关键发现：错误 token 返回 **HTTP 500 + HTML 错误页**（非 JSON）

```html
HTTP 500 | Content-Type: text/html; charset=gb2312
<title>500 - 内部服务器错误</title>
```

**影响**：SDK 若只解析 JSON，遇到 500 HTML 会抛未捕获异常。**必须**先判HTTP 状态码，非 200 时走独立的错误分支，不要试图解析 body。

---

## 三、`conditions` 结构 —— **实测推翻了原假设**

| 写法 | 真机结果 |
|---|---|
| **对象形态** `{operator, fields[]}` | ✅ `code=0`，`total=1`（过滤生效） |
| **数组形态** `[{groups:[...]}]`（易助写法） | ❌ `code=-1`，`conditions not found.` |
| **扁平数组** `[{field,op,value}]` | ❌ `code=-1`，`conditions not found.` |
| 空对象 `{}` | ✅ 取全部资料 |

### 结论修正（重要）

我在方案文档中把这条定为「**最高风险：静默返回全量、不报错**」，并据此裁决 OPEN-A3「彻底分包」。

**实测证明：易飞对错误 structures 是显式报错（`code=-1` + `conditions not found.`），不是静默失效。**

- 好消息：风险等级可从「🔴 最高」下调为「🟠 中」—— 问题会被立即发现，不会静默产出错误数据
- 但「按产品线彻底分包」的结论**不变**（理由从"防静默错误"变为"语义结构确实不同，双向转换会引入不必要的复杂度"）
- `conditions` 转换层**仍需实现**（易助代码习惯性会用数组形态），但**不必按"防静默"的高标准做双向兼容**，只需在 YFCLI 侧提供易飞结构的构造器 + 对数组形态做**显式拒绝并给出清晰报错**

---

## 四、复合主键与 `datakeys`

| 场景 | 真机结果 |
|---|---|
| 有效主键 `{doc_type_no:"091W", doc_no:"20230710001"}` | ✅ `code=0`，`success[0].accounting_voucher_data` 有数据 |
| 缺 `doc_no` | ❌ `code=-1`，`缺少[doc_no]的鍵值參數`，**`error[0].data` 回显已传的 `{"doc_type_no":"091W"}`** |
| 全错主键 `{ZZ, NOT_EXIST}` | ⚠️ `code=0`，`success[0].accounting_voucher_data=[]`（**返回成功但空数组**） |
| `datakeys` 传字符串 | ❌ `datakeys is not valid.` |
| `datakeys` 传空对象 | ❌ `datakeys is not valid.` |

### 🔴 关键发现 2：**主键错误时返回 `code=0` + 空数组**

`code=0` 但数据为空。**若只看 `execution.code` 判断成功，会把「查无此单」误判为「查询成功且无数据」。**

**应对**：`yfcli_sdk` 必须实现「空结果告警」—— 当 `code=0` 且 `rows`/`success` 为空时，区分「条件确实无匹配」与「主键写错」。建议：主键类 `read` 请求在返回空数组时**主动 WARN**。

### `error[]` 结构

真机实测**只出现 `{message, data}` 一种形态**（缺主键、非法服务名、非法字段名、conditions not found 全部如此）。文档中提到的 `information[]` 形态**在本次探测中未复现**。

→ 解析器仍应兼容两种（文档有记载，可能出现在其他操作/批量场景），但**主路径是 `{message, data}`**。

---

## 五、🔴🔴 枚举值传参 —— **本次最重要的发现，纠正了一个危险误解**

真机枚举字段的**回参**格式是 `编码.中文`（如 `Y.已审核`），但**查询条件必须传「纯编码」**：

| conditions 传值 | `total_result` |
|---|---|
| **无任何条件** | **50**（全量） |
| `approve_status = "Y.已审核"`（完整串） | **0** ← 查不到！ |
| `approve_status = "Y"`（仅编码） | **50** ✅ 全部匹配 |
| `approve_status = "N"`（仅编码） | **50** ✅ 全部匹配 |
| `approve_status = "Z"`（不存在编码） | 0 |
| `approve_status = "X.乱填"` | 0 |
| `approve_status = ""`（空串） | 0 |

### 危险点

**回参长得像枚举、但不能直接回传给查询条件。** 若 Agent 照搬上一步查询结果的 `approve_status="Y.已审核"` 作为下一步的过滤条件，会得到**空结果**且 `code=0`（不报错）。

**这正是「防幻觉」第1 类（编造/误用枚举值）的典型场景**，必须写进 Skill 的硬性规则：

> ⚠️ 枚举字段**回参**为 `编码.中文` 格式，但作为 **query 条件时必须只传编码**（`Y` 而非 `Y.已审核`）。
> 可从 `knowledge/enums/enums.yaml` 查编码表；**禁止直接把回参值回传为条件**。

### 数字型枚举

`flag=1` → 50 条，`flag=2` → 12 条，`flag=999` → 0 条。**纯数字型，无编码/中文分离问题**。

### 数值字段的引号宽容度

`total_debit_local_curr = "100"`（字符串）与 `= 100`（数字）**结果相同**（均 50 条）。**但文档明确要求「数值请勿使用双引号」** —— 仍应遵守文档规范，避免其他字段 stricter 时出错。

---

## 六、`node_name`（查询单身字段）

| 写法 | 真机结果 |
|---|---|
| `item_no` + `node_name: "accounting_voucher_detail_data"` | ❌ `accounting_voucher_detail_data OAPMA.MA012未定義或資料庫版` |
| `item_no` **不带** `node_name` | ❌ `OAPMB中找不到資料表:[ACTTA] 節點名:[item_no]的欄位對照，也不是管理欄位。` |

**结论**：`node_name` 机制**真实存在且必需** —— 不带时报错指向「找不到资料表ACTTA」。但**节点名必须是物理表名对应的注册名**（不是随便写 `*_data` 节点名）。

> 这解释了为什么用 `accounting_voucher_detail_data` 失败：真机期望的是该单据的**单身物理表**（如 `ACTTA`），而 `*_data` 是 API 层的逻辑节点名。**映射关系需在 Phase 1 用真机逐一探测**（新增探测项 T-16）。

⚠️ 这也意味着：**我生成的 175 个 `*_data` 节点名不能直接当`node_name` 用** —— 需补一层「逻辑节点名 → 物理表名」映射。这是 Phase 1 的**新增必做项**。

---

## 七、TypeKey 抽样（10 个）

| type_key | 服务名 | 结果 |
|---|---|---|
| customer | `yf.oapi.customer.data.query.get` | ✅ code=0 |
| **supplier** | `yf.oapi.supplier.data.query.get`（探测脚本猜名） | ❌ code=-1；但映射表记录的 `yf.oapi.supplier.query.get` **实测 code=0** ✅ |
| item | `yf.oapi.item.data.query.get` | ✅ code=0 |
| sales.order | `yf.oapi.sales.order.data.query.get` | ✅ code=0 |
| purchase.order | `yf.oapi.purchase.order.data.query.get` | ✅ code=0 |
| inventory.transaction | `yf.oapi.inventory.transaction.data.query.get` | ✅ code=0 |
| wo | `yf.oapi.wo.data.query.get` | ✅ code=0 |
| bom | `yf.oapi.bom.data.query.get` | ✅ code=0 |
| accounting.voucher | `yf.oapi.accounting.voucher.data.query.get` | ✅ code=0 |
| account | `yf.oapi.account.data.query.get` | ✅ code=0 |

**9/10 成功**。

### ✅ 澄清：`supplier` 的服务名**映射表是对的，是我探测时用错了名字**

核查 `typekey_map.yaml` 实际记录：

```yaml
- type_key: supplier
  services:
    create: yf.oapi.supplier.data.create
    delete: yf.oapi.supplier.delete
    query:  yf.oapi.supplier.query.get     ← 无 .data 段，与真机一致
    read:   yf.oapi.supplier.read.get
    update: yf.oapi.supplier.data.update
```

**实测 `yf.oapi.supplier.query.get` → `code=0` 成功**（探测中已验证）。

失败原因：我的**探测脚本**按「`{type_key}.data.{op}.get`」的直觉猜了 `yf.oapi.supplier.data.query.get`，而该名在官方文档中不存在。

**这恰好验证了一件事**：`typekey_map.yaml` 逐条抄写 `digi-service` 头原值、不做拼接的做法是**正确的** —— 6 个 `no_data_segment` 对象（`bom` / `document.type.general` / `function.category` / `item.customer.price` / `item.inventory.qty` / `item.supplier.price`）的服务名形态各异，**若靠拼接必然出错**。

**教训**：调用服务名**只能从 `typekey_map.yaml` 查**，禁止按规律拼接 —— `supplier` 与 `customer` 的命名形态不同即为反例。

---

## 八、`selectedColumns`（20260401 新增）

传 `selectedColumns: "plant_no,plant_name"` → 回参**仅含这两个字段**，实测生效 ✅。可用于大幅减少传输量。

---

## 九、page_size 性能（粗测，单次）

| page_size | 耗时 | 实际返回 | `total_result` |
|---|---|---|---|
| 10 | 94~113ms | 10 | 10 |
| 100 | 139~146ms | 22 | 22 |
| 1000 | 110~144ms | 22 | 22 |
| 10000 | 112~119ms | 22 | 22 |

**本账套工厂表仅 22 条**，无法据此判断万级数据的性能。**`page_size` 上限 10000 已验证可用**（无报错），但真实性能需在有大量数据的账套复测。

---

## 十、实测确认 vs 文档不符清单

| # | 项| 文档说法 | 实测 | 处置 |
|---|---|---|---|---|
| 1 | 错误 `conditions` 结构 | 未说明 | **显式报错**（非静默全量） | ✅ 风险下调；方案文档已修正 |
| 2 | `error[]` 结构 | `{message,data}` 与 `{information[]}` 并存 | 仅见 `{message,data}` | 解析器仍兼容两种，主路径 `{message,data}` |
| 3 | 错误 token 的响应 | 未说明 | **HTTP 500 + HTML** | 🔴 SDK 必须先判状态码 |
| 4 | 空 `digi-service.name` | 未说明 | 报「无效的身份令牌」（非「服务不存在」） | 错误提示会误导，需在 SDK 加语义化包装 |
| 5 | 主键错误的 `read` | 未说明 | **`code=0` + 空数组** | 🔴 需加空结果告警 |
| 6 | 枚举条件传值 | 未说明 | **只认纯编码**，传「编码.中文」返回 0 条 | 🔴 写进 Skill 硬性规则 |
| 7 | `node_name` 节点名 | 文档用 `sales_order_detail_data` 举例 | 该名**不可用**，报错指向物理表 `ACTTA` | 🔴 新增映射层（Phase 1 必做） |
| 8 | `supplier` 服务名 | Apipost 为 `yf.oapi.supplier.query.get` | 映射表误记为 `supplier.data.query.get` | 🔴 修抽取脚本（不得拼接服务名） |
| 9 | 数值字段引号 | 「数值请勿使用双引号」 | 带引号也work（宽松） | 仍遵守文档规范 |
| 10 | 成功文案 | `查詢成功`/`执行成功` 繁简混用 | 实测**恒为 `查詢成功`**（繁体） | 仍禁止字符串匹配判断成功 |

---

## 十一、Phase 1 放行闸门（更新）

| 闸门 | 状态 | 说明 |
|---|---|---|
| 真机环境可用 | ✅ **已达成** | `{内网IP}` 直连可用，鉴权通过 |
| 4 个公共头验证 | ✅ **已达成** | 含易飞独有的 `digi-datakey` |
| `conditions` 对象形态 | ✅ **已达成** | 数组形态确认被拒 |
| 复合主键识别 | ✅ **已达成** | `doc_type_no + doc_no` |
| 枚举编码表 | 🔴 **新增必做** | 需实机采集（回参≠查询值） |
| `*_data` → 物理表映射 | 🔴 **新增必做** | 175 个节点名需映射 |
| 服务名只能查表 | 🟠 **新增** | 加校验：调用前比对 `typekey_map.yaml` |
| 修 `typekey_map.yaml` 服务名 | 🔴 **新增必做** | 6 个无`.data` 段对象需复核 |
| 5 个未知主键探测 | 🔴 仍待做 | `company.detail` / `document.type.general` / `employee` / `item.count` / `item.inventory.qty` |
| SDK 错误处理 | 🔴 **新增必做** | HTTP 500 HTML + 空结果告警 |

---

## 十二、残留风险

| # | 风险 | 等级 | 说明 |
|---|---|---|---|
| 1 | 未知主键的 5 个对象 | 🟠 | 需真机探测；当前账套可能无这些数据 |
| 2 | `*_data` → 物理表映射未知 | 🔴 | 影响所有单身字段查询 |
| 3 | 服务名拼接错误（探测侧） | 🟢 | 已澄清：映射表正确，**调用方必须查表而非拼接**；建议 SDK 层加校验 |
| 4 | 枚举字典未采集 | 🔴 | 现有 `description` 中的枚举线索需真机验证 |
| 5 | 单次性能数据不可靠 | 🟡 | 需多轮复测 + 大数据量账套 |
| 6 | 文档缺陷 5 个对象未核实（T-11） | 🟠 | `ap.refund.doc` 等入参容器名错误 |
| 7 | 写操作（create/update/delete/approve）未测 | 🟡 | 本次仅只读；写操作需在测试账套谨慎验证 |
