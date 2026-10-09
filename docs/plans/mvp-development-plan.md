# YFCLI MVP 分期开发计划

> 生成时间：2026-10-09
> 工程代号：**YFCLI**（易飞 YF / E10 产品线 AI 助手），对标 **YZCLI**（易助产品线）
> 依据：`docs/plans/yzcli-architecture-reference.md`（YZCLI 全部实证事实）· `AGENTS.md`（易飞 API 硬约束 + 工程纪律）· `docs/TODO-PLAN.md`（D-01~D-14）· `docs/plans/yf-materials-collection-checklist.md`（16 类资料 P0-P2）· `docs/plans/yf-materials-tasks.md`（T-01~T-18）
> 配套任务体系：`.trellis/tasks/`（6 个任务目录，P0 为其余 5 个的依赖起点）
>
> **数字口径规则**：本文所有规模数字均带口径标签 `[口径：…]`。这是本工程铁律（`AGENTS.md`、`docs/decisions/STATISTICS-SPEC.md`）：
> **禁止裸数字，禁止跨口径相减**。读到一个数字若看不到口径标签，请视为该数字不可用。
>
> **本文不是调研流水，是可执行计划。** 每阶段都有「明确不做什么」——MVP 最小可运行原则的精髓是砍 scope，砍不具体就等于没砍。

---

## 零、一页速览

| 阶段 | slug | 一句话目标 | 主交付 | 依赖 | 工作量 |
|---|---|---|---|---|---|
| **P0** | `mvp-p0-prerequisites` | 把开工前必须处理的事变成可勾选清单 | 前置条件清单 + 架构裁决台账 | 无 | **S**（1~3 天） |
| **P1** | `mvp-p1-auth-module` | 抽出独立授权模块（YZCLI 最薄一环） | `packages/yfcli-auth/` | P0 | **L**（3~5 天） |
| **P2** | `mvp-p2-crud-skill-openapi` | CRUD 五操作跑通，打包成 skill-openapi | MCP 工具层 + skill-openapi 包 | P1 | **XL**（5~8 天） |
| **P3** | `mvp-p3-auth-integration` | 授权全链路打通（SDK→MCP→skill） | 端到端鉴权 + 健康检查 | P1 P2 | **M**（1~3 天） |
| **P4** | `mvp-p4-analysis-qa` | 分析层 + 智能问数 | `packages/yfcli-analysis/` + 9 视图 + 20 模板 | P3 | **XL**（8~12 天） |
| **P5** | `mvp-p5-expert-module` | 专家模块（业务公式层） | `packages/yfcli-experts/` | P4 | **L**（3~5 天） |

**关键路径**：`P0 → P1 → P2 → P3 → P4 → P5`（严格串行，因为 P1 是 P2 的前置、P3 的鉴权对象是 P2 的工具、P4 的问数依赖 P3 的授权）
**可并行**：P2 的 MCP 工具层骨架 与 P4 的视图 DDL 可在 P3 期间并行（两者文件集不重叠）
**总工作量**：**约 21~36 天** `[口径：S=1~3 天 / M=1~3 天 / L=3~5 天 / XL=5~12 天五阶段之和，未含外部依赖等待时间]`

---

## 一、MVP 范围界定（做什么 / 明确不做什么）

### 1.1 全局裁剪原则

对标 YZCLI 的 25,091 行 `[口径：11 个包，排除 node_modules/dist 与 *.test.ts]`，其中约 90% `[口径：按行数估计，未逐行分类]` 是与易助业务强绑定的元数据 / SQL 模板 / 只读视图定义 / 业务公式。真正与 ERP 品牌无关、可复用的只有**协议与防护骨架**，约 300~500 行 `[口径：template.ts 150 + executor.ts 156 + config.ts 129 + create-ai-views.sql 155 行数之和]`。

因此 MVP 的裁剪原则是：

| # | 原则 | 具体含义 |
|---|---|---|
| 1 | **抄协议，不抄业务** | 移植模板注册制 + 执行器防护 + 凭据红线 + 视图交付范式；元数据 / 模板 / 视图 / 公式一律从零重建 |
| 2 | **单用户假设** | 单用户 / 单账套场景，**Gateway 多租户层 3,906 行 `[口径：YZCLI Gateway 多租户模块行数]` 整体砍掉** |
| 3 | **不假定 YZCLI 已解决** | YZCLI 自身有 3 个缺口（无生产 driver / 端到端未通 / 四层防护只落地 2 层），不可引用为「已有」 |
| 4 | **不做商业化** | License 体系 4,126 行 `[口径：gateway license 1,405 + MCP guard 172 + license-server 2,064 + admin 485]` 整体砍掉 |
| 5 | **不承诺助手数量** | 22 个助手是易助存量，MVP 只做 3 个冒烟助手 |
| 6 | **两条取数路径从第一天打通** | 继承 YZCLI「视图建了但没人查」的缺陷教训 —— P4 必须视图先行、模板只查视图 |

### 1.2 逐阶段范围界定

#### P0 前置条件盘点

| | 内容 |
|---|---|
| **做** | ① 架构裁决清单（双通道 / 包边界 / 数据流 / 视图策略）；② 16 类资料 P0-P2 台账 + 覆盖度自检；③ 易助有但易飞无资料的缺口清单；④ 外部依赖问询函（43 个 MA012 节点 + 22 个 `yf.ai.*` 端点 + 5 个文档缺陷 + 5 个未知主键）；⑤ 每条验收判据的可测性评审 |
| **不做** | ❌ 不做资料采集动作本身（只盘点与排期，采集归P0 清单里的 T-xx 任务）<br>❌ 不写业务代码<br>❌ 不改任何知识产物（`knowledge/**` 由脚本生成，`gen:all` 覆盖） |

#### P1 授权模块

