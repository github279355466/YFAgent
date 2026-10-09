# P3 · 授权打通

> **slug**：`mvp-p3-auth-integration` ｜ **优先级**：P0 ｜ **工作量**：M（1~3 天）｜ **进度**：0%
>
> 阶段目标：把 P1 的授权模块真正接到全链路（SDK → MCP → skill-openapi），端到端鉴权可用。
> 这是用户指定的第 3 项「实现授权打通」。
>
> 依赖：**`mvp-p1-auth-module`**（授权包能力）+ **`mvp-p2-crud-skill-openapi`**（鉴权对象是 P2 的 MCP 工具与 skill 层）。
> **不可与 P4 调换** —— P4 的智能问数端到端链路需要本阶段的鉴权与健康检查才能跑通。
> **YZCLI 就是卡在这里**：`analysis/src/__tests__/end-to-end.test.ts:22` 自述被 `user_token` 阻塞。不能重复这个失败。

---

## 目录结构导航

```
D:/AIProject/claude/YFAgent/
├── packages/
│   ├── yfcli-auth/                   [P1 产出 · 本阶段接线]
│   │   └── src/
│   │       ├── index.ts              改造：对外暴露完整契约
│   │       ├── token-store.ts        改造：支持链路级注入
│   │       ├── health.ts             改造：组合故障诊断
│   │       ├── errors.ts             改造：token_expired / token_invalid 分级
│   │       └── redact.ts             改造：脱敏贯通到 MCP/skill 层
│   ├── yfcli-mcp/                    [P2 产出 · 本阶段接线]
│   │   └── src/
│   │       ├── server.ts             改造：启动即校验鉴权配置
│   │       ├── registry.ts           改造：工具调用前统一鉴权包装
│   │       └── tools/*.ts            改造：移除各处散落鉴权
│   └── yfcli-skill-openapi/          [P2 产出]
│       └── SKILL.md                  改造：鉴权失败的话术分级
├── config/
│   ├── yfcli.example.yaml        [P1 产出] 配置模板（只存引用）
│   └── *.local.yaml               既有 · 不入库 · 实际配置
└── packages/yfcli-analysis/          [P4 新建 · 本阶段为其铺路]
```

---

## 模块职责速查

| 模块 / 路径 | 职责 | 本阶段是否新建 | YZCLI 对应物（**反面基准**） |
|---|---|---|---|
| token 注入**单一入口** | 配置文件只存引用，明文走环境变量 |🟡接线 | ❌ YZCLI 无统一入口，token 靠调用方各层传入 |
| `errors.ts` 错误分级 | `token_expired` / `token_invalid` **必须不同码** | 🟡 改造 | ❌ YZCLI 无错误分类 |
| `health.ts` 组合诊断 | 能区分「token 有效但 `CompanyId` 错误」 | 🟡 改造 | ❌ **YZCLI 无健康检查** |
| `redact.ts` 脱敏贯通 | 覆盖 SDK / MCP / skill 三层日志 | 🟡 改造 | `logging/redact.ts`（既有，本工程已有） |
| MCP server 启动校验 | 启动即校验鉴权配置，不等到调用时 | 🟡 改造 | `http-server.ts:21-27` **仅「非空 + 长度 ≥ 8」** —— 本阶段不做这种弱校验 |
| 工具级鉴权包装 | 在注册表层统一包装，不逐工具写 | 🟡 改造 | `erp-client.ts`（21 行）注释强调 Token **ALWAYS** from caller，但**无集中包装** |
| 用户话术分级 | 过期 / 无效 / 权限不足三种场景话术不同 | ✅ 新增 | —— |
| OAuth / refresh / 缓存预热 | — | ❌ **不做** | 无对应物 |
| 多租户 / Gateway / License | — | ❌ **整体砍掉** | Gateway 多租户 3,906 行 + License 4,126 行 |
| 厂商刷新接口对接 | — | ❌ **不做** | —— **Token 有效期与刷新语义文档未说明** |
| 权限模型与角色模板 | — | ❌ **P2 资料项** | 权限模型已确认易飞与易助同构（基本/成本/售价），细节待补 |

---

## 关键文件索引

