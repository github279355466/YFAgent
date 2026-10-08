# AGENTS.md — YFCLI 智能体指引（平台无关）

> 本文件为**通用 Agent 指引**，不绑定特定平台。
> 硬性红线见 `CLAUDE.md`（若存在）；两文件共享「项目概览 / 常用命令 / 产物校验」段，修改时须同步。

---

## 项目概览

**YFCLI** 是易飞（YF / E10）产品线的 AI 助手工程，对标易助产品线的 YZCLI。

| 项 | 值 |
|---|---|
| 产品线 | 易飞 YF（E10） |
| 归属 | 鼎捷（Digiwin）产品体系 |
| 服务前缀 | `yf.oapi.`（共 595 个服务名 / 106 个业务对象） |
| 入口 | `http://{IP}/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost`（**大小写敏感**） |
| 公共头 | `digi-service` / `digi-user-token` / `digi-datakey` / `Content-Type`（四者全必填） |
| 封包 | `std_data` → `parameter` |
| 成功判据 | `execution.code === "0" \|\| "-0"`（**禁止字符串匹配 description**） |

---

## 常用命令

```bash
npm run gen:all        # 生成全部知识产物
npm run check:all      # 校验产物最新（CI 门禁）
npm run check:fields   # 仅校验字段对照表
```

---

## 产物校验（改动后必做）

| 改动类型 | 必跑命令 |
|---|---|
| 修改抽取脚本 | `npm run gen:all && npm run check:all` |
| 替换源文件 `docs/易飞OpenAPI.json` | `npm run gen:all`，并核对 `services_unique: 595` |
| 手工编辑了 `knowledge/**` | **禁止** —— 跑 `npm run gen:all` 覆盖 |

`--check` 会检出三类问题：产物过期、单个文件被篡改、产物缺失。

---

## 易飞 OpenAPI 关键规则（易助不适用，必须牢记）

### 1. `conditions` 是对象，不是数组

```jsonc
// ✅ 易飞正确写法
{ "conditions": { "operator": "AND", "fields": [ { "field_name": "item_no", "operator": "=", "value": "001" } ] } }

// ❌ 易助写法在易飞会静默失效（返回全量数据，不报错）
{ "conditions": [ { "groups": [ { "fields": [...] } ] } ] }
```

条件组用 `fields[].group`，**可多层递归嵌套**。查单身字段必须加 `node_name`：

```jsonc
{ "field_name": "project_code", "operator": "=", "value": "00181", "node_name": "sales_order_detail_data" }
```

### 2. 运算符的 value 需带 SQL 片段

| 运算符 | value 格式 | 示例 |
|---|---|---|
| `BETWEEN` | `'<起>' AND '<止>'` | `"'00941229002' AND '00950320001'"` |
| `IN` / `NOT IN` | `('N'000',N'001')` | `"(N'000',N'001',N'002')"` |
| `EXISTS` / `NOT EXISTS` | `(SELECT ...)` 且 `field_name` **留空** | `{"field_name":"","operator":"EXISTS","value":"(SELECT ...)"}` |
| `IN` + 子查询 | `$$表名` 前缀 + **必须起别名** | `"(SELECT MB001 FROM $$INVMB WHERE ...)"` |
| `LIKE` | 通配符写在 value 内 | `"00%"` / `"%00%"` |

组合字段用 `+`：`"field_name": "doc_type_no+doc_no"`。

### 3. 分页

| 参数 | 值 |
|---|---|
| `page_no` | 从 **1** 开始 |
| `page_size` | 最大 **10000** |
| `use_has_next` | 布尔 |

⚠️ **易飞无 `fastquery`**，所有查询重查数据库。`page_size` 上限须实测标定。

### 4. 字段与主键

- **无字段编号体系**（勿套用易助的「字段编号」概念）
- 自研字段：`udf01~udf12`（文本）/ `udf51~udf62`（数值）—— **与易助命名互斥**
- 管理字段 7 个：`company` `creator` `usr_group` `create_date` `modifier` `modi_date` `flag`（**只读**）
- `create_date` 长度 17，格式 `20241008153342862`，**非 ISO 日期**
- 复合主键普遍存在（如 `doc_type_no + doc_no`），`datakeys` 必须含**全部**主键字段

### 5. 错误处理

`error[]` 存在**两种结构**，解析器必须都兼容：

```jsonc
{ "message": "...", "data": {} }                              // 结构 A
{ "information": [{ "message": "...", "data": {} }] }       // 结构 B
```

未识别时**必须打 WARN**（这是「错误被静默吞掉」的唯一防线）。
`error[].data` 会**完整回显传入数据** —— 写日志前须脱敏。

### 6. 写操作约束