| | 内容 |
|---|---|
| **做** | ① 独立包 `packages/yfcli-auth/`，token 生命周期（获取 / 缓存 / 过期检测 / 刷新）；② ERP 连通性健康检查；③ 凭据红线（密码只从环境变量取、`FORBIDDEN_KEYS` 拒明文含 `user`、`limits` 必填、`allowed_templates` 为空即抛错「禁止全开」）；④ 错误 token 的 HTTP 500+HTML 独立分支；⑤ 日志脱敏 |
| **不做** | ❌ OAuth 授权码流<br>❌ 多租户 RBAC<br>❌ License 签发与校验（4,126 行）<br>❌ Gateway 层（3,906 行）<br>❌ Token 自动刷新对接厂商接口 —— **文档未说明刷新语义**（`docs/plans/yf-openapi-rules.md` §0），遇到就说「文档未说明」并转 `docs/decisions/OPEN-DECISIONS.md`，**不编造** |

> **架构依据（必须理解再动手）**：YZCLI **不存在独立 auth 包**，认证逻辑分散 4 处——SDK `packages/yzcli-sdk/src/config.ts`（67 行，`loadConfig()` 只映射 baseUrl / timeout / fieldMode，**从不读 token**）/ MCP `packages/yzcli-mcp/src/erp-client.ts`（21 行，注释明确 Token **ALWAYS** passed from caller）/ Gateway `auth/token-map.ts`(40) + `auth/jwt.ts`(67) / Python `src/yzcli/core/config.py`（173 行，默认 `base_url` 与 TS 侧 `localhost:8103` **不一致**）。缺失：无 OAuth / 无 refresh / 无 token 缓存 / 无重试 / 无健康检查；ERP token 是人工从 **TPASC19 作业**取的静态串，靠 header 透传。
> → **只沿用「token 必须由调用方显式注入」这一条约束，其余完整性（过期、刷新、缓存、健康检查）全部自行设计。** YZCLI 的授权层是**反面基准**，不是参考实现。

#### P2 CRUD + skill-openapi 打包

| | 内容 |
|---|---|
| **做** | ① 106 对象 × 8 操作的**服务名路由表**（只能查表，禁止拼接）；② `query`/`read`/`create`/`update`/`delete` 五操作；③ 复合主键 `datakeys` 含全部主键字段；④ `conditions` 构造器 7 类写法（单条件 / 多条件 / 条件组 / 嵌套组 / 组合字段 `+` / `BETWEEN` 区间 / 枚举编码）；⑤ `error[]` 双结构兼容 + 未识别打 WARN；⑥ MCP 工具层（`manifest` / `query` / `read` / `help`）；⑦ skill-openapi 包 + **薄 Skill**（只留角色定义 + 助手 Prompt，能力进二进制）；⑧ 3 个冒烟助手（工厂查询 / 工厂读取 / 客户新增） |
| **不做** | ❌ 22 个助手全量（只做 3 个冒烟）<br>❌ 22 个 `yf.ai.*` 端点直调（**清单未拿到**，T-09 阻塞）<br>❌ 审批工作流 `_workflow.md`（T-08 未完成）<br>❌ `knowledge/enums/enums.yaml` 完整枚举字典（981 个掩码字段，需大数据量账套）<br>❌ License / 多租户 / Gateway<br>❌ 写操作的并发与事务补偿 |

> **架构依据**：沿用 YZCLI「**能力进二进制，Skill 只留 Prompt**」的分工（`skills/yzcli-erp/SKILL.md` v4.3.0 设计意图：路由 / 组装 / 字段映射 / 防幻觉规则已编入 MCP 二进制，Skill 仅留角色定义与助手 Prompt）。MCP 工具 22 个 `[口径：packages/yzcli-mcp/src/tools/*.ts 中 server.tool( 出现次数]`；**注意 YZCLI 无集中式注册表**，靠 `packages/yzcli-mcp/src/index.ts:113-138` 逐个显式调用 —— 本工程应改用集中式注册表，避免新增工具时漏挂。

#### P3 授权打通

| | 内容 |
|---|---|
| **做** | ① token 注入**单一入口**（配置文件只存引用，不存明文）；② 过期检测 + `token_invalid` 错误分类；③ ERP 连通性健康检查；④ 端到端鉴权用例（合法 / 过期 / 空 / 超长 / 错误 `datakey`）；⑤ 日志脱敏贯通（复用 `packages/yfcli-sdk/src/logging/redact.ts`） |
| **不做** | ❌ OAuth / refresh / 缓存预热<br>❌ 多租户 / Gateway / License<br>❌ 厂商刷新接口对接（**文档未说明**）<br>❌ 权限模型与角色模板（P2 资料项，易飞与易助权限模型同构但细节待补） |

#### P4 分析 + 智能问数

| | 内容 |
|---|---|
| **做** | ① `packages/yfcli-analysis/` 包；② **9 个 `vw_ai_*` 只读视图 DDL**（幂等，由客户侧 DBA 执行，`GRANT SELECT`）；③ **20 个 SQL模板**，**全部只查视图不查物理表**；④ 执行器防护逐字重写（只读起始关键字 / 禁用词整词匹配 / 禁分号 / 必带 `:max_rows` / 参数不内联交驱动绑定 / `maxRows = min(调用方, 模板, 数据源)` 三重取小 / 审核码列名对照校验）；⑤ 生产 mssql driver（**不是接口**）+ 真实库集成测试；⑥ 智能问数（自然语言 → 模板路由 → 参数抽取 → 执行 → 带口径标签的结果） |
| **不做** | ❌ Gateway 多租户（3,906 行）<br>❌ License 体系（4,126 行）<br>❌ 语义层全面建设（只做问数必需的最小语义映射）<br>❌ L3 部署约束 / L4 治理的完整实现（**只做设计登记，不建代码** —— YZCLI 就是只写纸面规范）<br>❌ 三版本兼容层（9.0.12/ 9.1 / 9.2 —— 单版本优先） |

