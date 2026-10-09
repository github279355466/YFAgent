# 双产品线整体架构图（2026-10-09）

> 本文档描述易助(YZCLI)与易飞(YFAgent)两条产品线的代码归属、共享边界与部署拓扑。

---

## 一、代码仓库拓扑

```
D:\AIProject\claude\
├── erp-license/          ← 公共包①：授权认证核心（已抽取）
│   ├── src/crypto/       AES/RSA/HMAC
│   ├── src/auth/         JWT/Token/TokenMap
│   └── src/license/      指纹/心跳/降级/试用
│
├── erp-experts/          ← 公共包②：专家计算引擎（建议抽取）
│   ├── src/ar/           应收：账龄32项 + 催收4维评分
│   ├── src/cost/         成本：BOM展开 + 模拟 + 归因 + 呆滞
│   ├── src/ap/           应付：14维分析 + 付款优先级 + 三单匹配
│   ├── src/gl/           总账：凭证校验 + 结账 + 报表 + 勾稽
│   ├── src/sales/        销售：PO解析 + 四象限报价 + 评审
│   ├── src/purchase/     采购：询价比价 + 交期评审
│   ├── src/plan/         计划：齐套分析 + ATP交付承诺
│   ├── src/production/   生产：工单进度 + 报工统计
│   └── src/shared/       dry-run + voucher-readback
│
├── YZCLI/                ← 易助产品线（已上线）
│   └── packages/
│       ├── yzcli-sdk/          CRUD走OpenAPI (yz.oapi.*)
│       ├── yzcli-auth/         (待建，目前散在gateway/mcp中)
│       ├── yzcli-mcp/          MCP Server + 工具注册
│       ├── yzcli-analysis/     分析层(SQL模板+视图+语义)
│       ├── yzcli-experts/      → 将改为引用 erp-experts
│       ├── yzcli-gateway/      多租户网关(JWT/RBAC/限流)
│       ├── yzcli-cli/          命令行工具
│       ├── yzcli-eval/         评测框架
│       ├── yzcli-finance/      财务凭证(与experts重叠,待合并)
│       ├── yzcli-license-server/ → 将改为引用 erp-license
│       └── yzcli-license-admin/  管理后台UI
│
└── YFAgent/              ← 易飞产品线（MVP开发中）
    └── packages/
        ├── yfcli-sdk/          CRUD走OpenAPI (yf.oapi.*)
        ├── yfcli-auth/         独立授权模块 ✅已完成
        ├── yfcli-mcp/          MCP Server + 集中式注册表 ✅已完成
        ├── yfcli-analysis/     分析层(模板+视图+L3白名单) ✅已完成
        ├── yfcli-experts/      → 将改为引用 erp-experts
        └── yfcli-skill-openapi/ SKILL.md + 助手文档 ✅已完成
```

---

## 二、运行时架构（单条产品线视角）

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Client (Codex/Cursor/...)          │
│                    发送 JSON-RPC over SSE                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server (yfcli-mcp / yzcli-mcp)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ ToolRegistry │  │ SessionMgr   │  │ AuthProvider      │  │
│  │ (集中式注册)  │  │ (token注入)  │  │ (来自 yfcli-auth) │  │
│  └──────┬──────┘  └──────────────┘  └───────────────────┘  │
│         │                                                    │
│  ┌──────┴──────────────────────────────────────────────┐    │
│  │ Tools: manifest / query / read / help / ask / ...   │    │
│  └──────┬──────────────────────────────────────────────┘    │
└─────────┼───────────────────────────────────────────────────┘
          │
    ┌─────┴─────────────────────────────────┐
    │                                       │
    ▼                                       ▼
┌──────────────┐                  ┌──────────────────┐
│ SDK (CRUD)   │                  │ Analysis (聚合)   │
│ OpenAPI通道  │                  │ 数据库直连通道     │
│              │                  │                  │
│ yf.oapi.*    │                  │ vw_ai_* 视图     │
│ (易飞)       │                  │ SQL模板注册制     │
│              │                  │ L1参数化+L2注册   │
│ yz.oapi.*    │                  │ +L3白名单        │
│ (易助)       │                  │                  │
└──────┬───────┘                  └────────┬─────────┘
       │                                   │
       ▼                                   ▼
┌──────────────┐                  ┌──────────────────┐
│ 易飞ERP      │                  │ SQL Server 2014  │
│ OpenAPI      │                  │ (易飞数据库)      │
│              │                  │                  │
│ 易助ERP      │                  │ SQL Server       │
│ OpenAPI      │                  │ (易助数据库)      │
└──────────────┘                  └──────────────────┘

    ┌─────────────────────────────────────┐
    │  Expert Engine (erp-experts)        │
    │  纯计算，不直接访问ERP               │
    │                                     │
    │  输入: rows[] (从SDK或Analysis取回)  │
    │  输出: FormulaResult (带口径标签)    │
    │                                     │
    │  被 MCP tools 或 Agent 调用          │
    └─────────────────────────────────────┘
