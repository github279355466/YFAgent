# 16 类资料覆盖度台账 + 缺口清单

> **制定日期**：2026-10-09
> **归属阶段**：MVP P0 · 前置条件盘点
> **上游依据**：`docs/plans/yf-materials-collection-checklist.md`（16 类资料 / P0-P2 分级）· `docs/plans/yf-materials-tasks.md`（T-01~T-18 任务化）· `knowledge/` 目录实测
> **维护规则**：每类资料标注当前状态、负责人、产出物路径、验收判据；「易助有但易飞无」缺口单列成表
> **数字口径规则**：所有规模数字均带 `[口径：…]` 标签

---

## 一、16 类资料覆盖度总览

| # | 类别 | 优先级 | 状态 | 负责人 | 产出物路径 | 验收判据 | 阻塞阶段 |
|---|---|---|---|---|---|---|---|
| 1 | TypeKey 与服务清单 | P0 | ✅已有 | 开发（脚本） | `knowledge/typekey/typekey_map.yaml` | 601 服务名 / 107 对象（含 OAPMA 补充） / 8 操作全覆盖 `[口径：scripts/extract-typekey-map.mjs 机械抽取]` | — |
| 2 | 字段与单据模型 | P0 | ⚠️部分 | 开发（脚本） | `knowledge/typekey-mapping/*.md` | 106 个对象字段明细已抽取（12,893 字段）`[口径：_index.json 统计]`；大写物理字段名仅 0.3% 覆盖 | Phase 1 |
| 3 | 认证与 Token 配置 | P0 | ✅已有 | 架构 | `docs/plans/yf-openapi-rules.md` §3 | Header 四头已确认一致（digi-service/user-token/datakey/Content-Type） | — |
| 4 | 真机验证环境 | P0 | ✅已有 | 测试 | 内网 `{IP}` 环境 | 可连通 + 可只读查询；50 张凭证账套已验证 `[口径：2026-10-08 真机探测]` | — |
| 5 | 业务域清单与菜单树 | P0 | ❌缺失 | 产品/实施 | `knowledge/official/menu-tree/`（待建） | 11 个业务域定义 + 菜单层级结构；助手路由触发词可据此设计 | Phase 1 |
| 6 | AI 分析端点清单 | P0 | ❌缺失 | 易飞服务端 | `knowledge/official/ai-endpoints/`（待建） | 22 个 `yf.ai.*` 端点的 service 名 + 入参 + 出参定义；当前仅确认 2 个 `[口径：yf.ai.PurchaseBusinessWarning + yf.ai.SalesbusinessWarning]` | Phase 2 |
| 7 | 业务流程与审批规则 | P1 | ❌缺失 | 实施顾问 | `knowledge/official/workflows/`（待建） | 8 种操作的审批约束 + 状态机图；助手 `_workflow.md` 的业务规则来源 | Phase 2 |
| 8 | 数据库表结构 | P1 | ✅已有 | DBA/脚本 | `knowledge/data-dictionary/` + `knowledge/表结构信息/` | 72 个 SDD 文件 + field-index.csv（4.8 MB）+ table-index.csv（223 KB）`[口径：Get-ChildItem 实测]` | — |
| 9 | 枚举与常量字典 | P1 | ⚠️部分 | 开发 | `knowledge/data-dictionary/format-mask-map.csv` | 格式掩码映射已有（143 KB）`[口径：文件大小]`；完整枚举字典（981 个掩码字段）需大数据量账套导出 | Phase 2 |
| 10 | 术语表 | P1 | ❌缺失 | 产品 | `knowledge/glossary/`（待建） | 核心名词 + 易助对照表；消除跨产品线串味 | Phase 2 |
| 11 | 错误码与处置话术 | P1 | ⚠️部分 | 开发 | `docs/plans/yf-openapi-rules.md` §11 | 双结构解析规则已定义；完整错误码 → 处置话术映射表待补 | Phase 2 |
| 12 | 自定义字段实际配置 | P1 | ❌缺失 | 实施/客户 | `knowledge/official/udf-config/`（待建） | udf01~udf12 / udf51~udf62 的客户现场实际用途映射 | Phase 3 |
| 13 | 权限与角色 | P2 | ❌缺失 | 易飞官方 | `knowledge/official/permissions/`（待建） | RBAC 角色定义 + 权限矩阵；Gateway 策略依据 | Phase 3 |
| 14 | 常见问题与话术 | P2 | ❌缺失 | 产品 | `knowledge/faq/faq.md`（待建） | 按域分节的 FAQ；助手「能力边界」章节来源 | Phase 3 |
| 15 | 性能与容量基线 | P2 | ❌缺失 | 测试 | `docs/guides/OPERATIONS-性能基线.md`（待建） | page_size 上限标定 + 慢查询分布 + 并发承载实测数据 | Phase 3 |
| 16 | 版本兼容实测 | P2 | ⏸延期 | 测试 | `docs/decisions/ADR-E10-版本兼容策略.md`（待建） | 9.0.12/9.1/9.2 三版本接口差异报告；需先确认客户版本 | Phase 3 |