> **架构依据（最大架构风险所在）**：YZCLI 的 20 个模板**全部直查物理表，不查 `vw_ai_*`**；视图仅在语义层被**引用为字符串**（`packages/yzcli-analysis/src/semantic/model.ts:161-243` 的 `data_binding.type="computed_view"`、`packages/yzcli-analysis/src/rules/metric-registry.ts:274-317`）。→ YZCLI 自己就沉淀了「**视图建了但没人查**」的缺陷。**本工程必须从一开始就把这两条路打通**，否则原样继承。
>
> 其他依据：SQL 模板注册制 + 执行器防护 `runtime/sql/template.ts`(150) + `runtime/sql/executor.ts`(156)，**与 ERP 品牌无关，沿用 mssql 则 SQL 方言无需改动**；凭据红线 `config.ts`(129)；只读视图交付范式 `scripts/create-ai-views.sql`(155，9 视图 + DROP/CREATE 幂等 + 由 DBA 执行 + `GRANT SELECT ... TO yzai` 注释 + 独立验证脚本 —— **交付形态可照搬，内容必须重写**)。
>
> **必须新写**：20 个模板（YZCLI `templates.ts` 591 行，依赖 **16 张表 / 85 个字段引用**，易飞库**同名命中 0 张**，映射需求见 `docs/plans/analysis-table-mapping.xlsx`）、9 个视图、元数据（`erp-metadata.json` 245,455 行 + `agent_typekey_map.yaml` 2,545 行 / 110 TypeKey + `analysis-view.json` 15,445 行 —— **全部绑定易助后台表结构，不可抄**）。
>
> **视图设计裁决**（2026-10-09 用户裁定）：视图**不带 `COMPANY` 过滤** —— `COMPANY` 为预留管理字段（无业务含义），易飞架构为「独立公司账套」，不存在一表多账套。**库表名与字典 100% 一同**（52 组 3 位前缀交叉比对全部一致、0 组不同）→ **无需映射层**。
>
> **审核码口径陷阱**：不筛审核码污染 **12 倍** `[口径：同一单据集合，含税金额合计，未按审核码过滤 vs 过滤后对比；已审核 24 单 5,817 万 vs 未审核 13 单 7.28 亿，易助侧真机实测]`。本工程对应 `approve_status='Y'`（**易助是 `'T'`，勿沿用**），且易飞实测为 **Y / N / V 三值**，其中 **V = 作废**（用户 2026-10-09 裁决），**统计只筛 Y**。

#### P5 专家模块

| | 内容 |
|---|---|
| **做** | ① `packages/yfcli-experts/`；② 业务公式层（库存成本 / 毛利 / 采购金额 / 应收应付余额 / 科目发生额等）；③ 专家 × 模板 × 口径的注册表；④ 每个公式的口径标签与数据来源声明 |
| **不做** | ❌ 9 个专家全量（YZCLI 9 个 `[口径：experts/*/ 一级目录数]` 绑定 8 个域的易助科目语义，MVP 只做**单域试点**）<br>❌ **`yzcli-finance` 包不复刻**（9 文件 / 1,327 行，与 experts 凭证能力重叠且无交叉引用 —— YZCLI 自身的重复，不要继承）<br>❌ License / 多租户<br>❌ Skill 拆分评估（T-15 需等助手扩到 22+ 才启动） |

---

## 二、每阶段详细拆解

### P0 ｜ 前置条件盘点

| 项 | 内容 |
|---|---|
| **目标** | 在写第一行业务代码之前，把「还有哪些前置步骤需要处理的，包括架构、易飞涉及到的资料（易飞有没有对应资料）」变成一份可勾选、可指派、可验收的清单 |
| **架构依据** | `docs/TODO-PLAN.md` D-01~D-14 现有任务 + `docs/plans/yf-materials-collection-checklist.md` 16 类资料 + `docs/plans/yf-materials-tasks.md` T-01~T-18 |
| **涉及文件** | 新建 `docs/plans/mvp-prerequisites-checklist.md`；更新 `docs/decisions/OPEN-DECISIONS.md` |
| **依赖** | 无 |
| **工作量** | **S**（1~3 天） |
| **验收判据** | ① 清单每条都有负责人角色 + 产出物路径 + 可测验收判据<br>② 「易助有但易飞无资料」缺口单列成表（见 §五）<br>③ 外部依赖问询函已起草，含 4 类对象（MA012 节点 / `yf.ai.*` 端点 / 文档缺陷 / 未知主键）<br>④ 每条验收判据经测试角色评审「能否写成用例」，不可测的判据必须改写 |

**★ P0 关键发现（见 §五 完整版）**：
- 易飞侧**完全缺失**的 4 类资料：全量表结构、菜单树/业务域、22 个 `yf.ai.*` 端点清单、枚举字典
- 「易助有但易飞无」的对照结论：易助的 `knowledge/official/` 16 类资料中，**易飞侧仅 2 类有等价物**（接口清单可从 Apipost 抽取、认证头与易助逐字一致）
- **43 个 MA012 未注册节点** + 1 个服务端 DLL 崩溃（`yf.oapi.item.inventory.qty.query.get` 触发 `OAPComF2.exe Access violation`，该对象完全不可用）
- **5 个对象入参容器名与对象名无关**（疑官方文档复制粘贴错误）：`ap.refund.doc` / `op.stockin` / `prepayment.doc` / `transfer` / `wo.commence`

---

### P1 ｜ 独立授权模块