```

---

## 三、共享边界矩阵

| 模块 | 通用性 | 共享方式 | 各线独立部分 |
|------|--------|----------|-------------|
| **授权认证** (crypto/auth/license) | ✅ 100%通用 | `erp-license` 公共包 | 无 |
| **专家计算引擎** (8域公式) | ✅ 100%通用 | `erp-experts` 公共包 | 无（纯数学，零产品线引用） |
| **分析内核** (calc/plan/rules骨架) | ⚠️ ~70%通用 | 暂不抽取，各线独立 | templates.ts / semantic/ / metadata/ |
| **SQL执行器骨架** (template/executor/config) | ⚠️ ~80%通用 | 暂不抽取，各线移植 | driver连接串 / 视图名 |
| **CRUD SDK** (client/conditions/parser) | ⚠️ ~60%通用 | 各线独立 | 服务名前缀 / conditions结构 / 枚举规则 |
| **MCP Server** (registry/server/session) | ⚠️ ~70%通用 | 各线独立 | 工具集 / typekey_map |
| **Skill/Prompt** (SKILL.md + 助手文档) | ❌ 各线独立 | 不共享 | 触发词 / 服务名 / 字段名 |
| **Gateway** (JWT/RBAC/限流) | ⚠️ ~50%通用 | 各线独立(MVP不做) | 角色定义 / 域映射 / 工具清单 |
| **License Server** (签发/设备/心跳) | ⚠️ ~60%通用 | 二期统一 | licenses表需加product_line |

---

## 四、部署拓扑

### MVP 阶段（当前）

```
┌─ 开发者本机 ─────────────────────────────────┐
│                                               │
│  Agent Client (Codex)                         │
│       │                                       │
│       ▼                                       │
│  yfcli-mcp (localhost:3100)                   │
│       │                                       │
│       ├──→ 易飞ERP OpenAPI (内网IP)            │
│       ├──→ 易飞SQL Server (内网IP)             │
│       └──→ erp-experts (npm包,进程内)          │
│                                               │
│  无需独立部署 erp-license / erp-experts        │
│  它们作为 npm 依赖打包进 MCP server 进程       │
└───────────────────────────────────────────────┘
```

### 生产阶段（未来）

```
┌─ 客户服务器 ─────────────────────────────────┐
│                                               │
│  yfcli-mcp (Docker/PM2)                       │
│       │                                       │
│       ├──→ 易飞ERP OpenAPI                     │
│       ├──→ 易飞SQL Server                      │
│       └──→ erp-experts (npm包,进程内)          │
│                                               │
│  erp-license-server (可选,独立进程)            │
│       └──→ License签发/心跳/设备管理           │
│                                               │
│  注意: erp-experts 永远不需要独立部署           │
│  它是纯计算库,随 MCP server 一起运行           │
└───────────────────────────────────────────────┘
```

---

## 五、数据流示例：供应商采购报告

```
用户: "分析鼎新电脑2026年Q1的采购情况"
  │
  ▼ Step 1: Agent 读取助手 prompt (各线独立)
  │  易飞: knowledge/official/ai-assistants/14-supplier-procurement-report-agent/_workflow.md
  │  易助: skills/yzcli-erp/yzagent/03-supplier-purchase-report/_workflow.md
  │
  ▼ Step 2: 意图提取 (LLM, 各线独立prompt)
  │  输出: { supplier: "鼎新电脑", date_s: "2026-01-01", date_e: "2026-03-31" }
  │
  ▼ Step 3: 调用ERP取数 (各线独立SDK)
  │  易飞: yfcli_run({ service: "yf.ai.SupplierPurchaseGet", input: {...} })
  │  易助: yzcli_run({ service: "yz.ai.SupplierPurchaseGet", input: {...} })
  │  返回: { data_ai: { purchase: [...], quality: [...], payable: [...] } }
  │
  ▼ Step 4: 专家引擎计算 (通用! erp-experts)
  │  import { analyzeAp14d } from "erp-experts/ap"
  │  const result = analyzeAp14d(data_ai.payable)
  │  // 纯数学计算, 不关心数据来自易飞还是易助
  │
  ▼ Step 5: 生成报告 (LLM, 各线独立prompt)
     输出: HTML报告 (核心结论 + 采购履约 + 质量表现 + 应付账务 + 异常诊断)
```

**关键洞察**: Step 3 各线不同(CRUD不通用), Step 4 完全相同(专家引擎通用)。
这就是为什么专家引擎可以安全抽取——它只处理数据,不接触ERP。

---

## 六、演进路线

| 阶段 | 动作 | 影响 |
|------|------|------|
| **现在** | erp-license 已抽取; erp-experts 待抽取; 7个助手复制到易飞 | 零回归风险 |
| **MVP完成后** | 抽取 erp-experts; YZCLI/YFAgent 改 file: 引用 | YZCLI 需改 import 路径 |
| **商业化时** | 抽取 erp-analysis-core; License Server 加 product_line | 需数据库迁移 |
| **多客户部署时** | 上 npm registry 替代 file:; CI 配 registry 认证 | 需 .npmrc + CI secrets |
