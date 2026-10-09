# P4 · 分析层 + 智能问数

> **slug**：`mvp-p4-analysis-qa` ｜ **优先级**：P0 ｜ **工作量**：XL（8~12 天）｜ **进度**：0%
>
> 阶段目标：建analysis 层 + 智能问数模块，走**数据库直连 + 只读视图**。
> 这是用户指定的第 4 项「实现分析和智能问数模块」，对应 `docs/TODO-PLAN.md` 的 **D-13 + D-14**。
>
> 依赖：**`mvp-p3-auth-integration`**（智能问数端到端需要鉴权与健康检查）。
> 外部硬阻塞：**客户侧 DBA 执行视图 DDL** —— 视图是本阶段地基，无降级方案。
>
> ## ★ 本工程最大架构风险
> YZCLI 的 20 个模板**全部直查物理表，不查 `vw_ai_*`**；视图仅在语义层被**引用为字符串**（`packages/yzcli-analysis/src/semantic/model.ts:161-243` 的 `data_binding.type="computed_view"`、`packages/yzcli-analysis/src/rules/metric-registry.ts:274-317`）。
> → YZCLI 自己就沉淀了「**视图建了但没人查**」的缺陷。**本工程必须从一开始打通，硬门禁：模板中出现物理表名即 `check` 失败。**

---

## 目录结构导航

```
D:/AIProject/claude/YFAgent/
├── packages/yfcli-analysis/               [新增 · 本阶段主交付]
│   ├── src/
│   │   ├── runtime/sql/
│   │   │   ├── config.ts                 凭据红线（可移植 YZCLI 129 行 + 改）
│   │   │   ├── template.ts               模板注册制（可移植 YZCLI 150 行）
│   │   │   ├── templates.ts              ★ 20 个模板（全部新写）
│   │   │   ├── executor.ts               执行器防护（可移植 YZCLI 156 行 + 改）
│   │   │   └── driver-mssql.ts           ★ 生产 mssql driver（YZCLI 缺）
│   │   ├── semantic/
│   │   │   ├── model.ts                  语义模型（data_binding）
│   │   │   └── metric-registry.ts        指标注册表
│   │   └── qa/                           智能问数
│   │       ├── router.ts                 自然语言 → 模板路由
│   │       ├── extractor.ts              参数抽取
│   │       └── answer.ts                 带口径标签输出
│   └── tools/verify-integration.mjs      ★真实库集成测试（不用 fakeDriver）
├── sql/views/                            [新增 · D-14 交付物]
│   ├── vw_ai_inventory_cost.sql
│   ├── ...（共 9 个）
│   └── _verify.sql                       独立验证脚本
├── config/
│   └── analysis-sql.example.json         allowed_templates 白名单
├── docs/guides/
│   └── OPERATIONS-性能基线.md            性能基线（易飞无 fastquery）
└── packages/yfcli-auth/                  [P3 产出] 凭据红线复用
```

---

## 模块职责速查

