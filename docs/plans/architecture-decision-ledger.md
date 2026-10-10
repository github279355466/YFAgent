# 架构裁决台账（Architecture Decision Ledger）

> **制定日期**：2026-10-09
> **归属阶段**：MVP P0 · 前置条件盘点
> **上游依据**：`docs/decisions/OPEN-DECISIONS.md`（22 条已裁决）· `docs/plans/dual-product-line-architecture.md`（B1-B5）· `docs/plans/mvp-development-plan.md`（§一~§五）· `AGENTS.md`（真机实测硬约束）
> **维护规则**：只追加 + 就地关闭（OPEN → RESOLVED / DEFERRED）；每条标注裁决日期、依据文档、状态
> **数字口径规则**：所有规模数字均带 `[口径：…]` 标签，禁止裸数字

---

## 一、双通道架构裁决

### AD-01 ｜CRUD + Analysis 双通道模式

| 项 | 内容 |
|---|---|
| **编号** | AD-01 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/dual-product-line-architecture.md` §一 · `docs/plans/mvp-development-plan.md` §1.2-P4 |
| **裁决内容** | 采用**双通道模式**：CRUD 五操作走 OpenAPI（`yfcli-sdk`），分析聚合走数据库直连（`yfcli-analysis`）。两条通道从第一天打通，不允许分析层绕过视图直查物理表。 |
| **理由** | ① 易飞无 `fastquery`，OpenAPI 每次重查数据库，不适合聚合场景；② YZCLI 沉淀了「视图建了但没人查」的缺陷教训（20 个模板全部直查物理表）；③ 双通道从源头避免继承该缺陷。 |
| **落地位置** | `packages/yfcli-sdk/`（CRUD）+ `packages/yfcli-analysis/`（Analysis） |
| **关联** | OPEN-A3（conditions 结构差异）、AD-07（视图策略） |

### AD-02 ｜分析层必须只查视图，禁止直查物理表

| 项 | 内容 |
|---|---|
| **编号** | AD-02 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/mvp-development-plan.md` §1.2-P4「架构依据（最大架构风险所在）」 |
| **裁决内容** | `yfcli-analysis` 的 20 个 SQL 模板**全部只查 `vw_ai_*` 视图**，不允许出现物理表名。执行器防护须校验 FROM 子句只含视图名。 |
| **理由** | YZCLI 的 `templates.ts` 591 行依赖 16 张表 / 85 个字段引用，易飞库同名命中 0 张。若允许直查物理表，将导致两套产品线模板完全不可维护。视图作为唯一抽象层，保证模板可跨版本、跨客户部署。 |
| **落地位置** | `packages/yfcli-analysis/src/runtime/sql/executor.ts`（FROM 校验）+ `packages/yfcli-analysis/sql/views/*.sql`（9 视图 DDL） |
| **关联** | AD-07（视图策略）、AD-10（L2 模板注册制） |

---

## 二、包边界定义

### AD-03 ｜六包依赖方向

| 项 | 内容 |
|---|---|
| **编号** | AD-03 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/dual-product-line-architecture.md` §三 · `docs/plans/mvp-development-plan.md` §1.2 |
| **裁决内容** | 六个包的依赖方向严格单向，禁止循环： |

```
                    ┌─────────────────┐
                    │   erp-license   │ ← 共享授权内核（与产品线无关）
                    │  (rsa/aes/tier) │
                    └────────┬────────┘
                             │ 被引用
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ yfcli-auth │  │ yfcli-sdk  │  │yfcli-analysis│
     │(token/健康) │  │(CRUD/OpenAPI)│ │(SQL/视图/模板)│
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           └───────┬───────┘               │
                   ▼                       │
          ┌────────────────┐               │
          │   yfcli-mcp    │◄──────────────┘
          │(工具注册/路由)  │
          └───────┬────────┘
                  │
                  ▼
          ┌────────────────┐
          │ yfcli-experts  │
          │(业务公式/助手) │
          └────────────────┘