**统计**：✅已有 4 ｜ ⚠️部分 3 ｜ ❌缺失 8 ｜ ⏸延期 1 `[口径：上表 16 行状态列计数]`

---

## 二、P0 类别详表（5 类，阻塞一期最小可跑链路）

### 2.1 ✅ TypeKey 与服务清单

| 项 | 内容 |
|---|---|
| **编号** | M-01 |
| **当前状态** | ✅已有 |
| **负责人** | 开发（脚本自动产出） |
| **产出物路径** | `knowledge/typekey/typekey_map.yaml`（80 KB）· `knowledge/typekey/_report.json`（5.7 KB） |
| **验收判据** | ① 601 服务名 / 107 对象（含 OAPMA 补充） / 8 操作全覆盖；② 101/106 主键已确定；③ `npm run check:all` 通过 |
| **已知局限** | 5 个对象主键未知（`primary_key_unknown: true`），需真机探测补齐（并入 T-05） |
| **关联任务** | T-01（已完成） |

### 2.2 ⚠️ 字段与单据模型

| 项 | 内容 |
|---|---|
| **编号** | M-02 |
| **当前状态** | ⚠️部分（中文名字段已抽取，大写物理字段名仅 0.3%） |
| **负责人** | 开发（脚本） |
| **产出物路径** | `knowledge/typekey-mapping/*.md`（106 份 / 1.8 MB / 12,893 字段）· `knowledge/typekey-mapping/_index.json`（34.5 KB） |
| **验收判据** | ① 106 个对象全覆盖；② title 非中文 0/106；③ 单身节点名归一 175/175；④ 只读对象 28 个已标注 |
| **已知局限** | 大写物理字段名覆盖仅 0.3%（易飞文档基本不给，非抽取缺陷）；Analysis 层需要物理字段名写视图 DDL，需从 `knowledge/data-dictionary/field-index.csv` 交叉补全 |
| **关联任务** | T-02（已完成）+ T-06（字段补全，待启动） |

### 2.3 ✅ 认证与 Token 配置

| 项 | 内容 |
|---|---|
| **编号** | M-03 |
| **当前状态** | ✅已有 |
| **负责人** | 架构 |
| **产出物路径** | `docs/plans/yf-openapi-rules.md` §3 · `docs/plans/dual-product-line-architecture.md` §3.4 |
| **验收判据** | Header 四头（digi-service / digi-user-token / digi-datakey / Content-Type）已确认真机可用；环境变量前缀 `YF_` 已定 |
| **关联任务** | T-03（已完成） |

### 2.4 ✅ 真机验证环境

| 项 | 内容 |
|---|---|
| **编号** | M-04 |
| **当前状态** | ✅已有（2026-10-08 真机探测完成） |
| **负责人** | 测试 |
| **产出物路径** | `docs/plans/yf-live-probe-report.md` · `runs/node-name-verify.json` |
| **验收判据** | ① 可连通 + 可只读查询；② 50 张凭证账套验证通过；③ 175 个 node_name 批量实测完成（110 可用 / 43 MA012 / 22 服务名拼接错误）`[口径：runs/node-name-verify.json 归一统计]` |
| **关联任务** | T-05（已完成）+ T-17（node_name 批量验证，已完成） |