| 文件路径 | 规模 | 作用 | 归属阶段 | 口径 |
|---|---|---|---|---|
| `packages/yfcli-auth/src/` | P1 新建 | 授权模块主体，本阶段接线改造 | P3 | `[口径：新增]` |
| `packages/yfcli-mcp/src/server.ts` | P2 新建 | MCP server，启动即校验鉴权 | P3 改造 | `[口径：新增]` |
| `packages/yfcli-mcp/src/registry.ts` | P2 新建 | 工具调用前**统一鉴权包装**的落点 | P3 改造 | `[口径：新增]` |
| `packages/yfcli-sdk/src/logging/redact.ts` | 既有 | 脱敏基础，本阶段贯通到 MCP/skill | P3 | `[口径：既有文件]` |
| `config/yfcli.example.yaml` | P1 新建 | 配置模板（**只存引用**） | P3 | `[口径：新增]` |
| `packages/yzcli-mcp/src/http-server.ts`（YZCLI） | `:21-27` | **反面基准**：仅「非空 + 长度 ≥ 8」弱校验 | P3 规避 | `[口径：行号区间]` |
| `packages/yzcli-mcp/src/erp-client.ts`（YZCLI） | **21 行** | 反面基准：无集中鉴权包装 | P3 借鉴该约束 | `[口径：单文件行数]` |
| `auth/token-map.ts` + `auth/jwt.ts`（YZCLI） | 40 + 67 行 | 反面基准：双Token 映射 / 8 小时过期（**多租户专属，MVP 砍**） | P3 不做 | `[口径：两文件行数之和]` |
| `src/yzcli/core/config.py`（YZCLI） | **173 行** | 反面基准：与 TS 侧 `base_url` 不一致 | P3 规避 | `[口径：单文件行数]` |
| `analysis/src/__tests__/end-to-end.test.ts`（YZCLI） | `:22` | **反面教材**：端到端被 `user_token` 阻塞 | P3 规避 | `[口径：行号]` |

---

## 当前进度

**0%** —— 尚未开始。

- [ ] token 注入单一入口（配置只存引用）
- [ ] `token_expired` / `token_invalid` 错误分级
- [ ] ERP 连通性健康检查（含组合故障诊断）
- [ ] 端到端 5 类鉴权用例（合法 / 过期 / 空 / 超长 / 错误 `datakey`）
- [ ] 日志脱敏贯通 SDK → MCP → skill 三层
- [ ] 鉴权失败用户话术分级

---

## 下一步

| # | 动作 | 负责角色 | 产出物路径 |
|---|---|---|---|
| 1 | 裁决 token 注入**单一入口**设计 + 完整错误码体系（`token_expired` / `token_invalid` / `datakey_invalid` / `permission_denied`） | 架构师 | `docs/decisions/ADR-00X-token-注入入口.md` |
| 2 | 实现链路级token 注入，改造 `yfcli-auth/src/index.ts` | 后端开发 | `packages/yfcli-auth/src/index.ts` |
| 3 | 在 MCP **注册表层**做统一鉴权包装（不在各工具内散落） | 后端开发 | `packages/yfcli-mcp/src/registry.ts` |
| 4 | MCP server 启动即校验鉴权配置，不等到调用时 | 后端开发 | `packages/yfcli-mcp/src/server.ts` |
| 5 | 实现组合故障诊断：区分「token 无效」/「token 有效但 `CompanyId` 错」/「权限不足」 | 后端开发 | `packages/yfcli-auth/src/health.ts` |
| 6 | 脱敏贯通到 MCP 层与 skill 层（覆盖 `error[].data` 回显路径） | 后端开发 | `packages/yfcli-auth/src/redact.ts` |
| 7 | 定义鉴权失败 4 种场景的用户话术（过期 / 无效 / datakey 错 / 权限不足） | 产品经理 | `packages/yfcli-skill-openapi/SKILL.md` §错误话术 |
| 8 | 编写 5 类端到端鉴权用例 + 组合故障用例 | 测试 | `packages/yfcli-mcp/src/__tests__/` |
| 9 | 验证配置模板不含明文凭据，`npm run scan:secrets` PASS | 测试 | 门禁报告 |
| 10 | 端到端鉴权放行裁决 | 总监 | `docs/decisions/ADR-00X-token-注入入口.md` §放行 |

---

## 硬性约束与教训

### A. 易飞 OpenAPI 9 条硬约束
> 来源 `AGENTS.md`，2026-10-08 真机实测。**本阶段直接对应第 3 条（错误 token 返 HTTP 500+HTML）。**

