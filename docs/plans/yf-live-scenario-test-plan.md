# YFAgent 真机 CRUD + 问数 + 归因 场景测试计划

> 版本：v1.0 ｜ 编制日期：2026-10-10 ｜ 适用产品线：易飞 YF（E10）
> 关联任务：`.trellis/tasks/post-mvp-live-scenario-test`
> 真机报告产物：`runs/e2e-<YYYYMMDD>.md`（`runs/` 已 gitignore）
>
> **数字口径规则**：本文所有规模数字均带口径标签，禁止裸数字与跨口径相减。

---

## 零、一页速览

| 项 | 值 |
|---|---|
| 测试目标 | 通过 MCP 走真机，验证 CRUD 七操作 + 三域智能问数 + 双域归因分析 |
| 测试通道 | `http://localhost:{YF_MCP_PORT}/mcp`（Bearer token + `Accept: application/json, text/event-stream`） |
| 用例载体 | `packages/yfcli-mcp/__tests__/live/*.live.test.ts`（vitest） |
| 默认行为 | **未设 `YF_LIVE=1` 时全部 live 用例 skip**，`npm test` / CI 绝不连真机 |
| 场景规模 | **52 个场景** [口径：已执行并记录的独立场景数] / **9 个对象** [口径：type_key 去重] |
| 通过判据 | **无 ❌ FAIL**；⚠️ WARN 允许但必须逐条说明原因 |
| 上次真机结果 | ✅37 ⚠️15 ❌0，登记缺陷 6 条，残留数据 2 笔 [口径：2026-10-10 单轮执行] |

---

## 一、测试范围与边界

### 1.1 覆盖范围（做什么）

| 域 | 对象 | 覆盖操作 |
|---|---|---|
| 主数据 | `plant` / `customer` / `supplier` / `item` / `warehouse` | query、read、create、update、delete |
| 单据（销售域） | `sales.order` | query、枚举条件、read、create、approve、disapprove、update、delete |
| 智能问数 | 销售域 / 采购域 / 库存域 | `yf_ask` 路由 → 取数 → 确定性计算 |
| 归因分析 | 销售域 / 生产域 | `yf_analysis_plan` → `yf_analysis_step` → 取数 → 计算 |
| 降级 | — | 未匹配问题的诚实失败（禁止编造数字） |

### 1.2 明确不做（砍 scope）

- ❌ **不覆盖 `wo` 工单 CRUD**（既定的单据范围只做 `sales.order`；生产域仅经归因路径间接覆盖）
- ❌ **不启动/不改造 MCP Server**（只消费已运行的服务；若服务停机则报告标 BLOCKED）
- ❌ **不配置 SQL Server 直连、不建 `vw_ai_*` 视图**（问数与归因一律走 ERP OpenAPI 取数）
- ❌ **不清理测试数据**（既定策略：只标记、不删除；残留清单见报告第四节）
- ❌ **不在本轮改产品代码**（缺陷只登记，不进入修复循环）
- ❌ **不回写 SKILL.md / AGENTS.md**（待真机结论稳定后另行处理）

### 1.3 数据源策略

问数与归因的数据来源统一为 **ERP OpenAPI 取数**：

```
yf_ask(question)                    → QueryPlan（模板 + 参数）
yf_query / yf_run                   → 原始行数据（ERP OpenAPI）
yf_ask(question, rows)              → 确定性计算（变化/变化率/贡献度/排名）
```

`yfcli-analysis` 的 mssql driver 与 9 个 `vw_ai_*` 视图**不在本次范围**。

---

## 二、前置条件

| 项 | 要求 | 校验命令（PowerShell） |
|---|---|---|
| Node.js | >= 20 | `node -v` |
| 依赖已安装 | 仓库根执行过一次 | `npm install` |
| 知识产物最新 | `check:all` 通过 | `npm run check:all` |
| MCP Server 运行中 | `YF_MCP_PORT`（默认 4001）在监听 | `Invoke-RestMethod "http://localhost:4001/health"` |
| ERP 可达 | `/health` 返回 `tools:24` | 同上，检查 `tools` 字段 |
| 凭证 | `YF_USER_TOKEN` / `YF_COMPANY_ID` / `YF_BASE_URL` | 见 §2.1（**禁止入库**） |

### 2.1 凭证准备（红线：一律不入库）