```

**依赖规则**：

| 包 | 可依赖 | 禁止依赖 |
|---|---|---|
| `erp-license` | 无（零内部依赖） | 任何 yfcli-* 包 |
| `yfcli-auth` | `erp-license` | `yfcli-sdk` / `yfcli-mcp` / `yfcli-analysis` / `yfcli-experts` |
| `yfcli-sdk` | `erp-license` | `yfcli-auth` / `yfcli-mcp` / `yfcli-analysis` / `yfcli-experts` |
| `yfcli-analysis` | `erp-license` | `yfcli-auth` / `yfcli-sdk` / `yfcli-mcp` / `yfcli-experts` |
| `yfcli-mcp` | `erp-license` / `yfcli-auth` / `yfcli-sdk` / `yfcli-analysis` | `yfcli-experts` |
| `yfcli-experts` | `erp-license` / `yfcli-mcp` | — |

| **理由** | ① `erp-license` 已实测对其他包 0 引用（`yzcli-license-server/src/` 内无任何 yzcli-sdk 引用）；② `yfcli-analysis` 零内部依赖，已设计为可独立复用内核；③ 单向依赖保证各包可独立测试、独立发布。 |
| **落地位置** | 各包 `package.json` + CI 依赖检查脚本 |
| **关联** | B1（授权体系抽为独立包共用） |

### AD-04 ｜erp-license 共享内核范围

| 项 | 内容 |
|---|---|
| **编号** | AD-04 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/dual-product-line-architecture.md` §3.3 |
| **裁决内容** | `erp-license` 仅包含与产品线完全无关的通用机制：密码学（rsa/aes）、协议（心跳/JWT claims）、阈值（TIER_RANK/TIER_MAX_RISK/TIER_WRITE_OPS）、判定逻辑（纯比较）、风险映射（OPERATION_ACTION_MAP）、注册表接口（ToolRegistry/DomainRegistry/RoleRegistry）。**不包含**任何业务数据（TYPE_KEY_DOMAIN_MAP/SERVICE_DOMAIN_MAP/ROLE_PERMISSIONS 由各线注入）。 |
| **理由** | 按类别识别取代按名称识别，消除 `SERVICE_DOMAIN_MAP` 中混入易飞端点的反面实证。 |
| **落地位置** | `packages/erp-license/src/` |
| **关联** | AD-03（六包依赖方向） |

---

## 三、数据流图

### AD-05 ｜端到端数据流

| 项 | 内容 |
|---|---|
| **编号** | AD-05 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/dual-product-line-architecture.md` §一 · `AGENTS.md` 真机实测硬约束 |
| **裁决内容** | 两条数据流的完整路径如下： |

**CRUD 流（OpenAPI）**：

```
用户/AI Agent
      │
      ▼
┌──────────────┐    Authorization Bearer     ┌──────────────────┐
│  yfcli-mcp   │ ──────────────────────────► │   yfcli-auth     │
│  (工具路由)   │ ◄────────────────────────── │ (token 获取/缓存) │
└──────┬───────┘                              └──────────────────┘
       │ std_data + digi-service + digi-user-token + digi-datakey
       ▼
┌──────────────┐    HTTP POST                ┌──────────────────┐
│  yfcli-sdk   │ ──────────────────────────► │  易飞 OpenAPI    │
│  (CRUD 封装) │ ◄────────────────────────── │  ATNPost 端点    │
└──────────────┘    execution.code=0/-1      └──────────────────┘
```

**Analysis 流（数据库直连）**：

```
用户/AI Agent
      │
      ▼
┌──────────────┐                              ┌──────────────────┐
│  yfcli-mcp   │ ──────────────────────────► │   yfcli-auth     │
│  (分析工具)   │ ◄────────────────────────── │ (tier 校验)      │
└──────┬───────┘                              └──────────────────┘
       │ 模板名 + 参数
       ▼
┌──────────────────┐   L1 参数化绑定          ┌──────────────────┐
│  yfcli-analysis  │ ──────────────────────► │  MSSQL Server    │
│  (模板注册+执行器)│ ◄────────────────────── │  (只读视图查询)   │
└──────────────────┘   L2 白名单校验          └──────────────────┘
```

**关键约束**：
- CRUD 流：Header 四头全必填（`digi-service` / `digi-user-token` / `digi-datakey` / `Content-Type`）
- Analysis 流：密码只从环境变量取（`YF_SQL_USER` / `YF_SQL_PASSWORD`），配置里写变量名
- 两流共享 `erp-license` 的 tier 判定逻辑

| **落地位置** | `docs/plans/dual-product-line-architecture.md` §一（文本版 ASCII 已嵌入） |
| **关联** | AD-01（双通道）、AD-06（视图策略） |

---

## 四、视图策略

### AD-06 ｜视图不带 COMPANY 过滤

| 项 | 内容 |
|---|---|
| **编号** | AD-06 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/mvp-development-plan.md` §1.2-P4「视图设计裁决」· `docs/plans/dual-product-line-architecture.md` §3.5 |
| **裁决内容** | 9 个 `vw_ai_*` 视图 DDL **不带 `COMPANY` 字段过滤**。`COMPANY` 为预留管理字段（无业务含义），易飞架构为「独立公司账套」，不存在一表多账套场景。 |
| **理由** | 易助需要 `COMPANY` 过滤是因为多账套共用一套数据库；易飞每个账套独立数据库实例，加 `WHERE COMPANY=` 反而引入不必要的性能开销和维护负担。 |
| **落地位置** | `packages/yfcli-analysis/sql/views/*.sql`（9 视图 DDL，幂等 DROP/CREATE） |
| **关联** | AD-07（库表名一致性）、AD-02（只查视图） |

