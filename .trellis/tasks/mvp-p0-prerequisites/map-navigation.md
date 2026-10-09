# P0 · 前置条件盘点

> **slug**：`mvp-p0-prerequisites` ｜ **优先级**：P0 ｜ **工作量**：S（1~3 天）｜ **进度**：0%
>
> 阶段目标：在写第一行业务代码之前，把「还有哪些前置步骤需要处理的，包括架构、易飞涉及到的资料（易飞有没有对应资料）」变成一份**可勾选、可指派、可验收**的清单。
>
> **本阶段是其余 5 个阶段（P1~P5）的依赖起点**，`task.json` 中其余 5 个任务的 `depends_on` 均含本任务。

---

## 目录结构导航

```
D:/AIProject/claude/YFAgent/
├── docs/
│   ├── decisions/
│   │   ├── OPEN-DECISIONS.md              [既有] 22 条已裁决 + 「文档未说明」台账
│   │   └── STATISTICS-SPEC.md[既有] 统计口径规范
│   ├── plans/
│   │   ├── mvp-development-plan.md        [本阶段产出] MVP 分期开发计划
│   │   ├── mvp-prerequisites-checklist.md [新增·本阶段主交付]
│   │   ├── yzcli-architecture-reference.md [既有] YZCLI 全部实证事实
│   │   ├── yf-materials-collection-checklist.md [既有] 16 类资料 P0-P2
│   │   ├── yf-materials-tasks.md          [既有] T-01~T-18 任务化
│   │   ├── analysis-template-requirements.md [既有] 20 模板依赖 16 表 85 字段
│   │   ├── analysis-table-mapping.xlsx   [既有] 85 项表字段映射
│   │   ├── inv-monthly-stats-spec.md      [既有] 库存月档期末成本公式
│   │   └── yf-db-direct-connect-probe.md  [既有] 数据库直连实测
│   └── TODO-PLAN.md                       [既有] D-01~D-14
├── knowledge/                [既有·机械产物，禁止手工编辑]
│   ├── typekey/typekey_map.yaml           106 对象 / 595 服务名 / 101 主键
│   ├── typekey-mapping/*.md               106 份/ 12,893 字段
│   ├── data-dictionary/                    78 模块字典 + 7 CSV
│   └── official/                           待建：menus / ai-endpoints / enums / glossary
├── .trellis/tasks/
│   ├── mvp-p0-prerequisites/    ← 本任务
│   ├── mvp-p1-auth-module/          ← 依赖本任务
│   ├── mvp-p2-crud-skill-openapi/   ← 依赖本任务
│   ├── mvp-p3-auth-integration/     ← 依赖本任务
│   ├── mvp-p4-analysis-qa/          ← 依赖本任务
│   └── mvp-p5-expert-module/        ← 依赖本任务
└── scripts/                    [既有] 抽取与校验脚本
```

---

## 模块职责速查

| 模块 / 路径 | 职责 | 本阶段是否新建 | YZCLI 对应物 |
|---|---|---|---|
| `docs/plans/mvp-development-plan.md` | 5 阶段范围界定 + 角色矩阵 + 关键路径 | ✅ 新建（本轮） | — |
| `docs/plans/mvp-prerequisites-checklist.md` | **本阶段主交付**：前置条件可勾选清单 | ✅ 新建 | — |
| `docs/decisions/OPEN-DECISIONS.md` | 「文档未说明」台账（禁止臆测的出口） | 🟡 追加 | — |
| `docs/plans/yf-materials-collection-checklist.md` | 16 类资料 P0-P2 分级（输入） | 既有 | — |
| `docs/plans/yf-materials-tasks.md` | T-01~T-18 任务化（输入） | 既有 | — |
| `docs/TODO-PLAN.md` | D-01~D-14 任务（输入，D-13/D-14 落在 P4） | 既有 | — |
| `knowledge/typekey/typekey_map.yaml` | 服务名路由唯一权威源 | 既有（只读） | `agent_typekey_map.yaml` 2,545 行 / 110 TypeKey |
| `knowledge/official/menus/` | 菜单树 / 业务域（**待收集**） | ⬜ 缺口 | `knowledge/ai-assistants/` 388 文件设计工作台 |
| `knowledge/official/ai-endpoints/` | 22 个 `yf.ai.*` 端点（**待收集**） | ⬜ 缺口 | `_routes.yaml` 的 `assistants[]` |
| `knowledge/enums/enums.yaml` | 枚举字典（**待收集**） | ⬜ 缺口 | `match.ini` `[Source]`（GBK，易踩编码坑） |
| `knowledge/glossary/` | 术语表 + 易助↔易飞对照（**待收集**） | ⬜ 缺口 | `knowledge/glossary/` |
| `knowledge/official/permissions/` | 权限与角色（**待收集**） | ⬜ 缺口 | `knowledge/official/permissions/` |

