# P2 · CRUD 五操作 + MCP 工具层 + skill-openapi 打包

> **slug**：`mvp-p2-crud-skill-openapi` ｜ **优先级**：P0 ｜ **工作量**：XL（5~8 天）｜ **进度**：0%
>
> 阶段目标：**MVP 最小可运行** —— CRUD 五操作跑通，打包成 skill-openapi 可被 Agent 调用。
> 这是用户指定的第 2 项「先实现 CRUD 等操作，打包完成 skill-openapi 的调用」。
>
> 依赖：**`mvp-p0-prerequisites`**（服务名路由边界须先确认）+ **`mvp-p1-auth-module`**（token 注入须已有单一入口）。
> **不可与 P1 调换** —— 若先做 CRUD，每个工具都要各写一遍鉴权，这正是 YZCLI 的教训。

---

## 目录结构导航

```
D:/AIProject/claude/YFAgent/packages/
├── yfcli-auth/                [P1 产出] 授权模块
├── yfcli-sdk/                     [既有 · 本阶段改造]
│   └── src/
│       ├── client/yf-client.ts     改造：query/read/create/update/delete 五操作
│       ├── conditions/
│       │   ├── builder.ts          改造：7 类写法（对象形态硬约束）
│       │   └── enum-guard.ts既有：枚举只传编码
│       ├── response/parser.ts      改造：error[] 双结构兼容 + 未识别打 WARN
│       ├── catalog/typekey-catalog.ts  既有：服务名路由（只查表不拼接）
│       └── dictionary/             既有：CSV 字典读取
├── yfcli-mcp/                      [新增 · 本阶段主交付]
│   └── src/
│       ├── index.ts                入口
│       ├── registry.ts             ★ 集中式注册表（YZCLI 无，是反面教材）
│       ├── server.ts               MCP server
│       └── tools/
│           ├── manifest.ts         返回 106 对象
│           ├── query.ts
│           ├── read.ts
│           └── help.ts
├── yfcli-skill-openapi/            [新增 · 本阶段主交付]
│   ├── SKILL.md                    ★ 薄 Skill：只留角色定义 + 助手 Prompt
│   └── references/                 按需读取，不占常驻上下文
├── yfcli-analysis/                 [P4 新建]
└── yfcli-experts/                  [P5 新建]

knowledge/
├── typekey/typekey_map.yaml    [只读] 106 对象 / 595 服务名 —— 服务名唯一权威源
├── typekey-mapping/*.md            [只读] 106 份 / 12,893 字段 —— 字段明细
└── data-dictionary/modules/        [禁止直接改] 78 个机械产物

docs/YFAgent/                     [新增 · 3 个冒烟助手]
├── 01-plant-query/
├── 02-plant-read/
└── 03-customer-create/
```

---

## 模块职责速查

