# YFCLI 易飞产品线扩展方案

> 制定日期：2026-10-08
> 基线版本：YZCLI `skills/yzcli-erp` v4.3.0 / 11 个 packages
> 决策方式：grill-me 逐分支裁决，8 个顶层分支全部收敛
> 状态：待用户确认 → 确认后进入 Phase 0（资料准备）

---

## 0. 决策速览（grill-me 结论）

| # | 分支 | 裁决 | 关键理由 |
|---|------|------|---------|
| 0 | 易飞接入条件 | 4 项全具备（真机库 / OpenAPI 文档 / 规格 SDD / 归属权），产品线名 **YF**（非 E10），与易助同属鼎捷 | 可完整对齐易助三层，不做薄层降级 |
| 1 | 认证方案 | **可插拔设计**：`HeaderProvider` + `TokenProvider` 接口预留于 `yfcli-sdk`，未核实前 fail-fast | E10 认证细节未核实，接口化后填实现即可 |
| 2 | TypeKey 策略 | **两套独立 `typekey_map.yaml`**，易飞用自己的 type_key命名与字段编号 | 路由/工具层已验证数据驱动，换数据文件即可 |
| 2.5 | 代码基线 | **fork 易助当前代码**，逐一抽换 7 处硬编码 | 继承 794 条测试基线与已知坑记忆 |
| 3 | 分析层 | **完全复制一份 `yfcli-analysis`**（含 20 个 E10 SQL 模板 + 33 指标） | 避免抽象不彻底导致语义泄漏；代价是双份维护 |
| 3.5 | 知识资产 | **官方文档原件入库 + 最简 TypeKey 清单**，字段级对照留到 analysis 阶段 | 启动快、资料保真，不做 premature 机械抽取 |
| 4 | 助手边界 | **全部重建，易飞侧从 01 重新编号** | 保证易飞 Skill 纯净；8 个专家引擎方法论由 erp-core 共享 |
| 5 | 仓库形态 | **另建独立仓库 YFCLI**（不在 YZCLI monorepo 内） | YZCLI 已进入交付态，不受新线扰动 |
| 5.1 | 共享资产 | **抽第三方共享仓 `erp-core`**（gateway / license-server / license-admin / admin / experts，共 14,149 行） | 两产品线永远同步，商业化逻辑单点 |
| 5.2 | 运行时形态 | **两个独立 MCP Server 进程**（yfcli 独立端口，与 yzcli 并存） | 符合完全隔离；同一客户可用两条线，Skill 挂两个 MCP |
| 5.3 | Know-how 分档 | **按产品线分组，每组独立 `requires_tier`**，L2 维度扩为「租户 × 产品线」 | 客户可只买一条线，不被强制买单另一条 |
| 6 | 命名规范 | 包名 `yfcli-*` / Skill `yifei-erp` / MCP 工具 `yfcli_*` / 助手目录 `yfagent/` / 文档 `docs/YFAgent/` | 工具名自带厂商信息，错误信息自带来源 |
| 7 | 一期范围 | **最小可跑链路**：sdk + mcp + 3 助手 + TypeKey 清单 + Skill 包 + 1 专家包 | 约 1/8 工作量，先验证认证/映射/路由/分发四条链路 |

### 开放项裁决状态

>✅ **全部 12 条已于2026-10-08 裁决完毕，OPEN 归零。**
> 完整裁决理由与落地位置见 `docs/decisions/OPEN-DECISIONS.md`（唯一权威台账，本表仅作索引）。

| 原编号 | 事项 | 裁决结论 | 台账条目 |
|--------|------|---------|---------|
| OPEN-01 | 助手编号对齐规则 | ✅ 易飞连续编号 01~NN，问数固定 99，编号发布即冻结 | OPEN-A1 |
| OPEN-02 | 助手 06/17 的 `yf.ai.*` 端点归属 | ✅ 归属易飞服务端；**易飞同样有 22 个分析助手** | OPEN-A2 |
| OPEN-03 | Skill 拆分决策冲突（继承易助） | 🔀 拆为 T-15，Phase 2 评估；**在此之前不拆分** | OPEN-B3 |
| OPEN-04 | `erp-core` 仓发布方式 | 🔀 拆为 T-12/T-13；Phase 1 用本地相对路径依赖 | OPEN-B1 |
| OPEN-05 | `.trellis/spec/` 是否补齐 | 🔀 拆为 T-14，Phase 1 代码落地后补 | OPEN-B2 |
| — | `conditions` 方言差异处置 | ✅ **不做兼容层，按产品线彻底分包**（用户裁定） | OPEN-A3 |
| — | Token 获取方式 | ✅ **无需关心**，配置填值即可 | OPEN-A4 |
| — | `digi-datakey` 账套传递 | ✅ `token_map` 升级为 `{userId, companyId, token}` | OPEN-A5 |
| — | 成功判据 | ✅ 统一 `code === "0" || "-0"` | OPEN-A6 |
| — | TypeKeyList/help 元数据服务是否存在 | ⏸ 延期，**已有静态产物替代**，问询 AI 端点时顺带确认 | OPEN-C1 |
| — | 三版本（9.0.12/9.1/9.2）接口差异 | ⏸ 延期，**先确认客户版本**再验证 | OPEN-C2 |
| — | `udf07~udf12` 中文描述跳号 | ❌ 放弃，**不影响实现**（以节点名为准） | OPEN-D1 |

**新增的外部依赖事项**（已转为资料收集任务，见 `yf-materials-tasks.md`）：

| 任务 | 事项 | 责任方 | 阻塞 |
|---|---|---|---|
| T-05 | 真机验证环境 | 客户 / 项目组 | Phase 1 |
| T-06 | 业务域菜单树 | 项目组 / 实施 | Phase 1 |
| T-07 | 数据库表结构 | 项目组 / DBA | Phase 2 |
| T-08 | 业务流程与审批规则 | 实施顾问 | Phase 2 |
| T-09 | 22 个 `yf.ai.*` 端点清单 | 易飞服务端 / AI 团队 | Phase 2 |

---

## 1. 现有 YZCLI 项目结构总结

### 1.1 四层血缘链（已核实）

```
knowledge/          ① 源材料层（17 MB / 1405 文件）—— 易助 ERP 原始资产，人工维护
   │  （人工标准化提炼，_spec.md 自述"基于 knowledge/ai-assistants/… 标准化"）
   ▼
docs/YZAgent/       ② 唯一真源 SOURCE OF TRUTH（31 助手目录 + 72 个真实 prompts）
   │  node scripts/sync-yzagent.mjs（单向同步，启动即校验专家包不得嵌入）
   ▼
skills/yzcli-erp/   ③ Skill 交付镜像（102 文件；prompts/ 全为空壳）
   │  dist/ 打包（SKILL.md + references/ + yzagent/ 三条目）
   ▼
yzcli-agent-skill-v4.3.0.zip   ④ 分发物（111 KB）
```

并行两条旁路：

- `experts/yizhu-erp-ai-expert/skills/yzcli-erp/` —— 专家包内嵌副本，**已漂移到 v4.2.1，丢失 `live-contracts.md` 与 `assistants/supplier-report.md`**
- `config/knowhow/` —— 云端 L0 标准层（8 specs + 71 prompts = 79 文件 / 391 KB）+ L2 租户覆盖位（`tenants/E2E-CUST/` 空壳，**未实现**）

### 1.2 目录职责与产品线耦合度

