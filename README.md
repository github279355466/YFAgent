# YFCLI — 易飞（YF / E10）产品线 AI 助手

> 对标 YZCLI（易助 ERP 产品线）的独立仓库。
> **易飞与易助同属鼎捷（Digiwin）产品体系**，但 OpenAPI 方言差异较大，故采用完全隔离架构。
>
> 仓库：<https://github.com/github279355466/YFAgent> ｜ 分支 `main` ｜ 推送通道 HTTPS

---

## 仓库定位

| 维度 | 说明 |
|---|---|
| **产品线** | 易飞 YF（E10），非 E10 Cloud，非雅典娜 |
| **上游依据** | `易飞OpenAPI.json`（Apipost 导出，2120 接口节点 / 601 服务名 / 107 业务对象（含 OAPMA 补充））+ 三份元数据 XML（1170 表 / 54842 字段） |
| **对标产品线** | 易助（YZCLI，`digiwin.com` 体系，110 TypeKey） |
| **架构决策** | 三仓隔离：本仓（易飞业务知识与产物）/ `erp-core`（授权认证核心）/ `erp-experts`（8 域专家计算引擎） |

### 三仓关系

```
┌──────────────────────────────────────────────────────────────┐
│                      GitHub 公共仓                           │
│  ┌─────────────────┐          ┌──────────────────────┐      │
│  │   erp-core       │          │    erp-experts        │      │
│  │ 授权认证核心      │          │ 8 域纯数学计算引擎     │      │
│  │ AES/RSA/JWT/指纹  │          │ AR/AP/Cost/GL/Sales/ │      │
│  │ 心跳/降级/试用    │          │ Purchase/Plan/Prod   │      │
│  └────────┬────────┘          └──────────┬───────────┘      │
│           │ file: 依赖                    │ file: 依赖        │
└───────────┼───────────────────────────────┼──────────────────┘
            ▼                               ▼
┌───────────────────────┐     ┌───────────────────────────────┐
│  YZCLI (易助)          │     │  YFAgent (易飞) ← 本仓         │
│  yzcli-auth → erp-core│     │  yfcli-auth → erp-core        │
│  yzcli-experts → ...  │     │  yfcli-experts → erp-experts  │
│  110 TypeKey          │     │  107 TypeKey / 601 服务名      │
└───────────────────────┘     └───────────────────────────────┘
```

### 为什么不与 YZCLI 合仓

易飞与易助的 OpenAPI 存在**无法靠配置消解**的方言差异：

| # | 差异 | 实测结论 |
|---|---|---|
| 1 | `conditions` 结构 | 易飞是对象嵌套 `group`，易助是数组嵌套 `groups`；**易飞对错误结构显式报错**（`conditions not found.`），不会静默返回全量 |
| 2 | 查询子服务 | 易飞**无 `fastquery`**（仅 `query.get`，每次重查数据库），易助的性能优化经验不可复用 |
| 3 | 字段命名 | 易飞是 `XX001` 编码制（无语义），易助是 `doc_no` 式语义化—— 易飞必须内置字典层 |
| 4 | 枚举传值 | 易飞回参是「编码.中文」，条件按**前缀匹配**（`N` / `N.` / `N.未审核` 等价），传纯编码或完整值均可 |
| 5 | 其他 | 服务前缀 `yf.`/`yz.`、读取操作名 `read`/`get`、账套传递方式均不同 |

详见 `docs/plans/yf-vs-yizhu-openapi-diff.md`（31 维度差异对照）。

---

## 目录结构

