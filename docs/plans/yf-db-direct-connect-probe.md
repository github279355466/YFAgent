# 架构对比与数据库直连可行性（2026-10-09 实测）

> 目的：裁决 YFAgent 是否与 YZCLI 采用同一架构，并确认数据库直连可行性。
> 结论：**是**。CRUD 走 OpenAPI + 分析走数据库直连的双通道，两条产品线一致。

---

## 一、架构对比

| 维度 | YZCLI（易助，已落地） | YFAgent（易飞，建设中） | 一致？ |
|---|---|---|---|
| CRUD 增删改查 | `yzcli-sdk/src/client.ts` → ERP OpenAPI → `localhost:8103` | `packages/yfcli-sdk/src/client/`（9 模块，未接真机） | ✅一致 |
| 分析聚合内核 | `packages/yzcli-analysis/`（11 子模块） | **不存在** | ❌ **缺失** |
| 分析数据通道 | SQL 直连 + 9 个只读 View `vw_ai_*` | 无 | ❌ 缺失 |
| SQL 模板制| 20 个模板，注册制 + 白名单 + 参数绑定 | 无 | ❌ 缺失 |
| 字段元数据来源 | 直查数据库 | 离线 CSV（54842 行） | ⚠️ 替代方案 |
| 凭据管理 | `config.ts` 3 条红线（密码只从环境变量取、limits 必填、配置不入库） | 无 | ❌ 缺失 |
| 网关层 | `yzcli-gateway` :3000（JWT/RBAC/限流/审计） | 无（规划中） | ❌ 缺失 |

**唯一结构性差异**：YFAgent 缺 analysis 层，导致字段元数据改用离线 CSV 预抽。

---

## 二、数据库直连实测

**环境**：`{内网IP}:1433` / `{CompanyId}` / 账号 `ai` / SQL Server 2014 (SP2) 12.0.5000.0 (X64)

### 2.1 连通性

```
[OK] 连接成功
[版本] Microsoft SQL Server 2014 (SP2) (KB3171021) - 12.0.5000.0 (X64)
[当前] {"db":"{CompanyId}","login":"ai"}
```

### 2.2 对象分布

| 类型 | 数量 |
|---|---|
| USER_TABLE | 1210 |
| PRIMARY_KEY_CONSTRAINT | 1135 |
| DEFAULT_CONSTRAINT | 35667 |
| VIEW | **4**（`MoJu` / `VCMSMQZ` / `VCOPTH` / `VMOCTE`） |
| schema | 仅 `dbo` |

**结论：易飞无 `vw_ai_*` 分析视图**，需照易助视图定义改写后由客户 DBA 手动执行。

### 2.3 库表名与字典表名 100% 一致

3 位前缀交叉比对：**52 组一致 / 0 组不同**。

```
库表名样例   : ACMLC, ACMMA, ACMMD, ACMMJ, ACMML, ACMMM, ACMMN, ACMMO
字典表名样例 : ACMLC, ACMMA, ACMMD, ACMMJ, ACMML, ACMMM, ACMMN, ACMMO
```

前缀频次（Top10）：`COP=73 PAL=69 CMS=52 INV=52 ASM=48 HRS=43 ACT=41 EQT=39 BOM=35 MOC=35`

**结论：无需映射层**，字典可直接与库表对照。

差集（非同名部分）：

| 方向 | 3 位前缀 | 数量 |
|---|---|---|
| 库有字典无 | ALS AWB GTI LSM OAP OAS PDA Sal Tem dtp | 10 |
| 字典有库无 | DSC DXL EFJ GHX IWC JCX JHX LLJ LLX MTF PDX PMS RPT SCX TBX THX TLX TRA UPD V_Q WAR WTX WWX XHJ XHX | 25 |

> 字典多出的 25 个前缀多为 `XXY` 三段式衍生名（如 `DXL`/`DSC`），库内以 4~5 字符形态存在（如 `ACMMO`），需在 D-14 视图阶段逐一确认对应关系。

### 2.4 字段元数据可直查

`ADMME` 共 41 列，`INFORMATION_SCHEMA.COLUMNS` 可直查：

```
COMPANY char / CREATOR char / USR_GROUP char / CREATE_DATE char
MODIFIER char / MODI_DATE char / FLAG numeric
ME001~ME010 + UDF01~UDF62
```

**印证既有结论**：7 个管理字段（COMPANY/CREATOR/USR_GROUP/CREATE_DATE/MODIFIER/MODI_DATE/FLAG）在物理表中存在，但 OpenAPI 不暴露 —— 即「管理字段是网关注入」。

### 2.5 COMPANY 字段裁决

`COMPANY` 为**预留管理字段，无业务含义**。易飞架构为「独立公司账套」，不存在一表多账套。

**裁决：视图不带 `COMPANY` 过滤。**

> 探针曾发现 `ACMLC` 表内 COMPANY 有 3 个取值（`{CompanyId}`/92/91），经用户确认为预留字段的历史遗留值，不构成账套隔离依据。

---

## 三、影响与后续

### 3.1 D-01 降级

CSV 字典定位从「运行时唯一数据源」降为「离线缓存快照」。库内元数据是权威源，缓存可随时重生成，**不再阻塞 SDK 开发** → D-01 从 P0 降为 P2。

保留价值：① 防重生成口径漂移；② `node-table-map.csv` / `ER-relations.csv` 当前不在自报口径内，属无主产物。

### 3.2 新增任务

| ID | 任务 | 工作量 |
|---|---|---|
| **D-13** | 建易飞 analysis 层（照 YZCLI 双通道） | L（3~5 天） |
| **D-14** | 视图建库脚本（易飞版 DDL，客户 DBA 执行） | M（1~2 天） |

### 3.3 analysis 层实现要点（照 YZCLI 抄）

| 要点 | YZCLI 参考实现 |
|---|---|
| 四层防护 | `yzcli-analysis/src/runtime/sql/executor.ts` L2 |
| 驱动注入 | `SqlDriver` 接口由调用方注入，analysis 零第三方依赖 |
| 模板注册制 | 仅 `allowed_templates` 白名单内模板可执行 |
| 参数绑定 | 占位符 `:name` → 驱动 `@name`，**禁止内联拼接** |
| 行数双保险 | SQL 内 `TOP(:max_rows)` + 执行器再截断 |
| 凭据红线 | 密码只从环境变量取，配置文件不入库 |

---

## 四、探针产出物（可重跑）

| 文件 | 用途 |
|---|---|
| `.workbuddy/tmp/yf_probe.js` | 8 项只读探针（视图/前缀/字段/主键/schema 等） |
| `.workbuddy/tmp/yf_company_probe.js` | COMPANY 取值分布与多库验证 |
| `.workbuddy/tmp/yf_db_tables.json` | 1211 张表全名，供离线 diff |
| `.workbuddy/tmp/diff_tables.py` | 库表名 vs 字典表名 diff 脚本 |

> 全部为只读探针，未对数据库做任何写操作。依赖 YZCLI 的 `mssql` 包（`NODE_PATH` 指向其 `node_modules`）。