| 项 | 内容 |
|---|---|
| **目标** | 让「认证」第一次成为有边界的模块。YZCLI 把认证散在 4 处且完整性缺失（无 OAuth / refresh / 缓存 / 重试 / 健康检查），本阶段一次性补齐边界 |
| **架构依据** | 反面基准：YZCLI 无独立 auth 包（SDK `config.ts` 67 行 + MCP `erp-client.ts` 21 行 + Gateway `auth/token-map.ts` 40 + `auth/jwt.ts` 67 + Python `config.py` 173）；`loadConfig()` 从不读 token；MCP 仅做「非空 + 长度 ≥ 8」弱校验（`http-server.ts:21-27`）；Python 与 TS 侧 `base_url` 不一致<br>正面依据：凭据红线 `runtime/sql/config.ts` 129 行 |
| **涉及文件** | 新建 `packages/yfcli-auth/src/`（`token-store.ts` / `health.ts` / `errors.ts` / `redact.ts` / `index.ts`）；改 `packages/yfcli-sdk/src/config/config.ts`、`packages/yfcli-sdk/src/index.ts`（导出 auth 契约） |
| **依赖** | P0 |
| **工作量** | **L**（3~5 天） |
| **验收判据** | ① 配置文件**不含任何明文密码/token**（`FORBIDDEN_KEYS` 拒绝，含 `user`），密码只从环境变量取<br>② `limits` 缺失即抛错<br>③ token 过期能被检测并抛 `token_expired`，与 `token_invalid` 区分<br>④ 错误 token 返 HTTP 500+HTML 时**不解析 body**，走独立分支抛 `token_invalid`<br>⑤ ERP 连通性健康检查可独立执行并给出结构化结论<br>⑥ 日志输出经脱敏，**扫描无token 明文**（`npm run scan:secrets` PASS）<br>⑦ 单测覆盖上述 6 条，**不只测 happy path** |

---

### P2 ｜ CRUD + skill-openapi 打包

| 项 | 内容 |
|---|---|
| **目标** | MVP 最小可运行：CRUD 五操作跑通，打包成 skill-openapi 可被 Agent 调用。这是用户指定的第2 项「先实现 CRUD 等操作，打包完成 skill-openapi 的调用」 |
| **架构依据** | YZCLI `packages/yzcli-sdk/src/client.ts`(201) + `packages/yzcli-mcp/`(22 个 MCP 工具 / 46 文件 / 5,068 行)；「能力进二进制、Skill 只留 Prompt」的 SKILL.md v4.3.0 分工<br>反面教材：MCP **无集中式注册表**（`index.ts:113-138` 逐个显式调用），新增工具易漏挂 |
| **涉及文件** | 新建 `packages/yfcli-mcp/src/`（`registry.ts` 集中注册 / `tools/*.ts` / `server.ts`）、`packages/yfcli-skill-openapi/`（SKILL.md + references）<br>改 `packages/yfcli-sdk/src/client/yf-client.ts`、`conditions/builder.ts`、`response/parser.ts` |
| **依赖** | P1（token 注入单一入口） |
| **工作量** | **XL**（5~8 天） |
| **验收判据** | ① `manifest` 返回 106 对象（读 `knowledge/typekey/typekey_map.yaml`）<br>② `query` `type_key=plant` 返回行数与 `total_result` 一致<br>③ 复合主键 `read`（`accounting.voucher` 的 `doc_type_no + doc_no`）成功<br>④ **反向用例**：传数组形态 `conditions` 必须显式报错，**不得静默降级为全量**<br>⑤ 枚举条件传 `Y.已审核` 返回 0 条时给出明确告警（提示只传编码）<br>⑥ 主键全错返回 `code=0` + 空数组时**触发空结果告警**，不静默通过<br>⑦ `create` 支持单别自动审核；`update` 单身「存在则更新、不存在则新增」，**不支持删除单身**<br>⑧ 3 个冒烟助手端到端可用<br>⑨ MCP 工具有**集中式注册表**，新增工具漏挂时门禁失败<br>⑩ 错误信息不泄露 token |

---

### P3 ｜ 授权打通

| 项 | 内容 |
|---|---|
| **目标** | 把 P1 的授权模块真正接到全链路（SDK → MCP → skill-openapi），端到端鉴权可用。这是用户指定的第 3 项 |
| **架构依据** | YZCLI 反面基准（同 P1）：认证分散、弱校验、Python 与 TS 配置不一致 |
| **涉及文件** | 改 `packages/yfcli-mcp/src/server.ts`、`packages/yfcli-auth/src/`；新建 `config/yfcli.example.yaml` |
| **依赖** | P1、P2 |
| **工作量** | **M**（1~3 天） |
| **验收判据** | ① token 注入**单一入口**，配置只存引用<br>② 端到端 5 类鉴权用例全过：合法 / 过期 / 空 / 超长（< 8 字符）/ 错误 `datakey`<br>③ 过期与无效用**不同错误码**（`token_expired` vs `token_invalid`），用户话术不同<br>④ 健康检查可探出「token 有效但 `CompanyId` 错误」这类组合故障<br>⑤ 日志脱敏贯通到 MCP 层与 skill 层<br>⑥ `npm run scan:secrets` PASS，配置模板不含明文凭据 |

---

### P4 ｜ 分析 + 智能问数

| 项 | 内容 |
|---|---|
| **目标** | 建analysis 层 + 智能问数模块，走数据库直连 + 只读视图。这是用户指定的第 4 项，也是 `docs/TODO-PLAN.md` **D-13/D-14** |
| **架构依据** | 可移植：`runtime/sql/template.ts` 150 + `executor.ts` 156 + `config.ts` 129 + `scripts/create-ai-views.sql` 155（**沿用 mssql 则 SQL 方言不改**）<br>不可移植：20 模板（`templates.ts` 591 行，依赖 16 表 / 85 字段，易飞同名命中 0 张）、9 视图、元数据<br>**必须警惕**：视图与模板两套路径未打通（YZCLI 缺陷）<br>**必须警惕**：无生产 mssql driver（`SqlDriver` 只是接口 `executor.ts:24-37`，唯一真实 driver 在 `scripts/verify-ai-views.mjs:33` —— 验证脚本不是生产代码）；集成测试用 `fakeDriver()`（`sql-executor.test.ts:40`） |
| **涉及文件** | 新建 `packages/yfcli-analysis/src/runtime/sql/`（`config.ts` / `template.ts` / `templates.ts` / `executor.ts` / `driver-mssql.ts`）、`src/semantic/`、`src/qa/`<br>新建 `sql/views/`（9 个 `vw_ai_*.sql`）、`sql/views/_verify.sql`<br>改 `packages/yfcli-sdk/src/`（analysis 侧导出） |
| **依赖** | P3（授权打通）；视图需客户侧 DBA 执行 |
| **工作量** | **XL**（8~12 天） |
| **验收判据** | ① SQL **参数化绑定**，模板注册制 + 白名单；白名单与模板库**数量一致**（YZCLI 白名单只列 15 个而模板库 20 个 —— 不一致即门禁失败）<br>② 凭据从环境变量取，配置文件不进仓库<br>③ **生产 mssql driver 落地**（非接口），真实库集成测试**不用 `fakeDriver()`**<br>④ 9 个视图 DDL幂等可重复执行，附字段映射说明<br>⑤ **20 个模板全部只查 `vw_ai_*`，零模板直查物理表** —— 有直查即门禁失败（打通 YZCLI 缺陷的硬判据）<br>⑥ 至少 3 个模板真机实测通过<br>⑦ 所有金额/数量类结果**带口径标签**，审核码只筛 `Y`（`V`=作废须排除）<br>⑧ 审核码污染回归测试：同集合对比筛/不筛，差异须可解释<br>⑨ 智能问数端到端：**LLM → 模板路由 → 参数抽取 → 执行 → 带口径输出** 全链路通（**不接受「单测全绿」代替** —— YZCLI 就是卡在 `end-to-end.test.ts:22`）<br>⑩ L3/L4 防护**明确标注为「设计登记，未实现」**，不得在文档里宣称已落地 |