```
YFAgent/
├── packages/
│   ├── yfcli-sdk/              OpenAPI SDK（配置、封包、conditions、响应解析）
│   │   └── src/data/_routes.yaml  31 个 AI 助手动态路由表
│   ├── yfcli-auth/             独立授权模块（Token 生命周期 / 凭据红线 / 健康检查）
│   ├── yfcli-analysis/         分析层（SQL 模板注册制 + 执行器防护 + 智能问数路由）
│   │   └── sql/views/          9 个 vw_ai_* 视图 DDL
│   ├── yfcli-mcp/              MCP Server（24 工具 + HTTP/SSE 传输）
│   ├── yfcli-experts/          专家模块（引用 @digiwin/erp-experts + 易飞注册表层）
│   └── yfcli-skill-openapi/    AI 助手 Skill v0.2.0
│       ├── SKILL.md            32 KB 主指令文件
│       └── references/
│           ├── typekey-index.md           107 TypeKey 精简索引
│           ├── json-construction-examples.md  易飞版 JSON 组装示例
│           ├── assistants-index.md        31 助手精简索引
│           └── assistants/                3 个冒烟助手完整文档
├── knowledge/                  知识资产（脚本生成，禁止手工编辑）
│   ├── typekey/                TypeKey 映射表（107 对象 / 601 服务名）
│   ├── typekey-mapping/        字段对照表（106 份 / 12,893 字段）
│   ├── data-dictionary/        结构化数据字典（78 模块 + 7 CSV）
│   ├── enums/                  枚举值映射
│   └── official/
│       └── ai-assistants/      31 个助手 _workflow + _spec 完整文档
├── docs/
│   ├── plans/                  方案与规划文档（23 份）
│   ├── decisions/              决策台账（OPEN-DECISIONS / STATISTICS-SPEC）
│   ├── DEPLOYMENT.md           部署指南
│   ├── COLLABORATION.md        团队协作约定
│   └── GITHUB-SETUP.md         远程仓库同步手册
├── scripts/                    生成、校验、部署脚本（25 个）
│   ├── pack-deploy.ps1         部署包打包
│   ├── pack-skill.ps1          Skill 分发包打包
│   ├── setup-servy-services.ps1  Servy 服务注册
│   ├── run-live-e2e.mjs        端到端真机测试
│   └── ...                     抽取 / 校验 / 探测脚本
├── config/                     配置模板（仅 .example 入库）
├── .trellis/                   Trellis 任务体系（23 个任务）
├── .github/workflows/          CI 门禁（verify.yml）
└── runs/                       真机探测产物（gitignored）
```

---

## 快速开始

```powershell
# 1. 安装依赖（Node 20+）
npm install

# 2. 构建全部包（按依赖顺序：sdk → auth → analysis → experts → mcp）
npm run build

# 3. 生成全部知识产物（首次或源文件更新后）
npm run gen:all

# 4. 校验产物是否为最新（CI 门禁）
npm run check:all

# 5. 提交前必跑
npm run verify           # = scan:secrets + check:all
```

### 前置：准备源文件

抽取脚本依赖 `docs/易飞OpenAPI.json`（约 48 MiB，**不入库**）。需单独获取：

- 来源：Apipost 项目 `322f10`（易飞OpenAPI）导出
- 存放：`docs/易飞OpenAPI.json`
- 校验：`node scripts/extract-typekey-map.mjs` 输出的 `services_unique` 应为 **601**（含 OAPMA 补充）

### 配置环境变量

```powershell
Copy-Item .env.example .env
notepad .env
```

| 变量 | 必填 | 说明 |
|------|------|------|
| `YF_BASE_URL` | ✅ | 易飞 ERP 内网 IP（**只填 IP**，路径代码自动拼接） |
| `YF_COMPANY_ID` | ✅ | 账套编号 |
| `YF_USER_TOKEN` | ✅ | 身份令牌（TPASC19 获取） |
| `YF_MCP_PORT` | 否 | 默认 4001 |

### 启动 MCP Server

```powershell
# 开发环境
node packages\yfcli-mcp\dist\cli.js --http --port 4001

# 生产环境：注册为 Servy Windows 服务（推荐）
.\scripts\setup-servy-services.ps1 -ProjectRoot "D:\YFCLI" -Port 4001
```

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