| 模块 / 路径 | 职责 | 本阶段是否新建 | YZCLI 对应物 |
|---|---|---|---|
| `yfcli-mcp/src/registry.ts` | **集中式工具注册表**（漏挂即门禁失败） | ✅ 新增 | ❌ **YZCLI 无集中注册表** —— `index.ts:113-138` 逐个显式调用，新增工具易漏挂 |
| `yfcli-mcp/src/tools/*` | `manifest` / `query` / `read` / `help` | ✅ 新增 | `packages/yzcli-mcp/src/tools/*.ts` —— 22 个工具 `[口径：server.tool( 出现次数]` |
| `yfcli-skill-openapi/SKILL.md` | 薄 Skill：角色定义 + 助手 Prompt + 分诊表 | ✅ 新增 | `skills/yzcli-erp/SKILL.md` v4.3.0 —— 能力进二进制，Skill 只留 Prompt |
| `yfcli-sdk/src/client/yf-client.ts` | 五操作主链路 | 🟡 改造 | `packages/yzcli-sdk/src/client.ts` **201 行** |
| `yfcli-sdk/src/conditions/builder.ts` | 7 类条件构造 | 🟡 改造 | `conditions/`（易助侧写法在易飞会**静默失效**） |
| `yfcli-sdk/src/conditions/enum-guard.ts` | 枚举只传编码 | 既有 | —— |
| `yfcli-sdk/src/response/parser.ts` | `error[]` 双结构兼容 + WARN | 🟡 改造 | —— |
| `yfcli-sdk/src/catalog/typekey-catalog.ts` | 服务名路由（**只查表**） | 既有 | `agent_typekey_map.yaml` 2,545 行 / 110 TypeKey |
| 服务名路由表 | 106 对象 × 8 操作 | 🟡 用既有 | **必须从 `typekey_map.yaml` 查**，禁止 `{type_key}.data.{op}.get` 拼接 |
| 3 个冒烟助手 | 工厂查询 / 工厂读取 / 客户新增 | ✅ 新增 | `docs/YFAgent/{NN}/`（22 个助手目录，MVP 只做 3 个） |
| License / 多租户 / Gateway | — | ❌ **整体砍掉** | License 4,126 行 + Gateway 3,906 行 |
| `yzcli-finance` | — | ❌ **不复刻** | 9 文件 / 1,327 行，与 experts 凭证能力重叠且无交叉引用 |
| 22 个 `yf.ai.*` 端点 | — | ❌ **P0 阻塞，清单未拿到** | 已确证 2 个现役（助手 06/ 17） |
| 审批工作流 `_workflow.md` | — | ❌ **T-08 未完成** | `knowledge/ai-assistants/` 388 文件工作台 |
| `knowledge/enums/enums.yaml` | — | ❌ **需大数据量账套** | `match.ini`（GBK，易踩编码坑） |

---

## 关键文件索引

| 文件路径 | 规模 | 作用 | 归属阶段 | 口径 |
|---|---|---|---|---|
| `packages/yfcli-sdk/src/` | **20 个 TS 文件 / 9 个源码子目录** | 本阶段主要改造面 | P2 | `[口径：不含 node_modules 与测试]` |
| `knowledge/typekey/typekey_map.yaml` | 106 对象 / 595 服务名 | **服务名唯一权威源**（禁止拼接） | P2 硬依赖 | `[口径：scripts/extract-typekey-map.mjs 机械抽取]` |
| `knowledge/typekey-mapping/*.md` | 106 份 / **12,893 字段** | 字段明细（易飞**无 help 服务**，只能靠静态产物） | P2 硬依赖 | `[口径：同上；title 非中文 0/106]` |
| `knowledge/data-dictionary/modules/` | 78 个 md | 机械产物 —— **禁止直接改** | 不可改 | `[口径：gen_data_dictionary.py 生成]` |
| `packages/yzcli-sdk/src/client.ts`（YZCLI） | **201 行** | CRUD 链路参照 | P2 参照 | `[口径：单文件行数]` |
| `packages/yzcli-mcp/src/`（YZCLI） | 46 文件 / **5,068 行** / 22 工具 | MCP 层规模参照 | P2 参照 | `[口径：server.tool( 出现次数]` |
| `packages/yzcli-mcp/src/index.ts`（YZCLI） | `:113-138` | **反面教材**：逐个显式调用，无集中注册表 | P2 规避 | `[口径：行号区间]` |
| `skills/yzcli-erp/SKILL.md`（YZCLI） | v4.3.0 | 分工参照：能力进二进制，Skill 只留 Prompt | P2 借鉴 | `[口径：单文件版本号]` |
| `analysis/src/__tests__/end-to-end.test.ts`（YZCLI） | `:22` | **反面教材**：端到端被 `user_token` 阻塞 | P2/P4 规避 | `[口径：行号]` |
| `scripts/probe-live-env.mjs` | —— | 真机只读探测（可复现） | P2 复用 | `[口径：脚本]` |

---

## 当前进度

**0%** —— 尚未开始。