| 目录 | 体量 | 职责 | 耦合度 |
|---|---|---|---|
| `skills/yzcli-erp/` | 102 文件 | Skill 声明（frontmatter仅 `name` / `version` / `description` 三字段）+ `references/` 7 篇 + `yzagent/` 31 助手 | 中（31 助手中 8 个已产品无关） |
| `knowledge/` | 17 MB | `json节点对照/`（110 md / 2.4 MB）、`Tbschema/`（574 xml / 4.9 MB）、`OpenAPI/`（225 ini）、`易助OpenAPI使用说明/`（23 md）、`ServiceName列表`、`match.ini` 枚举、`ai-assistants/`（388 文件设计工作台） | **极高（97%）** |
| `packages/` | 11 包 / ~35 K 行 TS | `mcp`（23 工具 / 5068 行）、`gateway`（JWT+RBAC+限流+审批+审计+license / 6536 行）、`sdk`（OpenAPI 客户端 + **TypeKey 数据宿主** / 1046 行）、`analysis`（BA 内核 / 12749 行）、`experts`（8 岗位纯计算引擎 / 5098 行）、`finance`（1327 行）、`eval`（657 行）、`license-server`（2008 行）、`license-admin`（505 行）、`admin`（348 行）、`cli`（950 行） | **极高（7 处硬编码）** |
| `experts/` | 9 包 | `yizhu-erp-ai-expert`（总纲，含全量易助业务模块地图）+ 8 职能专家（**纯领域方法论，零易助知识**） | 低（8/9 已通用） |
| `docs/` | 13 子目录 | `YZAgent/`（真源）、`typekey/`（110 TypeKey 双套参考表）、`architecture/`、`decisions/`、`云端化改造方案/`、`competition/` | 中 |
| `.trellis/` | spec×4 + tasks×7 | spec = **编码规范**（非 PRD），仅覆盖 4/11 包；tasks 含 `09-28-ai-experts-yizhu-adaptation`（**易助适配 = 新增产品线的现成模板**） | — |

### 1.3 关键发现

**① 路由层是「假数据驱动」。** `agent_typekey_map.yaml`（110 条）是外部数据文件✅，但 7 处硬编码必须逐一抽换：

| # | 位置 | 内容 | 抽换方式 |
|---|------|------|---------|
| 1 | `yzcli-mcp/src/tools/route.ts:29-37` | `BUSINESS_OBJECT_MAP` 仅 7 条，且 3 条与 YAML 主数据**不一致**（`inventory` 无裸 TypeKey；`production_order → manufacture.workorder` 而 YAML 中是 `wo`） | 扩为读 YAML |
| 2 | `yzcli-mcp/src/tools/assemble.ts:33-41` | `REQUIRED_FIELDS` 与 `route.ts:49-57` 零复用重复 | 合并为单一数据源 |
| 3 | `yzcli-mcp/src/tools/service-route.ts:40-62` | `FALLBACK_ASSISTANTS` 逐条复制 22 助手（注释自认"与 _routes.yaml 保持同步"） | 删除或改为显式失败 |
| 4 | `yzcli-analysis/src/runtime/sql/templates.ts` | 20 个 SQL 模板写死易助物理表 `JSKLNA` / `JSKLPB` / `JSKLPA` / `JSKLOA` + `match.ini` 单据代码 | 全部重写为 E10 表|
| 5 | `yzcli-analysis/src/semantic/model.ts:32` | 语义模型硬编码名 `"yizhu-erp-semantic-model"` | 改 `yifei-erp-semantic-model` |
| 6 | `yzcli-finance/src/voucher/save-model.ts:5,76,100,123` | 易助凭证 `cdsMaster.cdsDetail` 结构、借贷 `local_currency_amt_J/_D`、科目编码惯例 | 按 E10 凭证模型重写 |
| 7 | `yzcli-sdk/src/client.ts:79-81` | 强制补 `yz.oapi.` 前缀 | 改为 `servicePrefix` 配置项 |

**② 易飞资产 ≈ 0。** 全仓库仅 9 处 `yf.ai.*` 服务名 + 1 条 2026-07-09 注释（`销售订单跟单-03-API-说明.md:6`：「兼容易飞，更改返回节点名 `sales_no` 和 `sales_name`」）。**没有任何 E10 字段、表结构、TypeKey、接口文档。** 佐证这 2 个 `yf.ai.*` 端点极可能就是易飞侧服务被混写进易助 Skill（详见 OPEN-02）。

**③ 通用 : 专属 ≈ 3% : 97%。** 通用资产清单见 §2.2。

**④ 商业化护栏已跑通，是产品线隔离的现成载体。** `yzcli-license-server/routes/knowhow.ts` 保护 `config/knowhow/`（specs + prompts），`capability_groups` 四组分档声明在 manifest.json（**数据驱动，非代码**），L2 租户覆盖查找已实现（`resolveContentPath`），客户端三层闸门一致：`yzcli-mcp/middleware/license-guard.ts:134-144`、`yzcli-gateway/license/tier-mapper.ts:24-44`、`yzcli-analysis/spec/index.ts:72-103`。

**⑤ 已有一条方向正确但未落地的路。** `.trellis/tasks/09-28-skill-layered-split-prd`（`in_progress`）已设计「一专家多 Skill」+ 命名规范 `{产品线}-{模块}-{动作}`，明确对标E10 架构。但 `skills-layered/` 目录**根本没生成**，且与 `docs/decisions/Skill拆分与容量治理结论-2026-09-24.md`（结论：不拆分）**冲突未裁决**（见 OPEN-03）。

---

## 2. 通用能力 vs 易助专属产品知识

### 2.1 三层绑定模型