| 模块 / 路径 | 职责 | 可移植性 | YZCLI 对应物 |
|---|---|---|---|
| `runtime/sql/template.ts` | 模板注册制（L1 防护） | ✅ **可移植 150 行** | `runtime/sql/template.ts:62-84` |
| `runtime/sql/executor.ts` | 执行器约束（L2 防护）：只读起始关键字 / 14 个禁用词整词匹配 / 禁分号 / 必带 `:max_rows` / 参数不内联交驱动绑定 / `maxRows = min(调用方, 模板, 数据源)` 三重取小 / 审核码列名对照校验 | ✅ **可移植 156 行**（沿用 mssql 则**方言不改**） | `runtime/sql/executor.ts` 全文 |
| `runtime/sql/config.ts` | 凭据红线：密码只从环境变量取（`password_env`）/ `FORBIDDEN_KEYS` 拒明文（含 `user`）/ `limits` 必填 / `allowed_templates` 为空即抛错 | ✅ **可移植 129 行** | `runtime/sql/config.ts` |
| `runtime/sql/driver-mssql.ts` | **生产 mssql driver** | ❌ **必须新写** | ⚠️ YZCLI **无生产 driver** —— `SqlDriver` 只是接口（`executor.ts:24-37`），唯一真实 driver 在 `scripts/verify-ai-views.mjs:33`（**验证脚本，不是生产代码**） |
| `runtime/sql/templates.ts` | **20 个模板**，全部只查 `vw_ai_*` | ❌ **必须新写** | `templates.ts` **591 行** / 20 个 `defineTemplate`；依赖 **16 表 / 85 字段**，易飞库**同名命中 0 张** |
| `sql/views/*.sql` | **9 个 `vw_ai_*` 只读视图 DDL** | 🟡 **交付形态可照搬，内容重写** | `scripts/create-ai-views.sql` **155 行**：9 视图 + DROP/CREATE 幂等 + 由 DBA 执行 + `GRANT SELECT ... TO yzai` 注释 + 独立验证脚本 |
| `semantic/model.ts` + `metric-registry.ts` | 语义模型与指标注册表 | 🟡 结构可参考 | `semantic/model.ts:161-243`、`rules/metric-registry.ts:274-317` |
| `qa/` 智能问数 | 自然语言 → 模板路由 → 参数抽取 → 执行 → 带口径输出 | ❌ 新写 | YZCLI **端到端未通**（`end-to-end.test.ts:22` 被 `user_token` 阻塞） |
| 元数据 | — | ❌ **全部新写** | `erp-metadata.json` **245,455 行** / `agent_typekey_map.yaml` 2,545 行 110 TypeKey / `analysis-view.json` 15,445 行 —— **全绑定易助后台表结构** |
| Gateway 多租户 | — | ❌ **整体砍掉** | **3,906 行** `[口径：Gateway 多租户模块行数]` |
| License 体系 | — | ❌ **整体砍掉** | **4,126 行** `[口径：gateway license 1,405 + MCP guard 172 + license-server 2,064 + admin 485]` |
| L3 部署约束 / L4 治理 | — | ⬜ **只做设计登记，不建代码** | ⚠️ YZCLI **无任何代码**，仅纸面规范 |

---

## 关键文件索引

| 文件路径 | 规模 | 作用 | 归属阶段 | 口径 |
|---|---|---|---|---|
| `packages/yfcli-analysis/src/` | 新建 | 分析层主体 | P4 | `[口径：新增]` |
| `sql/views/*.sql` | 9 个 | `vw_ai_*` 只读视图 DDL（D-14 交付物） | P4 | `[口径：对照 YZCLI create-ai-views.sql DDL 行号区间 20-152]` |
| `runtime/sql/template.ts`（YZCLI） | **150 行** | 模板注册制 —— **逐字重写** | P4 移植 | `[口径：单文件行数]` |
| `runtime/sql/executor.ts`（YZCLI） | **156 行** | 执行器防护 —— **逐字重写** | P4 移植 | `[口径：单文件行数]` |
| `runtime/sql/config.ts`（YZCLI） | **129 行** | 凭据红线 —— **逐字重写** | P4 移植 | `[口径：单文件行数]` |
| `scripts/create-ai-views.sql`（YZCLI） | **155 行** | 视图交付范式 —— **形态照搬，内容重写** | P4 参照 | `[口径：单文件行数]` |
| `templates.ts`（YZCLI） | **591 行 / 20 模板** | 模板清单与参数签名 —— **SQL 全部重写** | P4 参照 | `[口径：脚本解析 defineTemplate 块数]` |
| `runtime/sql/executor.ts:24-37`（YZCLI） | 接口定义 | ⚠️ `SqlDriver` **只是接口**，非生产实现 | P4 规避 | `[口径：行号区间]` |
| `scripts/verify-ai-views.mjs:33`（YZCLI） | —— | ⚠️ 唯一真实 driver 在**验证脚本**里，非生产代码 | P4 规避 | `[口径：行号]` |
| `__tests__/sql-executor.test.ts:40`（YZCLI） | —— | ⚠️ 集成测试用 `fakeDriver()`，生产 mssql 集成测试**未做** | P4 规避 | `[口径：行号]` |
| `semantic/model.ts:161-243`（YZCLI） | —— | ⚠️ 视图仅在此被**引用为字符串**（`computed_view`） | P4 打通 | `[口径：行号区间]` |
| `rules/metric-registry.ts:274-317`（YZCLI） | —— | ⚠️ 同上，视图未被任何模板真正查询 | P4 打通 | `[口径：行号区间]` |
| `config/analysis-sql.example.json`（YZCLI） | `allowed_templates` 只列 **15 个** | ⚠️ 白名单比模板库（20 个）窄 5 个 | P4 设一致性门禁 | `[口径：配置文件键数 vs templates.ts 导出数]` |
| `docs/plans/analysis-template-requirements.md` | 16 表 / 85 字段 | 模板依赖清单（易飞同名命中 **0 张**） | P4 实施 | `[口径：脚本解析 templates.ts 得字段引用数]` |
| `docs/plans/analysis-table-mapping.xlsx` | 85 项映射 | 表字段映射（用 `C:/Program Files/Python312/python.exe` + openpyxl 读） | P4 实施 | `[口径：xlsx 数据行数]` |
| `docs/plans/inv-monthly-stats-spec.md` | 296 行 | 库存月档期末成本公式（D-14 直接依据） | P4 实施 | `[口径：单文件行数]` |