| 操作 | 约束 |
|---|---|
| `create` | 必须提供业务主键 + 不可空白字段；支持单别自动审核 |
| `update` | ① 按主键定位 ② 单身须含**所有**输入字段 ③ 单身「存在则更新、不存在则新增」④ **不支持删除单身** ⑤ 单头与单身 key 必须一致 |

---

## 真机实测硬约束（2026-10-08 验证，优先级最高）

> 以下每条都在真实环境（`{内网IP}`，账套 50 张凭证）验证过。
> **违反其中任何一条都会产生错误数据或误判，且多数不会报错。**

### 1. 枚举字段：回参是「编码.中文」，查询只认纯编码 ⚠️

| 传值 | 结果 |
|---|---|
| `approve_status = "Y.已审核"`（回参原样） | **0 条** ← 静默查不到 |
| `approve_status = "Y"`（仅编码） | 50 条 ✅ |

回参形如 `Y.已审核` / `N.未过账` / `1.一般凭证输入`，
**作为 query 条件时只传编码部分**。**禁止把回参值直接回传为条件。**

### 2. 主键全错返回 `code=0` + 空数组

不能用 `code` 判断「查到了」。主键类 `read` 返回空数组时必须告警。
### 3. `node_name` 用**逻辑节点名**（`*_data`），已实测确认

`node_name: "purchase_order_detail_data"` → `code=0` ✅
`node_name: "sales_order_detail_data"` → `code=0` ✅
`node_name: "inventory_transaction_detail_data"` → `code=0` ✅
`node_name: "ACTTA"`（物理表名）→ `MA012未定義` ❌

**官方文档所举的写法就是标准用法。** 三类报错的含义：

| 报错 | 含义 |
|---|---|
| `code=0` | 节点名正确 |
| `MA012未定義` | 该节点未在 OAPMA 注册表登记（与表结构无关） |
| `找不到資料表:[XXX]` | **节点名正确**，但字段名不对（XXX 是该节点的物理表名） |

⚠️ 本仓 175 个 `*_data` 节点名已批量验证（`scripts/verify-node-names.mjs`）：
**110 个可用**（5 直接通过 + 105 因我方字段名猜错但节点名有效），43 个报 MA012 待易飞端处理。
### 4. 服务名只能查表，禁止拼接

`supplier` → `yf.oapi.supplier.query.get`（无 .data 段）
`customer` → `yf.oapi.customer.data.query.get`（有 .data 段）

**一律从 `knowledge/typekey/typekey_map.yaml` 查**。按 `{type_key}.data.{op}.get` 拼接必错。

### 5. 错误 token 返回 HTTP 500 + HTML

不是 JSON。**先判 HTTP 状态码**，非200 走独立分支，不要解析 body。

### 6. 错误 `conditions` 结构是显式报错（非静默全量）

数组形态 / 扁平数组均返回 `code=-1` + `conditions not found.`。
好消息：**问题会立即暴露**，但仍须确保只生成易飞的对象形态。

---
## 已知文档缺陷（官方 Apipost 文档问题，非我方抽取错误）

| 缺陷 | 影响 |
|---|---|
| `error[]` 双结构并存 | 解析器须兼容两者 |
| 成功文案繁简混用（`查詢成功`/`执行成功`） | **禁止字符串匹配判断成功** |
| `docdate` 与 `doc_date` 并存 | 写契约时须覆盖两种 |
| `udf07~udf12` 中文描述跳号（标 13-18） | 按节点名写 |
| URL 4 种大小写/斜杠变体 | 部署时校验 |
| **5 个对象的入参容器名与对象名无关** | 见对应 md 的「⚠️ 文档异常」段，真机调用前须核实 |

---

## AI 助手路由（22 个分析助手）

走 `yzcli_run` 的 `service` 模式直调易飞侧 AI 端点（`yf.ai.*`），与易助架构同构。

**当前状态**：易助侧已现役 2 个（`yf.ai.PurchaseBusinessWarning` / `yf.ai.SalesbusinessWarning`），其余 20 个端点清单待易飞侧提供。
详见 `docs/plans/yf-materials-tasks.md` 任务 T-09。

---

## 不要臆测

以下信息文档中**没有**，需实测或向厂商确认（详见 `docs/plans/yf-openapi-rules.md` §0）：

调用频率限制 / HTTP 状态码完整语义 / Token 有效期与刷新 / 超时时间 / 版本兼容正式策略 / 单笔批量上限 / `sql_code` 取值含义 / 三版本（9.0.12·9.1·9.2）接口差异。

遇到这些，**说「文档未说明」并转入 `docs/decisions/OPEN-DECISIONS.md`**，不要编造。
