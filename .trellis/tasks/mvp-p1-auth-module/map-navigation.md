# P1 · 独立授权模块

> **slug**：`mvp-p1-auth-module` ｜ **优先级**：P0 ｜ **工作量**：L（3~5 天）｜ **进度**：0%
>
> 阶段目标：抽出**独立授权模块**（`packages/yfcli-auth/`），让「认证」第一次成为有边界的模块而非散落代码。
>
> 依赖：**`mvp-p0-prerequisites`**（架构裁决台账须先确认 auth 包边界与依赖方向）。
> 这是用户指定的第 1 项「先抽取独立授权模块」。
> **本阶段是全项目最大反直觉点：YZCLI 的授权层是反面基准，不是参考实现。**

---

## 目录结构导航

```
D:/AIProject/claude/YFAgent/packages/
├── yfcli-auth/                    [新增 · 本阶段主交付]
│   ├── src/
│   │   ├── index.ts               公开契约导出
│   │   ├── token-store.ts         token 生命周期（获取/缓存/过期检测/刷新）
│   │   ├── health.ts              ERP 连通性健康检查
│   │   ├── errors.ts              token_expired / token_invalid 分类
│   │   ├── redact.ts              日志脱敏
│   │   └── credentials.ts         凭据红线（环境变量/ FORBIDDEN_KEYS / limits）
│   ├── package.json
│   └── tools/check-auth.mjs       离线自检
├── yfcli-sdk/                [既有 · 本阶段改造]
│   └── src/
│       ├── config/config.ts        改造：接入 auth 单一入口
│       ├── config/headers.ts       既有：四头构造
│       ├── logging/redact.ts既有：脱敏（auth 复用）
│       └── index.ts                改造：导出 auth 契约
├── yfcli-mcp/                    [P2 新建]
├── yfcli-skill-openapi/            [P2 新建]
├── yfcli-analysis/                 [P4 新建]
└── yfcli-experts/                  [P5 新建]

config/
├── yfcli.example.yaml          [新增] 配置模板（只存引用，不存明文）
└── *.local.yaml                 [既有·不入库] 实际配置走环境变量
```

---

## 模块职责速查

| 模块 / 路径 | 职责 | 本阶段是否新建 | YZCLI 对应物（**反面基准**） |
|---|---|---|---|
| `yfcli-auth/token-store.ts` | token 生命周期：获取 / 缓存 / 过期检测 / 刷新 | ✅ | **无对应物** —— YZCLI 无 token 缓存、无 refresh |
| `yfcli-auth/health.ts` | ERP 连通性健康检查（结构化结论） | ✅ | **无对应物** —— YZCLI 无健康检查 |
| `yfcli-auth/credentials.ts` | 凭据红线：环境变量取密码 /拒明文 / `limits` 必填 | ✅ 部分借鉴 | `runtime/sql/config.ts` **129 行**（可移植） |
| `yfcli-auth/errors.ts` | `token_expired` 与 `token_invalid` **必须区分** | ✅ | **无对应物** —— YZCLI 无错误分类 |
| `yfcli-auth/redact.ts` | 日志脱敏 |✅ 复用 | `yfcli-sdk/src/logging/redact.ts`（既有，直接复用） |
| `yfcli-sdk/src/config/config.ts` | **改造**：不再自行处理 token，改为委托 auth | 🟡 改造 | `config.ts` 67 行 —— `loadConfig()` 只映射 baseUrl/timeout/fieldMode，**从不读 token** |
| `yfcli-sdk/src/config/headers.ts` | 四头构造（`digi-service`/`digi-user-token`/`digi-datakey`/`Content-Type`） | 既有 | `client.ts:44-50` 与易飞逐字一致 |
| MCP 层鉴权 | — | ❌ **P3 才做** | `http-server.ts:21-27` 仅校验「非空 + 长度 ≥ 8」（弱校验，本工程不做） |
| Gateway 层 | — | ❌ **整体砍掉** | `auth/token-map.ts` 40 + `auth/jwt.ts` 67 + Gateway 多租户 **3,906 行** |
| License 体系 | — | ❌ **整体砍掉** | 4,126 行 `[口径：gateway license 1,405 + MCP guard 172 + license-server 2,064 + admin 485]` |
| Python 配置 | — | ❌ **不做**（本工程纯 TS） | `src/yzcli/core/config.py` 173 行，默认 `base_url` 与 TS 侧 `localhost:8103` **不一致** |

---

## 关键文件索引