---

## 当前进度

**0%** —— 尚未开始。

- [ ] `packages/yfcli-analysis/` 包骨架
- [ ] 9 个 `vw_ai_*` 只读视图 DDL（幂等）
- [ ] 20 个 SQL 模板（**全部只查视图，零直查物理表**）
- [ ] 执行器防护逐字重写
- [ ] **生产 mssql driver**（非接口）
- [ ] 真实库集成测试（**不用 `fakeDriver()`**）
- [ ] 智能问数端到端（LLM → 模板路由 → 参数抽取 → 执行 → 带口径输出）
- [ ] 性能基线粗测

---

## 下一步

| # | 动作 | 负责角色 | 产出物路径 |
|---|---|---|---|
| 1 | 裁决analysis 包分层 + **视图↔模板打通契约** + L1-L4 每层落地状态登记（L3/L4 明确标「设计登记，未实现」） | 架构师 | `docs/decisions/ADR-00X-analysis-分层.md` |
| 2 | 确认 85 项表字段映射（读 `analysis-table-mapping.xlsx`，用 `C:/Program Files/Python312/python.exe` + openpyxl） | 后端开发 + 架构师 | `docs/plans/analysis-table-mapping.xlsx`（就地补全） |
| 3 | 编写 9 个 `vw_ai_*` 视图 DDL（**幂等**：DROP/CREATE 或 `CREATE OR ALTER`；**不带 `COMPANY` 过滤**；附字段映射说明） | 后端开发 | `sql/views/*.sql` |
| 4 | 编写独立验证脚本（参照 YZCLI 独立验证脚本形态） | 后端开发 | `sql/views/_verify.sql` |
| 5 | **提交客户 DBA 执行视图 DDL**（本阶段**硬前置**，无降级方案） | 总监 | 交付清单 + 执行回执 |
| 6 | 逐字重写 `template.ts`（模板注册制）+ `executor.ts`（执行器防护）+ `config.ts`（凭据红线） | 后端开发 | `packages/yfcli-analysis/src/runtime/sql/` |
| 7 | 实现**生产 mssql driver**（参数化绑定，禁字符串拼接） | 后端开发 | `runtime/sql/driver-mssql.ts` |
| 8 | 实现 20 个模板，**全部只查 `vw_ai_*`**；设「模板含物理表名即门禁失败」检查 | 后端开发 | `runtime/sql/templates.ts` |
| 9 | 设白名单一致性门禁（`allowed_templates` 数量必须 == 模板库数量） | 后端开发 | `config/analysis-sql.example.json` |
| 10 | 实现智能问数：模板路由 + 参数抽取 + 带口径标签输出 | 后端开发 | `packages/yfcli-analysis/src/qa/` |
| 11 | 定义 20 模板的业务语义 + **每个口径标签的中文表述** + 问数话术 | 产品经理 | `docs/YFAgent/analysis/_metrics.md` |
| 12 | 性能基线粗测（`page_size: 10000` 响应时间 / 并发 / 慢查询分布） | 后端开发 + 测试 | `docs/guides/OPERATIONS-性能基线.md` |
| 13 | 编写验收用例：执行器防护 + **模板只查视图门禁** + 审核码污染回归 + **端到端 LLM 取数真跑** | 测试 | `packages/yfcli-analysis/src/__tests__/` |
| 14 | 「视图先行」架构纪律守护（**不许模板直查物理表**） | 总监 | 门禁报告 + 放行裁决 |