---

## 关键文件索引

| 文件路径 | 规模 | 作用 | 归属阶段 | 口径 |
|---|---|---|---|---|
| `knowledge/typekey/typekey_map.yaml` | 106 对象 / 595 服务名 | 服务名唯一权威源（**禁止拼接**） | P0 校验 → P2 使用 | `[口径：scripts/extract-typekey-map.mjs 机械抽取]` |
| `knowledge/typekey-mapping/*.md` | 106 份 / 12,893 字段 | 字段明细（易飞**无 help 服务**，只能靠静态产物） | P2 | `[口径：同上；title 非中文 0/106]` |
| `knowledge/data-dictionary/modules/` | 78 个md | 机械产物 —— **禁止直接改** | 不可改 | `[口径：gen_data_dictionary.py 生成]` |
| `knowledge/ADMMD-字段信息.xml` | 25 MB | 字段元信息源 | 只读 | `[口径：单文件体积]` |
| `knowledge/ADMMC-表名信息.xml` | 500 KB | 表名元信息源 | 只读 | `[口径：单文件体积]` |
| `knowledge/表结构信息/` | 4.7 MB | 已有表结构资料（**非全量**） | P4 依赖 | `[口径：目录体积]` |
| `docs/plans/yzcli-architecture-reference.md` | 160 行 | YZCLI 全部实证事实 | P0 全员必读 | `[口径：单文件行数]` |
| `docs/plans/analysis-table-mapping.xlsx` | 85 项映射 | 20 模板的表字段映射 | P0 盘点 → P4 实施 | `[口径：xlsx 数据行数]` |
| `docs/plans/analysis-template-requirements.md` | 16 表 / 85 字段 | 模板依赖清单（易飞同名命中 **0 张**） | P4 | `[口径：脚本解析 templates.ts 得defineTemplate 块数]` |

---

## 当前进度

**0%** —— 尚未开始。

- [ ] 架构裁决台账（双通道 / 包边界 / 数据流 / 视图策略 / L1-L4 落地状态标注）
- [ ] 16 类资料 P0-P2 台账 +覆盖度自检
- [ ] **「易助有但易飞无资料」缺口清单**
- [ ] 外部依赖问询函（4 类对象）
- [ ] 验收判据可测性评审（每条判据须能写成用例）

---

## 下一步

| # | 动作 | 负责角色 | 产出物路径 |
|---|---|---|---|
| 1 | 编写架构裁决台账：双通道确认 / 6 个包的边界与依赖方向 / 数据流 / 视图策略 / **L1-L4 每层落地状态**（YZCLI 实为「设计四层、代码两层」，L3/L4 无任何代码，本工程亦须如实标注） |架构师 | `docs/plans/mvp-prerequisites-checklist.md` §架构 |
| 2 | 汇总 16 类资料 P0-P2 台账 + 覆盖度自检表（对齐 `yf-materials-collection-checklist.md` §6） | 产品经理 | 同上 §资料台账 |
| 3 | 编制**「易助有但易飞无资料」缺口清单**（见下方 §关键发现） | 产品经理 | 同上 §缺口清单 |
| 4 | 起草外部依赖问询函，覆盖 4 类对象：43 个 MA012 节点 / 22 个 `yf.ai.*` 端点 / 5 个入参容器名文档缺陷 / 5 个未知业务主键 | 产品经理 | `docs/plans/mvp-prerequisites-inquiry.md` |
| 5 | 资料缺口技术可行性反查：逐项标注「可脚本化抽取」vs「必须外部索取」 | 后端开发 | 清单 §可行性列 |
| 6 | 验收判据**可测性评审**：逐条判定「能否写成用例」，不可测的判据必须改写 | 测试 | 清单 §可测性评审 |
| 7 | 阶段放行裁决：确认 P1 可开工 | 总监 | 清单 §放行裁决 |

---

## ★ 关键发现：「易助有但易飞无」资料缺口

> 这是用户第4 项要求的前置盘点核心结论。**易助侧有、易飞侧完全没有或没有等价物的资料**：

