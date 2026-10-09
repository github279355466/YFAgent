# YFCLI — 易飞（YF / E10）产品线 AI 助手

> 对标 YZCLI（易助ERP 产品线）的独立仓库。
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
| **架构决策** | 三仓隔离：本仓（易飞业务知识与产物）/ `erp-core`（共享引擎与商业化）/ `YZCLI`（易助，不动） |

### 为什么不与 YZCLI 合仓

易飞与易助的 OpenAPI 存在**无法靠配置消解**的方言差异：

| # | 差异 | 实测结论 |
|---|---|---|
| 1 | `conditions` 结构 | 易飞是对象嵌套 `group`，易助是数组嵌套 `groups`；**易飞对错误结构显式报错**（`conditions not found.`），不会静默返回全量 |
| 2 | 查询子服务 | 易飞**无 `fastquery`**（仅 `query.get`，每次重查数据库），易助的性能优化经验不可复用 |
| 3 | 字段命名 | 易飞是 `XX001` 编码制（无语义），易助是 `doc_no` 式语义化—— 易飞必须内置字典层 |
| 4 | 枚举传值 | 易飞回参是「编码.中文」，**查询只认纯编码**；混用返回空集且 `code=0` |
| 5 | 其他 | 服务前缀 `yf.`/`yz.`、读取操作名 `read`/`get`、账套传递方式均不同 |

详见 `docs/plans/yf-vs-yizhu-openapi-diff.md`（31 维度差异对照）。

---

## 目录结构

```
YFAgent/
├── packages/
│   ├── yfcli-sdk/              OpenAPI SDK（配置、封包、conditions、响应解析）
│   ├── yfcli-auth/             独立授权模块（Token 生命周期 / 凭据红线 / 健康检查）
│   ├── yfcli-analysis/         分析层（SQL 模板注册制 + 执行器防护 + 智能问数路由）
│   │   └── sql/views/          9 个 vw_ai_* 视图 DDL
│   ├── yfcli-mcp/              MCP Server（集中式工具注册表 + HTTP/SSE 传输）
│   ├── yfcli-experts/          专家模块（引用 @digiwin/erp-experts + 易飞注册表层）
│   └── yfcli-skill-openapi/    AI 助手 Skill（薄 Skill + 助手 Prompt）
│       └── references/assistants/  助手文档（每助手一个 .md）
├── knowledge/                  知识资产（脚本生成，禁止手工编辑）
│   ├── typekey/                TypeKey 映射表（107 对象 / 601 服务名）
│   ├── typekey-mapping/        字段对照表（106 份 / 12,893 字段）
│   ├── data-dictionary/        结构化数据字典（78 模块 + 7 CSV）
│   ├── enums/                  枚举值映射
│   └── official/               官方文档原件
├── docs/
│   ├── plans/                  方案与规划文档
│   ├── decisions/              决策台账
│   ├── DEPLOYMENT.md           部署指南
│   ├── COLLABORATION.md        团队协作约定
│   └── GITHUB-SETUP.md         远程仓库同步手册
├── scripts/                    生成与校验脚本（11 个）
├── config/                     配置模板（仅 .example 入库）
├── .trellis/                   Trellis 任务体系（MVP P0~P5 + Post-MVP）
├── .github/workflows/          CI 门禁（verify.yml）
└── runs/                       真机探测产物（gitignored）
```

---

## 快速开始

```powershell
# 1. 安装依赖（Node 20+）
npm install

# 2. 生成全部知识产物
npm run gen:all

# 3. 校验产物是否为最新（CI 门禁）
npm run check:all

# 4. 提交前必跑
npm run verify           # = scan:secrets + check:all
```

### 前置：准备源文件

抽取脚本依赖 `docs/易飞OpenAPI.json`（约 48 MiB，**不入库**）。需单独获取：

- 来源：Apipost 项目 `322f10`（易飞OpenAPI）导出
- 存放：`docs/易飞OpenAPI.json`
- 校验：`node scripts/extract-typekey-map.mjs` 输出的 `services_unique` 应为 **601**（含 OAPMA 补充）

### 启动 MCP Server

```powershell
npx tsx -e "import { startServer } from 'yfcli-mcp'; await startServer({ port: 3100 });"
```

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

---

## 包说明

| 包 | 职责 | 测试数 |
|----|------|--------|
| `yfcli-sdk` | OpenAPI SDK：配置、封包、conditions 构造、响应解析、错误模型、枚举守卫 | 122 |
| `yfcli-auth` | 独立授权：Token 生命周期管理、凭据红线检查、健康检查、错误分类 | 64 |
| `yfcli-analysis` | 分析层：SQL 模板注册制、执行器防护、L4 审计日志、智能问数路由 | 49 |
| `yfcli-mcp` | MCP Server：集中式工具注册表、HTTP/SSE 传输、Auth 全链路集成 | 41 |
| `yfcli-experts` | 专家模块：引用 `@digiwin/erp-experts` 公共引擎 + 易飞注册表层 | 18 |
| `yfcli-skill-openapi` | AI 助手 Skill：角色定义 + 助手 Prompt（无运行时测试） | — |
| **合计** | | **294 [5 包]** |