---

## 硬性约束与教训

### A. 易飞 OpenAPI 9 条硬约束
> 来源 `AGENTS.md`，2026-10-08 真机实测。**本阶段走数据库直连，9 条中主要涉及第 7、8 条**（分页与无 fastquery），其余约束在 P2 已落地。

| # | 约束 | 后果 | 本阶段相关性 |
|---|---|---|---|
| 1 | 枚举字段查询**只传编码**（回参是 `Y.已审核`，传 `Y.已审核` 静默返回 0 条） | 查不到数据，不报错 | 语义层枚举参数 |
| 2 | 主键全错返回 `code=0` + 空数组 | 不能用 `code` 判断「查到了」 | 模板查询结果判空 |
| 3 | 错误 token 返回 **HTTP 500 + HTML**（不是 JSON） | 解析 body 会崩，须先判状态码 | 由 P3 auth 层兜住 |
| 4 | `node_name` 用**逻辑节点名**（`*_data`），不是物理表名 | 传 `ACTTA` 报 `MA012未定義` | —— |
| 5 | 服务名**只能查表，禁止拼接** | 按 `{type_key}.data.{op}.get` 拼接必错 | 语义层绑定服务名时 |
| 6 | `conditions` 必须是**对象形态** | 数组形态静默失效返回全量数据 | —— |
| 7 | 分页 `page_no` 从 **1** 开始，`page_size` 上限 **10000**（须实测标定） | 漏数据或超时 | ⚠️ **本阶段相关**：所有模板**必带 `:max_rows`**，且 `maxRows = min(调用方, 模板, 数据源)` 三重取小 |
| 8 | 易飞**无 `fastquery`**，所有查询重查数据库 | 与易助性能天差地别 | ⚠️ **本阶段核心**：直接影响 `max_rows` 默认值与是否需要缓存 |
| 9 | 成功判据 `execution.code === "0" \|\| "-0"` | 禁止字符串匹配 `description` | 结果判据 |

补充：`error[]` 有**双结构**（`{message,data}` 与 `{information:[...]}`），解析器必须都兼容，未识别时**必须打 WARN**；`error[].data` 会完整回显传入数据，写日志前须脱敏。

### B. 易助/易飞单据编码同码不同义 —— 必须转码
| 码 | 易助含义 | 易飞含义 | 处理 |
|---|---|---|---|
| `33` | 销货单 | 销售订单类 | **必须转码：易助 33 → 易飞 23** |
| `82` | 领料单 | 生产领料类 | **必须转码：易助 82 → 易飞 54** |
| `84` | 生产耗用 | ⚠️ 与易助不同义 | 逐单据确认后建转码表 |
| `85` | ⚠️ 与易助不同义 | ⚠️ 与易助不同义 | 逐单据确认后建转码表 |

