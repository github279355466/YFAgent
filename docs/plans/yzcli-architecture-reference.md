# YZCLI 架构实证参考（对标易飞 YFAgent）

> **文档定位**：本文是**架构参考**，不是调研流水。回答「YZCLI 是怎么搭的、哪些能抄、哪些必须重写」。
>
> **读者**：第一次接触本项目的外部开发者，或准备做易飞（YF/E10）产品线 AI 助手、对标 YZCLI 的工程师。
>
> **核查方式**：2026-10-09 对 `D:/AIProject/claude/YZCLI` 做**只读**源码核查（未修改任何文件），逐条结论回链到文件路径与行号。
>
> **为什么需要这份文档**：YFAgent 是易飞 YF/E10 产品线的 AI 助手工程（下称「本工程」），架构对标易助产品线的 YZCLI。
> 「对标」很容易被误读成「照抄」。本文的结论是：**YZCLI 的协议与防护骨架值得移植，元数据 / 模板 / 视图 / 业务公式必须从零重建。**
> 想知道哪些能抄、哪些不能，先读第五节。
>
> **数字口径规则**：本文所有规模数字都带口径标签（`[口径：…]`）。这是本工程铁律
> （见 `AGENTS.md` 与 `docs/decisions/STATISTICS-SPEC.md`）：**禁止裸数字，禁止跨口径相减**。
> 读到一个数字若看不到它的口径标签，请视为该数字不可用。

---

## 一、规模概览

| 项 | 数值 | 口径 |
|---|---|---|
| TS 生产代码 | **25,091 行** | `[口径：11 个包，排除 node_modules / dist 与 *.test.ts]` |
| npm 包 | 11 个 | `[口径：packages/* 一级目录]` |
| MCP 工具 | 22 个 | `[口径：packages/yzcli-mcp/src/tools/*.ts 中 server.tool( 出现次数]` |
| 领域专家 | 9 个 | `[口径：experts/*/ 一级目录数]` |
| Agent Skill | 1 份 SKILL.md + 7 份 references + 22 个业务场景包 | `[口径：skills/yzcli-erp/ 目录内容]` |
| 测试规模 | 115 个 `.test.ts` / 973 个用例 / 252 个 describe | `[口径：vitest 3.2.1，grep it( / test( 与 describe(]` |

**总体判断**：25,091 行 [口径：11 个包，排除 node_modules/dist 与 *.test.ts] 中，**约 90% [口径：按行数估计，未逐行分类]
是与易助 ERP 业务强绑定的元数据、SQL 模板、只读视图定义与业务公式**。真正与 ERP 品牌无关、
可被本工程复用的只有「协议与防护骨架」，量级约 300~500 行 [口径：第三节三项资产行数之和]。

---

## 二、授权模块 —— YZCLI 最薄的一环

**这是本工程阶段一的主要工作量所在。**

**YZCLI 不存在独立的 auth 包。** 认证逻辑分散在 4 处：

| 层 | 位置 | 事实 |
|---|---|---|
| SDK | `packages/yzcli-sdk/src/config.ts`（67 行）/ `client.ts`（201 行） | token 存实例字段；**`loadConfig()` 只映射 baseUrl / timeout / fieldMode，从不读 token** → 走 `config.yaml` 拿不到 token，必须由调用方注入 |
| MCP | `packages/yzcli-mcp/src/erp-client.ts`（21 行） | 注释明确「Token **ALWAYS** passed from caller — **NEVER** from config」；`http-server.ts:21-27` 的校验仅「非空 + 长度 ≥ 8」 |
| Gateway | `auth/token-map.ts`（40 行）+ `auth/jwt.ts`（67 行） | 双 Token 映射（Token A = 网关身份 / Token B = ERP 身份），`POST /api/v1/token/issue` 签发，默认 8 小时过期 |
| Python | `src/yzcli/core/config.py`（173 行） | 默认 `base_url` 为 `{内网IP}:8103`，与 TS 侧 `localhost:8103` **不一致** |

**缺失能力清单**（无OAuth / 无 refresh / 无 token 缓存 / 无重试 / 无 ERP 连通性健康检查）。
ERP token 是人工从 **TPASC19 作业**取出的静态字符串，靠 header 透传。

> **给本工程的含义**：不要把 YZCLI 的授权层当参考实现。它的价值是反面基准 ——
> 说明「认证必须由调用方显式注入」这一约束是真实存在的（这一条值得沿用），
> 而除此之外的完整性（过期、刷新、缓存、健康检查）都需要本工程自己设计。

