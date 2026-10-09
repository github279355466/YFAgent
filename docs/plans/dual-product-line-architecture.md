# 双产品线架构设计（2026-10-09 裁决）

> 目的：确定易助（YZCLI）与易飞（YFAgent）两条产品线的代码归属、共享边界与移植策略。
> 状态：**B1/B2 已裁决**，B3/B4/B5 待推进。

---

## 一、总体架构（已裁决）

**双通道模式** —— 两条产品线同构：

```
┌─────────────────────────────────────────────┐
│ 交互层：MCP Server / CLI / Skill 包│
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│ 服务层：gateway（JWT/RBAC/限流/审计/License） │
└──────────────────┬──────────────────────────┘
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼────────┐
│ SDK            │   │ analysis       │
│ CRUD 走 OpenAPI│   │ 聚合走数据库直连 │
│ （各自实现）    │   │ （共享内核）      │
└────────────────┘   └────────────────┘
```

**裁决 B1 = 选项 2**：授权体系抽为独立包共用；其余全量复制，各自独立演进。

**理由**：
1. 授权是唯一确定共用项（实测 `license-server/src/` 对其他 yzcli 包 **0 引用**）
2. analysis 模板将来必然分化（易助表 `JSKLOA` vs 易飞表 `ACMMO`），抽成公共反添乱
3. 不动已上线的 YZCLI 现有包，只新增共享包 —— **零回归风险**

---

## 二、代码规模与依赖现状（实测）

| 包 | 文件 | 行数 | 对内依赖 |
|---|---|---|---|
| `yzcli-license-server` | — | 1884 | **无**（`yzcli-sdk` 是残留空依赖，可删） |
| `yzcli-gateway` | 60 | 6536 | `yzcli-sdk` |
| `yzcli-mcp` | 46 | 5068 | `yzcli-sdk` `yzcli-analysis` `yzcli-experts` |
| `yzcli-analysis` | 80 | 12749 | **无**（真正的独立内核） |
| `yzcli-sdk` | 13 | 1046 | 无 |

**关键发现**：
- `yzcli-analysis` **零内部依赖**，已设计为可独立复用的内核
- `yzcli-license-server` 同样零内部依赖，但 `package.json` 里残留 `"yzcli-sdk": "*"`，`src/` 内无任何引用 —— **删除该依赖即可完全解耦**

---

## 三、共享边界：注册表 + 共享判定逻辑（已裁决）

### 3.1 核心洞察

授权逻辑中的工具清单**同时混了「通用机制」与「产品线数据」**。前者可共用，后者必须各线独立。

**用户提出的关键改进**：不按工具名识别，改按**能力类别**识别 —— 不论专家包叫什么名字，只要属于「专家」这一类，`enterprise` tier 即可见。

### 3.2 硬编码清单分类（实测 `auth/rbac.ts` + `license/tier-mapper.ts`）

| 清单 | 位置 | 内容 |可否按类别识别 |
|---|---|---|---|
| `PUBLIC_TOOLS` | rbac.ts:70 | manifest/help/validate/route/assemble | ✅ 纯工具名，改名即可 |
| `TIER_GATED_TOOLS` | rbac.ts:81 | 6 个 analysis + 8 个 expert | ✅ **按类别识别** |
| `TIER_TOOLS` | tier-mapper.ts:22 | 24 个工具名 → tier 映射 | ✅ **按类别识别** |
| `TIER_RANK` | tier-mapper.ts:11 | 4 个 tier 排名 | ✅ 纯阈值，共用 |
| `TIER_MAX_RISK` | tier-mapper.ts:48 | trial 30 / basic 50 / pro 80 / ent 200 | ✅ 纯阈值，共用 |
| `TIER_WRITE_OPS` | tier-mapper.ts:55 | create/update/delete/approve/disapprove | ✅ 纯操作名，共用 |
| `ROLE_PERMISSIONS` | rbac.ts:4 | 角色 → 权限列表 | ⚠️ **数据**，各线注入 |
| `TYPE_KEY_DOMAIN_MAP` | rbac.ts:40 | `accounting.voucher` → finance | ❌ **业务耦合**，各线注入 |
| `SERVICE_DOMAIN_MAP` | rbac.ts:49 | `yz.ai.*` → 域 | ❌ **业务耦合**，各线注入 |