---

### P5 ｜ 专家模块

| 项 | 内容 |
|---|---|
| **目标** | 实现专家模块（业务公式层），把分析层的原子数据变成业务结论。这是用户指定的第 5 项 |
| **架构依据** | YZCLI `experts/` 35 文件 / 3,815 行 `[口径：experts/yzcli-experts 文件数 / 行数]`，9 个专家 / 8 个域的公式**全绑定易助科目语义** → 结构可参考，公式必须全部重写<br>**不复刻** `yzcli-finance`（9 文件 / 1,327 行，与 experts 凭证能力重叠且无交叉引用 —— YZCLI 自身的重复） |
| **涉及文件** | 新建 `packages/yfcli-experts/src/`（`registry.ts` / `<domain>/formula.ts` / `metrics.ts`） |
| **依赖** | P4 |
| **工作量** | **L**（3~5 天） |
| **验收判据** | ① 专家 × 模板 × 口径三者注册在**同一注册表**，可机读<br>② 每个公式声明：数据来源模板 id + 口径标签 + 适用范围<br>③ 单域试点公式全部有**边界用例**（空集/ 零值 / 负值 / 跨期）<br>④ 单笔金额可手工复核到模板结果（抽查 3 笔，逐笔对账）<br>⑤ 不复刻 `yzcli-finance` 的重复能力（评审时明确说明哪些能力归experts）<br>⑥ 公式错误时不静默返回 0，抛带口径信息的异常 |

---

## 三、角色任务分配矩阵

角色顺序按用户指定：**总监 → 架构师 → 产品经理 → 后端开发 → 测试**。

| 阶段 | 总监 | 架构师 | 产品经理 | 后端开发 | 测试 |
|---|---|---|---|---|---|
| **P0** 前置盘点 | 范围界定与阶段放行裁决；裁决「哪些不做」 | 架构裁决台账：双通道 / 包边界 / 数据流 / 视图策略 / L1-L4 防护落地状态标注 | 16 类资料 P0-P2 台账 + 覆盖度自检 + **外部依赖问询函**（4 类对象） | 资料缺口技术可行性反查（哪些可脚本化抽取、哪些必须外部要） | 验收判据**可测性评审**：每条判据能否写成用例，不可测的必须改写 |
| **P1** 授权模块 | 授权边界裁决（哪些能力自研、哪些等厂商） | auth 包接口契约 + 与 SDK 的依赖方向（auth **不依赖** sdk，避免循环） | 授权失败的用户话术（过期 vs 无效 vs 权限不足三种场景） | token 生命周期 / 健康检查 / 凭据红线 / 脱敏 | 7 条验收用例 + 反向用例（超长 token / 空token / 错误 datakey） |
| **P2** CRUD + skill | MVP 放行裁决（3 冒烟助手是否够） | MCP 工具**集中式注册表**设计 + 五操作契约 + 薄 Skill 边界 | 3 个冒烟助手的业务定义 + 触发词/排除词 | 五操作实现 + conditions 7 类 + MCP 层 + skill-openapi 打包 | 10 条验收判据用例，重点是**反向用例**（数组 conditions 必须报错、枚举编码、空结果告警） |
| **P3** 授权打通 | 端到端鉴权放行 | token 注入单一入口设计 + 错误码体系 | 鉴权失败话术分级 | 全链路接线 + 健康检查 +脱敏贯通 | 5 类端到端鉴权用例 + 组合故障（token 有效但 CompanyId 错） |
| **P4** 分析 + 问数 | 「视图先行」架构纪律的守护（**不许模板直查物理表**） | analysis 包分层 + **视图↔模板打通契约** + L3/L4 落地状态登记 | 20 模板的业务语义定义 + **每个口径标签的中文表述** + 问数话术 | 9 视图 DDL + 20 模板 + 生产 mssql driver + 智能问数 | 执行器防护用例 + **模板只查视图的门禁** + 审核码污染回归 + **端到端 LLM 取数必须真跑** |
| **P5** 专家模块 | 单域试点选哪个域的裁决 | 专家 × 模板 × 口径注册表设计 | 业务公式口径文档 + 业务复核 | 公式实现 + 边界用例 | 边界用例（空集/零值/负值/跨期）+ **3 笔逐笔对账** |

---

## 四、依赖关系图 + 关键路径