| # | 资料 | 易助侧有什么 | 易飞侧现状 | 影响 | 优先级 |
|---|---|---|---|---|---|
| 1 | **全量数据库表结构** | 574 个 XML（`Tbschema/`） | **Apipost文档中完全不含表结构**（仅有节点名）；`knowledge/表结构信息/` 4.7 MB 非全量 | P4 的 20 模板依赖 **16 表 / 85 字段**，部分可从实库探针反推（如 `inv-monthly-stats-spec.md` 对 6 张月档表已这样做），但**覆盖不了 85 字段** | P1 |
| 2 | **AI 分析端点清单** | 22 个助手的 `service` 定义（`yz.ai.*` 8 个 / `yf.ai.*` 2 个 / `yz.oapi.*` 5 个 / 裸typekey 5 个 / MCP 2 个） | **仅确证 2 个**：`yf.ai.PurchaseBusinessWarning`（助手 06）、`yf.ai.SalesbusinessWarning`（助手 17）；其余 **20 个待易飞提供** | 决定助手是「直调复刻」还是「改走引擎计算」 | P0 |
| 3 | **菜单树 / 业务域** | `yizhu-erp-ai-expert.md:39-50` 十域清单 + `knowledge/official/menus/` | **Apipost 目录 ≠ 系统菜单**。仅有 106 对象首段聚合线索（采购 12 / 委外 10 / 品号 8 / 工单 7 / 销售 6 / 财务 5 / 应收预收 4 / 质量 3 / 基础资料约 20） | 无菜单树则助手触发词只能靠猜 | P0 |
| 4 | **枚举与常量字典** | `match.ini` `[Source]`（权威来源，含`33`=销货单 / `82`=领料 等） | **完全缺失**。仅有 Apipost `description` 零散线索（`pricing_order` 1~I 档 / `invoice_type: A` / `taxed_code: 1` / `receive_method: 3`）；981 个掩码字段未采集 | **易飞若无对应字典，20 个 SQL 模板全错** | P1 |
| 5 | **术语表（易助↔易飞对照）** | `knowledge/glossary/` | **完全缺失** | LLM 跨产品线串味；prompts 措辞不统一 | P1 |
| 6 | **业务流程与审批规则** | `knowledge/ai-assistants/` 388 文件设计工作台 | **完全缺失** | 助手 `_workflow.md` 无业务规则；「approve 能否执行」靠试 | P1 |
| 7 | **自定义字段实际配置** | 按客户分文件 | **完全缺失**。易飞支持 `udf01~udf12`（文本）+ `udf51~udf62`（数值）共 24 个，客户现场配置不同 | 客户数据落不到正确字段 | P1 |
| 8 | **错误码完整表与话术** | `error-codes.md` | **仅有样本**（`0`/`-1` + 权限不足/主键重复/找不到服务） | 用户话术缺失 | P2 |
| 9 | **性能与容量基线** | 有实测记录 | **完全缺失**。⚠️ 易飞**无 `fastquery`**，所有查询重查数据库 | 直接决定 `page_size` 默认值与缓存策略 | P2（建议 P2 早期粗测） |
| 10 | **权限与角色细节** | RBAC 策略完整 | 权限**模型已确认同构**（基本/成本/售价三档），角色模板与数据权限缺失 | Gateway RBAC 策略 | P2 |

**反向结论（易飞已有、易助侧参考价值不大）**：
- 易飞**无字段编号体系**（勿套用易助的「字段编号」概念）
- 易飞自研字段 `udf01~udf12` / `udf51~udf62` 与易助命名**互斥**
- 易飞 `create_date` 长度 17，格式 `20241008153342862`，**非 ISO 日期**
- 易飞**无 `fastquery`**（性能特性与易助天差地别）
- 易飞视图**不带 `COMPANY` 过滤**（`COMPANY` 为预留管理字段，易飞为独立公司账套）

---

## 硬性约束与教训

### A. 易飞 OpenAPI 9 条硬约束
> 来源 `AGENTS.md`，2026-10-08 真机实测。**违反其中任何一条都会产生错误数据或误判，且多数不会报错。**

| # | 约束 | 后果 |
|---|---|---|
| 1 | 枚举字段查询**只传编码**（回参是 `Y.已审核`，传 `Y.已审核` 静默返回 0 条） | 查不到数据，不报错 |
| 2 | 主键全错返回 `code=0` + 空数组 | 不能用 `code` 判断「查到了」，须主动告警 |
| 3 | 错误token 返回 **HTTP 500 + HTML**（不是 JSON） | 解析 body 会崩，须先判状态码 |
| 4 | `node_name` 用**逻辑节点名**（`*_data`），不是物理表名 | 传 `ACTTA` 报 `MA012未定義` |
| 5 | 服务名**只能查表，禁止拼接**（`supplier` 无 `.data` 段 / `customer` 有 `.data` 段） | 按 `{type_key}.data.{op}.get` 拼接必错 |
| 6 | `conditions` 必须是**对象形态** | 数组形态静默失效返回全量数据 |
| 7 | 分页 `page_no` 从 **1** 开始，`page_size` 上限 **10000**（须实测标定） | 漏数据或超时 |
| 8 | 易飞**无 `fastquery`**，所有查询重查数据库 | 与易助性能天差地别，影响缓存策略 |
| 9 | 成功判据 `execution.code === "0" \|\| "-0"` | 禁止字符串匹配 `description`（简繁混用） |