> **`SERVICE_DOMAIN_MAP` 现状**：已混入两个易飞端点（`yf.ai.PurchaseBusinessWarning` / `yf.ai.SalesbusinessWarning`）—— 易飞服务被硬塞进易助 RBAC 表，是「按名称识别」的反面实证，印证按类别/按域识别的正确性。

### 3.3 拆分后结构

```
共享包 @erp-license/*  —— 与产品线完全无关
├─ 密码学    rsa.ts / aes-key.ts        （签名验签、加解密）
├─ 协议      心跳协议 / JWT claims 签发
├─ 阈值      TIER_RANK / TIER_MAX_RISK / TIER_WRITE_OPS
├─ 判定逻辑  tier ≥ 阈值 → 放行（纯比较，无业务名）
├─ 风险      OPERATION_ACTION_MAP（操作 → 风险等级，与 TypeKey 无关）
└─ 注册表接口
   ├─ ToolRegistry     每线注入：工具名 → 能力类别 → 最低 tier
   ├─ DomainRegistry每线注入：TypeKey/service → 权限域
   └─ RoleRegistry     每线注入：角色 → 权限列表

各线独立 yfcli-* / yzcli-*
├─ 工具清单    PUBLIC_TOOLS / TIER_GATED_TOOLS（按类别，不含名称硬编码）
├─ 映射表      TYPE_KEY_DOMAIN_MAP / SERVICE_DOMAIN_MAP
├─ 角色定义    ROLE_PERMISSIONS
└─ 业务层      SDK / analysis 模板 / experts
```

**改造效果**：`tier-mapper.ts` 中 24 个硬编码工具名全部消失，改为各线注册「我有哪几类工具，每类最小 tier」。

### 3.4 数据库配置（B4，已定原则）

照 `config/analysis-sql.example.json` 模板，**交付客户时填客户库信息**。

已验证原则（`config.ts` 3 条红线）：
1. 密码**只允许从环境变量取**（配置里写 `password_env` 变量名，出现明文 `password` 一律拒绝）
2. `limits` 必填（max_rows / timeout_ms兜底）
3. `allowed_templates` 白名单不得为空（防全开）
4.配置文件不入代码库，仓库只提供 `.example.json` 模板

当前实测配置（测试环境，**非交付配置**）：

```json
{
  "server": "172.16.2.86", "port": 1433, "database": "SDDEMO93",
  "user_env": "YF_SQL_USER", "password_env": "YF_SQL_PASSWORD",
  "options": { "trustServerCertificate": true, "readOnlyIntent": true }
}
```

环境变量前缀建议 `YF_`（易助用 `YZ_`）。

### 3.5 视图脚本（B5，已定原则）

易飞无 `vw_ai_*` 视图（实测仅 4 个：`MoJu` / `VCMSMQZ` / `VCOPTH` / `VMOCTE`）。

- 照易助 9 个视图定义改写为易飞表名
- **不带 `COMPANY` 过滤**（该字段为预留管理字段，易飞为独立公司账套）
- 产出 DDL 脚本，由**客户侧 DBA 手动执行**

**改写量评估**：易助模板全为易助专属表名与字段，必须逐个改写：

```sql
-- 易助模板（templates.ts）
SELECT TOP (:max_rows) LOA001 AS item_no ... FROM JSKLOA
SELECT TOP (:max_rows) LPA001 AS item_no ... FROM JSKLPA
SELECT TOP (:max_rows) LNA018 AS cust  ... FROM JSKLNA
SELECT TOP (:max_rows) k.KEA001 AS doc ... FROM JSKKEA k OUTER APPLY (...)
```

易飞表名体系为 `ACM*` / `PUR*` / `INV*`（如 `ACMMO`/`ACMLC`），与 `JSK*` 无重叠。

---

## 四、B3 落地形态（已裁决）

### 4.1 决策

**独立 private git 仓库 + `file:` 引用，暂不发布 registry。**

```text
D:\AIProject\claude\
├── erp-license/          ← 新建，独立 private git 仓（共享包源码唯一来源）
│   ├── packages/
│   │   └── core/         @erp-license/core：密码学 + 协议 + 阈值 + 判定逻辑 + 注册表接口
│   └── package.json      private: true，无 publish 脚本
├── YZCLI/                易助线，根 package.json 加 "erp-license": "file:../erp-license"
└── YFAgent/易飞线，同上
```