```
                ┌─────────────────────────────────────────┐
                │ P0mvp-p0-prerequisites                 │
                │ 架构裁决 · 16类资料台账 · 外部依赖问询函   │
                │ 外部阻塞: 43个MA012 / 22个yf.ai.* /│
                │           5个文档缺陷 / 5个未知主键        │
                └───────────────────┬─────────────────────┘
                                    │
                                    ▼
                ┌─────────────────────────────────────────┐
                │ P1  mvp-p1-auth-module                │
                │ 独立授权包（YZCLI 最薄一环，全部自研）    │
                │ 不做: OAuth/多租户/License/Gateway       │
                └───────────────────┬─────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │ P2  mvp-p2-crud-skill-openapi                         │
        │ CRUD五操作 + MCP工具层 + skill-openapi 打包            │
        │ 不做: 22助手/ yf.ai.*端点 /审批工作流 / License        │
        └───────────────────┬───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────────────────────┐
        │ P3  mvp-p3-auth-integration│
        │ token 注入单一入口 · 端到端鉴权 · 健康检查              │
        └───────────────────┬───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────────────────────┐
        │ P4  mvp-p4-analysis-qa                    ← 最大风险   │
        │ 9视图 + 20模板 + 生产mssql driver + 智能问数            │
        │ ★ 视图与模板必须一开始打通（继承 YZCLI 缺陷教训）        │
        │ ★ 审核码只筛 Y（V=作废），不筛污染 12倍                 │
        │ 外部阻塞: 客户侧 DBA 执行视图 DDL                       │
        └───────────────────┬───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────────────────────┐
        │ P5  mvp-p5-expert-module                              │
        │ 业务公式层（单域试点）                                  │
        │ 不做: 9专家全量 / yzcli-finance 重复包                  │
        └───────────────────────────────────────────────────────┘

可并行轨道（文件集不重叠）：
  · P2 的 MCP 工具层骨架 ←→ P4 的视图 DDL 设计（P3 期间并行）
  · P5 的公式口径文档    ← → P4 的模板实现（口径需对齐，可提前起草）

外部依赖（不在我方控制范围）：
  · 43 个 MA012 节点注册          → 易飞端
  · 22 个 yf.ai.* 端点清单        → 易飞服务端 / AI 团队
  · 5 个入参容器名文档缺陷        → 易飞官方文档维护方
  · 9 视图 DDL 执行               → 客户侧 DBA
  · 大数据量账套（枚举采集用）      → 客户
```

**关键路径**：`P0 → P1 → P2 → P3 → P4 → P5`

**为什么 P1 在 P2 之前（不可调换）**：P2 的所有工具都要拿 token，YZCLI 的教训正是「token 靠人工静态串 + 调用方隐式注入」，导致接入点散落无法收口。先有单一入口，P2 才不用在每个工具里各写一遍鉴权。

**为什么 P3 在 P4 之前（不可调换）**：P4 的 SQL 执行走数据库凭据（独立于 ERP token），但**智能问数的端到端链路需要 P3 的鉴权与健康检查**才能跑通。YZCLI 的 `end-to-end.test.ts:22` 就是卡在 `user_token` 上 —— 不能重复这个失败。

**最大风险点**：P4 的「视图 ↔ 模板打通」。若走成 YZCLI 那样（视图建了没人查），P4 的工作量会白付，且 P5 建在错误的基线上。

---

## 五、工作量汇总

### 5.1 按阶段

| 阶段 | 档位 | 天数 | 主要工作项 |
|---|---|---|---|
| P0 前置盘点 | **S** | 1~3 | 架构裁决台账 / 16 类资料台账 / 问询函 / 可测性评审 |
| P1 授权模块 | **L** | 3~5 | token 生命周期 / 健康检查 / 凭据红线 / 脱敏 |
| P2 CRUD + skill | **XL** | 5~8 | 五操作 / conditions 7 类 / MCP 层 / skill 打包 / 3 冒烟助手 |
| P3 授权打通 | **M** | 1~3 | 注入单一入口 / 5 类鉴权用例 / 脱敏贯通 |
| P4 分析 + 问数 | **XL** | 8~12 | 9 视图 / 20 模板 / 生产 driver / 智能问数 |
| P5 专家模块 | **L** | 3~5 | 注册表 / 单域公式 / 边界用例 |
| **合计** | — | **21~36** | `[口径：S=1~3 天、M=1~3 天、L=3~5 天、XL=5~12 天，五阶段之和]` |

**未计入天数的部分**（说明：这些是等待，不是工作）：
- 43 个 MA012 节点注册（等易飞端）
- 22 个 `yf.ai.*` 端点清单（等易飞服务端）
- 9 视图 DDL 执行（等客户 DBA）
- 大数据量账套开放（枚举采集用）

### 5.2 档位定义（口径统一）

| 档位 | 天数 | 定义 |
|---|---|---|
| XS | < 1 小时 | 单文件改动，无设计决策 |
| S | 1~3 小时 ~ 1~3 天 | 单模块内可完成，无跨包依赖 |
| M | 1~3 天 | 跨 2 个包，需联调 |
| L | 3~5 天 | 新建包，接口契约需评审 |
| XL | 5~12 天 | 新建包 + 外部协作（DBA / 易飞端），含真机验证 |

### 5.3 对标 YZCLI 的规模参照

| 项 | YZCLI | YFCLI MVP 预期 | 口径 |
|---|---|---|---|
| 生产代码 | 25,091 行 | **约 8,000~12,000 行** | `[口径：11 包 vs MVP 6 包，均排除 node_modules/dist 与 *.test.ts；YFCLI 为按阶段工作量反推的估计值]` |
| npm 包 | 11 个 | **6 个**（auth / sdk / mcp / skill-openapi / analysis / experts） | `[口径：packages/* 一级目录]` |
| MCP 工具 | 22 个 | **4~6 个** | `[口径：server.tool( 出现次数]` |
| 领域专家 | 9 个 | **1 个（单域试点）** | `[口径：experts/* 一级目录数]` |
| 只读视图 | 9 个 | **9 个**（`vw_ai_*`） | `[口径：scripts/create-ai-views.sql DDL 行号区间 vs易飞实库需求]` |
| SQL 模板 | 20 个 | **20 个** | `[口径：templates.ts 导出数]` |
| 测试规模 | 115 文件 / 973 用例 / 252 describe | **约 40 文件 / 300 用例** | `[口径：vitest，grep it( / test( 与 describe(；YFCLI 为按覆盖判据反推的估计]` |