---

## 三、可移植的资产（约 300~500 行 [口径：本节三项资产行数之和]）

| 资产 | 规模 | 为什么能移植 |
|---|---|---|
| **SQL 模板注册制 + 执行器防护** | `runtime/sql/template.ts` 150 行 + `executor.ts` 156 行 | 与 ERP 品牌无关。防护要点：只读起始关键字校验、14 个禁用词整词匹配、禁分号、必带 `:max_rows`、参数不内联（交驱动绑定）、`maxRows = min(调用方, 模板, 数据源)` 三重取小、审核码列名对照校验。**沿用 mssql 则 SQL 方言无需改动** |
| **凭据红线** | `config.ts` 129 行 | 密码只从环境变量取（配 `password_env`）、`FORBIDDEN_KEYS` 拒明文（含 `user`）、`limits` 必填、`allowed_templates` 为空即抛错（「禁止全开」） |
| **只读视图交付范式** | `scripts/create-ai-views.sql` 155 行 | 9 视图 + DROP/CREATE 幂等 + 由 DBA 执行 + `GRANT SELECT ... TO yzai` 注释 + 独立验证脚本。**视图内容全部需重写，交付形态可照搬** |

> **沿用前提**：本工程的 analysis 层沿用 PostgreSQL / SQL Server 直连路线时，这套执行器防护是唯一必须逐字重写的部分。
> 见 `docs/plans/yf-db-direct-connect-probe.md` 与 `docs/TODO-PLAN.md` 的 D-13。

---

## 四、必须新写（约占 YZCLI 全仓 90% 行数 [口径：按行数估计]）

| 项 | 规模 | 口径 | 为什么不能抄 |
|---|---|---|---|
| **元数据 `erp-metadata.json`** | 245,455 行 | `[口径：单文件行数]` | 易助后台表结构 |
| **元数据 `agent_typekey_map.yaml`** | 2,545 行 / 110 个 TypeKey | `[口径：单文件行数 / 键数]` | 易助业务对象 |
| **元数据 `analysis-view.json`** | 15,445 行 | `[口径：单文件行数]` | 易助视图定义 |
| **20 个 SQL 模板** | `templates.ts` 591 行 | `[口径：单文件行数]` | 全查易助表（`JSKLOA` / `JSKLNA` / `SGMQLA` / `SGMQKA` / `DCSHDA`…），与易飞零重叠可能 |
| **9 个 `vw_ai_*` 视图** | DDL 位于 `scripts/create-ai-views.sql:20-152` | `[口径：行号区间]` | 全查易助后台表，易飞须重新调研建模 |
| **License 体系**（仅商业化需要） | 4,126 行 | `[口径：gateway license 1,405 + MCP guard 172 + license-server 2,064 + admin 485]` | 与授权实现耦合 |
| **Gateway 多租户层** | 3,906 行 | `[口径：单模块行数]` | **单用户场景 MVP 可整体砍掉** |
| **专家业务逻辑** | 35 文件 / 3,815 行 | `[口径：experts/yzcli-experts 文件数 / 行数]` | 8 个域的公式全绑定易助科目语义 |
| **`yzcli-finance` 包** | 9 文件 / 1,327 行 | `[口径：文件数 / 行数]` | 与 experts 的凭证能力重叠且无交叉引用 → **建议不复刻这个重复** |

---

## 五、三个必须警惕的架构事实

### 事实 1：不要因为「YZCLI 有」就假定问题已解决 —— 它自身还有 3 个缺口

| 缺口 | 证据 |
|---|---|
| **无生产 mssql driver** | `packages/yzcli-analysis` **零运行时依赖**；`SqlDriver` 只是接口定义（`runtime/sql/executor.ts:24-37`）。唯一的真实 driver 在 `scripts/verify-ai-views.mjs:33` —— **那是验证脚本，不是生产代码** |
| **LLM 端到端真实取数链路未通** | `analysis/src/__tests__/end-to-end.test.ts:22` 自述被 `user_token` 阻塞 |
| **四层防护只落地 2 层** | L1 模板注册制（`runtime/sql/template.ts:62-84`）+ L2 执行器约束（`executor.ts` 全文）已落地；**L3 部署约束 / L4 治理无任何代码**，仅纸面规范 |

> ⚠️ **常见误引用**：项目内文档 `docs/erp_analysis/11-B方案-SQL补充数据源设计.md:23`（写于 2026-08-29）
> 标注 L2/L3/L4 待落地，但**L2 实际已落地**。准确表述是：**设计四层，代码两层**。
> 引用 YZCLI 的防护能力时不要沿用那份文档的措辞。