→ **本阶段是这套冲突的主战场**：20 个模板中的单据类型码条件全部依赖它。
> 依据：易助 `templates.ts` 注释明确「单据来源代码（权威来源 `knowledge/match.ini` `[Source]`）：`33`=销货单 / `82`=领料…」
> → ⚠️ **易飞若无对应字典，20 个 SQL 模板全错**。见下方 §G 缺口。

**转码表必须集中管理，禁止散落硬编码在 SQL 里。**

### C. 审核码口径 —— ★ 本阶段最易出错的点
- 易飞实测三值：`Y` = 已审核 / `N` = 未过账 / `V` = **作废**（用户 2026-10-09 裁决）
- **统计只筛 `Y`**
- 易助侧是 `'T'` —— **勿沿用易助常量**
- 不筛审核码会污染 **12 倍** `[口径：同一单据集合，含税金额合计，未按审核码过滤 vs 过滤后对比；已审核 24 单 5,817 万 vs 未审核 13 单 7.28 亿，易助侧真机实测]`
- **执行器须有「审核码列名对照校验」**（可移植自 YZCLI `executor.ts`）—— 防止把 `Y`/`T` 写到错误的列上

### D. 工程纪律（本项目已踩坑 5 次）
| # | 规则 | 事故 |
|---|---|---|
| 1 | 含反引号的中文文本**必须落文件再执行**，禁止 `python -c` / `bash -c` 内联 | bash 把反引号当命令替换，46 MB 的 `易飞OpenAPI.json` 被当脚本逐行跑，孤儿进程报错 **57 分钟** |
| 2 | 写文件禁止 `(CR+LF).join(str)` 逐字符拼接 | 换行插到每个字符间，产出损坏 JSON |
| 3 | 统计数字必须带口径标签，禁止裸数字与跨口径相减 | 曾产生 9 个版本的「部分非标准表数」 |
| 4 | 破坏性验证只在副本上做，改完校验 sha1 还原 | 曾截断 `field-index.csv` |
| 5 | 全部文件 **CRLF 行尾 + UTF-8 无 BOM** | 混合编码与行尾导致门禁失败 |

附加铁律：
- **禁止直接改 `knowledge/data-dictionary/modules/`**（78 个机械产物，由脚本生成）
- **提交前必跑 `npm run verify`**（敏感扫描 + 四类产物校验）
- token / `CompanyId` / 内网 IP / 客户名 / 账套名**一律不入库**，走环境变量
- 临时脚本放 `.workbuddy/tmp/`（**不要用 `.cache/` 或 `.tmp/`**，`.gitignore` 的 `.cache/` 规则会误伤）