---

## 公共包依赖

本仓通过 `file:` 引用两个独立仓库的公共包：

| 公共包 | GitHub 仓库 | 引用方 | 说明 |
|--------|-------------|--------|------|
| `@digiwin/erp-experts` | [erp-experts](https://github.com/github279355466/erp-experts) | `yfcli-experts` | 公共计算引擎（成本归因、库存分析等） |
| `erp-license` | [erp-core](https://github.com/github279355466/erp-core) | （Phase 3） | 授权服务 + 网关核心 |

```jsonc
// packages/yfcli-experts/package.json
{ "dependencies": { "@digiwin/erp-experts": "file:../../../erp-experts" } }
```

> ⚠️ `file:` 路径相对于引用方根目录。CI 环境需额外 clone 共享仓，或后续改用 registry。

---

## AI 助手

助手文档位于 `packages/yfcli-skill-openapi/references/assistants/`，每个助手一个 `.md` 文件。

| 助手 | 文件 | 说明 |
|------|------|------|
| customer-create | `customer-create.md` | 客户创建 |
| plant-query | `plant-query.md` | 工厂查询 |
| plant-read | `plant-read.md` | 工厂读取 |

> 更多助手文档待业务侧提供端点清单后补充。格式规范参见 SKILL.md。

---

## 测试

```powershell
# 各包独立运行
cd packages\yfcli-sdk;     npx vitest run    # 122 passed
cd ..\yfcli-auth;          npx vitest run    #  64 passed
cd ..\yfcli-analysis;      npx vitest run    #  49 passed
cd ..\yfcli-mcp;           npx vitest run    #  41 passed
cd ..\yfcli-experts;       npx vitest run    #  18 passed
```

测试框架：Vitest 5.x。所有测试均为离线单元测试，不依赖外部服务。

---

## Trellis 任务体系

`.trellis/tasks/` 下按阶段组织开发任务：

| 阶段 | 任务 | 状态 |
|------|------|------|
| MVP P0 | prerequisites（前置条件） | ✅ |
| MVP P1 | auth-module（授权模块） | ✅ |
| MVP P2 | crud-skill-openapi（CRUD Skill） | ✅ |
| MVP P3 | auth-integration（授权集成） | ✅ |
| MVP P4 | analysis-qa（分析层 + 智能问数） | ✅ |
| MVP P5 | expert-module（专家模块） | ✅ |
| Post-MVP | view-ddl-execution（视图 DDL 执行） | ✅ |
| Post-MVP | sql-template-completion（SQL 模板补全） | ✅ |
| Post-MVP | l4-audit-log（L4 审计日志） | ✅ |
| Post-MVP | container-probe / inquiry / integration-test / yzcli-migration | 🔶 |

---
## 关键文档

| 文档 | 内容 |
|---|---|
| `docs/plans/yfcli-product-line-extension-plan.md` | 扩展方案主文档（三仓架构 / 复用策略 / 分阶段落地） |
| `docs/plans/yf-openapi-rules.md` | 易飞 OpenAPI 规则体系提取（含 10 项「文档未说明」） |
| `docs/plans/yf-vs-yizhu-openapi-diff.md` | 易飞 vs 易助 31 维度差异对照 |
| `docs/plans/yf-openapi-integration-recommendations.md` | 统一规则落地建议（改造点 / 阻塞项） |
| `docs/plans/yf-materials-collection-checklist.md` | 资料收集清单（16 类 / P0-P2 分级） |
| `docs/plans/yf-materials-tasks.md` | 资料收集**任务化清单**（含负责人 / 时间 / 交付物） |
| `docs/decisions/OPEN-DECISIONS.md` | 全部开放项与裁决状态 |

---

## 红线

1. **禁止向仓库提交任何凭证** —— token、账套名（`CompanyId`）、内网 IP 一律不入库
2. **`knowledge/typekey/` 与 `knowledge/typekey-mapping/` 是脚本产物，禁止手工编辑** —— 改了就跑 `npm run gen:all` 重新生成
3. **禁止猜测字段名** —— 字段一律查 `knowledge/typekey-mapping/{type_key}.md`
4. **易飞无字段编号体系** —— 勿套用易助的「字段编号」概念
5. **自研字段名两套互斥** —— 易飞 `udf01~udf12`/`udf51~udf62`，易助 `udf_text1~16`/`udf_no1~16`，**混用即幻觉**