### 事实 2：视图与 SQL 模板是两套并行取数路径，且未打通

20 个模板**全部直查物理表，不查 `vw_ai_*`**。视图仅在语义层被**引用为字符串**：

- `packages/yzcli-analysis/src/semantic/model.ts:161-243` 的 `data_binding.type="computed_view"`
- `packages/yzcli-analysis/src/rules/metric-registry.ts:274-317`

→ 说明 YZCLI 自己就存在「**视图建了但没人查**」的沉淀。
**本工程必须从一开始就把这两条路打通**，否则会原样继承这个缺陷。
这是本工程 analysis 层设计（D-13 / D-14）的首要约束。

### 事实 3：审核码口径陷阱（易助侧真机实测数据）

`templates.ts` 抬头记录了真机实测：不过滤审核码时「**已审核 24 单 5,817 万 vs 未审核 13 单 7.28 亿**」
→ **不筛选会污染 12 倍** [口径：同一单据集合，含税金额合计，未按审核码过滤 vs 过滤后的对比]。

**本工程对应口径**：`approve_status='Y'`。

- 易助侧为 `'T'`，**易飞侧 `'T'` 需改为 `'Y'`**
- 易飞实测为 **Y / N / V 三值**，其中 **V = 作废**（用户 2026-10-09 裁决），统计**只筛 `Y`**

详见 `docs/plans/inv-monthly-stats-spec.md` 与 `docs/plans/analysis-table-mapping.xlsx`。

---

## 六、其他规模数字（带口径）

- **MCP 工具 22 个** `[口径：packages/yzcli-mcp/src/tools/*.ts 中 server.tool( 出现次数]`；
  **无集中式注册表**，靠 `packages/yzcli-mcp/src/index.ts:113-138` 逐个显式调用
- **Agent Skill刻意做薄** —— `skills/yzcli-erp/SKILL.md` v4.3.0 的设计意图是
  「路由 / 组装 / 字段映射 / 防幻觉规则**已编入 MCP 二进制**，Skill 仅留角色定义与助手 Prompt」。
  本工程若对标，应照此分工：能力进二进制，Skill 只留Prompt。
- **专家 9 个** `[口径：experts/*/ 一级目录数]`：`ap` / `ar` / `cost` / `gl` / `plan` / `production` / `purchase` / `sales` / `yizhu-erp-ai-expert`
- **生产 mssql 集成测试未做** —— `runtime/sql/__tests__/sql-executor.test.ts:40` 用的是 `fakeDriver()`
- **模板白名单比模板库窄** —— `config/analysis-sql.example.json` 的 `allowed_templates` 只列**15 个**，
  而模板库有 **20 个** `[口径：上述两处分别为配置文件键数与 templates.ts 导出数]`

---

## 七、结论速查（给决策者）

| 问题 | 答案 |
|---|---|
| YZCLI 能直接抄吗？ | **不能。** 约 90% 行数绑定易助业务 [口径：按行数估计] |
| 抄什么？ | SQL 模板注册制 + 执行器防护（`template.ts` + `executor.ts`，共 306 行 [口径：两文件行数之和]）、凭据红线（`config.ts` 129 行）、只读视图交付范式（`create-ai-views.sql` 155 行） |
| 授权层能抄吗？ | 只能抄「token 必须由调用方注入」这一约束；其余全部需自行设计 |
| 多租户 / License 要做吗？ | MVP **不做** —— 多租户 3,906 行可整体砍掉 [口径：Gateway 多租户模块行数] |
| 本工程最大的架构风险是什么？ | 复制事实 2 —— **视图与模板两条取数路径必须一开始就打通** |

---

## 相关文档

| 文档 | 内容 |
|---|---|
| `docs/plans/yf-db-direct-connect-probe.md` | 本工程数据库直连实测 + 与 YZCLI 的架构对比 |
| `docs/plans/dual-product-line-architecture.md` | 双产品线架构设计（注册表 + 共享判定逻辑） |
| `docs/plans/inv-monthly-stats-spec.md` | 库存月档字段语义 + 期末公式（视图设计依据） |
| `docs/TODO-PLAN.md` | D-13 建 analysis 层 / D-14 视图建库脚本 |
| `AGENTS.md` | 本工程纪律铁律 |
| `docs/decisions/STATISTICS-SPEC.md` | 统计口径规范 |