### E. 架构教训 —— 继承 YZCLI 的缺陷，本工程必须从第一天就避开
| # | YZCLI 的问题 | 本工程的要求 |
|---|---|---|
| 1 | **视图与 SQL 模板是两套并行取数路径且未打通**：20 个模板**全部直查物理表**、不查 `vw_ai_*`；视图仅在语义层被**引用为字符串**（`semantic/model.ts:161-243` 的 `data_binding.type="computed_view"`、`rules/metric-registry.ts:274-317`）→ 「**视图建了但没人查**」 | ★ **硬门禁：模板中出现物理表名即 `check` 失败**。视图先行、模板只查视图。这是 P4 首要约束 |
| 2 | **无生产 mssql driver**：`SqlDriver` 只是接口定义（`runtime/sql/executor.ts:24-37`），唯一真实 driver 在 `scripts/verify-ai-views.mjs:33`（**验证脚本，不是生产代码**）；集成测试用 `fakeDriver()`（`__tests__/sql-executor.test.ts:40`） | **生产 driver + 真实库集成测试是必做项**，不能只做 fake driver 单测。验收判据明确列出 |
| 3 | **LLM 端到端真实取数链路未通**（`analysis/src/__tests__/end-to-end.test.ts:22` 自述被 `user_token` 阻塞） | 「**端到端跑通**」是验收判据，**不接受「单测全绿」代替** |
| 4 | **设计四层防护，代码只有两层**：L1 模板注册制（`template.ts:62-84`）+ L2 执行器约束（`executor.ts` 全文）已落地；**L3 部署约束 / L4 治理无任何代码**，仅纸面规范 | ★ **每处引用防护能力必须标注落地状态**。⚠️ 项目内 `docs/erp_analysis/11-B方案-SQL补充数据源设计.md:23`（写于 2026-08-29）误标 L2/L3/L4 待落地，**L2 实际已落地** —— 不要沿用那份文档的措辞。**准确表述是：设计四层，代码两层。** |
| 5 | **模板白名单比模板库窄**：`config/analysis-sql.example.json` 的 `allowed_templates` 只列 **15 个**，模板库有 **20 个** | 白名单必须与模板库**同步校验**，数量不一致即门禁失败 |
| 6 | **元数据全部绑定易助**：`erp-metadata.json` 245,455 行 / `agent_typekey_map.yaml` 2,545 行 110 TypeKey / `analysis-view.json` 15,445 行 | **全部新写**，不可抄 |
| 7 | **20 模板全查易助表**（`JSKLOA` / `JSKLNA` / `SGMQLA` / `SGMQKA` / `DCSHDA`…），易飞库**同名命中 0 张** | 全部重写，映射见 `analysis-table-mapping.xlsx` |
| 8 | **Gateway 多租户 3,906 行 / License 4,126 行** | **整体砍掉**，单用户 MVP 不预留抽象 |
| 9 | **`yzcli-finance` 与 experts 凭证能力重叠且无交叉引用**（9 文件 / 1,327 行） | **不复刻** |

### F. 本工程基线（引用数字时必须带口径）
| 项 | 值 | 口径 |
|---|---|---|
| 知识产物 | 106 业务对象 / 595 服务名 / 106 份字段对照表（12,893 字段）/ 78 模块字典 / 7 个 CSV | `[口径：scripts/extract-*.mjs 机械抽取，门禁 check:all 4/4 PASS]` |
| 数据库直连 | SQL Server 2014 / **1,211 张表** / 库表名与字典 **100% 一致**（52 组 3 位前缀交叉全部一致，0 组不同） | `[口径：2026-10-09 实测]` → **无需映射层** |
| 易飞视图现状 | 仅 **4 个**（`MoJu` / `VCMSMQZ` / `VCOPTH` / `VMOCTE`），**无 `vw_ai_*`** | `[口径：实库 sys.views 查询]` |
| YZCLI 可移植资产 | 约 **300~500 行**（`template.ts` 150 + `executor.ts` 156 + `config.ts` 129 + `create-ai-views.sql` 155） | `[口径：四文件行数之和]` → **沿用 mssql 则 SQL 方言无需改动** |
| YZCLI 必须新写 | 约 **90% 行数** | `[口径：按行数估计，未逐行分类]` |
| 元数据规模 | `erp-metadata.json` 245,455 行 / `agent_typekey_map.yaml` 2,545 行 110 TypeKey / `analysis-view.json` 15,445 行 | `[口径：各单文件行数 / 键数]` |
| 模板依赖 | 20 模板依赖 **16 表 / 85 字段** | `[口径：脚本解析 templates.ts 得 defineTemplate 块与字段引用数]` |