| 文件路径 | 规模 | 作用 | 归属阶段 | 口径 |
|---|---|---|---|---|
| `packages/yfcli-auth/src/` | 新建 | 授权模块主体 | P1 | `[口径：新增]` |
| `packages/yfcli-sdk/src/config/config.ts` | 既有 | **本阶段主要改造点** | P1 | `[口径：既有文件]` |
| `packages/yfcli-sdk/src/logging/redact.ts` | 既有 | 脱敏，auth 直接复用 | P1 | `[口径：既有文件]` |
| `runtime/sql/config.ts`（YZCLI） | **129 行** | 凭据红线**可移植部分** | P1 参照 | `[口径：单文件行数]` |
| `packages/yzcli-sdk/src/config.ts`（YZCLI） | **67 行** | 反面基准：`loadConfig()` 从不读 token | P1 规避 | `[口径：单文件行数]` |
| `packages/yzcli-mcp/src/erp-client.ts`（YZCLI） | **21 行** | 反面基准：注释明确 Token **ALWAYS** from caller | P1 借鉴该约束 | `[口径：单文件行数]` |
| `packages/yzcli-mcp/src/http-server.ts`（YZCLI） | `:21-27` | 反面基准：仅「非空 + 长度 ≥ 8」弱校验 | P1 规避 | `[口径：行号区间]` |
| `auth/token-map.ts` + `auth/jwt.ts`（YZCLI） | 40 + 67 行 | 反面基准：双Token 映射 + 8 小时过期（多租户专属，MVP 砍） | P1 不做 | `[口径：两文件行数之和]` |
| `src/yzcli/core/config.py`（YZCLI） | **173 行** | 反面基准：与 TS 侧 `base_url` 不一致 | P1 规避 | `[口径：单文件行数]` |

---

## 当前进度

**0%** —— 尚未开始。

- [ ] token 生命周期（获取 / 缓存 / 过期检测 / 刷新）
- [ ] ERP 连通性健康检查
- [ ] 凭据红线（环境变量取密码 / `FORBIDDEN_KEYS` 拒明文含 `user` / `limits` 必填）
- [ ] 错误分类（`token_expired` vs `token_invalid`）
- [ ] 错误 token 返HTTP 500+HTML 的独立分支
- [ ] 日志脱敏贯通
- [ ] 7 条验收用例 + 反向用例

---

## 下一步

| # | 动作 | 负责角色 | 产出物路径 |
|---|---|---|---|
| 1 | 裁决 auth 包接口契约 + **依赖方向**（`auth` **不依赖** `sdk`，避免循环依赖；`sdk` 依赖 `auth`） | 架构师 | `docs/decisions/ADR-00X-auth-包边界.md` |
| 2 | 实现 token 生命周期（获取 / 缓存 / 过期检测 / 刷新；刷新语义**文档未说明**，只做「过期检测」不做「自动刷新」） | 后端开发 | `packages/yfcli-auth/src/token-store.ts` |
| 3 | 实现凭据红线：密码只从环境变量取（配 `password_env`）、`FORBIDDEN_KEYS` 拒明文（含 `user`）、`limits` 必填、`allowed_templates` 为空即抛错「禁止全开」 | 后端开发 | `packages/yfcli-auth/src/credentials.ts` |
| 4 | 实现错误分类：`token_expired` / `token_invalid` 分离；错误 token 返 HTTP 500+HTML 时**先判状态码不解析 body** | 后端开发 | `packages/yfcli-auth/src/errors.ts` |
| 5 | 实现 ERP 连通性健康检查，输出结构化结论 | 后端开发 | `packages/yfcli-auth/src/health.ts` |
| 6 | 改造 `yfcli-sdk/src/config/config.ts`：不再自行处理 token，改为委托 auth **单一入口** | 后端开发 | `packages/yfcli-sdk/src/config/config.ts` |
| 7 | 编写配置模板（**只存引用，不存明文**） | 后端开发 | `config/yfcli.example.yaml` |
| 8 | 定义授权失败的 3 种用户话术（过期 / 无效 / 权限不足） | 产品经理 | `packages/yfcli-auth/README.md` |
| 9 | 编写 7 条验收用例 + 反向用例（超长 token / 空 token / 错误 datakey / 配置含明文 / `limits` 缺失） | 测试 | `packages/yfcli-auth/src/__tests__/` |
| 10 | 授权边界放行裁决 | 总监 | `docs/decisions/ADR-00X-auth-包边界.md` §放行 |

---

## 硬性约束与教训

### A. 易飞 OpenAPI 9 条硬约束
> 来源 `AGENTS.md`，2026-10-08 真机实测。**违反其中任何一条都会产生错误数据或误判，且多数不会报错。**