`.env` 已在 `.gitignore` 中。首次准备：

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` 需含：

```ini
YF_BASE_URL=http://{内网IP}
YF_COMPANY_ID={账套编号}
YF_USER_TOKEN={身份令牌}
YF_MCP_PORT=4001
```

> ⚠️ 令牌、账套名、内网 IP **一律不入库**。live 配置（`vitest.live.config.ts`）会自动读取仓库根 `.env`，无需手工 `$env:` 赋值。

### 2.2 MCP Server 启动（若未运行）

```powershell
cd D:\AIProject\claude\YFAgent\packages\yfcli-mcp
node dist/cli.js --http --port 4001
```

或使用 tsx 直跑源码：

```powershell
cd D:\AIProject\claude\YFAgent
npx tsx packages/yfcli-mcp/src/cli.ts --http --port 4001
```

**服务已运行时跳过本步** —— 本测试计划只消费服务，不重启、不改造。

---

## 三、执行步骤

### 3.1 一键执行（推荐）

```powershell
cd D:\AIProject\claude\YFAgent
$env:YF_LIVE = "1"
node scripts/run-live-e2e.mjs
```

脚本依次完成：
1. 校验 `YF_LIVE` / `YF_USER_TOKEN` / `/health`
2. 清空旧侧车 → 调 vitest 只跑 `*.live.test.ts`
3. 汇总 `runs/.live-sidecar/*.json` → 写出 `runs/e2e-<YYYYMMDD>.md`
4. 以 vitest 退出码作为脚本退出码

或经 npm script：

```powershell
npm run test:live
```

### 3.2 分包执行（调试用）

```powershell
cd D:\AIProject\claude\YFAgent\packages\yfcli-mcp
$env:YF_LIVE = "1"

# 全量
npx vitest run --config vitest.live.config.ts

# 只跑某对象
npx vitest run --config vitest.live.config.ts -t "sales.order"

# 只跑某个场景
npx vitest run --config vitest.live.config.ts -t "plant / create 新增"
```

### 3.3 离线门禁（必跑，确认 live 用例不影响既有套件）

```powershell
cd D:\AIProject\claude\YFAgent

# 五个包各自的离线套件（不应包含任何 live 用例）
foreach ($p in @('yfcli-sdk','yfcli-auth','yfcli-analysis','yfcli-experts','yfcli-mcp')) {
    Push-Location "packages\$p"
    npx vitest run
    Pop-Location
}

# 仓库校验（产物最新 + 无凭证泄漏）
npm run verify
```

**预期**：五个包全绿；`yfcli-mcp` 的 `vitest.config.ts` 已显式 `exclude: ['__tests__/live/**']`，故 live 用例不进入离线套件。

---

## 四、场景矩阵

判定分级：**✅ PASS**（符合预期）｜**⚠️ WARN**（结果可用但有口径限制/已登记缺陷，必须带原因）｜**❌ FAIL**（不符合预期，门禁不过）

### 4.1 主数据 CRUD（30 场景 [口径：5 对象 × 6 场景]）

对象与实测元数据（**容器名与主键列宽来自真机查证，不可按对象名推测**）：

| type_key | 主键 | 主键列宽 char(N) | 写操作容器名 | 名称字段 |
|---|---|---|---|---|
| `plant` | `plant_no` | 6 | `plant_data` | `plant_name` |
| `customer` | `customer_no` | 10 | `customer_basic_data_file_data` | `customer_name` |
| `supplier` | `supplier_no` | 10 | `supplier_basic_data` | `supplier_name` |
| `item` | `item_no` | 20 | `item_basic_data` | `item_name` |
| `warehouse` | `warehouse_no` | 10 | `warehouse_data` | `warehouse_name` |

> ⚠️ `customer` 的容器名**不是** `customer_data` —— 按对象名推测必错，会得到 `没有活动事务` 的误导性报错。

每个对象 6 个场景：

| # | 场景 | 操作 | 预期 | 判据 |
|---|---|---|---|---|
| 1 | `query` 全量取数 | `yf_query` | code=0 且返回 rows | `rows.length > 0`（无数据记 WARN） |
| 2 | `read` 按真实主键回读 | `yf_read` | 有效记录 > 0 | 下钻内层数组计数 |
| 3 | `read` 主键全错告警 | `yf_read` | code=0 但有效记录 = 0 | 证明不能只看 `code`/`item_count` |
| 4 | `create` 新增 | `yf_run` | code=0 **且 read 复核已落库** | 落库为唯一判据 |
| 5 | `update` 更改 | `yf_run` | code=0 且 read 复核新值生效 | 先 read 取全量基线 |
| 6 | `delete` 删除 | `yf_run` | code=0 | 记入残留清单（不清理策略） |

### 4.2 单据全链路（9 场景）

对象：`sales.order`，复合主键 `doc_type_no + doc_no`，容器 `sales_order_data`。

| # | 场景 | 预期 |
|---|---|---|
| 1 | `query` 全量取数 | code=0 且含 `doc_type_no` + `doc_no` |
| 2 | 枚举条件语义（前缀匹配 + 总数口径） | `"N"`/`"N."`/`"N.未审核"` 等价命中；哨兵值返 0；`total_result` 不随 `page_size` 漂移的断言**必失败**（已登记 blocker 缺陷） |
| 3 | `read` 复合主键回读 | 有效记录 > 0 |
| 4 | `read` 缺主键 | 被服务端显式拒绝 |
| 5 | `create` 新增 | 按官方契约（**不传 `doc_no`**，ERP 自动编号）→ create 成功且 read 复核落库 |
| 6 | `approve` 审核 | code=0（**需 4 键 datakeys**，见 §6.1） |
| 7 | `disapprove` 撤审 | code=0 |
| 8 | `update` 更改 | code=0（含单头全字段） |
| 9 | `delete` 删除 | code=0（已审核被拒属预期业务分支） |

### 4.3 智能问数（7 场景）

| 域 | 问题 | 期望模板 | 取数 type_key |
|---|---|---|---|
| 销售域 | 本月销售毛利是多少 | `sales_margin_by_order` | `sales.order` |
| 采购域 | 采购汇总按供应商统计 | `purchase_summary_by_supplier` | `purchase.order` |
| 库存域 | 库存成本按料号是多少 | `inventory_cost_by_item` | `item` |

每题两段 + 1 个降级场景：

1. `yf_ask(question)` 无 rows → 断言 `query_plan.template_id` 命中期望模板
2. `yf_query` 取数 → `yf_ask(question, rows)` → 断言 `executed=true` 且 `row_count` 与传入一致
3. **降级**：「今天天气怎么样」→ 断言 `executed=false` 且 `query_plan` 为空（**禁止编造数字**）

### 4.4 归因分析（6 场景）

| 域 | 问题 | 取数 type_key | 口径说明 |
|---|---|---|---|
| 销售域 | 本月销售毛利下降的原因是什么 | `sales.order` | 销货收入 − 销货成本，审核码默认 Y |
| 生产域 | 工单材料成本异常的原因是什么 | `wo` | 工单入库批次级，不含独立领料明细 |

每域 3 步：

1. `yf_analysis_plan {action:'create', question}` → `success=true` 且返回 plan
2. `yf_analysis_step {plan_json, operation_json}` 无 rows → `executed=false` 且返回 `query_plan`
3. 取数后传 `rows_json` → `executed=true` 且返回 `result`

> 生产域口径限制是**已知事实**，写入报告不作为缺陷。

---

## 五、断言与判定规则

### 5.1 统一断言器（`__tests__/live/helpers.ts`）

| 函数 | 职责 |
|---|---|
| `extractRows` | 兼容 `yf_query` **扁平**返回与 `yf_run` **嵌套**返回两条形态 |
| `extractSuccessItems` | 兼容 `yf_read` 扁平返回与 `yf_run` 嵌套 `success` |
| `countRealRecords` | **下钻内层数组**判定是否真的查到记录（易飞错误主键返「外层 1 元素 + 内层空数组」） |
| `extractErrorMessages` | 兼容 `error[].message` 与 `error[].information[].message` 双结构 |
| `firstNodePayload` / `nodeNames` | 解包 `{ <node>: [ {...} ] }` 与 `{ <node>: {...} }` 两种节点形态 |
| `assertNotFailed` | 场景 `FAIL` 时让套件真正变红；`WARN` 无 note 视为断言失败 |

### 5.2 易飞硬约束（本计划据此设计断言）

| # | 约束 | 本计划如何验证 |
|---|---|---|
| 1 | 成功判据 `code === '0' \|\| '-0'`，禁止字符串匹配 description | 所有场景只看 code |
| 2 | 主键全错返 `code=0` + 空数组 | §4.1 场景 3（下钻计数） |
| 3 | 错误 token 返 HTTP 500 + HTML | 不在本轮（由 SDK 单测覆盖） |
| 4 | `conditions` 必须对象形态 | `yf_query` 工具已封装 |
| 5 | 枚举字段等值条件按**前缀匹配**（`N` / `N.` / `N.未审核` 等价） | §4.2 场景 2 双向验证（已修正旧结论） |
| 5b | `total_result` 是「本页行数 + 1」哨兵，**非总行数** | §4.2 场景 2 total_result 漂移断言 |
| 7 | 写操作容器值**必须是数组** | 全部 create/update 用 `{ <container>: [ {...} ] }` |
| 8 | 主键为定长 `char(N)` | `testKey(maxLen)` 按列宽截断 |

### 5.3 结论口径

- **通过判据**：`❌ FAIL === 0`
- **WARN 允许条件**：必须带 `note` 说明原因（口径限制 / 已登记缺陷 / 账套无数据）
- **报告必带三节**：场景矩阵、发现的缺陷、残留测试数据清单

---

## 六、已锁定的事实（真机查证，实施时直接采用）

> ✅ **2026-10-10 更新：本节 6.1 / 6.2 对应的 6 条缺陷已全部修复并真机验证。**
> 详见 `.trellis/tasks/post-mvp-live-defect-remediation`。
> 下方仍保留「事实描述」用于理解约束，但「处理方式」已改为**已落地**。

### 6.1 approve / disapprove 额外键：判别规则已确立 ✅ 已修并推广

```jsonc
// ❌ 只传主键 → code=-1「取得傳入鍵值資料失敗，找不到:...datakeys[0].docdate」
{ "datakeys": [{ "doc_type_no": "0221", "doc_no": "20240703001" }] }

// ✅ 主键含 doc_no 的对象需补齐 docdate + approvedate
{ "datakeys": [{
    "doc_type_no": "0221", "doc_no": "20240703001",
    "docdate": "20240703", "approvedate": "20240703"
}] }
```

**判别规则（2026-10-10 真机实测 15 个对象，0 例外）**：

| 主键形态 | 是否需要额外键 | 实测证据 |
|---|---|---|
| **含 `doc_no`**（「单别 + 单号」式单据） | 需 `docdate` + `approvedate` | sales.order / purchase.order / wo / inventory.transaction / ap.refund.doc / ar.refund.doc / collection.doc / inquiry / ecn / other.payable.doc / expense.invoice / op.stockin / picking.receipt / accounting.voucher / approve.price —— 仅传主键 `-1`、补键后 `0` |
| **不含 `doc_no`**（如 `bom` 用 `master_item_no`） | **不需要** | `bom` 仅传主键 `-1`、补键仍 `-1` |

⚠️ 判别分子是「主键含不含 `doc_no`」，**不是**「属不属于单据域」——
`bom` 是单据类对象但主键不含 `doc_no`，实测确认不需要额外键。

`typekey_map.yaml` 已由**规则推导**生成该字段（不再是逐对象手工登记表）：

```yaml
  primary_key: [doc_type_no, doc_no]
  operation_extra_keys:   # approve/disapprove 除主键外还需的键值，缺则报「找不到:...datakeys[0].xxx」
    approve: [docdate, approvedate]
    disapprove: [docdate, approvedate]
```

生成处：`scripts/extract-typekey-map.mjs` 的 `resolveExtraOperationKeys(typeKey, primaryKey)`；
例外走 `EXTRA_OPERATION_KEYS_OVERRIDES` 覆盖表（当前为空）。
重跑 `npm run gen:typekey` 后 `operation_extra_keys` 出现 **61 次**
（[口径：`primary_key` 含 `doc_no` 的对象数]）。

SDK 已提供 `catalog.requiredDataKeys(typeKey, operation)` 返回完整键集，
`assertDataKeysCoverPrimary` 会在本地提前拦截缺键（`kind=primary_key_missing`），
不再让调用方看到误导性的服务端报错。

防复发：`packages/yfcli-sdk/__tests__/catalog/typekey-catalog.test.ts` 新增 4 例，
直接读真产物 `typekey_map.yaml` 断言（含 `bom` 对照样本与 `sales.order` 回归锚点）。

### 6.2 写操作返回契约 ✅ 已修

- 容器值传**单对象**（非数组）→ `DoAction Exception:没有活动事务。`（不报字段错误，极难定位）
- `create` 失败时 `execution.code` 仍为 `"0"`、`description` 为 `"执行成功"`，真实原因藏在 `parameter.result.error[].information[].message` + `data`
- `yf_run` 原只回 `{items, empty, serviceName}`，**丢弃整个 ERP 信封** → 调用方拿不到失败原因

**修复后行为**：

| 层面 | 变更 |
|---|---|
| SDK 判定 | `assertBusinessOk` 对**写操作**新增「假成功」检查：`code=0` 且 `error[]` 非空 → 抛 `silent_business_error`。query/read 不启用，避免误伤读取 |
| SDK 错误模型 | 新增 kind `silent_business_error`；`parseErrorEntries` 补 3 条真机文案归类（字段不可空白 / 输入的信息不符合范围 / 输入的data并不存在） |
| 工具返回 | `yf_run` 新增 `describeRunError()`，把 `kind` / `erp_description` / `erp_errors`（含缺失字段清单）摊平回传 |

**仍然有效的判定规则**：`create`/`update` 以「**read 复核是否落库**」为最终成功判据 ——
SDK 的拦截是防线之一，落库复核才是终极依据（本测试套件即如此断言）。

### 6.3 容器名查证结果

| type_key | 正确容器名 | 按对象名推测（错） |
|---|---|---|
| `customer` | `customer_basic_data_file_data` | `customer_data` |
| 其余主数据 | `{object}_data` / `{object}_basic_data` | — |

### 6.4 主键列宽（`knowledge/data-dictionary/field-index.csv`）

| 对象 | 物理表 | 主键列 | 宽度 |
|---|---|---|---|
| plant | CMSMB | `MB001` | char(6) |
| warehouse | CMSMC | `MC001` | char(10) |
| customer | ACRMB | `MB001` | char(10) |
| supplier | ACRMB | `MB002` | char(10) |
| item | INVMB | `MB001` | char(20) |
| sales.order 单别/单号 | COPTG | `TG001` / `TG002` | char(4) / char(11) |

超长会被 SQL 拒绝并回 `将截断字符串或二进制数据`。

### 6.5 枚举条件语义 ✅ 旧结论已推翻（2026-10-10 复验）

**旧记载**（本计划 §5.2 第 5 条、`AGENTS.md` §1 原文）：枚举条件只认纯编码，
传回参原样 `Y.已审核` 会静默返 0 条。

**复验结论：该记载是取样错误。** 当时 `page_size=5` 且样本恰好 5 条，
「返 0 条」的其实是**另一个字段**，被误归因到枚举。

真机实测（销单 928 条 [口径：`page_size=1000` 一次取完的 `count`]）：

| `approve_status` 条件 | `count` | 命中行实际值 |
|---|---|---|
| `"N"` / `"N."` / `"N.未审核"` | 均为 201 | 全为 `N.` |
| `"Y"` / `"Y."` / `"Y.已审核"` | 均为 201 | 全为 `Y.` |
| `"U"` | 2 | `U` |
| `"Z"` / `"__NO_SUCH_VALUE__"` | 0 | — |

→ 该字段等值条件按**前缀匹配**，`N` / `N.` / `N.未审核` 三者等价。

### 6.6 `total_result` 是分页哨兵，不是总行数 ⚠️ blocker（未修）

| `page_size` | `count` | `total_result` |
|---|---|---|
| 1 | 1 | 2 |
| 5 | 5 | 6 |
| 50 | 50 | 51 |
| 1000（一次取完） | **928** | **928** |

`total_result` = 「本页行数 + 1」，随 `page_size` 漂移。销单实际 928 条，
`page_size=5` 时却只报 6。**Agent 若拿它当业务总数 → 静默偏小错误。**

正确取数：`page_size` 放大到一次取完（上限 10000），或翻页累加 `count`；
`has_next` 才是翻页依据。已登记 `.trellis/tasks/post-mvp-query-total-result-semantics`。

### 6.7 `sales.order` create 契约（官方样本取证）

`docs/易飞OpenAPI.json` 中 `yf.oapi.sales.order.data.create` 的官方样本：

```jsonc
{ "std_data": { "parameter": { "sales_order_data": [ {
  "doc_type_no": "022W", "customer_no": "00WN", "customer_doc_no": "00WN",
  "plant_no": "01", "trans_currency": "RMB", "doc_date": "20240826",
  "project_no": "0001", "tax_type": "1",
  "sales_order_detail_data": [ { "doc_type_no": "022W", "seq": "0001", "item_no": "00WC", ... } ]
} ] } } }
```

要点：
- **不传 `doc_no`** —— 由 ERP 依单别自动编流水。手工传单号会报
  「`doc_no(TC002)`: 是新增加不可传入栏位」。
- **必须带至少一条单身**，否则报「取得单号失败 !」。
- 二者叠加时表现为 `code=0` + `error[]` 非空（假成功），由 SDK 防线拦截。

⚠️ 本账套按该契约复跑仍被拒（「输入的 data 并不存在, 请重新输入」），
该路径待易飞端确认 —— 见 `.trellis/tasks/post-mvp-sales-order-create-contract`。
---

## 七、产物与报告

### 7.1 产物清单

| 产物 | 路径 | 入库 |
|---|---|---|
| live 测试基础设施 | `packages/yfcli-mcp/__tests__/live/helpers.ts` | ✅ |
| 主数据场景 | `.../live/crud-master.live.test.ts` | ✅ |
| 单据场景 | `.../live/crud-document.live.test.ts` | ✅ |
| 问数场景 | `.../live/ask.live.test.ts` | ✅ |
| 归因场景 | `.../live/attribution.live.test.ts` | ✅ |
| 侧车写入 | `.../live/sidecar.ts` | ✅ |
| 报告生成 | `.../live/report.ts` | ✅ |
| live vitest 配置 | `packages/yfcli-mcp/vitest.live.config.ts` | ✅ |
| 执行入口 | `scripts/run-live-e2e.mjs` | ✅ |
| 真机报告 | `runs/e2e-<YYYYMMDD>.md` | ❌（gitignore） |
| 侧车结果 | `runs/.live-sidecar/*.json` | ❌（gitignore） |

### 7.2 报告结构

```
# YFAgent 真机端到端场景测试报告
一、结论汇总    —— 场景数/对象数/通过判据/耗时
二、场景矩阵    —— 场景|对象|操作|预期|实测|结论|耗时|备注
三、发现的缺陷  —— 严重度|标题|场景|详情
四、残留测试数据清单 —— 对象|主键|说明
```

### 7.3 残留数据说明

按既定策略**不清理、只标记**。读方需知：

- 报告第四节列出全部残留主键，供人工决定是否删除
- 测试键格式：`T` + base36 时间戳（按列宽截断）；销单号格式：`TEST` + base36
- 删除方式（人工，需谨慎）：

```powershell
# 例：删除本轮残留的 plant
# 走 MCP：yf_run { type_key:'plant', operation:'delete', input:{ datakeys:[{ plant_no:'TX5VWA' }] } }
```

---

## 八、已知限制与开放项

| # | 项 | 说明 |
|---|---|---|
| 1 | 单身（`*_detail_data`）存在性未验证 | 当前账套取样单别无单身数据，需有单身的单别复验 |
| 2 | 主数据 create 必填字段不全 | `customer`/`supplier`/`item`/`warehouse` 必填字段较多（ERP 回传缺失清单），本轮只验证「假成功防线」；正向 create 见 `.trellis/tasks/post-mvp-master-create-fields` |
| 2b | `sales.order` create 契约未跑通 | 已按官方样本（不传 `doc_no` + 带单身）复跑，仍被拒「输入的 data 并不存在」；见 `.trellis/tasks/post-mvp-sales-order-create-contract` |
| 3 | 问数/归因数字未与 ERP 报表核对 | 本轮只验证链路打通与确定性计算，未做数值口径比对 |
| 3b | `total_result` 口径缺陷未修 | `total_result` = 「本页行数 + 1」哨兵，禁止当总数；见 `.trellis/tasks/post-mvp-query-total-result-semantics` |
| 4 | Token 有效期与刷新语义 | **文档未说明**，本轮只做「可用/不可用」判定 |
| 5 | `page_size` 真实性能 | 单次粗测不可靠，需大数据量账套复测 |
| 6 | 未覆盖对象 | `wo` 工单、财务域、其余 95 个 type_key 未纳入本轮 |
| 7 | 枚举「前缀匹配」边界未穷举 | 仅对 `approve_status` 验证；其余枚举字段是否同样前缀匹配待复验 |

---

## 九、WorkBuddy 执行校验清单

供 WorkBuddy 侧独立复跑，逐项勾选：

```powershell
# ── 步骤 0：环境 ──
node -v                                        # >= v20

# ── 步骤 1：依赖与知识产物 ──
cd D:\AIProject\claude\YFAgent
npm install
npm run check:all                              # 期望：全部通过

# ── 步骤 2：确认 MCP 服务健康 ──
Invoke-RestMethod "http://localhost:4001/health" | ConvertTo-Json -Compress
# 期望：{"status":"ok", ..., "tools":24, ...}

# ── 步骤 3：离线门禁（确认 live 用例不影响既有套件）──
foreach ($p in @('yfcli-sdk','yfcli-auth','yfcli-analysis','yfcli-experts','yfcli-mcp')) {
    Push-Location "packages\$p"; npx vitest run; Pop-Location
}
# 期望：全绿；yfcli-mcp 不含 live 用例

# ── 步骤 4：确认 live 用例在未启用时全部 skip ──
Push-Location packages\yfcli-mcp
npx vitest run --config vitest.live.config.ts
Pop-Location
# 期望：全部 skipped，且**不发起任何网络请求**

# ── 步骤 5：真机执行 ──
$env:YF_LIVE = "1"
node scripts/run-live-e2e.mjs
# 期望：退出码 0；末行输出「场景 N ｜ ✅a ⚠️b ❌c」且 c = 0

# ── 步骤 6：核验报告 ──
Get-ChildItem runs\e2e-*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content (Get-ChildItem runs\e2e-*.md | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
# 期望：含「一、结论汇总 / 二、场景矩阵 / 三、发现的缺陷 / 四、残留测试数据清单」四节
```

### 通过标准

| 项 | 标准 |
|---|---|
| 离线门禁 | 五包全绿，且 `npm test` 不连真机 |
| skip 行为 | 未设 `YF_LIVE` 时 52 个 live 场景全部 skipped |
| 真机门禁 | `❌ FAIL === 0`，脚本退出码 0 |
| 报告完整性 | 四节齐全，缺陷与残留清单齐备 |
| 凭证安全 | 报告中无 token / 内网 IP / 账套名以外的敏感信息；`npm run scan:secrets` 通过 |

### 预期观察（2026-10-10 复跑基线）

- 主数据：五个对象的 `query`/`read`/`read-空结果告警` 必全绿；`plant` 可完整跑通 create→update→delete
- 主数据：`customer`/`supplier`/`item`/`warehouse` 的 create **预计仍报未落库**，但状态应为
  「SDK 已拦截假成功（success=false）」→ **计 PASS**（防线生效）；若计 WARN 且登记了 blocker，说明防线回归
- 单据：`query`/`query-枚举语义`/`read`/`read-缺主键` 必全绿；`create` 预计 WARN（契约未跑通）
- 单据：`approve`/`disapprove`/`update`/`delete` **因 create 未成功而跳过**（WARN，带 note）
- 问数：三域路由与确定性计算均 PASS；降级场景（「今天天气」）必须 `executed=false`
- 归因：销售域与生产域均 PASS
- 缺陷节：预计 1 条 blocker（`total_result` 口径），❌ FAIL 必须为 0

**实测基线（2026-10-10 复跑）**：`场景 52 ｜ ✅38 ⚠️14 ❌0 ｜ 对象 9 ｜ 缺陷 1 ｜ 残留 1`，退出码 0。

> 若 WorkBuddy 侧结果与上述不一致，请记录差异并比对 `runs/e2e-*.md` 的「三、发现的缺陷」节。

---

## 十、相关文档

| 文档 | 内容 |
| `packages/yfcli-skill-openapi/SKILL.md` | Agent 侧操作规范（硬性约束 11 条，v0.4.0） |
| `AGENTS.md` | 易飞 OpenAPI 硬约束 + 工程纪律（红线） |
| `docs/plans/yf-live-probe-report.md` | 2026-10-08 真机探测报告（首轮环境验证） |
| `packages/yfcli-skill-openapi/SKILL.md` | Agent 侧操作规范（硬性约束 8 条） |
| `docs/DEPLOYMENT.md` | MCP Server 部署与健康检查 |
| `docs/decisions/STATISTICS-SPEC.md` | 统计口径规范（口径标签铁律） |