### G. 本阶段专属纪律
- **视图不带 `COMPANY` 过滤**（2026-10-09 用户裁决）—— `COMPANY` 为预留管理字段（无业务含义），易飞架构为「独立公司账套」，不存在一表多账套。
- **视图由客户侧 DBA 手动执行** —— 代码里**不做自动建表/建视图**；交付形态为 `sql/views/*.sql` + 独立验证脚本 + 字段映射说明。
- **视图 DDL 必须幂等** —— `IF NOT EXISTS` 或 `CREATE OR ALTER`，可重复执行；附 `GRANT SELECT` 注释（参照 YZCLI `GRANT SELECT ... TO yzai`）。
- **模板 SQL 禁止字符串拼接** —— 参数一律交驱动绑定（执行器防护要点之一）。
- **执行器七重防护必须全部落地**：只读起始关键字校验 / 14 个禁用词**整词**匹配 / 禁分号 / 必带 `:max_rows` / 参数不内联 / `maxRows` 三重取小 / 审核码列名对照校验。
- **所有金额 / 数量结果必须带口径标签** —— 无标签的数字视为不可用。
- **库存月档期末成本公式**（`docs/plans/inv-monthly-stats-spec.md` 实测结论，模板实现依据）：
  - `INVLC` / `INVLE` 是月变动统计档，**没有存期末列，期末必须自己算**
  - 成本四要素 `LC026`+`LC027`+`LC028`+`LC029` **不可加进期末成本公式** —— 加进去仅 88/141 吻合；它记录的是成本构成拆解
  - 实测恒等式（**328/328 行成立**）：`LC026 + LC027 + LC028 + LC029 = 本月成本变动额`
  - `INVMC` / `INVML` 是**当前时点**（现有库存量），不是历史月档 —— 与 YZCLI `JSKLOA` 语义一致
- **不做缓存层** —— 易飞无 `fastquery`，先测性能基线再决定；MVP 不引入。
- **L3 / L4 防护只做设计登记** —— 不建代码，但必须在文档中明确标注「设计已登记，未实现」，**不得宣称已落地**。
- **外部硬阻塞**：客户侧 DBA 执行视图 DDL（**无降级方案**，视图是地基）；易飞全量表结构缺失（Apipost 不含表结构，85 字段覆盖不了，部分可从实库探针反推）；22 个 `yf.ai.*` 端点清单待易飞提供（影响助手扩展，不影响模板层）。

---

## 参考文档

| 文档路径 | 内容 | 为什么读它 |
|---|---|---|
| `docs/plans/yzcli-architecture-reference.md` **第三、五节** | 可移植资产 + **三个必须警惕的架构事实** | **本阶段最重要的一份** —— 缺陷 1（视图未打通）、缺陷 2（无生产 driver）、缺陷 3（审核码 12 倍）全在此 |
| `docs/plans/mvp-development-plan.md` §一 P4 / §二 P4 / §六 | 阶段范围 + **10 条验收判据** + 风险 R1/R2/R3/R4 | 动手前的唯一依据 |
| `docs/plans/inv-monthly-stats-spec.md`（296 行） | 库存月档字段语义 + 期末成本公式（实测 328/328 恒等式） | **D-14 视图 DDL 的直接依据** |
| `docs/plans/analysis-template-requirements.md` | 20 模板依赖 **16 表 / 85 字段** + 易助专有常量对照 | 模板重写的需求清单 |
| `docs/plans/analysis-table-mapping.xlsx`（85 项） | 表字段映射（用 `C:/Program Files/Python312/python.exe` + openpyxl 读，managed Python 没装 openpyxl） | 模板重写的映射依据 |
| `docs/TODO-PLAN.md` D-13 / D-14 | 建 analysis 层 + 视图建库脚本 | 本阶段对应的既有任务 |
| `docs/plans/yf-db-direct-connect-probe.md` | 数据库直连实测 + 与 YZCLI 架构对比 | 直连可行性与视图现状依据 |
| `AGENTS.md` | 9 条硬约束 + 工程纪律 | 分页上限、无 fastquery、审核码 |
| `docs/plans/dual-product-line-architecture.md`（252 行） | 双产品线架构（注册表 + 共享判定逻辑） | analysis 层作为「共享内核」的定位 |
| `.trellis/tasks/mvp-p3-auth-integration/map-navigation.md` | P3 产出的鉴权与健康检查 | 本阶段端到端链路的前置 |