- [ ] 106 对象 × 8 操作服务名路由表
- [ ] `query` / `read` / `create` / `update` / `delete` 五操作
- [ ] 复合主键 `datakeys` 含全部主键字段
- [ ] `conditions` 构造器 7 类写法
- [ ] `error[]` 双结构兼容 + 未识别打 WARN
- [ ] MCP 工具层（`manifest` / `query` / `read` / `help`）+ **集中式注册表**
- [ ] skill-openapi 包 + 薄 Skill
- [ ] 3 个冒烟助手（工厂查询 / 工厂读取 / 客户新增）

---

## 下一步

| # | 动作 | 负责角色 | 产出物路径 |
|---|---|---|---|
| 1 | 裁决 MCP 工具**集中式注册表**设计（替代 YZCLI 逐个显式调用）+ 五操作契约 + 薄 Skill 边界 | 架构师 | `docs/decisions/ADR-00X-mcp-注册表.md` |
| 2 | 核对服务名路由表：106 对象 × 8 操作**逐条查表核对**，标出无对应服务的组合 | 后端开发 | `packages/yfcli-sdk/src/catalog/typekey-catalog.ts` 注释 + 校验报告 |
| 3 | 实现五操作，含复合主键 `datakeys` 组装 | 后端开发 | `packages/yfcli-sdk/src/client/yf-client.ts` |
| 4 | 实现 `conditions` 7 类写法，**强制对象形态**（传数组即报错，不得静默降级） | 后端开发 | `packages/yfcli-sdk/src/conditions/builder.ts` |
| 5 | 实现 `error[]` 双结构解析 + 未识别打 WARN + 日志脱敏 | 后端开发 | `packages/yfcli-sdk/src/response/parser.ts` |
| 6 | 实现 MCP 工具层 + **集中式注册表**（漏挂即门禁失败） | 后端开发 | `packages/yfcli-mcp/src/` |
| 7 | 编写薄 Skill：3 个冒烟助手的角色定义 + Prompt + 触发词/排除词 | 后端开发 + 产品经理 | `packages/yfcli-skill-openapi/SKILL.md` |
| 8 | 定义 3 个冒烟助手的业务定义 + 触发词/排除词（依据 106 对象首段聚合线索 + Apipost 目录中文名） | 产品经理 | `docs/YFAgent/0{1,2,3}-*/_meta.json` |
| 9 | 编写 10 条验收用例，重点**反向用例**（数组 conditions 报错 / 枚举编码 / 空结果告警 / 枚举传 `Y.已审核` 告警） | 测试 | `packages/yfcli-mcp/src/__tests__/` |
| 10 | MVP 放行裁决（3 个冒烟助手是否够） | 总监 | `docs/decisions/ADR-00X-mcp-注册表.md` §放行 |

---

## 硬性约束与教训

### A. 易飞 OpenAPI 9 条硬约束
> 来源 `AGENTS.md`，2026-10-08 真机实测。**违反其中任何一条都会产生错误数据或误判，且多数不会报错。**
> **本阶段是这 9 条约束的主战场** —— 五操作与条件构造全部踩在它们上面。