### 4.2 为什么暂不上 registry

实测YZCLI 现状：**从未走过发布流程**。

| 项 | 实测值 |
|---|---|
| 根 package.json | `"name": "yzcli-monorepo"` / `private: true` / `workspaces: ["packages/*"]` |
| `.npmrc` | **不存在**（未配 registry） |
| publish 脚本 | **无** |
| 子包 private 字段 | 11 个包**全部无** `private` 字段，靠父级兜住 |
| 包间依赖写法 | `"yzcli-sdk": "*"` + workspaces 软链（lock 中 `"link": true`） |

若直接上 GitHub Packages，需新增 3 类故障点：registry 认证、版本号管理、CI 密钥配置。
当前单人项目，收益不足以抵消复杂度。**待真正需要给客户部署时再引入 registry。**

### 4.3 引用写法（沿用现有约定）

现有包间依赖是 `"*"` + workspaces 软链。跨仓引用改用 `file:`：

```jsonc
// YZCLI / YFAgent 的根 package.json
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "erp-license": "file:../erp-license"
  }
}
```

npm 会把 `file:` 依赖做成软链（lock 中同样呈现 `"link": true`），与现有行为一致。

> **`file:` 的坑**：相对路径**相对于引用方根目录**。CI 环境若无 `../erp-license` 会直接失败——
> CI 需额外 clone 共享仓，或后续改用 registry。

### 4.4 拆分前的必做改动

| # | 改动 | 位置 | 原因 |
|---|---|---|---|
| 1 | 删除 `"yzcli-sdk": "*"` 残留依赖 | `yzcli-license-server/package.json:dependencies` | 实测 `src/` 内 **0 引用**，是拆包前的最后一道耦合 |
| 2 | `licenses` 表加 `product_line` 字段 | `license-server/src/db/migrate.ts:48` | **阻塞项**：两条线共用同一 lib 时签发记录会互相覆盖 |
| 3 | `devices` / `heartbeat_logs` 评估是否需加产品线维度 | `migrate.ts:63,75` | 待评估 |
| 4 | tier 工具清单改注册表 | `gateway/src/license/tier-mapper.ts` / `auth/rbac.ts` | 消除 24 个硬编码工具名（见 3.2） |

### 4.5 licenses 表迁移示意

```sql
-- 现状：无产品线维度
CREATE TABLE licenses (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, tier TEXT NOT NULL, ...);

-- 需改为
CREATE TABLE licenses (
    id TEXT PRIMARY KEY,
    product_line TEXT NOT NULL,          -- 新增：yzcli / yfcli
    customer_id TEXT NOT NULL,
    tier TEXT NOT NULL,
    ...
);
CREATE INDEX idx_licenses_line ON licenses(product_line);
```

**迁移注意**：现有 `licenses` 表已有数据（易助真实客户 license），加 `NOT NULL` 字段需先
回填默认值（如 `product_line = 'yzcli'`）再改约束，否则迁移失败。

---

### 4.6 B3 的实测依据（licenses 表现状）

`licenses` 表结构（`db/migrate.ts:48`）无 `product_line` / `product_code` 字段。
若两条产品线共用同一授权服务且同一 `lib` 数据库，签发记录会互相覆盖。


## 五、剩余待决事项

| # | 事项 | 状态 |
|---|---|---|
| B3.2 | 心跳表 `heartbeat_logs` / `devices` 是否同样需加产品线维度 | 待评估 |
| — | analysis 层安全边界：直连绕过 OpenAPI 权限模型，需向易飞厂商报备 | 待确认 |
| — | analysis 层数据一致性：OpenAPI 枚举回传 `编码.中文`，SQL 得原始值，口径不同 | 需标注 |


---

## 六、与既有文档的关系

| 文档 | 关系 |
|---|---|
| `docs/plans/yf-db-direct-connect-probe.md` | 架构对比与数据库直连实测（B1 的证据来源） |
| `docs/TODO-PLAN.md` T-13/T-14 | analysis 层与视图 DDL 开发任务 |
| YZCLI `docs/`（易助侧） | 待补：共享包拆分后的迁移说明 |