| # | 约束 | 后果 |
|---|---|---|
| 1 | 枚举字段查询**只传编码**（回参是 `Y.已审核`，传 `Y.已审核` 静默返回 0 条） | 查不到数据，不报错 |
| 2 | 主键全错返回 `code=0` + 空数组 | 不能用 `code` 判断「查到了」，须主动告警 |
| 3 | 错误 token 返回 **HTTP 500 + HTML**（不是 JSON） | 解析 body 会崩，须**先判状态码** ← **本阶段核心** |
| 4 | `node_name` 用**逻辑节点名**（`*_data`），不是物理表名 | 传 `ACTTA` 报 `MA012未定義` |
| 5 | 服务名**只能查表，禁止拼接**（`supplier` 无 `.data` 段 / `customer` 有 `.data` 段） | 按 `{type_key}.data.{op}.get` 拼接必错 |
| 6 | `conditions` 必须是**对象形态** | 数组形态静默失效返回全量数据 |
| 7 | 分页 `page_no` 从 **1** 开始，`page_size` 上限 **10000**（须实测标定） | 漏数据或超时 |
| 8 | 易飞**无 `fastquery`**，所有查询重查数据库 | 与易助性能天差地别，影响缓存策略 |
| 9 | 成功判据 `execution.code === "0" \|\| "-0"` | 禁止字符串匹配 `description`（简繁混用） |

补充：`error[]` 有**双结构**（`{message,data}` 与 `{information:[...]}`），解析器必须都兼容，未识别时**必须打 WARN**；`error[].data` 会**完整回显传入数据**，写日志前须脱敏 —— **鉴权失败路径是这条泄露风险最高的位置**。

### B. 易助/易飞单据编码同码不同义 —— 必须转码
| 码 | 易助含义 | 易飞含义 | 处理 |
|---|---|---|---|
| `33` | 销货单 | 销售订单类 | **必须转码：易助 33 → 易飞 23** |
| `82` | 领料单 | 生产领料类 | **必须转码：易助 82 → 易飞 54** |
| `84` | 生产耗用 | ⚠️ 与易助不同义 | 逐单据确认后建转码表 |
| `85` | ⚠️ 与易助不同义 | ⚠️ 与易助不同义 | 逐单据确认后建转码表 |

→ 凡涉及单据类型码，**必须建「易助码 → 易飞码」转码表并集中管理**，禁止在 SQL/代码里散落硬编码、禁止沿用易助常量。

### C. 审核码口径
- 易飞实测三值：`Y` = 已审核 / `N` = 未过账 / `V` = **作废**（用户 2026-10-09 裁决）
- **统计只筛 `Y`**；易助侧是 `'T'` —— **勿沿用易助常量**
- 不筛审核码会污染 **12 倍** `[口径：同一单据集合，含税金额合计，未按审核码过滤 vs 过滤后对比；已审核 24 单 5,817 万 vs 未审核 13 单 7.28 亿，易助侧真机实测]`
- **本阶段相关性**：部分权限可能与账套/审核权绑定，健康检查诊断时须能区分「无权限」与「数据本身未审核」

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
| 1 | **端到端取数链路被 token 阻塞**（`analysis/src/__tests__/end-to-end.test.ts:22` 自述被 `user_token` 阻塞） | **P3 必须先打通鉴权**，否则 P4 会重复这个失败。这是 P3 不可后置的根本原因 |
| 2 | **MCP 弱校验**：`http-server.ts:21-27` 仅校验「非空 + 长度 ≥ 8」 | 长度检查**不是鉴权**。必须做有效性验证 + 过期检测 + 错误分级 |
| 3 | **认证逻辑分散 4 处**，无独立 auth 包（SDK `config.ts` 67 行且 `loadConfig()` 从不读 token / MCP `erp-client.ts` 21 行 / Gateway 40+67 / Python 173 行） | **单一入口**，鉴权包装集中在注册表层 |
| 4 | **Python 与 TS 配置不一致**（`config.py:173` 默认 `172.16.6.22:8103` vs TS 侧 `localhost:8103`） | 配置**单一来源**，禁止多语言各持一份 |
| 5 | **无健康检查**：无法区分「token 坏了」与「网络不通」与「账套号错」 | 健康检查须输出**结构化**结论，能定位到具体故障原因 |
| 6 | **无错误分类**：所有失败都是同一种错，用户话术无法分级 | `token_expired` / `token_invalid` / `datakey_invalid` / `permission_denied` **四码分离** |
| 7 | **双Token 映射 + 8 小时过期**（`auth/token-map.ts` 40 行 + `auth/jwt.ts` 67 行，`POST /api/v1/token/issue` 签发） | **多租户专属，MVP 砍掉**。不做 Gateway 签发端点 |
| 8 | **视图与 SQL 模板两套路径未打通**（模板全查物理表；视图仅在语义层被引用为字符串） | 落在 P4 |
| 9 | **无生产 mssql driver**（`SqlDriver` 只是接口 `executor.ts:24-37`；集成测试用 `fakeDriver()` `sql-executor.test.ts:40`） | 落在 P4 |