| # | 约束 | 后果 | 本阶段对应实现点 |
|---|---|---|---|
| 1 | 枚举字段查询**只传编码**（回参是 `Y.已审核`，传 `Y.已审核` 静默返回 0 条） | 查不到数据，不报错 | `conditions/enum-guard.ts` 强制剥离编码后缀 |
| 2 | 主键全错返回 `code=0` + 空数组 | 不能用 `code` 判断「查到了」，须主动告警 | `read` 空结果必须告警 |
| 3 | 错误 token 返回 **HTTP 500 + HTML**（不是 JSON） | 解析 body 会崩，须先判状态码 | 由 P1 auth 层兜住 |
| 4 | `node_name` 用**逻辑节点名**（`*_data`），不是物理表名 | 传 `ACTTA` 报 `MA012未定義` | 查单身字段必须加 `node_name` |
| 5 | 服务名**只能查表，禁止拼接**（`supplier` 无 `.data` 段 / `customer` 有 `.data` 段） | 按 `{type_key}.data.{op}.get` 拼接必错 | `catalog/typekey-catalog.ts` |
| 6 | `conditions` 必须是**对象形态** | 数组形态**静默失效返回全量数据** | `conditions/builder.ts` |
| 7 | 分页 `page_no` 从 **1** 开始，`page_size` 上限 **10000**（须实测标定） | 漏数据或超时 | `query` 分页实现 |
| 8 | 易飞**无 `fastquery`**，所有查询重查数据库 | 与易助性能天差地别，影响缓存策略 | 不设计缓存层|
| 9 | 成功判据 `execution.code === "0" \|\| "-0"` | 禁止字符串匹配 `description`（简繁混用） | `response/parser.ts` |

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
- **本阶段注意**：写操作（`approve`/`disapprove`/`invalid`）涉及审核码变更，须按易飞三值语义实现，勿套用易助

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
| 1 | **MCP 无集中式注册表**：靠 `packages/yzcli-mcp/src/index.ts:113-138` 逐个显式调用 | **本工程用集中式注册表**，新增工具漏挂时门禁失败 |
| 2 | **Skill 边界**：v4.3.0 设计意图是「路由/组装/字段映射/防幻觉规则已编入 MCP 二进制，Skill 仅留角色定义与助手 Prompt」 | **沿用此分工** —— 能力进二进制，Skill 只留 Prompt，不把逻辑写进 markdown |
| 3 | **易助的 `conditions` 写法在易飞会静默失效**（数组形态返回全量数据，不报错） | 反向用例必须覆盖：传数组形态须**显式报错** |
| 4 | **`end-to-end.test.ts:22` 端到端被 `user_token` 阻塞** | 本阶段 3 个冒烟助手必须**端到端真跑**，不接受单测全绿代替 |
| 5 | **授权散落 4 处**（SDK `config.ts` 67 行 / MCP `erp-client.ts` 21 行 / Gateway 40+67 / Python 173 行） |鉴权只走P1 的**单一入口**，工具内不各写一遍 |
| 6 | **`yzcli-finance` 与 experts 凭证能力重叠且无交叉引用**（9 文件 / 1,327 行） | **不复刻这个重复** |
| 7 | **设计四层防护，代码只有两层**：L1 模板注册制 + L2 执行器约束已落地；**L3/L4 无任何代码** | 引用防护能力时标注每层落地状态，不宣称「四层已落地」 |
| 8 | **视图与 SQL 模板两套路径未打通**（模板全查物理表；视图仅在语义层被引用为字符串 `semantic/model.ts:161-243`、`rules/metric-registry.ts:274-317`） | 落在 P4，视图先行、模板只查视图 |
| 9 | **无生产 mssql driver**（`SqlDriver` 只是接口 `executor.ts:24-37`；唯一真实 driver 在验证脚本 `verify-ai-views.mjs:33`；集成测试用 `fakeDriver()` `sql-executor.test.ts:40`） | 落在 P4，生产 driver + 真实库集成测试必做 |