---

## 包说明

| 包 | 职责 | 测试数 |
|----|------|--------|
| `yfcli-sdk` | OpenAPI SDK：配置、封包、conditions 构造、响应解析、错误模型、枚举守卫、助手路由表 | 166 |
| `yfcli-auth` | 独立授权：Token 生命周期管理、凭据红线检查、健康检查、错误分类 | 68 |
| `yfcli-analysis` | 分析层：SQL 模板注册制、执行器防护、L4 审计日志、智能问数路由 | 105 |
| `yfcli-mcp` | MCP Server：24 工具集中式注册表、HTTP/SSE 传输、Auth 全链路集成 | 64 |
| `yfcli-experts` | 专家模块：引用 `@digiwin/erp-experts` 公共引擎 + 易飞注册表层 | 28 |
| `yfcli-skill-openapi` | AI 助手 Skill v0.2.0：SKILL.md + 精简索引 + 助手文档（无运行时测试） | — |
| **合计** | | **431 [5 包]** |

---

## 公共包依赖

本仓通过 `file:` 引用两个独立仓库的公共包：

| 公共包 | GitHub 仓库 | 引用方 | 说明 |
|--------|-------------|--------|------|
| `@digiwin/erp-experts` | [erp-experts](https://github.com/github279355466/erp-experts) | `yfcli-experts` | 8 域纯数学计算引擎（AR/AP/Cost/GL/Sales/Purchase/Plan/Production） |
| `erp-license` | [erp-core](https://github.com/github279355466/erp-core) | `yfcli-auth` | 授权认证核心（AES/RSA/JWT/指纹/心跳/降级） |

```jsonc
// packages/yfcli-experts/package.json
{ "dependencies": { "@digiwin/erp-experts": "file:../../../erp-experts" } }
```

> ⚠️ `file:` 路径相对于引用方根目录。CI 环境需额外 clone 共享仓，或后续改用 registry。

---

## MCP 工具（24 个）

MCP Server 暴露 24 个工具，分 5 类：

### 基础查询（4）

| 工具 | 说明 |
|------|------|
| `yf_manifest` | 返回 107 个业务对象清单及支持的操作 |
| `yf_query` | 通用列表查询（conditions + 分页） |
| `yf_read` | 按主键精确读取单条记录 |
| `yf_help` | 获取指定 TypeKey 的字段说明与操作指南 |

### CRUD 操作（4）

| 工具 | 说明 |
|------|------|
| `yf_run` | 通用 ERP 操作执行器（create/update/delete/approve + service 直调） |
| `yf_validate` | 请求体结构预校验（不发送） |
| `yf_assemble` | JSON 请求组装与字段校验 |
| `yf_route` | 自然语言意图 → type_key + operation 映射 |

### 分析引擎（7）

| 工具 | 说明 |
|------|------|
| `yf_ask` | 智能问数（自然语言聚合统计） |
| `yf_analysis_plan` | 创建/校验业务分析计划 |
| `yf_analysis_step` | 执行分析步骤（compare/contribution/drill-down） |
| `yf_analysis_meta` | 查询数据源语义视图 |
| `yf_analysis_prompt` | 按需获取助手 prompt 片段 |
| `yf_analysis_spec` | 获取分析方法论规范 |
| `yf_service_route` | 关键词 → AI 助手服务名路由 |

### 专家引擎（8）

| 工具 | 说明 |
|------|------|
| `yf_expert_ar` | 应收：账龄分析 + 催收评分 |
| `yf_expert_ap` | 应付：14 维分析 + 付款优先级 + 三单匹配 |
| `yf_expert_cost` | 成本：BOM 模拟 + 归因 + 呆滞诊断 |
| `yf_expert_gl` | 总账：凭证校验 + 结账 + 报表 + 勾稽 |
| `yf_expert_sales` | 销售：PO 解析 + 报价 + 订单评审 |
| `yf_expert_purchase` | 采购：询价比价 + 交期评审 |
| `yf_expert_plan` | 计划：齐套分析 + ATP 交付承诺 |
| `yf_expert_production` | 生产：工单进度 + 报工统计 |

### 辅助（1）

| 工具 | 说明 |
|------|------|
| `yf_skill_version` | 返回当前 Skill 版本号 |

---

## AI 助手（31 个）

31 个 AI 助手覆盖查询、分析、专家三大类，通过两种方式提供：

| 层级 | 内容 | 位置 |
|------|------|------|
| **Skill 精简索引** | 107 TypeKey + 31 助手摘要 + JSON 组装示例 | `packages/yfcli-skill-openapi/references/` |
| **MCP 按需获取** | 每个助手的完整 `_workflow.md` + `_spec.md` | `yf_analysis_prompt` 工具 / `knowledge/official/ai-assistants/` |

助手分类：

| 类别 | 编号 | 数量 |
|------|------|------|
| 物料与库存 | 02–04 | 3 |
| 销售管理 | 05–09 | 5 |
| 采购管理 | 10–14 | 5 |
| 生产管理 | 15–17 | 3 |
| 财务会计 | 18–21, 26–30 | 9 |
| 业务专家 | 22–25 | 4 |
| 综合分析 | 31–32 | 2 |

Skill 包内含 3 个冒烟助手的完整文档（`customer-create` / `plant-query` / `plant-read`），其余 28 个通过 MCP `yf_analysis_prompt` 按需获取。

---

## 测试

```powershell
# 全量运行
npm test

# 各包独立运行
cd packages\yfcli-sdk;     npx vitest run    # 166 passed
cd ..\yfcli-auth;          npx vitest run    #  68 passed
cd ..\yfcli-analysis;      npx vitest run    # 105 passed
cd ..\yfcli-mcp;           npx vitest run    #  64 passed
cd ..\yfcli-experts;       npx vitest run    #  28 passed
```

测试框架：Vitest 5.x。所有测试均为离线单元测试，不依赖外部服务。

### 端到端真机测试（20/20 PASS）

```powershell
node scripts\run-live-e2e.mjs
```

| 类别 | 测试项 | 结果 |
|------|--------|------|
| MCP 协议 | initialize / session 管理 | ✅ |
| 健康检查 | 24 tools 注册验证 | ✅ |
| 真机 ERP | yf_query / yf_read / yf_run 返回真实数据 | ✅ |
| 动态路由 | 31 助手从 `_routes.yaml` 加载 | ✅ |
| Prompt 分发 | 实际读取 `_workflow.md` / `_spec.md` | ✅ |
| 专家引擎 | 8 域计算正确性 | ✅ |
| 智能问数 | 自然语言 → SQL → 结果 | ✅ |
| 工具链 | validate / assemble / route 联动 | ✅ |

---

## Trellis 任务体系（23 个）

`.trellis/tasks/` 下按阶段组织开发任务：

| 阶段 | 任务 | 状态 |
|------|------|------|
| MVP P0 | prerequisites（前置条件） | ✅ completed |
| MVP P1 | auth-module（授权模块） | ✅ completed |
| MVP P2 | crud-skill-openapi（CRUD Skill） | ✅ completed |
| MVP P3 | auth-integration（授权集成） | ✅ completed |
| MVP P4 | analysis-qa（分析层 + 智能问数） | ✅ completed |
| MVP P5 | expert-module（专家模块） | ✅ completed |
| Post-MVP | container-probe | ✅ completed |
| Post-MVP | inquiry-q01-q02 | ✅ completed |
| Post-MVP | integration-test | ✅ completed |
| Post-MVP | l4-audit-log | ✅ completed |
| Post-MVP | sql-template-completion | ✅ completed |
| Post-MVP | view-ddl-execution | ✅ completed |
| Post-MVP | approve-keys-broaden | ✅ completed |
| Post-MVP | conditions-operator-case | ✅ done |
| Post-MVP | enum-trailing-dot | ✅ done |
| Post-MVP | live-defect-remediation | ✅ completed |
| Post-MVP | live-scenario-test | ✅ completed |
| Post-MVP | master-create-fields | ✅ completed |
| Post-MVP | query-total-result-semantics | ✅ completed |
| Post-MVP | sales-order-create-contract | ✅ completed |
| Post-MVP | secret-scan-hits | ✅ completed |
| Post-MVP | detail-node-and-metric-verify | 🔶 pending |
| Post-MVP | yzcli-migration | ⏸️ deferred |

**完成率**：21/23 completed/done（91%），1 pending，1 deferred。

---

## 部署

生产环境使用 **Servy** 注册为 Windows 原生服务（非 PM2）：

```powershell
# 一键注册 + 启动 + 健康检查
.\scripts\setup-servy-services.ps1 -ProjectRoot "D:\YFCLI" -Port 4001
```

- 端口：**4001**（默认）
- 入口：`node dist/cli.js --http --port 4001`
- `.env` 中 `YF_BASE_URL` **只存 IP**，完整路径由代码自动拼接
- 部署包由 `scripts/pack-deploy.ps1` 生成，包含 `_routes.yaml` 和 `knowledge/official/ai-assistants/`

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

---

## 关键文档

| 文档 | 内容 |
|---|---|
| `docs/plans/yfcli-product-line-extension-plan.md` | 扩展方案主文档（三仓架构 / 复用策略 / 分阶段落地） |
| `docs/plans/dual-product-line-full-architecture.md` | 双产品线整体架构图（代码归属 / 共享边界 / 部署拓扑） |
| `docs/plans/yf-openapi-rules.md` | 易飞 OpenAPI 规则体系提取（含 10 项「文档未说明」） |
| `docs/plans/yf-vs-yizhu-openapi-diff.md` | 易飞 vs 易助 31 维度差异对照 |
| `docs/plans/yf-openapi-integration-recommendations.md` | 统一规则落地建议（改造点 / 阻塞项） |
| `docs/plans/yf-materials-tasks.md` | 资料收集任务化清单（含负责人 / 时间 / 交付物） |
| `docs/decisions/OPEN-DECISIONS.md` | 全部开放项与裁决状态 |
| `docs/decisions/STATISTICS-SPEC.md` | 统计口径规范（禁止裸数字） |
| `docs/DEPLOYMENT.md` | 部署指南（Servy / 环境变量 / 验证清单） |

---

## 红线

1. **禁止向仓库提交任何凭证** —— token、账套名（`CompanyId`）、内网 IP 一律不入库
2. **`knowledge/typekey/` 与 `knowledge/typekey-mapping/` 是脚本产物，禁止手工编辑** —— 改了就跑 `npm run gen:all` 重新生成
3. **禁止猜测字段名** —— 字段一律查 `knowledge/typekey-mapping/{type_key}.md`
4. **易飞无字段编号体系** —— 勿套用易助的「字段编号」概念
5. **自研字段名两套互斥** —— 易飞 `udf01~udf12`/`udf51~udf62`，易助 `udf_text1~16`/`udf_no1~16`，**混用即幻觉**
6. **`total_result` 不是总行数** —— 是分页哨兵（本页行数 + 1），取总数须用足够大 `page_size` 一次取完或翻页累加 `count`
7. **枚举条件按前缀匹配** —— `N` / `N.` / `N.未审核` 等价，不存在「传中文返 0 条」（旧结论已推翻）
8. **写操作成功判据只能是 read 复核落库** —— `code=0` 与 `error[]` 都不可信
9. **update 必须按官方样本白名单下发** —— 把 `read` 全量字段原样回传必被拒
10. **`.env` 中 `YF_BASE_URL` 只存 IP** —— 完整路径由 SDK 自动拼接，避免路径大小写错误