| # | 约束 | 后果 |
|---|---|---|
| 1 | 枚举字段查询**只传编码**（回参是 `Y.已审核`，传 `Y.已审核` 静默返回 0 条） | 查不到数据，不报错 |
| 2 | 主键全错返回 `code=0` + 空数组 | 不能用 `code` 判断「查到了」，须主动告警 |
| 3 | 错误 token 返回 **HTTP 500 + HTML**（不是 JSON） | 解析 body 会崩，须先判状态码 ← **本阶段核心** |
| 4 | `node_name` 用**逻辑节点名**（`*_data`），不是物理表名 | 传 `ACTTA` 报 `MA012未定義` |
| 5 | 服务名**只能查表，禁止拼接**（`supplier` 无 `.data` 段 / `customer` 有 `.data` 段） | 按 `{type_key}.data.{op}.get` 拼接必错 |
| 6 | `conditions` 必须是**对象形态** | 数组形态静默失效返回全量数据 |
| 7 | 分页 `page_no` 从 **1** 开始，`page_size` 上限 **10000**（须实测标定） | 漏数据或超时 |
| 8 | 易飞**无 `fastquery`**，所有查询重查数据库 | 与易助性能天差地别，影响缓存策略 |
| 9 | 成功判据 `execution.code === "0" \|\| "-0"` | 禁止字符串匹配 `description`（简繁混用） |

补充：`error[]` 有**双结构**（`{message,data}` 与 `{information:[...]}`），解析器必须都兼容，未识别时**必须打 WARN**；`error[].data` 会完整回显传入数据，写日志前须脱敏。**`error[].data` 回显是 token 泄露的高危路径 —— 本阶段脱敏必须覆盖它。**

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
- **本阶段是全项目 token 泄露风险最高处** —— `error[].data` 会完整回显请求内容，日志脱敏必须覆盖

### E. 架构教训 —— 继承 YZCLI 的缺陷，本工程必须从第一天就避开
| # | YZCLI 的问题 | 本工程的要求 |
|---|---|---|
| 1 | **授权逻辑分散 4 处，无独立 auth 包**：SDK `config.ts` 67 行（`loadConfig()` **从不读 token**）/ MCP `erp-client.ts` 21 行 / Gateway `auth/token-map.ts` 40 + `auth/jwt.ts` 67 / Python `core/config.py` 173 行（与 TS 侧 `base_url` **不一致**） | **抽出独立包 `yfcli-auth`**，token 注入**单一入口**，不散落 |
| 2 | **授权完整性缺失**：无 OAuth / 无 refresh / 无 token 缓存 / 无重试 / 无 ERP 连通性健康检查 | 本阶段一次性补齐边界，**只沿用「token 必须由调用方显式注入」这一条约束** |
| 3 | **MCP 弱校验**：`http-server.ts:21-27` 仅校验「非空 + 长度 ≥ 8」 | 过期检测 + 有效性验证 + 错误分类，**长度检查不是鉴权** |
| 4 | **Python 与 TS 配置不一致**（`config.py:173` 默认 `172.16.6.22:8103` vs TS 侧 `localhost:8103`） | 配置**单一来源**，禁止多语言各持一份 |
| 5 | **ERP token 是人工从 TPASC19 作业取的静态串**，靠 header 透传 | 本工程 MVP沿用同样获取方式（易飞侧 TPASC19 待确认），但**必须在文档中标注为已知约束**，不得写成「已支持自动获取」 |
| 6 | **设计四层防护，代码只有两层**：L1 模板注册制（`runtime/sql/template.ts:62-84`）+ L2 执行器约束（`executor.ts` 全文）已落地；**L3 部署约束 / L4 治理无任何代码** | 引用防护能力时不要沿用「四层已落地」的错误表述；须标注每层落地状态 |
| 7 | **无生产 mssql driver**：`SqlDriver` 只是接口（`runtime/sql/executor.ts:24-37`），唯一真实 driver 在 `scripts/verify-ai-views.mjs:33`（验证脚本，非生产代码）；集成测试用 `fakeDriver()`（`__tests__/sql-executor.test.ts:40`） | 生产 driver 与真实库集成测试是**必做项**（落在 P4） |
| 8 | **LLM 端到端取数链路未通**（`analysis/src/__tests__/end-to-end.test.ts:22` 自述被 `user_token` 阻塞） | **P3 必须先打通鉴权**，否则 P4 会重复这个失败 |
| 9 | **视图与 SQL 模板两套路径未打通**（模板全查物理表，视图仅在语义层被引用为字符串 `semantic/model.ts:161-243`、`rules/metric-registry.ts:274-317`） | 落在 P4，视图先行、模板只查视图 |
| 10 | **模板白名单比模板库窄**（`allowed_templates` 只列 15 个，模板库 20 个） | 落在 P4，白名单与模板库同步校验 |