> **注意**：MVP 代码量约为 YZCLI 的 **1/3** `[口径：8,000~12,000 ÷ 25,091，按上述估计区间计算]`，但**覆盖面不小于 YZCLI 的核心链路** —— 因为砍掉的是多租户（3,906 行）、License（4,126 行）、`yzcli-finance` 重复包（1,327 行），合计 9,359 行 `[口径：三项行数之和]`。

---

## 六、风险与外部阻塞

### 6.1 架构风险（内部可控）

| # | 风险 | 后果 | 应对 | 归属 |
|---|---|---|---|---|
| **R1** | **视图与 SQL 模板未打通**（YZCLI 已犯：20 模板全查物理表，视图仅在语义层被引用为字符串 `semantic/model.ts:161-243`、`rules/metric-registry.ts:274-317`） | 「视图建了但没人查」，P4 工作量白付，P5 建在错误基线上 | **硬门禁**：模板中出现物理表名即 `check` 失败；视图先行，模板只查视图 | 架构师 + 测试 |
| **R2** | **只做 fake driver 单测**（YZCLI `sql-executor.test.ts:40` 用 `fakeDriver()`，唯一真实 driver 在验证脚本里） | 上线才发现 SQL 方言/驱动问题 | 生产 driver 与真实库集成测试列为 P4 验收判据③，**不接受单测全绿代替** | 后端 + 测试 |
| **R3** | **宣称「四层防护已落地」**（YZCLI 实为「设计四层，代码两层」，L3/L4 无任何代码；且项目内 `docs/erp_analysis/11-B方案-SQL补充数据源设计.md:23` 写于 2026-08-29 误标 L2/L3/L4 待落地） | 文档误导后续开发，安全感虚高 | 每处引用防护能力**必须标注落地状态**；L3/L4 明确写「设计登记，未实现」 | 架构师 |
| **R4** | **审核码污染 12 倍**（易助侧真机实测：已审核 24 单 5,817 万 vs 未审核 13 单 7.28 亿） | 数字错 12 倍且不报错 | 所有统计模板强制筛 `approve_status='Y'`；**易助是 `'T'`，勿沿用**；`V`=作废须排除；设回归测试 | 后端 + 测试 |
| **R5** | **单据编码同码不同义**（33/82/84/85 四处冲突；易助 33→易飞 23、易助 82→易飞 54） | 静默算错数 | 建集中转码表，禁止散落硬编码 | 架构师 |
| **R6** | 枚举条件传回参值（`Y.已审核`） | **静默返回 0 条**，看起来像「没数据」 | 枚举守卫强制剥离编码后缀；反向用例覆盖 | 后端 + 测试 |
| **R7** | 主键全错返 `code=0` + 空数组 | 误判为「查到了」或「无数据」 | 空结果必须告警，不能用 `code` 判断 | 后端 |
| **R8** | 错误 token 返 HTTP 500 + HTML | 解析 body 崩溃 | 先判 HTTP 状态码，非 200 走独立分支，**不解析 body** | 后端 |
| **R9** | MCP 无集中式注册表（YZCLI 逐个显式调用 `index.ts:113-138`） | 新增工具漏挂 | 本工程改集中式注册表 + 漏挂门禁 | 后端 |
| **R10** | 模板白名单与模板库不一致（YZCLI 白名单 15 个 / 模板库 20 个） | 5 个模板不可用且无人察觉 | 白名单与模板库数量一致性校验纳入门禁 | 后端 |

### 6.2 外部阻塞（不在我方控制范围）

| # | 阻塞项 | 现状 | 需要谁 | 影响阶段 | 降级方案 |
|---|---|---|---|---|---|
| **B1** | **43 个 MA012 未注册节点** | T-17 批量验证 175 个节点，110 个可用，43 个报 MA012；其中 7 个疑为官方文档错误（容器名与所属对象无关，如 `ap.refund.doc` → `wo_stockin_data`） | 🔴 易飞服务端 | P2（部分单据的条件查询） | 仅用 110 个已验证节点；43 个节点的单身条件查询延后 |
| **B2** | **22 个 `yf.ai.*` 端点清单** | 已确证 2 个现役（`yf.ai.PurchaseBusinessWarning` 助手 06 / `yf.ai.SalesbusinessWarning` 助手 17），其余 20 个待提供 | 🔴 易飞服务端 / AI 团队 | P4/P5（助手扩展） | **降级方案**：改走「`query.get` 取数 → experts 引擎计算 → 本地生成报告」；需重写该助手 `_meta.json` 与 prompts |
| **B3** | **9 视图 DDL 执行** | 易飞库无 `vw_ai_*`（实测仅 4 个：`MoJu` / `VCMSMQZ` / `VCOPTH` / `VMOCTE`） | 🔴 客户侧 DBA | P4（硬前置） | 无降级方案 —— **视图是 P4 的地基**，DBA 未执行则 P4 无法验证 |
| **B4** | **易飞全量表结构缺失** | Apipost 文档**不含表结构**（仅有节点名）；易助侧有 574 个 XML（`Tbschema/`），易飞侧无等价物 | 🔴 项目组 / DBA | P4（20 模板依赖 16 表 85 字段） | 部分可从实库探针反推（`docs/plans/inv-monthly-stats-spec.md` 已对 6 张月档表这样做），但**覆盖不了 85字段** |
| **B5** | **菜单树 / 业务域缺失** | Apipost 目录 ≠ 系统菜单；106 对象首段聚合可作初始线索（采购 12 / 委外 10 / 品号 8 / 工单 7 / 销售 6 / 财务 5 / 应收预收 4 / 质量 3 / 基础资料约 20） | 🟠 实施顾问 / 项目组 | P2（触发词设计） | 用首段聚合线索做初版路由，人工复核后修正 |
| **B6** | **枚举字典缺失** | 981 个掩码字段的码值未采集；测试账套仅 50 张凭证 / 22 条工厂数据，覆盖不足 | 🟠 大数据量账套 | P4（防编造枚举值） | 从Apipost `description` 抽取已有线索（`pricing_order` 1~I 档 / `invoice_type: A` / `taxed_code: 1` / `receive_method: 3`） |
| **B7** | **5 个对象入参容器名文档缺陷** | `ap.refund.doc` / `op.stockin` / `prepayment.doc` / `transfer` / `wo.commence` 的入参容器名与对象名无关 | 🟠 易飞官方文档维护方 | P2（真机调用前必须核实） | 真机探测确认后再写契约 |
| **B8** | **5 个对象业务主键未知** | 4 个已反推补录（`primary_key_source: live_probe`），第 5 个 `item.inventory.qty` 服务端 DLL 崩溃（`OAPComF2.exe Access violation`） | 🟠 易飞服务端 | P2 | 该对象从可用清单中剔除并显式标注 |
| **B9** | **Token 有效期与刷新语义** | **文档未说明** | 🔴 易飞官方 | P1/P3 | 说「文档未说明」并转 `docs/decisions/OPEN-DECISIONS.md`，**不编造**；MVP 只做「过期检测」，不做「自动刷新」 |