### 2.5 ❌ 业务域清单与菜单树

| 项 | 内容 |
|---|---|
| **编号** | M-05 |
| **当前状态** | ❌缺失（部分草案存在于 `docs/plans/yfcli-product-line-extension-plan.md`） |
| **负责人** | 产品 / 实施顾问 |
| **产出物路径** | `knowledge/official/menu-tree/`（待建） |
| **验收判据** | ① 11 个业务域定义完整；② 菜单层级结构可从 E10 系统导出；③ 每个域至少有 3 个代表性 TypeKey 映射 |
| **收集方式** | E10 系统导出菜单树 + 实施顾问访谈确认业务域划分 |
| **关联任务** | T-10（待启动） |

### 2.6 ❌ AI 分析端点清单

| 项 | 内容 |
|---|---|
| **编号** | M-06 |
| **当前状态** | ❌缺失（仅确认 2/22 个端点）`[口径：yf.ai.PurchaseBusinessWarning + yf.ai.SalesbusinessWarning 已在 rbac.ts 中硬编码]` |
| **负责人** | 易飞服务端 / AI 团队 |
| **产出物路径** | `knowledge/official/ai-endpoints/`（待建） |
| **验收判据** | ① 22 个 `yf.ai.*` 端点的 service 名完整列出；② 每个端点有入参 / 出参定义；③ 端点归属确认（易飞服务端 vs 易助兼容层） |
| **降级方案** | 若 22 个端点清单不可得 → 改走 `query.get` 取数 → `yfcli-experts` 引擎本地计算 → 生成报告（详见外部依赖问询函 §2） |
| **关联任务** | T-09（阻塞中） |

---

## 三、「易助有但易飞无」缺口清单

以下资料在 YZCLI（易助）工程中已有成熟产物，但在 YFAgent（易飞）工程中缺失或不可直接复用：

| # | 资料类别 | 易助现状 | 易飞现状 | 缺口性质 | 补齐方式 | 阻塞阶段 |
|---|---|---|---|---|---|---|
| G-01 | AI 分析端点清单 | 22 个 `yz.ai.*` 端点已上线 | 仅确认 2 个 `yf.ai.*` | **服务端未提供** | 向易飞服务端发问询函 | Phase 2 |
| G-02 | 枚举字典 enums.yaml | `knowledge/enums/enums.yaml` 完整 | 仅有 format-mask-map.csv（格式掩码） | **数据缺失** | 从大数据量账套导出 + 脚本抽取 | Phase 2 |
| G-03 | 术语表 glossary | `knowledge/glossary/` 已有 | 完全缺失 | **知识缺失** | 产品整理 + 易助对照 | Phase 2 |
| G-04 | 权限角色定义 | `knowledge/official/permissions/` 已有 | 完全缺失 | **官方未提供** | 向易飞官方发问询函 | Phase 3 |
| G-05 | 菜单树 / 业务域 | 已有完整菜单结构 | 部分草案 | **数据缺失** | E10 系统导出 + 实施顾问确认 | Phase 1 |
| G-06 | 9 个 vw_ai_* 只读视图 | `scripts/create-ai-views.sql` 已部署 | 仅有 4 个非 AI 视图（MoJu/VCMSMQZ/VCOPTH/VMOCTE） | **DDL 需重写** | 照易助模板改写为易飞表名（P4 地基） | Phase 4 |
| G-07 | 20 个 SQL 分析模板 | `templates.ts` 591 行 / 16 表 / 85 字段 | 完全缺失 | **代码需重写** | 从零重建，只查视图不查物理表 | Phase 4 |
| G-08 | erp-metadata.json | 245,455 行完整元数据 | 完全缺失 | **数据缺失** | 从 data-dictionary 重新抽取 | Phase 4 |
| G-09 | agent_typekey_map.yaml | 2,545 行 / 110 TypeKey | typekey_map.yaml 有 106 对象但格式不同 | **格式适配** | 写转换脚本对齐易助格式 | Phase 4 |
| G-10 | analysis-view.json | 15,445 行视图语义绑定 | 完全缺失 | **数据缺失** | 随视图 DDL 同步生成 | Phase 4 |