### F. 本工程基线（引用数字时必须带口径）
| 项 | 值 | 口径 |
|---|---|---|
| 知识产物 | 106 业务对象 / 595 服务名 / 106 份字段对照表（12,893 字段）/ 78 模块字典 / 7 个 CSV | `[口径：scripts/extract-*.mjs 机械抽取，门禁 check:all 4/4 PASS]` |
| SDK 骨架 | 单包 `packages/yfcli-sdk/` / 9 个源码子目录 / 20 个 TS 文件 | `[口径：不含 node_modules 与测试]` |
| SDK 质量 | `tsc` 零错误 / 离线用例 60 项 / 冻结判据 50 项 | `[口径：npm run check:skeleton + check:offline + check:dict]` |
| 真机验证 | 15/15 PASS | `[口径：scripts/probe-live-env.mjs 只读探测]` |
| 数据库直连 | SQL Server 2014 / 1,211 张表 / 库表名与字典 100% 一致（52 组 3 位前缀交叉全部一致，0 组不同） | `[口径：2026-10-09 实测]` → **无需映射层** |
| YZCLI 对标规模 | 11 包 / 203 生产 .ts / 25,091 行 | `[口径：packages/*，排除 node_modules/dist 与 *.test.ts]` |
| YZCLI 可移植资产 | 约 300~500 行（`template.ts` 150 + `executor.ts` 156 + `config.ts` 129 + `create-ai-views.sql` 155） | `[口径：四文件行数之和]`；本阶段仅涉及其中的 `config.ts` 129 行 |

### G. 本阶段专属纪律
- **Token 有效期与刷新语义「文档未说明」** —— MVP 只做「过期检测」，**不做「自动刷新」**。遇到此问题说「文档未说明」并转 `docs/decisions/OPEN-DECISIONS.md`，**不编造**。
- **不假定易飞 TPASC19 与易助 TPASC19 行为一致** —— 易飞侧授权作业获取方式待确认，文档中须标注为待确认项。
- **`auth` 包不得依赖 `sdk`** —— 依赖方向只能是 `sdk → auth`，否则形成循环依赖。
- **不做多租户**：MVP 是单用户 / 单账套场景，Gateway 多租户 3,906 行 `[口径：YZCLI Gateway 多租户模块行数]` 整体砍掉，不预留抽象。
- **不做 License**：4,126 行整体砍掉 `[口径：gateway license 1,405 + MCP guard 172 + license-server 2,064 + admin 485]`。
- **`error[]` 脱敏是硬要求**：`error[].data` 会完整回显传入数据，鉴权失败路径尤其危险。

---

## 参考文档

| 文档路径 | 内容 | 为什么读它 |
|---|---|---|
| `docs/plans/yzcli-architecture-reference.md` 第二节 | **授权模块 —— YZCLI 最薄的一环**（4 处分散 + 缺失能力清单） | 本阶段的存在理由与反面基准 |
| `docs/plans/mvp-development-plan.md` §一 P1 / §二 P1 | 阶段范围界定（做/不做）与 7 条验收判据 | 动手前的唯一依据 |
| `AGENTS.md` §真机实测硬约束 | 9 条硬约束，尤其第 3 条（500+HTML） | 错误处理分支的设计依据 |
| `docs/plans/yf-materials-collection-checklist.md` §2.3 | 认证与 Token 配置 —— **已确认易飞与易助一致**，只需填 `digi-user-token` | 避免重复调研认证协议 |
| `docs/plans/yf-vs-yizhu-openapi-diff.md` | 31 维度对照（含请求方式/鉴权/错误码） | 确认哪些差异会影响鉴权实现 |
| `docs/plans/yf-openapi-rules.md` §0 | 10 项「文档未说明」清单 | Token 刷新语义缺失的登记依据 |
| `docs/decisions/OPEN-DECISIONS.md` | 22 条已裁决 | 避免重复裁决 |
| `docs/decisions/STATISTICS-SPEC.md` | 统计口径规范 | 所有数字必须带口径标签 |
| `.trellis/tasks/mvp-p0-prerequisites/map-navigation.md` | 前置盘点结论 + 「易助有但易飞无」缺口清单 | 本阶段的前置依赖 |