### 6.3 需记录的「文档未说明」清单（禁止臆测）

来自 `AGENTS.md`：调用频率限制 / HTTP 状态码完整语义 / Token 有效期与刷新 / 超时时间 / 版本兼容正式策略 / 单笔批量上限 / `sql_code` 取值含义 / 三版本（9.0.12/ 9.1 / 9.2）接口差异。

**处理纪律**：遇到这些，**说「文档未说明」并转入 `docs/decisions/OPEN-DECISIONS.md`**，不要编造。

---

## 七、配套任务体系（`.trellis/`）

```
.trellis/
├── tasks/
│   ├── mvp-p0-prerequisites/        task.json + map-navigation.md
│   ├── mvp-p1-auth-module/          task.json + map-navigation.md
│   ├── mvp-p2-crud-skill-openapi/   task.json + map-navigation.md
│   ├── mvp-p3-auth-integration/     task.json + map-navigation.md
│   ├── mvp-p4-analysis-qa/          task.json + map-navigation.md
│   └── mvp-p5-expert-module/        task.json + map-navigation.md
└── workspace/
    └── <dev>/journal-N.md           每日开发日志
```

依赖关系：`mvp-p0-prerequisites` 是其余 5 个的 `depends_on` 起点。

每个 `map-navigation.md` 含：目录结构导航 / 模块职责速查 / 关键文件索引 / 当前进度% / 下一步 / **硬性约束与教训** / 参考文档。

> 注：`.trellis/tasks/` 已在 `.gitignore` 中（约定：任务状态以文件为准，不入 Git）。

---

## 八、全局硬性约束（所有阶段共同遵守）

### 8.1 易飞 OpenAPI 9 条硬约束
1. 枚举字段查询**只传编码**（回参 `Y.已审核` 传回去静默返 0 条）
2. 主键全错返 `code=0` + 空数组（不能用 `code` 判断「查到了」）
3. 错误 token 返 **HTTP 500 + HTML**（不是 JSON，先判状态码）
4. `node_name` 用**逻辑 `*_data` 名**，不是物理表名
5. 服务名**只能查表，禁止拼接**
6. `conditions` 必须**对象形态**（数组形态静默失效返全量）
7. 分页 `page_no` 从 1 开始、`page_size` 上限 10000（须实测标定）
8. **无 `fastquery`**，所有查询重查数据库
9. 成功判据 `execution.code === "0" || "-0"`（禁止字符串匹配 description）

### 8.2 工程纪律
- 含反引号的中文文本**必须落文件再执行**，禁止 `python -c` / `bash -c` 内联（已踩坑：46 MB 文件被当脚本跑，孤儿进程报错 57 分钟）
- 写文件禁止 `(CR+LF).join(str)` 逐字符拼接
- 统计数字**必须带口径标签**，禁止裸数字与跨口径相减
- 破坏性验证只在副本上做，改完校验 sha1 还原
- 全部文件 **CRLF 行尾 + UTF-8 无 BOM**
- **禁止直接改 `knowledge/data-dictionary/modules/`**（78 个机械产物）
- **提交前必跑 `npm run verify`**
- token / `CompanyId` / 内网 IP / 客户名 / 账套名一律不入库
- 临时脚本放 `.workbuddy/tmp/`（不要用 `.cache/` 或 `.tmp/`）

---

## 相关文档

| 文档 | 内容 |
|---|---|
| `docs/plans/yzcli-architecture-reference.md` | **YZCLI 全部实证事实**（规模 / 可移植资产 / 3 个缺口 / 3 个必须警惕） |
| `AGENTS.md` | 易飞 API 9 条硬约束 + 工程纪律（已踩坑 5 次） |
| `docs/TODO-PLAN.md` | D-01~D-14 任务（D-13=建analysis 层 / D-14=视图建库脚本） |
| `docs/plans/inv-monthly-stats-spec.md` | 库存月档字段语义 + 期末公式（D-14 直接依据） |
| `docs/plans/analysis-template-requirements.md` | 20 模板依赖 16 表 / 85 字段 |
| `docs/plans/analysis-table-mapping.xlsx` | 85 项表字段映射 |
| `docs/plans/dual-product-line-architecture.md` | 双产品线架构（注册表 + 共享判定逻辑） |
| `docs/plans/yf-materials-collection-checklist.md` | 16 类资料 P0-P2 |
| `docs/plans/yf-materials-tasks.md` | T-01~T-18 任务化 |
| `docs/decisions/OPEN-DECISIONS.md` | 22 条已裁决 + 「文档未说明」台账 |
| `docs/decisions/STATISTICS-SPEC.md` | 统计口径规范 |