```
┌──────────────────────────────────────────────────────────────┐
│ 第3 层【强产品绑定】换ERP 即失效                ≈ 17.5 MB     │
│ TypeKey↔DLL 映射 · 字段编号↔节点别名 · 物理表结构 ·            │
│ OpenAPI 协议 · 枚举字典 · 业务模块地图 · 服务端点 · 账套名│
├──────────────────────────────────────────────────────────────┤
│ 第 2 层【弱产品绑定】换 ERP 需替换举例，结构可留≈ 1200 行 md │
│ 路由决策树 · 防幻觉 7 类 · JSON 组装 · 真机契约探测法 ·       │
│ 职能领域方法论 · 意图分诊 · 用户场景故事模板                  │
├──────────────────────────────────────────────────────────────┤
│ 第 1 层【完全通用】与 ERP 无关，可直接复用        ≈ 500 KB     │
│ AI Skill 工程化流程 · Prompt 写作规范 · ChatBI 竞品调研 ·      │
│ 多 ERP MCP 平台架构 · 单据主子孙数据范式                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 通用能力清单（可直接复用，无需复制）

| 能力 | 位置 | 体量 | 复用去向 |
|---|---|---|---|
| 防幻觉方法论（7 类 + 负面测试） | `skills/yzcli-erp/references/hallucination-cases.md` | 159 行 | YFCLI `references/` 原样复制 |
| 4 层路由决策模型 | `references/routing-decision-tree.md` | 95 行 | 原样复制 |
| JSON 组装范式（`conditions` 嵌套 / `datakeys` 数组 / `cdsMaster`+`cdsDetail`） | `references/json-construction-examples.md` | 279 行 | 原样复制，示例值换 E10 |
| 真机契约探测方法论（三步法 / 自学习回写 / 五条报错判据） | `references/live-contracts.md` §3 §4 §7 | 279 行 | 方法论复制，**举例全部换 E10** |
| 8 职能专家领域方法论（32 项账龄指标 / 4 维催收评分 / 14 维应付 / 三单匹配 / 5 阶段月结 SOP / 报价四象限 / 齐套 ATP） | `experts/{ar,ap,gl,cost,sales,purchase,plan,production}-*/agents/*.md` | 839~1833 B/个 | **抽 `erp-core`共享** |
| 8 岗位纯函数计算引擎（grep `readFile\|node:fs\|prompt` = **0 命中**） | `packages/yzcli-experts/src/` | 5098 行 | **抽 `erp-core` 共享** |
| 意图三分诊框架（A 数据操作 / B 智能分析 / C 产品方案） | `experts/yizhu-erp-ai-expert/agents/*.md:64-68` | 3 行 | 复制 |
| JWT + RBAC + 限流 + 审批流 + 审计链 + 契约自学习 | `packages/yzcli-gateway/src/` | 6536 行 | **抽 `erp-core` 共享** |
| License 签发/心跳/计费/knowhow 分档下发 | `packages/yzcli-license-server/src/` | 2008 行 | **抽 `erp-core` 共享** |
| 多 ERP 平台架构设计（Adapter 抽象 / MCP 协议 / 权限脱敏审计） | `knowledge/ERP_MCP_Lite_V2.0/` | 42 文件 | 已在 YFCLI 决策中受益，**直接复用其设计思路** |
| ChatBI 竞品方法论（13 个开源项目 PRD 化整理） | `knowledge/智能问数/` | 3 文件 | 复制 |
| AI 助手工程化流水线（PRD→SPEC→API→Prompt）+ Prompt 写作规范 | `knowledge/ai-assistants/README.md:37-47` + `_shared/` | 8 文件 | 复制为 YFCLI 资料收集SOP |
| 单据主/子/扩展三表数据范式 | `knowledge/json节点对照/*.md` 的 `###单头表/单身表/扩展表` 结构规范 | 结构约定 | 复制为 E10 字段对照表格式 |
| 评测 harness（fixtures / fixtures-real / golden / 8 种断言） | `packages/yzcli-eval/src/` | 657 行 | 复制并换 E10 golden |

### 2.3 易助专属清单（必须复制或重写）

| 知识 | 位置 | 体量 | YFCLI 处置 |
|---|---|---|---|
| 110 TypeKey↔DLL 映射 | `references/typekey-full-list.md`(116行) + `knowledge/ServiceName列表.md`(110行) + `knowledge/OpenAPI/`(225 ini) | ≈ 1.1 MB / 560 文件 | **按 E10 重建**（见 §5 资料清单） |
| 字段编号 ↔ 节点别名全量对照 | `knowledge/json节点对照/`（110 md / 21632 行 / 2.4 MB + `old/` 27 xlsx） | 2.4 MB | analysis 阶段按 E10 重建 |
| ERP 物理表结构 | `knowledge/Tbschema/`(574 xml / 4.9 MB) + `_erp-tables/`(276 xml 子集，**冗余**) + `data/TPABCA.xml`(696 KB) | ≈ 5.6 MB / 851 文件 | 按 E10 重建（去冗余） |
| 字段编号前缀规则（`IBA`=单头 / `DFA`=客户 / `DEA`=商品 …） | `references/field-mapping-matrix.md` | 107 行 | 按 E10 编号体系重建 |
| OpenAPI 服务协议（`yz.oapi.{typekey}.{op}` 命名、`TPAOpenAPIProcess.exe` 机制、`fastquery` SQL 缓存 vs `query` DLL 直调） | `knowledge/易助OpenAPI使用说明/`(23 md) + `查询接口说明.txt`(14 KB) + `match.ini`(3.7 KB) | ≈ 200 KB | 按 E10 官方文档重建 |
| 枚举值字典（`[InvoiceType]` / `[Source]` 等） | `knowledge/match.ini` | 3.7 KB | 按 E10 重建 |
| 易助业务模块地图（10 域 ~110 TypeKey 逐单据链） | `experts/yizhu-erp-ai-expert/agents/*.md:39-50` | ≈ 4000 字符 | 按 E10 菜单树重建 |
| 31 助手路由表（触发词 / 排除词） | `SKILL.md:83-104` + 31 份 `_meta.json` | — | **全部重建，易飞从 01 编号** |
| 31 助手服务端点绑定（`erp_service`） | 31 份 `_meta.json` | — | 按 E10 `yf.ai.*` / `yf.oapi.*` 重建 |
| 账套名 `DSB90` / `TPAStandard90`（**客户租户标识，不应外泄**） | `references/live-contracts.md:3,9` + `TPABIB-节点编号中英文对照表.xml`(44 处) + `data/TPABCA.xml` | 3 文件 | **严禁复制**，改 E10 账套名 |
| 单据审核码字段对照 | `knowledge/单据审核码字段对照表.xlsx` | 17 KB | 按 E10 重建 |
| 20 个 SQL 模板 | `packages/yzcli-analysis/src/runtime/sql/templates.ts` | 591 行 | **重写为 E10 物理表** |
| 33 个指标绑定 | `packages/yzcli-analysis/src/rules/metric-registry.ts` | 481 行 | 逐个核对 E10 数据源后重建 |
| 14,667 字段元数据 | `packages/yzcli-analysis/metadata/erp-metadata.json` | 6.7 MB | 由 E10 字段对照机械重抽 |
| 易助凭证保存模型 | `packages/yzcli-finance/src/voucher/save-model.ts` | 123 行 | 按 E10 凭证模型重写 |

---

## 3. 三仓架构与目录结构

### 3.1 仓库划分

```
┌─────────────────────────────────────────────────────────────┐
│  YZCLI（现有，不动）                                          │
│  易助产品线：skills/yizhu-erp + packages/yzcli-* + knowledge/ │
│  已进入交付态，v4.3.0                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ 依赖（npm / submodule /相对路径，见 OPEN-04）
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  ERP-CORE（新建，共享层）                                     │
│  erp-gateway(6536) · erp-license-server(2008) ·               │
│  erp-license-admin(505) · erp-admin(348) ·                   │
│  erp-experts(5098) · erp-eval(657)                            │
│  合计 ≈ 15,152 行｜零产品线耦合                                │
│  承载双产品线 knowhow 分组与 requires_tier 交叉校验            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────────┐   ┌───────────────────────────────┐
│  YFCLI（新建）      │   │  （未来第三产品线）              │
│  易飞 YF 产品线│   │  按同一模式复制 YFCLI 即可       │
│  yfcli-* 6 包     │   │                               │
│  skills/yifei-erp │   │  共享资产零复制                 │
└───────────────────┘   └───────────────────────────────┘
```

**共享资产归属理由**：`erp-experts`（5098 行）grep `readFile|node:fs|prompt` = **0 命中**，是纯函数计算引擎，8 个岗位方法论与哪家ERP 无关；`erp-gateway`（6536 行）是 JWT+RBAC+限流+审批+审计的通用治理层，**认证差异只落在 `gateway.config.yaml` 的 `erp.base_url` 与 `token_map` 两个配置值**（详见 §4.3）；`erp-license-server`（2008 行）承载 knowhow 分组，必须单点否则商业化被撕成两半。

### 3.2 YFCLI 目录树

```
D:\AIProject\claude\YFCLI\
├── AGENTS.md                     # 通用 Agent 指引（平台无关）
├── CLAUDE.md                     # 红线专章（4 条，同易助但换绑 erp-core）
├── README.md                     # 产品门面
├── CHANGELOG.md                  # Skill 包版本独立管理
├── package.json                  # workspaces: packages/*
│
├── knowledge/                    # E10 知识资产（构建期输入 = 源）
│   ├── official/                 # ★ 官方文档原件（保真，不改写）
│   │   ├── specs/                #   产品规格文档
│   │   ├── sdd/                  #   作业规格（SDD）
│   │   ├── field-manual/         #   字段说明书
│   │   ├── openapi/              #   接口文档 / 服务清单
│   │   ├── menus/                #   菜单与功能树
│   │   ├── permissions/          #   权限与角色
│   │   └── approval-rules/       #   审批规则
│   ├── typekey/
│   │   └── typekey_map.yaml      # ★ 最简 TypeKey 清单（决策 3.5）
│   ├── glossary/                 # 术语表（中英对照）
│   ├── faq/                      # 常见问题与话术
│   └── _raw/                     # 原始归档（xlsx/xml/zip，建议 gitignore）
│
├── packages/
│   ├── yfcli-sdk/                # ErpClient + HeaderProvider/TokenProvider 接口
│   ├── yfcli-mcp/                # MCP Server，23 个 yfcli_* 工具
│   ├── yfcli-analysis/           # BA 内核（20 个 E10 SQL 模板 + 33 指标）[二期]
│   ├── yfcli-finance/            # 财务引擎（E10 凭证模型）
│   ├── yfcli-cli/                # yfcli bin
│   └── yfcli-eval/               # 回归评测
│
├── skills/
│   └── yifei-erp/                # ★ Skill 包（frontmatter: name/version/description）
│       ├── SKILL.md
│       ├── custom-assistants/route-table.json   # 客户自定义助手钩子
│       ├── references/           # 7 篇（5 篇换 E10 举例，2 篇原样）
│       │   └── assistants/supplier-report.md
│       └── yfagent/              # ★ 助手目录（易助为 yzagent/，此处改名）
│           ├── 01-*/ … NN-*/     #   从 01 起编
│           └── prompts/          #   ★ 保留真实文件（见 §4.2 改造点）
│
├── experts/                      # 9+ 职能专家包（agents/ 内容来自 erp-experts 复用）
│   ├── yifei-erp-ai-expert/      #   总纲（E10 业务模块地图）
│   ├── ar-accountant/ … 8 个
│   └── _shared/                  #   agents/ 正文的共享源
│
├── config/
│   ├── analysis-sql.example.json # SQL 连接配置模板（禁明文凭据）
│   └── knowhow/                  # ★ 易飞组 knowhow（推送至 erp-license-server）
│       ├── manifest.json#   capability_groups.yifei.* 独立分档
│       ├── specs/                #   8 个 Analysis Rules section
│       ├── prompts/{NN}/*.md     #   助手 prompts 分片
│       └── tenants/{tenant}/     #   L2 覆盖层（租户 × 产品线）
│
├── docs/
│   ├── YFAgent/                  # ★ 助手规格唯一真源（对应易助 docs/YZAgent/）
│   │   ├── {NN}-{name}/          #   _meta.json / _spec.md / _workflow.md / prompts/
│   │   ├── README.md
│   │   ├── PLAN-多助手扩展方案.md
│   │   └── _template/
│   ├── typekey/                  # E10 TypeKey 参考表
│   ├── architecture/
│   ├── decisions/                # ADR + OPEN-DECISIONS.md
│   ├── guides/                   # 部署与运维
│   └── reference/
│
├── scripts/                      # 与易助对称
│   ├── sync-yfagent.mjs          # docs/YFAgent → skills/yifei-erp/yfagent（保留 prompts）
│   ├── generate-routes.mjs       # _meta.json → _routes.yaml
│   ├── extract-analysis-metadata.mjs  # 字段对照 → metadata/*.json
│   ├── publish-knowhow.mjs       # → erp-license-server
│   ├── learn-erp-contracts.mjs   # 真机契约自学习
│   └── verify-*.mjs              # 各项真机验证
│
├── tests/ · tools/ · dist/ · runs/ · logs/ · data/
└── .trellis/                     # spec（需补齐，见 OPEN-05）+ tasks/
```

### 3.3 命名规范（决策 6）

| 对象 | 易助（现有） | 易飞（新建） | 规则 |
|---|---|---|---|
| npm 包名 | `yzcli-*` | `yfcli-*` | 共享包 `erp-*` |
| Skill 名 | `yzcli-erp` | `yifei-erp` | Skill = 能力单元 |
| MCP 工具名 | `yzcli_run` / `yzcli_route` / `yzcli_expert_ar` | `yfcli_run` / `yfcli_route` / `yfcli_expert_ar` | **工具名携带厂商信息** |
| 助手目录 | `yzagent/` | `yfagent/` | — |
| 文档真源 | `docs/YZAgent/` | `docs/YFAgent/` | — |
| 助手目录名 | `NN-english-slug` | `NN-english-slug` | 沿用（编号从 01 起，见 OPEN-01） |
| 专家包 | `experts/{role}` | `experts/{role}` + `_shared/` | agents 正文共享 |
| 服务名前缀 | `yz.ai.*` / `yz.oapi.*` | `yf.ai.*` / `yf.oapi.*` | 由 `servicePrefix` 配置项决定 |
| SQL 模板前缀 | 无 | 无 | 但表名全换 E10 |
| 语义模型名 | `yizhu-erp-semantic-model` | `yifei-erp-semantic-model` | — |
| TypeKey 命名 | `sales.order` 等 110 个 | E10 自有命名（独立 map） | 决策 2 |

**工具名带 `yf` 前缀的收益**：错误信息自带来源（`Field 'X' not found` 会伴随 `yfcli` 字样）；两产品线若装进同一 Agent 会话，工具名不冲突；`yzcli-eval` / `scripts` / `docs` 需建易飞副本（决策已接受）。

---

## 4. 复用策略与改造点

### 4.1 零改动直接复用

| 资产 | 位置 | 方式 |
|---|---|---|
| 8 岗位专家引擎 | `erp-experts/src/{ar,ap,gl,cost,sales,purchase,plan,production}/` | 由 `erp-core` 导出，`yfcli-mcp` 依赖引用 |
| 8 专家 agents 方法论正文 | `experts/*/agents/*.md` | 复制到 `experts/_shared/`，各包引用 |
| gateway 治理层 | `erp-gateway/src/{auth,audit,approval,risk,middleware,metrics,learning}/` | 依赖引用，仅换 `gateway.config.yaml` |
| license 商业化层 | `erp-license-server/src/` | 依赖引用，knowhow 分组扩为双产品线 |
| 分析方法论 8 section | `config/knowhow/specs/00~07-*.md` | **共用同一份收费**（产品线无关） |
| 通用 references | `routing-decision-tree.md` / `hallucination-cases.md` | 原样复制 |
| 分析 Rules 框架 | `analysis/src/{spec,prompt}/` + `rules/{router,metric-registry,field-source}.ts` 的**框架** | 复制，指标绑定重写 |
| Trellis 规范 | `.trellis/spec/guides/`（code-reuse / cross-layer） | 复制 |
| 资料收集 SOP | `knowledge/ai-assistants/README.md:37-47` + `_shared/` | 复制为 YFCLI 资料整理流程 |

### 4.2 复制后必须改造的点

| # | 文件 / 位置 | 改造内容 |
|---|---|---|
| 1 | `yfcli-mcp/src/tools/route.ts:29-57` | `BUSINESS_OBJECT_MAP` 7 条 → 读 `typekey_map.yaml`；**修正 3 条与主数据不一致项**；`REQUIRED_FIELDS` 与 assemble 合并为单一数据源 |
| 2 | `yfcli-mcp/src/tools/assemble.ts:33-41` | 删除重复的 `REQUIRED_FIELDS`；补 `type_key` 存在性与 operation 兼容性校验（现仅做非空校验） |
| 3 | `yfcli-mcp/src/tools/service-route.ts:40-62` | **删除** `FALLBACK_ASSISTANTS` 22 条硬编码副本，改为读 `_routes.yaml` 失败时显式报错（fail-fast，杜绝双份漂移） |
| 4 | `yfcli-mcp/src/tools/run.ts:15-17,87-90` | `SERVICE_REPORT_DIRS` 改 E10 服务名；`OPERATION_ALIAS` 按 E10 实际 operation 调整 |
| 5 | `yfcli-sdk/src/client.ts:47-51,79-81` | **`buildHeaders` 抽为 `HeaderProvider` 接口**；`yz.oapi.` 硬编码前缀改 `servicePrefix` 配置项 |
| 6 | `yfcli-sdk/src/config.ts:19-27` | `baseUrl` 改 E10 OpenAPI 地址；新增 `HeaderProvider` / `TokenProvider` 工厂注册位 |
| 7 | `yfcli-analysis/src/runtime/sql/templates.ts` | 20 个模板全部重写为 E10 物理表；**删除 `knowledge/match.ini` 单据代码引用** |
| 8 | `yfcli-analysis/src/semantic/model.ts:32` | 模型名改 `yifei-erp-semantic-model`；`domains` 按 E10 实际域调整 |
| 9 | `yfcli-analysis/src/rules/metric-registry.ts`（481 行） | 33 指标逐个核对 E10 数据源；`unavailable_reason` 如实标注 E10 不可得的指标 |
| 10 | `yfcli-analysis/src/rules/field-source.ts`（719 行） | 字段取数路径全换 E10 节点名/字段编号 |
| 11 | `yfcli-analysis/src/rules/router.ts` | 三分诊词表可沿用（中文通用词），微调 E10 术语 |
| 12 | `yfcli-finance/src/voucher/save-model.ts` | E10 凭证结构、借贷方向标识、科目编码惯例全部重写 |
| 13 | `yfcli-finance/src/reconcile/matcher.ts`（355 行） | 匹配字段换 E10 |
| 14 | `yfcli-experts/src/shared/voucher-readback.ts:16` | 注释 `/** 凭证 TypeKey（易助ERP） */` 改 E10 |
| 15 | `yfcli-mcp/src/middleware/license-guard.ts:134-144` | tier 闸门加 `product_line` 声明校验 |
| 16 | `skills/yifei-erp/SKILL.md` | 全文重写：路由表（易飞从 01 编号）、`references` 路由引导表、字段标识读取优先级（改为 `~/.yfcli/learned-contracts/<tenant>.json`）、自检清单 |
| 17 | `scripts/sync-yfagent.mjs:92` | **删除 `filter: !src.includes('/prompts')`** —— 保留真实 prompts 文件（见下方改造点说明） |
| 18 | `config/knowhow/manifest.json` | `capability_groups` 扩为 `{yizhu:{...}, yifei:{...}}` 双组，每组独立 `requires_tier` |

**关于第 17 项的说明**：易助侧 `scripts/sync-yzagent.mjs:92` 主动过滤掉 `prompts/`，导致 `skills/yzcli-erp/yzagent/**/prompts/` 全为空目录（0 文件），但 `SKILL.md:109` 仍在 instructing Agent 去读 `prompts/04-extract.md` + `prompts/05-report.md` —— **文档与打包产物不一致的现存缺陷**。YFCLI 侧决策：prompts 保留在 `docs/YFAgent/`（真源），同步到 `skills/yifei-erp/yfagent/` 时**不再过滤**；云端分发的分层由 `config/knowhow/manifest.json` 控制，而非打包时剥离。

### 4.3 认证可插拔设计（决策 1 落实）

**背景**：`erp-gateway` 的 Token 链路已核实为**产品线无关**——`auth/token-map.ts`（41 行）只认 `"env:VAR"` 前缀或字面量，不知道 token 是什么、也不知道哪家 ERP 发的。真正绑定易助的只有 `gateway.config.yaml` 的 4 行配置值。

```yaml
erp:
  base_url: http://localhost:8103     # ← E10 OpenAPI 地址
  token_mode: user_map
  token_map:
    liucb:  w3XR17nu1PAsO/...=         # ← 明文 base64，YAML 文件（建议改 env）
    digiwin: env:ERP_TOKEN_DS
    admin:  env:ERP_TOKEN_DS