**统计**：共 10 项缺口 → 服务端未提供 1 ｜ 官方未提供 1 ｜ 数据缺失 4 ｜ DDL/代码需重写 2 ｜ 格式适配 1 ｜ 知识缺失 1 `[口径：上表缺口性质列计数]`

**唯一无降级项**：G-06（9 视图 DDL）—— 视图是 P4 地基，没有视图则 Analysis 层无法运行，**不可降级**。

---

## 四、覆盖度自检（一期验收标准）

| 检查项 | 目标 | 当前 | 差距 |
|---|---|---|---|
| TypeKey 覆盖 | 107 个业务对象全部有 service 定义 | ✅ 100%（601 服务名，含 OAPMA 补充 6 个）`[口径：typekey_map.yaml]` | 无 |
| 操作矩阵 | 8 种操作映射完整 | ✅ 100% | 无 |
| 业务主键 | 106 个对象全部确定 | ⚠️ 101/106 `[口径：primary_key_unknown 标记]` | 5 个待真机探测 |
| 中文字段名 | 106 个对象全覆盖 | ✅ 100%（12,893 字段）`[口径：_index.json]` | 大写物理字段名仅 0.3% |
| 单身节点 | 各对象 *_data 节点 | ✅ 175/175 已归一 `[口径：T-02 结果]` | 43 个 MA012 未注册 |
| 枚举字典 | 主要业务枚举 | ⚠️ 仅格式掩码（143 KB）`[口径：format-mask-map.csv]` | 完整枚举待补 |
| AI 端点 | 22 个助手 service 定义 | ❌ 2/22 `[口径：rbac.ts 硬编码计数]` | 20 个待易飞服务端提供 |
| 菜单树/业务域 | 11 个域 | ❌ 缺失 | 待 E10 导出 |
| 术语表 | 核心名词 + 易助对照 | ❌ 缺失 | 待产品整理 |
| 审批规则 | 8 种操作的审批约束 | ❌ 缺失 | 待实施顾问提供 |
| 真机环境 | 可连通 + 可只读 | ✅ 已就绪 | 无 |
| 9 视图 DDL | 幂等脚本 | ❌ 缺失 | P4 地基，不可降级 |

**一期放行条件**：TypeKey 100% + 主键 106/106 + 菜单树 + AI 端点清单（或确认走降级方案）+ 真机环境就绪 + 9 视图 DDL 完成。

---

## 五、与资料收集任务清单的映射

| 资料编号 | 对应任务 | 任务状态 | 备注 |
|---|---|---|---|
| M-01 | T-01 | ✅ 已完成 | — |
| M-02 | T-02 + T-06 | ✅/⏸ | T-02 已完成，T-06 字段补全待启动 |
| M-03 | T-03 | ✅ 已完成 | — |
| M-04 | T-05 + T-17 | ✅ 已完成 | — |
| M-05 | T-10 | ⏸ 待启动 | 需 E10 系统导出 |
| M-06 | T-09 | 🔒 阻塞 | 需易飞服务端提供 |
| M-07 | T-08 | ⏸ 待启动 | 需实施顾问 |
| M-08 | T-11 | ⏸ 待启动 | data-dictionary 已有基础 |
| M-09 | T-07 | ⚠️ 部分 | format-mask-map 已有 |
| M-10 | T-12 | ⏸ 待启动 | — |
| M-11 | T-14 | ⏸ 待启动 | — |
| M-12 | T-15 | ⏸ 待启动 | 需客户现场 |
| M-13 | T-16 | ⏸ 待启动 | 需易飞官方 |
| M-14 | T-18 | ⏸ 待启动 | — |
| M-15 | — | ⏸ 待启动 | Phase 1 早期粗测 |
| M-16 | OPEN-D2 | ⏸ DEFERRED | 需先确认客户版本 |