### F. 本工程基线（引用数字时必须带口径）
| 项 | 值 | 口径 |
|---|---|---|
| 知识产物 | 106 业务对象 / 595 服务名 / 106 份字段对照表（12,893 字段）/ 78 模块字典 / 7 个 CSV | `[口径：scripts/extract-*.mjs 机械抽取，门禁 check:all 4/4 PASS]` |
| SDK 骨架 | 单包 `packages/yfcli-sdk/` / 9 个源码子目录 / 20 个 TS 文件 | `[口径：不含 node_modules 与测试]` |
| SDK 质量 | `tsc` 零错误 / 离线用例 60 项 / 冻结判据 50 项 | `[口径：npm run check:skeleton + check:offline + check:dict]` |
| 真机验证 | 15/15 PASS（**只读**，写操作未测） | `[口径：scripts/probe-live-env.mjs 只读探测]` |
| 节点名验证 | 175 个 `*_data` 节点：**110 可用**（5 直接通过 + 105 字段名猜错但节点名有效）/ 43 报 MA012 | `[口径：scripts/verify-node-names.mjs 批量验证]` |
| 业务主键 | **101/106** 已确定；5 个未知（4 个已反推补录 `primary_key_source: live_probe`，第 5 个 `item.inventory.qty` 服务端 DLL 崩溃） | `[口径：typekey_map.yaml 字段统计]` |
| 只读对象 | **28 个**已标注只读 | `[口径：同上]` |
| 数据库直连 | SQL Server 2014 / 1,211 张表 / 库表名与字典 100% 一致（52 组 3 位前缀交叉全部一致，0 组不同） | `[口径：2026-10-09 实测]` → **无需映射层** |
| YZCLI 对标规模 | 11 包 / 22 个 MCP 工具 | `[口径：server.tool( 出现次数]` |

### G. 本阶段专属纪律
- **写操作真机未测**：真机 15/15 PASS **仅覆盖只读**。`create` / `update` / `delete` 首次接真机须**在测试账套做、可回滚**、单据数量最少化。
- **`update` 的三条易错约束**：① 按主键定位 ② 单身须含**所有**输入字段 ③ **不支持删除单身**（单身是「存在则更新、不存在则新增」）。单头与单身 key 必须一致。
- **`create` 必须提供业务主键 + 不可空白字段**；支持单别自动审核。
- **复合主键普遍存在**（如 `doc_type_no + doc_no`），`datakeys` 必须含**全部**主键字段，缺一个就定位不到。
- **不实现缓存层**：易飞无 `fastquery`，但 MVP 不引入缓存 —— 先测性能基线（P4 的 `docs/guides/OPERATIONS-性能基线.md`）再决定。
- **不铺 22 个助手**：MVP 只做 3 个冒烟。助手路由触发词在无菜单树的情况下是**初版**，须标注待人工复核。
- **43 个 MA012 节点只做延后处理**：本阶段仅用 110 个已验证节点；`item.inventory.qty` 服务端 DLL 崩溃（`OAPComF2.exe Access violation`），**从可用清单中剔除并显式标注**。

---

## 参考文档

| 文档路径 | 内容 | 为什么读它 |
|---|---|---|
| `AGENTS.md` | **9 条硬约束全文** + 写操作约束 + 已知文档缺陷 | 本阶段最核心的参考 |
| `docs/plans/mvp-development-plan.md` §一 P2 / §二 P2 |阶段范围（做/不做）+ **10 条验收判据** | 动手前的唯一依据 |
| `docs/plans/yzcli-architecture-reference.md` 第三、六节 | 可移植资产 + MCP 工具 22 个 / 无集中注册表 | MCP 层设计的取舍依据 |
| `docs/plans/yf-openapi-rules.md` | 易飞 OpenAPI 规则（441 行）+ 13 类条件范例 | 条件构造器的完整依据 |
| `docs/plans/yf-vs-yizhu-openapi-diff.md` | 31 维度对照 | 识别易飞/易助写法差异 |
| `docs/plans/yf-materials-collection-checklist.md` §2.5 | 业务域线索（106 对象首段聚合） | 3 个冒烟助手触发词初版依据 |
| `docs/plans/yf-materials-tasks.md` T-17 / T-18 / T-11 | 节点名验证结果与文档缺陷 | 已知阻塞范围 |
| `docs/plans/yf-live-probe-report.md` | 真机 15/15 PASS 完整报告 | 写操作真机测试的基线 |
| `.trellis/tasks/mvp-p1-auth-module/map-navigation.md` | P1 产出的授权契约 | 本阶段鉴权接入点 |