### F. 本工程基线（引用数字时必须带口径）
| 项 | 值 | 口径 |
|---|---|---|
| 知识产物 | 106 业务对象 / 595 服务名 / 106 份字段对照表（12,893 字段）/ 78 模块字典 / 7 个 CSV | `[口径：scripts/extract-*.mjs 机械抽取，门禁 check:all 4/4 PASS]` |
| SDK 骨架 | 单包 `packages/yfcli-sdk/` / 9 个源码子目录 / 20 个 TS 文件 | `[口径：不含 node_modules 与测试]` |
| 真机验证 | 15/15 PASS（**只读**） | `[口径：scripts/probe-live-env.mjs 只读探测]` |
| 真机连通性 | 内网直连可用，ping 30~32 ms，**不走代理** | `[口径：T-05 实测]` |
| 鉴权真机结论 | `code=0` 查詢成功；四个公共头逐个验证（含易飞独有 `digi-datakey`） | `[口径：T-05 实测]` |
| 权限模型 | 易飞与易助**同构**（基本权限 / 成本权限 / 售价权限） | `[口径：官方文档确认]`；角色模板与数据权限**待补** |
| YZCLI 对标规模 | 11 包 / 22 个 MCP 工具 | `[口径：server.tool( 出现次数]` |
| 本工程不做 | 多租户 3,906 行 + License 4,126 行 + finance 重复包 1,327 行 = **9,359 行** | `[口径：三项行数之和]` |

### G. 本阶段专属纪律
- **Token 有效期与刷新语义「文档未说明」** —— 只做「过期检测」，**不做「自动刷新」**，不实现 Gateway 的 `POST /api/v1/token/issue` 签发端点。遇到此问题说「文档未说明」并转 `docs/decisions/OPEN-DECISIONS.md`，**不编造**。
- **不得臆测**：`AGENTS.md` 明确列出 10 项文档未说明的内容（调用频率限制 / HTTP 状态码完整语义 / Token 有效期与刷新 / 超时时间 / 版本兼容正式策略 / 单笔批量上限 / `sql_code` 取值含义 / 三版本接口差异等），一律按「文档未说明」处理。
- **鉴权必须在注册表层统一包装** —— 不在各工具内各写一遍，这是 YZCLI 散落 4 处的根因。
- **过期与无效必须是不同错误码** —— 用户话术与处置动作完全不同（过期可能可等待恢复，无效需换 token）。
- **组合故障必须可诊断** —— 「token 有效但 `CompanyId` 错」是最常见的现场问题，若只能返回「鉴权失败」则现场无法自助排查。
- **不做权限模型** —— 权限模型虽已确认同构，但角色模板与数据权限细节待补（P2 资料项），本阶段只做 token 层鉴权。

---

## 参考文档

| 文档路径 | 内容 | 为什么读它 |
|---|---|---|
| `docs/plans/mvp-development-plan.md` §一 P3 / §二 P3 / §四 | 阶段范围 + 5 条验收判据 + **关键路径说明「为什么 P3 在 P4 之前」** | 动手前的唯一依据 |
| `docs/plans/yzcli-architecture-reference.md` 第二节 | 授权模块 —— YZCLI 最薄的一环 | 本阶段要解决的核心问题 |
| `AGENTS.md` §真机实测硬约束第 3、5 条 | 错误 token 返 HTTP 500+HTML；四个公共头全必填 | 错误分支与头构造的依据 |
| `docs/plans/yf-materials-collection-checklist.md` §2.3 | 认证与 Token 配置 —— **已确认易飞与易助一致** | 避免重复调研认证协议 |
| `docs/plans/yf-materials-collection-checklist.md` §4.1 | 权限与角色（易飞与易助权限模型同构，细节待补） | 明确本阶段不做权限的原因 |
| `docs/plans/yf-openapi-rules.md` §0 | 10 项「文档未说明」清单 | Token 刷新语义缺失的登记依据 |
| `docs/decisions/OPEN-DECISIONS.md` | 22 条已裁决 + 8 条真机实证 | 避免重复裁决 |
| `.trellis/tasks/mvp-p1-auth-module/map-navigation.md` | P1 产出的授权契约与验收判据 | 本阶段接线的上游依据 |
| `.trellis/tasks/mvp-p2-crud-skill-openapi/map-navigation.md` | P2 产出的 MCP 工具与 skill 层结构 | 本阶段鉴权包装的落点 |