```

链路：`tokenMap.getErpToken(userId)` → `X-Erp-Token` Header（`mcp-proxy.ts:164`）→ `http-server.ts:132` → `run.ts:142` → `ErpClient.buildHeaders()` 注入 `digi-service` + `digi-user-token`。

**设计**（在 `yfcli-sdk` 层预留，未核实前 fail-fast）：

```ts
// yfcli-sdk/src/auth/header-provider.ts
export interface HeaderProvider {
  /** 返回注入 ERP OpenAPI 请求的认证 Header */
  build(serviceName: string, token: string): Record<string, string>;
}

// yfcli-sdk/src/auth/token-provider.ts
export interface TokenProvider {
  /** 依据 userId 解析 ERP 侧 Token（易飞实现待核实后填充） */
  resolve(userId: string): Promise<string | undefined>;
}

// yfcli-sdk/src/auth/registry.ts
export function registerAuth(provider: {
  header: HeaderProvider;
  token: TokenProvider;
}): void
```

**三种落地情形与对应改动量**：

| 核实结果 | 改动量 | 说明 |
|---|---|---|
| Header 名与获取方式完全一致 | **0** | 仅换 `gateway.config.yaml` 两个值 |
| Header 名不同、Token 路径一致 | **1 函数 / 3 行** | 只改 `buildHeaders` 实现，`HeaderProvider` 接口已隔离 |
| Token 路径与生命周期都不同 | ~200 行 | `TokenProvider` 接口已隔离，gateway 侧 `token_map` 升级为 `{productLine, token}` 结构 |

**未核实期间的策略**：`registerAuth()` 启动时校验 provider 已注册，未注册则**启动即失败并打印明确提示**（不静默降级为无认证调用）。同时保留一份易助实现作为可插拔的第二实现样本，便于将来反哺 `erp-core`。

**部署形态**：每个产品线一个 gateway 实例（共享代码、不同配置），MCP 各自独立进程与端口。若同一客户同时用两条线，则启动两个 gateway 实例 + 两个 MCP 实例，Skill 内同时挂两个 MCP server。

---

## 5. 易飞（E10）资料准备清单

> 决策 3.5：**官方文档原件入库 + 最简 TypeKey 清单**。字段级机械抽取推迟到 analysis 阶段。
> 优先级：P0 = 一期必需（阻塞最小可跑链路）｜P1 = 二期必需｜P2 = 增强

### 5.1 资料清单

| # | 类别 | 具体资料 | 用途 | 优先级 | 来源渠道 | 建议存放格式 |
|---|---|---|---|---|---|---|
| 1 | **产品架构与模块** | E10 产品架构说明、模块划分（财务/供应链/生产/人力/CRM…）、部署形态（Web/客户端/中间件）、数据库类型与版本 | 判定 E10 与易助的域粒度差异；决定 31 助手哪些可直接对位、哪些需重定义 | **P0** | 鼎捷官方文档站 / 售前提供的 E10 规格书 | `knowledge/official/specs/*.md`（原件 PDF/Word 另存 `official/specs/_original/`） |
| 2 | **菜单与功能树** | 全模块菜单路径、节点清单、菜单级功能说明 | 助手路由的触发词来源；`typekey_map.yaml` 的 `title` 字段来源；意图分诊表的基础 | **P0** | E10 系统导出 / 官方手册截图 | `knowledge/official/menus/menu-tree.md` + `menu-tree.csv`（便于机械处理） |
| 3 | **TypeKey / 服务清单** | 单据/对象类型清单、对应服务名、主键构成、支持的 operation | `typekey_map.yaml` 的直接来源；MCP 工具的数据驱动基础 | **P0** | E10 OpenAPI 服务清单文档 / 系统导出 | `knowledge/typekey/typekey_map.yaml`（结构对齐易助版，字段：`type_key` / `title` / `service` / `aliases` / `operations` / `operation_aliases`） |
| 4 | **OpenAPI 接口文档** | 认证 Header 定义、请求/响应结构、`std_data` 封包格式、错误码、分页与查询规范、限流规则 | `yfcli-sdk` 的 `HeaderProvider` 实现依据；`buildHeaders` 与响应解析的正确性 | **P0** | 官方 OpenAPI 手册 | `knowledge/official/openapi/*.md` + `service-catalog.yaml` |
| 5 | **认证与 Token** | Token 获取方式（登录作业/API/加密算法）、有效期、刷新机制、与用户/账套的绑定关系 | **决策 1 的可插拔实现依据**（当前唯一空白项） | **P0** | 官方文档 + 向服务端/易助二开团队确认 | `knowledge/official/openapi/auth.md` + 结论写入 `docs/decisions/ADR-E10-Auth.md` |
| 6 | **字段与单据模型** | 单据主键/字段编号体系、单头/单身/扩展表结构、字段编号↔节点名↔类型对照、必填与只读标识 | `knowledge/typekey-mapping/` 的来源；analysis 字段元数据的机械抽取输入 | **P1** | E10 规格文档 / DB 表结构导出 / DLL 导出 | `knowledge/typekey-mapping/{type_key}_{中文名}_{服务号}.md`（**沿用易助 5 列固定表头格式**，便于复用 `extract-analysis-metadata.mjs`） |
| 7 | **数据库表结构** | 全量表结构（表名/中文字段名/类型/长度/主外键/索引） | analysis SQL 模板的物理表依据；`yfcli-analysis` 真机验证前置 | **P1** | DB 导出 / 官方建表脚本 | `knowledge/tbschema/*.xml`（沿用易助 RowSet Schema 格式） |
| 8 | **业务流程与审批规则** | 核心流程（销售/采购/生产/财务）单据流转链、审批节点与条件、审核码规则、结账流程 | 助手 `_workflow.md` 的业务规则来源；触发/排除关键词设计依据 | **P1** | E10 作业规格（SDD）/ 业务流程文档 | `docs/YFAgent/{NN}/_workflow.md` + `knowledge/official/approval-rules/*.md` |
| 9 | **权限与角色** | 功能权限菜单树、数据权限（组织/账套/部门）、角色模板 | Gateway RBAC 策略配置；expert 包的能力边界声明 | **P2** | 官方文档 | `knowledge/official/permissions/*.md` |
| 10 | **术语表** | 中英对照、业务名词定义、易助↔E10 差异术语标注 | 消除 LLM 跨产品线串味；prompts 措辞统一 | **P1** | 官方文档 + 项目组积累 | `knowledge/glossary/glossary.md` + `glossary.csv`（含 `易助术语` / `E10 术语` / `说明` 三列做差异对照） |
| 11 | **常见问题与话术** | 用户高频问题、标准答法、错误码处置话术、限制与不支持项说明 | 助手 `_spec.md` 的「能力边界」章节；`references/assistants/` 素材 | **P2** | 售前/实施访谈记录 + 易助侧 7 类幻觉案例迁移 | `knowledge/faq/faq.md`（按域分节） |
| 12 | **枚举与常量字典** | 单据类型、来源代码、币种、税率、库存状态等枚举值 | 防幻觉第 1 类（编造枚举值）；`match.ini` 等价物 | **P1** | 系统导出 / 官方文档 | `knowledge/enums/enums.yaml`（**替代易助的 GBK `match.ini`**，用 UTF-8 YAML 避免编码坑） |
| 13 | **真机验证环境** | 测试账套地址、只读账号、可用 TypeKey 清单、样本数据说明 | 契约自学习（`learn-erp-contracts.mjs`）与 real-machine-verification | **P0** | 项目组/客户环境 | 不入库；写入 `config/local.example.json`（gitignore），实际值走环境变量 |
| 14 | **对标蓝本（可选）** | 鼎捷 E10 AI 智能职能专家页面资料（11 专家 / 44 技能 / 7 已实现） | 复用易助侧已整理的逆向需求报告作为蓝本 | **P2** | `D:\AIProject\claude\YZCLI\.trellis\tasks\09-28-09-28-ai-role-experts-prd/research/`（可直接复制） | 复制到 `docs/reference/e10-benchmark/` |

### 5.2 资料收集 SOP

沿用易助 `knowledge/ai-assistants/README.md:37-47` 的流水线，并按 grill-me 模式澄清需求：

```
收资料 → 逐类别归档到 knowledge/official/<category>/
       → grill-me 澄清缺失与歧义
       → 写 PRD → Spec → API 说明 → Prompt
       → 一份文档做原型验证 → 推广到其余
```

**归档纪律**（沿用用户既有偏好）：

- 官方原件**保真存放**，不手工改写；如需结构化另存派生文件并标注来源
- GBK/GB2312 编码的原件（E10 文档若沿用中文 Windows 编码）**转 UTF-8 时须先探测原编码再转**，禁止 UTF-8 盲目覆写导致混合编码
- 统一 CRLF 行尾，UTF-8 无 BOM
- 写盘前强制快照备份到 `.workbuddy/snapshots/`

---

## 6. 多产品线共存组织方案

### 6.1 标识体系

| 维度 | 标识 | 取值 | 载体 |
|---|---|---|---|
| 产品线代码 | `product_line` | `yizhu` / `yifei` | license payload + JWT claim + Skill 名 |
| 包前缀 | — | `yzcli-*` / `yfcli-*` / `erp-*` | npm 包名 |
| 工具前缀 | — | `yzcli_*` / `yfcli_*` | MCP 工具名 |
| Skill 名 | — | `yzcli-erp` / `yifei-erp` | frontmatter `name` |
| 服务前缀 | `servicePrefix` | `yz.` / `yf.` | `yfcli-sdk` 配置项 |
| 语义模型 | — | `yizhu-erp-semantic-model` / `yifei-erp-semantic-model` | analysis 配置 |
| 契约存储 | — | `~/.yzcli/learned-contracts/<tenant>.json` / `~/.yfcli/learned-contracts/<tenant>.json` | 客户本地，**不入 skill 包** |
| 账套 | `tenant_id` | 各产品线各自的账套名 | JWT claim + `analysis-sql.json` `database` |

### 6.2 切换机制

**采用「部署期绑定 + License 声明」双闸门，不做运行时动态切换。**

```
客户部署
  ├─ 选产品线 → 决定部署哪套包（yzcli-* 或 yfcli-*）
  ├─ 配 gateway.config.yaml：erp.base_url / token_map
  ├─ 配 analysis-sql.json：datasources[].database（账套名）
  └─ 装对应 Skill（yzcli-erp 或 yifei-erp）→ 挂对应 MCP server
        ↓
运行时校验（erp-license-server + erp-gateway）
  ├─ License payload 必须含 product_line 声明
  ├─ tier 校验交叉比对：License.tier ≥ manifest.capability_groups[product_line].requires_tier
  └─ 不匹配 → 403 tier_insufficient，返回 capability_impact 降级契约
```

**不做运行时动态切换的理由**：两产品线的 TypeKey 命名、SQL 物理表、字段编号体系完全不同，运行时切换会导致 analysis 语义层与 SQL 模板需要在两个模型间来回映射，反而引入不一致风险。部署期绑定是「配置一次、明确可控」的最简方案。

**同一客户同时用两条线的场景**：Skill 内挂两个 MCP server（`yzcli` / `yfcli`），工具名带前缀故不冲突；客户按需购买任一产品线的 License。

### 6.3 Know-how 分组与分档（决策 5.3 落实）

`config/knowhow/manifest.json`（易飞仓）结构：

```json
{
  "version": "2026.10.xx",
  "spec_version": "1.0.0",
  "prompt_version": "2.0.0",
  "product_line": "yifei",
  "capability_groups": {
    "yifei.assistant_prompts": { "requires_tier": "professional", "file_count": 0, "items": [] },
    "yifei.business_analyst":  { "requires_tier": "enterprise",   "file_count": 0, "items": [] },
    "yifei.smart_query":       { "requires_tier": "enterprise",   "file_count": 0, "items": [] },
    "shared.methodology":      { "requires_tier": "enterprise",   "file_count": 0, "items": [] }
  },
  "files": []
}
```

**分组原则**：

| 分组 | 产品线相关性 | 处理 |
|---|---|---|
| `*.assistant_prompts` / `*.business_analyst` / `*.smart_query` | **强相关**（含表名、字段名、枚举值、示例数据） | 各产品线独立内容、独立分档 |
| `shared.methodology`（8 个 Analysis Rules section） | **无关**（三分诊/指标注册方法/停止规则/输出规范） | **共用同一份收费**，易飞仓只放引用不重复上传 |
| L2 `tenants/{tenantId}/` | 与产品线正交 | 维度扩为「租户 × 产品线」：租户同时买两条线时，两条线各有独立覆盖层 |

**L2 路径解析改造**（`erp-license-server/src/routes/knowhow.ts:51-72`）：

```ts
// 原：tenants/{tenant}/prompts/{assistant_id}/{kind}.md
// 新：tenants/{tenant}/{product_line}/prompts/{assistant_id}/{kind}.md
l2Path = join(contentDir, "tenants", tenant, productLine, "prompts", assistant_id, kind + ".md")
```

### 6.4 命名、版本管理与维护约定

| 项 | 约定 |
|---|---|
| **版本双轨** | Skill 包版本与项目版本独立管理（沿用易助 `CHANGELOG.md:3` 声明）。Skill 版本号从 frontmatter 动态读取，单版本线策略 |
| **产物命名** | `dist/{expert}-v{skill_version}.zip`、`dist/yifei-erp-v{skill_version}.zip` |
| **助手编号** | 易飞从 01 起编；新增助手**只增不改**（已发布编号的 `_meta.json` 字段一旦发布即冻结） |
| **知识源单向同步** | `docs/YFAgent/` → `skills/yifei-erp/yfagent/`（`sync-yfagent.mjs` 单向，启动即校验专家包不得嵌入 Skill 目录）；**禁止手工双改** |
| **路由表单一来源** | `_routes.yaml` 由 `generate-routes.mjs` 从 `_meta.json` 生成；**删除**任何硬编码 fallback |
| **Schema 统一** | `_meta.json` 建立统一 schema（易助侧有 **11 种字段变体**，`trigger_excludes` vs `exclude_keywords`、`erp_service` vs `mcp_tool` 命名分裂，9 个目录缺 `parameters`、9 个缺 `author`）→ YFCLI 侧从第一份就用统一 schema + JSON Schema 校验 |
| **知识库覆盖层** | `config/knowhow/tenants/{tenant}/{product_line}/`（L2 覆盖）优先于 L0 标准层；两者都需 `manifest.json` 登记并带 `sha256` |
| **凭据红线** | `analysis-sql.json` 密码只允许从环境变量取（`password_env`），配置校验拒绝 `password`/`pwd`/`user`/`uid`/`sa_password` 等明文字段；`allowed_templates` 白名单不得为空；`limits` 必填 |
| **契约隔离** | 契约自学习文件按租户隔离，`_meta.tenant` 不匹配时**拒绝写入**（防跨库串味）；**绝不跨产品线复制** |
| **账套名保密** | 账套名（如 `DSB90`）**严禁写入 SKILL / knowledge / docs**，只在本地配置与真机验证脚本中出现 |
| **测试基线** | 易助 794 passed / 0 failed 为参照；YFCLI 复制后须跑通同等量级才算一期完成 |
| **红线继承** | 沿用 `CLAUDE.md` 4 条红线（禁直连 CLI / 禁热改`packages/` / 改 Skill 必须重打包 / 禁另起端口），但因两产品线独立进程，**红线 #4 适用范围限定为「本产品线内」** |
| **副本漂移防护** | 易助侧 `experts/yizhu-erp-ai-expert/skills/yzcli-erp/` 已漂移到 v4.2.1 且丢失 2 个 references 文件 → YFCLI 侧 CI 加`sync-fyfagent.mjs check` 门禁（易助侧 `sync-expert-skills.py` 已有此机制，YFCLI 照做） |
| **数据入库纪律** | `data/`（license、token、指纹 salt、trial-state）**逐项精确 gitignore**，不整体忽略也不入库；`knowledge/official/_raw/` 原件大文件建议 gitignore + 内部仓 |

---

## 7. 分阶段落地步骤

### Phase 0：资料准备与基线冻结（不写业务代码）

| 步 | 动作 | 产出 | 依赖 |
|---|---|---|---|
| 0.1 | 创建 YFCLI 独立仓（git init + `.gitattributes` + `.gitignore` 纪律） | 仓库骨架 | — |
| 0.2 | 关闭 OPEN-01~05 五个开放项 | `docs/decisions/OPEN-DECISIONS.md` 更新 + ADR | — |
| 0.3 | 收集 P0 资料（清单 #1~#5、#13） | `knowledge/official/` 五类归档 | 客户/官方渠道 |
| 0.4 | **核实 E10 认证方案**（决策 1 的空白项） | `docs/decisions/ADR-E10-Auth.md` | 服务端确认 |
| 0.5 | 产出最简 `typekey_map.yaml` | `knowledge/typekey/typekey_map.yaml` | 资料 #2#3 |
| 0.6 | 确定 `erp-core` 仓形态与发布方式（OPEN-04） | `erp-core` 仓骨架 | 架构裁决 |
| 0.7 | 建立 `.trellis/spec/`（至少 sdk / mcp / cli 三套，见 OPEN-05） | 编码规范 | — |

**门禁**：P0 资料齐备率 100%；`typekey_map.yaml` 覆盖全部目标单据；E10 认证方案有明确书面结论。

### Phase 1：最小可跑链路（决策 7）

| 步 | 动作 | 产出 | 改造点 |
|---|---|---|---|
| 1.1 | 建 `erp-core`，迁入 gateway / license-server / license-admin / admin / experts / eval | 6 个共享包 | 从 YZCLI 复制，**不改业务逻辑** |
| 1.2 | fork `yzcli-{sdk,mcp,cli}` → `yfcli-{sdk,mcp,cli}` | 3 个包 | 改造点 #1#2#3#4#5#6 |
| 1.3 | 实现 `HeaderProvider` / `TokenProvider` 接口 + 易飞实现 | `yfcli-sdk/src/auth/` | 决策 1 |
| 1.4 | fork `yzcli-finance` → `yfcli-finance`，按 E10 凭证模型重写 | 1 个包 | 改造点 #12#13 |
| 1.5 | 建 `knowledge/typekey/typekey_map.yaml` + `_routes.yaml`（3 助手） | 数据文件 | 资料 #2#3 |
| 1.6 | 建 `docs/YFAgent/01~03`（3 个助手规格真源）+ `sync-yfagent.mjs`（**不过滤 prompts**） | 真源 + 同步脚本 | 改造点 #17 |
| 1.7 | 写 `skills/yifei-erp/SKILL.md` + `references/` 7 篇 | Skill 包 | 改造点 #16 |
| 1.8 | 建 `experts/yifei-erp-ai-expert` + 1 个职能专家包（建议 `ar-accountant`） | 2 个专家包 | — |
| 1.9 | `publish-knowhow.mjs` 发布易飞组（3 助手 prompts + 8 specs 引用） | manifest | 改造点 #18 |
| 1.10 | 真机验证：3 助手端到端 + Token 链路 + 契约自学习 | `runs/` 验证报告 | — |
| 1.11 | 建 `yfcli-eval` golden（3 助手）+ 跑通测试 | 回归基线 | — |
| 1.12 | 打包 `dist/yifei-erp-v1.0.0.zip` + 专家包 zip | 交付物 | — |

**门禁**：3 助手在真机跑通；Token 链路验证通过（三种情形之一已确认并实现）；测试全绿；`sync-fyfagent.mjs check` 无漂移。

**建议的 3 个一期助手**（选择理由：数据源单一、验证成本低、覆盖三条技术路线）：

| 助手 | 技术路线 | 验证目标 |
|---|---|---|
| `01-inventory-aging` 库存呆滞查询 | `yf.ai.*` 私有端点 | 验证 AI 端点调用（对应易助 02） |
| `02-supplier-purchase-report` 供应商采购报告 | `yf.ai.*` 私有端点 | 验证 prompts 分片链路（对应易助 03） |
| `03-purchase-order` 采购订单 CRUD |裸 typekey + operation 映射 | 验证 TypeKey 发现 / 字段写入 / 先查后写（对应易助 08） |

### Phase 2：能力扩展

| 步 | 动作 |
|---|---|
| 2.1 | 补齐 P1 资料（#6 字段对照 / #7 表结构 / #8 流程审批 / #10 术语 / #12 枚举） |
| 2.2 | 写 `extract-analysis-metadata.mjs` 易飞版，产出 `yfcli-analysis/metadata/*.json` |
| 2.3 | fork `yzcli-analysis` → `yfcli-analysis`，重写 20 SQL 模板 + 33 指标 + field-source |
| 2.4 | 跑 `real-machine-verification`（沿用易助 `.trellis/spec/yzcli-analysis/backend/real-machine-verification.md` 规范） |
| 2.5 | 扩助手到 01~23（业务域）+ 8 专家助手 |
| 2.6 | 建 `99-intelligent-query` |
| 2.7 | 补齐 9 专家包 |

### Phase 3：商业化与治理对齐

| 步 | 动作 |
|---|---|
| 3.1 | `erp-license-server` 扩展双产品线 knowhow 分组 + L2「租户 × 产品线」解析 |
| 3.2 | 三层 tier 闸门加 `product_line` 交叉校验 |
| 3.3 | `erp-eval` golden 扩到全量，CI 门禁 |
| 3.4 | 补齐 `.trellis/spec/` 覆盖全部包 |
| 3.5 | 部署文档（`docs/guides/`）：E10 OpenAPI 地址配置、Token 配置、双产品线并行部署 |

---

## 8. 潜在风险点

| # | 风险 | 等级 | 证据 / 现状 | 缓解措施 |
|---|------|------|------------|---------|
| R1 | **E10 认证方案未核实** | 🔴 高 | 决策 1 的空白项；易助侧链路已核实为 3 处配置 + 1 函数 3 行 | `HeaderProvider`/`TokenProvider` 接口化；未注册即 fail-fast；Phase 0.4 强制关闭 |
| R2 | **E10 字段/表结构资料缺失或不可机读** | 🔴 高 | 决策 3.5 已把字段抽取推迟到二期；易助侧 2.4 MB 字段对照是 21632 行人工整理 | Phase 1 只依赖菜单树+服务清单（可导出）；字段抽取放 Phase 2，并保留 `old/*.xlsx` 人工可读版 |
| R3 | **analysis 完全复制导致双份维护** | 🟠 中 | 决策 3；12749 行 + 33 指标 + 20 模板 | 每新增指标必须三处同步（`metric-registry.ts` + `semantic/model.ts` + `field-source.ts` FIELD_ROUTES），沿用易助规范；`available:false` 诚实标注 E10 不可得指标 |
| R4 | **31 助手全部重建工作量超预期** | 🟠 中 | 决策 4；易助侧真源 169 文件 / 含 72 个 prompts | 一期只做 3 助手（决策 7）；每助手沿用「PRD→Spec→Prompt」流水线；单文档原型验证后再推广 |
| R5 | **`erp-core` 抽仓引入跨仓依赖复杂度** | 🟠 中 | 决策 5.1；14,149+ 行共享 | 三仓 monorepo 或相对路径依赖优先（OPEN-04）；erp-core 不引入任何产品线知识，守住「零耦合」纪律 |
| R6 | **两产品线共享 gateway 但配置不同，运维复杂度上升** | 🟡 中低 | 每产品线一个 gateway 实例 + 独立配置 | `gateway.config.yaml` 纳入版本管理（脱敏）；提供 `docs/guides/OPERATIONS-双产品线并行运维.md`；`scripts/` 提供健康检查统一入口 |
| R7 | **`yf.ai.*` 端点归属未明** | 🟡 中低 | OPEN-02；易助助手 06/17 现用此前缀 | Phase 0.2 关闭；确认后决定这两个助手归属哪条线（若属易飞，则从易助 31 助手中移除并入易飞） |
| R8 | **Skill 包体积与上下文超限** | 🟡 中低 | 易助 SKILL.md 18 KB 超 EIOSpace 16 KB 预警线；`09-28-skill-layered-split-prd` 提拆分但与「不拆分」决策冲突（OPEN-03） | 一期 3 助手时 SKILL.md 体积可控；31 助手时按 OPEN-03 结论执行（拆分或瘦身 + 云端化）；`config/knowhow` 分档已提供按需下发能力 |
| R9 | **易助侧冻结被破坏** | 🟡 中低 | YZCLI 已进入交付态（v4.3.0 zip 已产出） | 所有改动在 YFCLI / erp-core 新仓进行；YZCLI 只读参考；如需反哺（如认证接口抽象），须走 CLAUDE.md 红线 #3 重打包流程并评估对已交付客户的影响 |
| R10 | **账套名等客户标识泄漏进开源/交付物** | 🟡 中低 | 易助侧 `TPABIB-节点编号中英文对照表.xml` 含 `DSB90` 44 处、`live-contracts.md:3,9` 含真机单号 | 建立交付前扫描脚本（grep 账套名模式），纳入 CI 门禁 |
| R11 | **prompts 保留在 Skill 包导致 know-how 泄漏** | 🟡 中低 | 决策 4.2 第 17 项；易助侧现为空壳但 `SKILL.md:109` 仍指向它 | 明确分层：prompts 真源在 `docs/YFAgent/`，Skill 包内副本用于本地兜底，云端分档由 `manifest.json` 控制；交付物分层（Skill zip 可分发 / knowhow 仅授权用户） |
| R12 | **`_meta.json` Schema 不统一的历史教训重演** | 🟢 低 | 易助侧 31 文件 11 种变体 | YFCLI 从第一份就用统一 schema + JSON Schema 校验 + CI 门禁 |

---

## 9. 决策总结（一段话）

本次扩展采用**「三仓架构 + 完全隔离 + 共享内核」**路线：新建独立仓 `YFCLI` 承载易飞产品线的 6 个包（`yfcli-sdk/mcp/analysis/finance/cli/eval`）、Skill 包 `yifei-erp`、助手真源 `docs/YFAgent/` 与 E10 知识资产；抽出 `erp-core` 共享仓承载 6 个零产品线耦合的包（gateway / license-server / license-admin / admin / experts / eval，共约 15,152 行）；`YZCLI` 仓保持不动作为易助交付基线。产品线隔离的切面划在「认证适配」与「数据/知识」两层——认证通过 `HeaderProvider` + `TokenProvider` 可插拔接口吸收 E10 差异（未核实前 fail-fast），数据与知识完全独立（两套 `typekey_map.yaml`、两套 SQL 模板、两套字段元数据、31 助手从 01 重建）。多产品线共存采用「部署期绑定 + License 声明」双闸门，Know-how 按产品线分组独立分档，方法论层共用收费。一期交付最小可跑链路（sdk + mcp + 3 助手 + TypeKey 清单 + Skill 包 + 1 专家包）以验证认证链路、TypeKey 映射、助手路由、Skill 分发四条主链路，二期补齐分析层与全部助手，三期对齐商业化治理。核心未决项仅剩 E10 认证细节（已接口化隔离，不阻塞架构决策）与 5 个开放项，均可在 Phase 0 内关闭。