补充：`error[]` 有**双结构**（`{message,data}` 与 `{information:[...]}`），解析器必须都兼容，未识别时**必须打 WARN**；`error[].data` 会完整回显传入数据，写日志前须脱敏。

### B. 易助/易飞单据编码同码不同义 —— 必须转码
| 码 | 易助含义 | 易飞含义 | 处理 |
|---|---|---|---|
| `33` | 销货单 | 销售订单类 | **必须转码：易助 33 → 易飞 23** |
| `82` | 领料单 | 生产领料类 | **必须转码：易助 82 → 易飞 54** |
| `84` | 生产耗用 | ⚠️ 与易助不同义 | 逐单据确认后建转码表 |
| `85` | ⚠️ 与易助不同义 | ⚠️ 与易助不同义 | 逐单据确认后建转码表 |

→ 凡涉及单据类型码，**必须建「易助码 → 易飞码」转码表并集中管理**，禁止在 SQL/代码里散落硬编码、禁止沿用易助常量。四处冲突（33/82/84/85）是本工程最容易静默算错数的地方。

### C. 审核码口径
- 易飞实测三值：`Y` = 已审核 / `N` = 未过账 / `V` = **作废**（用户 2026-10-09 裁决）
- **统计只筛 `Y`**
- 易助侧是 `'T'` —— **勿沿用易助常量**
- 不筛审核码会污染 **12 倍** `[口径：同一单据集合，含税金额合计，未按审核码过滤 vs 过滤后对比；已审核 24 单 5,817 万 vs 未审核 13 单 7.28 亿，易助侧真机实测]`

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
| 1 | **视图与 SQL 模板是两套并行取数路径且未打通**：20 个模板全部直查物理表、不查 `vw_ai_*`；视图仅在语义层被引用为字符串（`semantic/model.ts:161-243`、`rules/metric-registry.ts:274-317`）→ 「视图建了但没人查」 | **视图与 SQL 模板必须一开始就打通**，视图先行、模板只查视图，禁止模板直查物理表 |
| 2 | **设计四层防护，代码只有两层**：L1 模板注册制（`runtime/sql/template.ts:62-84`）+ L2 执行器约束（`executor.ts` 全文）已落地；**L3 部署约束 / L4 治理无任何代码**，仅纸面规范 | 引用 YZCLI 防护能力时不要沿用「四层已落地」的错误表述；本工程须明确标注每层落地状态 |
| 3 | **无生产 mssql driver**：`SqlDriver` 只是接口定义（`runtime/sql/executor.ts:24-37`），唯一真实 driver 在 `scripts/verify-ai-views.mjs:33`（验证脚本，非生产代码）；且集成测试用 `fakeDriver()`（`__tests__/sql-executor.test.ts:40`） | 生产 driver 与真实库集成测试是**必做项**，不能只做 fake driver 单测 |
| 4 | **LLM 端到端取数链路未通**（`analysis/src/__tests__/end-to-end.test.ts:22` 自述被 `user_token` 阻塞） | 「端到端跑通」必须是本工程的验收判据，不接受「单测全绿」代替 |
| 5 | **授权层无完整性**：无 OAuth / refresh / 缓存 / 重试 / 健康检查；token 靠人工从 TPASC19 作业取静态串 | 授权是本工程阶段一的**主体工作量**，不可假定 YZCLI 已解决 |
| 6 | **模板白名单比模板库窄**：`config/analysis-sql.example.json` 的 `allowed_templates` 只列 15 个，模板库有 20 个 | 白名单必须与模板库**同步校验**，不一致即门禁失败 |
| 7 | **`yzcli-finance` 包与 experts 凭证能力重叠且无交叉引用**（9 文件 / 1,327 行重复） | 不复刻这个重复 |