### AD-07 ｜库表名 100% 一致，无需映射层

| 项 | 内容 |
|---|---|
| **编号** | AD-07 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/mvp-development-plan.md` §1.2-P4「视图设计裁决」· `docs/plans/analysis-table-mapping.xlsx` |
| **裁决内容** | 易飞与易助的库表名经 52 组 3 位前缀交叉比对，**100% 一致（0 组不同）**。因此 `yfcli-analysis` 不需要「易助表名 → 易飞表名」映射层，视图 DDL 直接使用易飞物理表名。 |
| **理由** | 映射层增加维护成本和出错概率。既然表名完全一致，直接复用即可。注意：**表名一致不等于字段名一致**——易助用 `JSK*` 系列字段编号（如 `LOA001`），易飞用大写物理列名（如 `MB001`），字段级仍需逐个改写。 |
| **落地位置** | `packages/yfcli-analysis/sql/views/*.sql` + `packages/yfcli-analysis/src/templates.ts` |
| **关联** | AD-06（COMPANY 过滤）、AD-02（只查视图） |

### AD-15 ｜视图授权不得给 PUBLIC，改授专用只读账号

| 项 | 内容 |
|---|---|
| **编号** | AD-15 |
| **裁决日期** | 2026-10-10 |
| **状态** | ✅ RESOLVED（脚本已改；真机 REVOKE 待 DBA 执行） |
| **依据文档** | `docs/reviews/2026-10-09-代码审查报告.md` P1-1/P1-2 · `docs/plans/yzcli-architecture-reference.md`（YZCLI 范式） |
| **裁决内容** | 9 个 `vw_ai_*` 视图 DDL **不得** `GRANT SELECT ... TO PUBLIC`，改为授权给专用只读账号（本项目实测环境为 `ai`）。DDL 中 GRANT 语句**默认注释掉**，由客户 DBA 按环境指定主体后执行。 |
| **理由** | `PUBLIC` 是所有登录的隐含角色，`TO PUBLIC` 等于把应收/应付/总账/毛利数据开放给库内任意账号，与「分析层只读」的设计意图相悖。YZCLI 交付范式亦为 `TO yzai`（专用账号），本项目照搬。**注意**：本项目只读账号为 `ai` 而非 YZCLI 的 `yzai`，不可照抄账号名。 |
| **落地位置** | `packages/yfcli-analysis/sql/views/*.sql`（9 个，GRANT 注释化 + 补幂等 DROP/CREATE）· `packages/yfcli-analysis/sql/views/revoke-public-grants.sql`（已在真机执行过旧 DDL 的环境做补救） |
| **关联** | AD-02（只查视图）、AD-06（COMPANY 过滤）、OPEN-G2 |

---

## 五、L1-L4 防护落地状态

### AD-08 ｜四层防护矩阵

| 项 | 内容 |
|---|---|
| **编号** | AD-08 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED（设计登记完成，实现状态见下表） |
| **依据文档** | `docs/plans/mvp-development-plan.md` §1.2-P4「执行器防护逐字重写」· `docs/plans/dual-product-line-architecture.md` §3.4 |
| **裁决内容** | 分析层 SQL 执行器采用四层防护，落地状态如下： |

| 层级 | 名称 | 状态 | 说明 | MVP 范围 |
|---|---|---|---|---|
| **L1** | 参数化绑定 | ✅ 已设计 | 参数不内联交驱动绑定，`:param` 占位符由 mssql driver 处理 | P4 实现 |
| **L2** | 模板注册制 | ✅ 已设计 | 只允许预注册模板执行，`allowed_templates` 白名单不得为空 | P4 实现 |
| **L3** | 部署约束白名单 | ⚠️ 设计未实现 | IP/端口/数据库名白名单校验，防止误连生产库 | **P4 只做设计登记，不建代码** |
| **L4** | 审计日志 | ❌ 未设计 | 谁在什么时候执行了什么模板、传了什么参数、返回了多少行 | **MVP 不做** |

**YZCLI 现状参照**：YZCLI 自身也只落地了 L1 + L2（`template.ts` 150 行 + `executor.ts` 156 行），L3/L4 仅停留在纸面规范。**本工程不承诺超越 YZCLI 的防护水平**，但必须在设计文档中明确登记 L3/L4 的未来实现路径。

**L1 具体规则**：
- 只读起始关键字校验（`SELECT` / `WITH`）
- 禁用词整词匹配（`INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` / `EXEC` / `EXECUTE` / `xp_` / `sp_`）
- 禁分号（防注入链式语句）
- 必带 `:max_rows` 参数
- `maxRows = min(调用方, 模板, 数据源)` 三重取小

**L2 具体规则**：
- 配置文件 `config/analysis-sql.json` 中 `allowed_templates` 数组列出所有合法模板名
- 未在白名单中的模板名一律拒绝执行
- 模板注册时校验审核码列名对照（防口径污染）

| **落地位置** | `packages/yfcli-analysis/src/runtime/sql/template.ts` + `executor.ts` + `config.ts` |
| **关联** | AD-02（只查视图）、AD-09（凭据红线） |

### AD-09 ｜凭据红线

| 项 | 内容 |
|---|---|
| **编号** | AD-09 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/dual-product-line-architecture.md` §3.4 · `docs/plans/mvp-development-plan.md` §1.2-P1 |
| **裁决内容** | 三条红线不可违反：① 密码只允许从环境变量取（配置里写 `password_env` 变量名，出现明文 `password` 一律拒绝）；② `limits` 必填（`max_rows` / `timeout_ms` 兜底）；③ `allowed_templates` 白名单不得为空。配置文件不入代码库，仓库只提供 `.example.json` 模板。 |
| **落地位置** | `packages/yfcli-analysis/src/config.ts` + `config/analysis-sql.example.json` |
| **关联** | AD-08（L1-L4 防护） |

---

## 六、其他关键裁决

### AD-10 ｜审核码口径：统计只筛 approve_status='Y'

| 项 | 内容 |
|---|---|
| **编号** | AD-10 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `docs/plans/mvp-development-plan.md` §1.2-P4「审核码口径陷阱」· `AGENTS.md` 真机实测硬约束 §1 |
| **裁决内容** | 易飞 `approve_status` 有三值：`Y`（已审核）/ `N`（未审核）/ `V`（作废）。**统计分析只筛 `Y`**。不筛审核码会导致数据污染达 12 倍 `[口径：同一单据集合含税金额合计，未按审核码过滤 vs 过滤后对比]`。注意：易助用 `'T'`，**不可沿用**。 |
| **落地位置** | `packages/yfcli-analysis/sql/views/*.sql`（视图 WHERE 子句）+ `packages/yfcli-analysis/src/templates.ts`（模板参数默认值） |
| **关联** | OPEN-E1（枚举回参陷阱） |

### AD-11 ｜枚举查询只传编码部分

| 项 | 内容 |
|---|---|
| **编号** | AD-11 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `AGENTS.md` 真机实测硬约束 §1 · `docs/decisions/OPEN-DECISIONS.md` OPEN-E1 |
| **裁决内容** | 枚举回参形如 `Y.已审核` / `N.未过账`，作为 query 条件时**只传编码部分**（`Y` / `N`）。回参原样回传会静默返回 0 条且不报错。SDK 层须提供枚举值清洗函数。 |
| **落地位置** | `packages/yfcli-sdk/src/enum-sanitizer.ts`（待实现） |
| **关联** | OPEN-E1 |

### AD-12 ｜node_name 使用逻辑节点名 *_data

| 项 | 内容 |
|---|---|
| **编号** | AD-12 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `AGENTS.md` 真机实测硬约束 §3 · `docs/decisions/OPEN-DECISIONS.md` OPEN-E2（T-17 批量实测推翻原结论） |
| **裁决内容** | `node_name` 直接使用逻辑节点名 `*_data`（如 `purchase_order_detail_data`），**不需要**「逻辑名 → 物理表名」映射层。175 个节点批量实测确认 110 个可用 `[口径：5 直接通过 + 105 因字段名猜错但节点名有效]`，43 个报 MA012 属真未注册（转外部依赖问询函）。 |
| **落地位置** | `packages/yfcli-sdk/src/conditions-translator.ts` |
| **关联** | OPEN-E2、外部依赖问询函 §1（43 个 MA012 节点） |

### AD-13 ｜服务名只能查表，禁止拼接

| 项 | 内容 |
|---|---|
| **编号** | AD-13 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `AGENTS.md` 真机实测硬约束 §4 |
| **裁决内容** | 服务名一律从 `knowledge/typekey/typekey_map.yaml` 查表获取，**禁止**按 `{type_key}.data.{op}.get` 规则拼接。部分对象有 `.data` 段（如 `customer.data.query.get`），部分没有（如 `supplier.query.get`），拼接必错。 |
| **落地位置** | `packages/yfcli-sdk/src/service-resolver.ts` |
| **关联** | T-01（TypeKey 清单） |

### AD-14 ｜错误处理兼容双结构

| 项 | 内容 |
|---|---|
| **编号** | AD-14 |
| **裁决日期** | 2026-10-09 |
| **状态** | ✅ RESOLVED |
| **依据文档** | `AGENTS.md` 真机实测硬约束 §5 · `docs/plans/yf-openapi-rules.md` §11 |
| **裁决内容** | `error[]` 存在两种结构（A: `{message, data}` / B: `{information: [{message, data}]}`），解析器必须都兼容。未识别结构时**必须打 WARN**。`error[].data` 会完整回显传入数据，写日志前须脱敏。HTTP 非 200 走独立分支，不解析 body（可能返回 HTML）。 |
| **落地位置** | `packages/yfcli-sdk/src/error-parser.ts` + `packages/yfcli-sdk/src/logging/redact.ts` |
| **关联** | AD-09（凭据红线/脱敏） |

---

## 七、裁决索引

| 编号 | 标题 | 状态 | 裁决日期 |
|---|---|---|---|
| AD-01 | CRUD + Analysis 双通道模式 | ✅ RESOLVED | 2026-10-09 |
| AD-02 | 分析层必须只查视图 | ✅ RESOLVED | 2026-10-09 |
| AD-03 | 六包依赖方向 | ✅ RESOLVED | 2026-10-09 |
| AD-04 | erp-license 共享内核范围 | ✅ RESOLVED | 2026-10-09 |
| AD-05 | 端到端数据流 | ✅ RESOLVED | 2026-10-09 |
| AD-06 | 视图不带 COMPANY 过滤 | ✅ RESOLVED | 2026-10-09 |
| AD-07 | 库表名 100% 一致无需映射层 | ✅ RESOLVED | 2026-10-09 |
| AD-08 | L1-L4 四层防护矩阵 | ✅ RESOLVED | 2026-10-09 |
| AD-09 | 凭据红线 | ✅ RESOLVED | 2026-10-09 |
| AD-10 | 审核码口径只筛 Y | ✅ RESOLVED | 2026-10-09 |
| AD-11 | 枚举查询只传编码部分 | ✅ RESOLVED | 2026-10-09 |
| AD-12 | node_name 使用逻辑节点名 | ✅ RESOLVED | 2026-10-09 |
| AD-13 | 服务名只能查表禁止拼接 | ✅ RESOLVED | 2026-10-09 |
| AD-14 | 错误处理兼容双结构 | ✅ RESOLVED | 2026-10-09 |
| AD-15 | 视图授权不得给 PUBLIC | ✅ RESOLVED | 2026-10-10 |

**统计**：共 15 条 → RESOLVED 15 ｜ OPEN 0 `[口径：本台账创建时的裁决总数]`

---

## 八、与 OPEN-DECISIONS.md 的关系

本台账是 `docs/decisions/OPEN-DECISIONS.md` 的**架构视角补充**。OPEN-DECISIONS 侧重「开放项的逐步关闭」，本台账侧重「架构选择的正式登记」。两者交叉引用：

- OPEN-A1 ~ OPEN-A3 → 已关闭，对应 AD-01 / AD-11 / AD-12
- OPEN-E1 / OPEN-E2 → 真机探测新增并已关闭，对应 AD-11 / AD-12
- B1 ~ B5 → 双产品线架构裁决，对应 AD-03 / AD-04 / AD-06 / AD-07

未来新增的架构裁决在本台账追加；新增的开放项在 OPEN-DECISIONS 追加。两者定期同步评审。