### F. 本工程基线（引用数字时必须带口径）
| 项 | 值 | 口径 |
|---|---|---|
| 知识产物 | 106 业务对象 / 595 服务名 / 106 份字段对照表（12,893 字段）/ 78 模块字典 / 7 个 CSV | `[口径：scripts/extract-*.mjs 机械抽取，门禁 check:all 4/4 PASS]` |
| SDK 骨架 | 单包 `packages/yfcli-sdk/` / 9 个源码子目录 / 20 个 TS 文件 | `[口径：不含 node_modules 与测试]` |
| SDK 质量 | `tsc` 零错误 / 离线用例 60 项 / 冻结判据 50 项 | `[口径：npm run check:skeleton + check:offline + check:dict]` |
| 真机验证 | 15/15 PASS | `[口径：scripts/probe-live-env.mjs 只读探测]` |
| 数据库直连 | SQL Server 2014 / 1,211 张表 / 库表名与字典 100% 一致（52 组 3 位前缀交叉全部一致，0 组不同） | `[口径：2026-10-09 实测，3 位前缀交叉比对]` → **无需映射层** |
| 易飞视图现状 | 仅 4 个（`MoJu` / `VCMSMQZ` / `VCOPTH` / `VMOCTE`），**无 `vw_ai_*`** | `[口径：实库 sys.views 查询]` |
| YZCLI 对标规模 | 11 包 / 203 生产 .ts / 25,091 行 | `[口径：packages/*，排除 node_modules/dist 与 *.test.ts]` |
| YZCLI 可移植资产 | 约 300~500 行（`template.ts` 150 + `executor.ts` 156 + `config.ts` 129 + `create-ai-views.sql` 155） | `[口径：四文件行数之和]` |
| YZCLI 必须新写 | 约 90% 行数（元数据 / 20 模板 / 9 视图 / License 4,126 / Gateway 3,906 / 专家公式 3,815） | `[口径：按行数估计，未逐行分类]` |

### G. 本阶段专属纪律
- **禁止修改任何知识产物**：`knowledge/**` 由脚本生成，`npm run gen:all` 覆盖。P0 只读不写。
- **不得臆测**：调用频率限制 / HTTP 状态码完整语义 / Token 有效期与刷新 / 超时时间 / 版本兼容正式策略 / 单笔批量上限 / `sql_code` 取值含义 / 三版本接口差异 —— 这些**文档中没有**，遇到就说「文档未说明」并转入 `docs/decisions/OPEN-DECISIONS.md`。
- **外部依赖只登记不承诺**：43 个 MA012 节点 / 22 个 `yf.ai.*` 端点 / 9 视图 DDL 执行 / 大数据量账套，**均不在我方控制范围**，P0 只负责起草问询函与排期，不得在计划里假设它们会按时到位。
- **降级方案必须写进清单**：每个外部阻塞项都要有降级路径（如 22 个端点拿不到 → 改走「`query.get` 取数 → experts 引擎计算 → 本地生成报告」）；唯一无降级的是 9 视图 DDL（视图是 P4 地基）。

---

## 参考文档

| 文档路径 | 内容 | 为什么读它 |
|---|---|---|
| `docs/plans/mvp-development-plan.md` | 5 阶段范围 + 角色矩阵 + 关键路径 + 风险 | **本阶段的产出依据**，也是各阶段 `depends_on` 的来源 |
| `docs/plans/yzcli-architecture-reference.md` | YZCLI 全部实证事实（160 行） | 判断「哪些能抄、哪些必须重写」的唯一依据 |
| `AGENTS.md` | 9 条硬约束 + 工程纪律（209 行） | 动手前必读，尤其易踩坑 5 次的教训 |
| `docs/TODO-PLAN.md` | D-01~D-14 任务 + 架构裁决 | 现有任务台账，P0 需与之对齐避免重复建项 |
| `docs/plans/yf-materials-collection-checklist.md` | 16 类资料 P0-P2 + 覆盖度自检 | **P0 台账的主体输入** |
| `docs/plans/yf-materials-tasks.md` | T-01~T-18 任务化 | 采集动作的执行台账，P0 只盘点不执行 |
| `docs/decisions/OPEN-DECISIONS.md` | 22 条已裁决 + 8 条真机实证 | 避免重复裁决；「文档未说明」的登记入口 |
| `docs/decisions/STATISTICS-SPEC.md` | 统计口径规范 | 所有数字必须带口径标签的依据 |
| `docs/plans/yf-openapi-rules.md` | 易飞 OpenAPI 规则 + §0「文档未说明」10 项 | 禁止臆测的清单来源 |
| `docs/plans/analysis-table-requirements.md` | 20 模板依赖 16 表 / 85 字段 | 缺口清单第1 项（表结构缺失）的证据 |
