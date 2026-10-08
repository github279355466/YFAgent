# 资料收集任务清单（Phase 0 任务化）

> 制定日期：2026-10-08
> 上游文档：`yf-materials-collection-checklist.md`（16 类资料 / P0-P2 分级）
> 覆盖基准：`knowledge/typekey/typekey_map.yaml`（**106 个业务对象 / 595 个服务名**）
> 本文件是**可执行任务**，清单是**资料目录**；两者一一映射，任务号 `T-xx` 供后续 Open 项台账引用

---

## 任务总览

| 状态 | 数量 | 说明 |
|---|---|---|
| ✅ 已完成 | 5 | T-01~T-04 + T-07（部分）由脚本自动完成 |
| ✅ 已完成 | 1 | **T-05**（真机环境，2026-10-08） |
| ⏸ 待启动 | 6 | 需外部资源或Phase 1/2 触发 |
| 🔒 阻塞 | 3 | T-05 / T-09 / T-11 需外部推动 |
| **合计** | **15** | — |

**关键路径**：T-05（真机环境）→ T-13（联调）→ Phase 1 放行。T-05 是唯一的硬阻塞。

---

## 一、已完成（脚本自动产出）

### T-01 ｜TypeKey 与服务清单 ✅

| 项 | 内容 |
|---|---|
| **资料内容** | 业务对象清单、服务名、8 种操作映射、复合主键、单身节点名 |
| **来源渠道** | ✅ Apipost 项目 `322f10` 导出（已获取，不入库） |
| **负责角色** | 开发（脚本） |
| **优先级** | P0 |
| **完成时间** | 2026-10-08 |
| **交付物** | `knowledge/typekey/typekey_map.yaml`（80 KB）<br>`knowledge/typekey/_report.json`（5.7 KB） |
| **存放路径** | `knowledge/typekey/` |
| **结果** | 595 服务名 / 106 对象 / 101 主键 / 0 命名不规则 |
| **后续** | 5 个对象主键待真机探测（并入 T-05） |

---

### T-02 ｜字段与单据模型（中文名 + 类型 + 可写性）✅

| 项 | 内容 |
|---|---|
| **资料内容** | 单头/单身分层、节点名、中文名、类型、必填三态、复合主键标注 |
| **来源渠道** | ✅ 同 T-01（Apipost 导出内含 `raw_parameter` 元信息） |
| **负责角色** | 开发（脚本） |
| **优先级** | P0 |
| **完成时间** | 2026-10-08 |
| **交付物** | `knowledge/typekey-mapping/*.md`（106 份 / 1.8 MB / 12,893 字段）<br>`knowledge/typekey-mapping/_index.json`（34.5 KB） |
| **存放路径** | `knowledge/typekey-mapping/` |
| **结果** | title 非中文 0/106；单身节点名归一 175/175；只读对象 28 个已标注 |
| **已知局限** | 大写物理字段名覆盖仅 0.3%（易飞文档基本不给，非抽取缺陷） |

---

### T-03 ｜接口范式与请求/响应结构 ✅

| 项 | 内容 |
|---|---|
| **资料内容** | 公共头4 项、`std_data` 封包、`execution.code` 判据、`result.success`/`error` 双通道、查询 13 类条件范例、8 种操作约束 |
| **来源渠道** | ✅ Apipost 导出中的 4 份规范文档（通则 / 查询服务 / 管理字段说明 / 更新说明） |
| **负责角色** | 开发（提取）+ 产品（复核） |
| **优先级** | P0 |
| **完成时间** | 2026-10-08 |
| **交付物** | `docs/plans/yf-openapi-rules.md`（441 行） |
| **存放路径** | `docs/plans/` |
| **结果** | 含 10 项「文档未说明」明确标注 |

---

### T-04 ｜易飞 vs 易助差异比对 ✅

| 项 | 内容 |
|---|---|
| **资料内容** | 31 维度对照（请求方式/URL/鉴权/参数/返回/分页/错误码/命名风格等） |
| **来源渠道** | ✅ 易飞 Apipost + 易助 `knowledge/易助OpenAPI使用说明/` |
| **负责角色** | 架构 |
| **优先级** | P0 |
| **完成时间** | 2026-10-08 |
| **交付物** | `docs/plans/yf-vs-yizhu-openapi-diff.md`<br>`docs/plans/yf-openapi-integration-recommendations.md` |
| **存放路径** | `docs/plans/` |
| **结果** | 识别 5 个高风险差异；2 条误判已修正（Token / AI 端点） |

---

### T-07 ｜枚举与常量字典 🟡（部分完成）

| 项 | 内容 |
|---|---|
| **资料内容** | 单据类型、来源代码、币种、税率、库存状态、审核状态等枚举值 |
| **来源渠道** | 🟡 部分可从 Apipost `description` 抽取；完整版需 E10 系统导出 |
| **负责角色** | 开发（抽取） |
| **优先级** | P1 |
| **完成时间** | 脚本 2026-10-08；完整版待 T-05 环境就绪后补 |
| **交付物** | 待产出 `knowledge/enums/enums.yaml` |
| **存放路径** | `knowledge/enums/` |
| **已得线索** | `pricing_order`（1~I 档折扣定价）、`invoice_type: A`、`taxed_code: 1`、`receive_method: 3` |
| **风险** | ⚠️ 易助 `templates.ts` 注释明确「单据来源代码（权威来源 `match.ini` [Source]）：33=销货单 / 82=领料」—— **易飞若无对应字典，analysis 的 20 个 SQL 模板全错**。这是 T-07 必须做实的原因 |

---

## 二、进行中

### T-06 ｜业务域菜单树与功能树 🔄

| 项 | 内容 |
|---|---|
| **资料内容** | ① 完整菜单树（**Apipost 目录 ≠ 系统菜单**）；② 106 对象的业务域归属；③ 常用业务术语 |
| **来源渠道** | E10 系统导出 / 官方手册截图 / 实施顾问访谈 |
| **负责角色** | **产品**（主责）+ 实施顾问（配合） |
| **优先级** | **P0**（阻塞助手路由触发词设计） |
| **预计完成** | Phase 1 期间（与 T-05 并行） |
| **交付物** | `knowledge/official/menus/menu-tree.md`（人读）<br>`knowledge/official/menus/menu-tree.csv`（机读，供触发词生成） |
| **存放路径** | `knowledge/official/menus/` |
| **已有线索** | 106 对象的首段聚合（采购 12/ 委外 10 / 品号 8 / 工单 7 / 销售 6 / 财务 5 / 应收预收 4 / 质量 3 / 基础资料约 20）；Apipost 目录名含 `COPI01-客户信息` / `PURI05-请购单` / `MOCI02-工单` / `QMSI07-进货检验单` 等编号+中文名 |
| **验收标准** | ① 11 个业务域边界清晰；② 每个 type_key 有域归属；③ 每个域有中文业务名（非目录名噪声） |
| **风险** | 🔴 无菜单树则 22 个助手的触发词只能靠猜，`SKILL.md` 路由表质量无法保证 |

---

## 三、待启动（Phase 1/2 触发）

### T-08 ｜业务流程与审批规则 SDD ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | ① 各域单据流转链（如采购：requisitions → approve.price → order → arrival → inspection → receipt → invoice）；② 审批节点、条件、金额阈值；③ 审核码规则（对应 `approve`/`disapprove`/`invalid`）；④ 月结流程 |
| **来源渠道** | E10 作业规格（SDD）/ 业务流程文档 / 实施访谈 |
| **负责角色** | **实施顾问**（主责）+ 产品（结构化） |
| **优先级** | P1（阻塞助手 `_workflow.md`） |
| **预计完成** | Phase 2 |
| **交付物** | `docs/YFAgent/{NN}/_workflow.md`（助手工作流）<br>`knowledge/official/approval-rules/*.md`（审批规则原文） |
| **存放路径** | `docs/YFAgent/` + `knowledge/official/approval-rules/` |
| **可复用资产** | 易助 `knowledge/ai-assistants/`（388 文件设计工作台）可作模板骨架 |
| **风险** | 🟠 审批规则缺失会导致「approve 能否执行」判断靠试|

---

### T-10 ｜性能与容量基线 ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | ① `page_size: 10000` 响应时间；② 并发承载；③ 慢查询分布；④ 官方是否有限制（文档未说明） |
| **来源渠道** | **自己做**（需 T-05 真机环境） |
| **负责角色** | 开发 + 测试 |
| **优先级** | P2（但**建议 Phase 1 早期粗测一次**） |
| **预计完成** | Phase 1（粗测）+ Phase 2（压测） |
| **交付物** | `docs/guides/OPERATIONS-性能基线.md` |
| **存放路径** | `docs/guides/` |
| **背景** | ⚠️ **易飞无 `fastquery`**，所有查询重查数据库 —— 与易助性能天差地别。直接决定 `page_size` 默认值与缓存策略 |
| **原编号** | B2 |

---

### T-12 ｜erp-core 本地依赖联通 ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | 在 Phase 1 期间用本地相对路径依赖（`file:../erp-core/packages/*`）跑通联调 |
| **来源渠道** | 自建（`erp-core` 仓尚未创建） |
| **负责角色** | 架构 |
| **优先级** | P0（Phase 1 阻塞） |
| **预计完成** | Phase 1 早期 |
| **交付物** | `packages/yfcli-*/package.json` 中的依赖声明 + 联调通过的验证记录 |
| **存放路径** | `packages/*/package.json` |
| **暂定方案** | npm workspaces + 相对路径；切换成本低（改一处 `package.json`） |
| **原编号** | OPEN-B1 拆出 |

---

### T-13 ｜erp-core 正式发布方式裁决 ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | npm 私有 registry / 独立仓 submodule / monorepo 联合 —— 三选一 |
| **来源渠道** | 自建决策 |
| **负责角色** | **架构 + 项目总监** |
| **优先级** | P2 |
| **预计完成** | Phase 3 |
| **交付物** | `docs/decisions/ADR-00X-共享包发布方式.md` |
| **存放路径** | `docs/decisions/` |
| **前置** | T-12 跑通后再定（避免过早决策） |
| **原编号** | OPEN-B1 拆出 |

---

### T-14 ｜`.trellis/spec/` 编码规范补齐 ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | 为 `yfcli-sdk` / `yfcli-mcp` / `yfcli-cli` 三包补编码规范（目录分层、错误处理、类型安全等） |
| **来源渠道** | 自建（对齐易助 `.trellis/spec/` 格式） |
| **负责角色** | 架构 |
| **优先级** | P2 |
| **预计完成** | Phase 1 代码落地后 |
| **交付物** | `.trellis/spec/yfcli-{sdk,mcp,cli}/` |
| **存放路径** | `.trellis/spec/` |
| **注意** | ⚠️ 易助教训：11 包仅 4 包有 spec，且 `.trellis/config.yaml` 的 `packages` 段需与实际包同步，否则新包不被覆盖 |
| **原编号** | OPEN-B2 拆出 |

---

### T-15 ｜Skill 拆分必要性评估 ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | 评估 YFCLI 是否需沿用「一专家多 Skill」拆分；先看 `SKILL.md` 实际体积 |
| **来源渠道** | 自建评估 |
| **负责角色** | **项目总监** |
| **优先级** | P2 |
| **预计完成** | Phase 2（助手扩到 22+ 时） |
| **交付物** | `docs/decisions/ADR-00X-Skill拆分决策.md` |
| **存放路径** | `docs/decisions/` |
| **裁定时须参考** | ① 易助 2026-09-24 决策（不拆分）的实测依据：zip仅占上限 4.9%，`yzagent/` 按需读取不占常驻上下文；② 易助 `09-28-skill-layered-split-prd`（拆分）的设计；③ YFCLI 命名规范 `{产品线}-{模块}-{动作}` |
| **触发条件** | `SKILL.md` 体积超平台预警线（如 EIOSpace 16 KB）时立即启动 |
| **原编号** | OPEN-B3 拆出 |

---

### T-17 ｜`*_data` 逻辑节点名 → 物理表名映射 🔴 **Phase 1 新增必做**

| 项 | 内容 |
|---|---|
| **来源** | 真机探测（2026-10-08，OPEN-E2） |
| **负责角色** | 开发 |
| **优先级** | 🔴 **P0**（阻塞所有单身字段条件查询） |
| **预计完成** | Phase 1 早期 |
| **问题** | 文档称 `node_name: "sales_order_detail_data"`，实测**不接受**；真机期望**物理表名**（如 `ACTTA`） |
| **交付物** | `knowledge/typekey-mapping/node-map.yaml`（逻辑节点名 → 物理表名）+ 校验脚本 |
| **采集方法** | 故意传错 `node_name`，从错误消息反推期望值 —— 真机错误消息直接给出物理表名（如「找不到資料表:[ACTTA]」） |
| **规模** | 175 个 `*_data` 节点名（来自各对照表的 `detail_nodes`） |
| **验收** | 随机抽 10 个单身字段查询，返回行数与不加条件时一致 |
| **风险** | 无此映射则**所有单身字段条件查询不可用** |
| **注** | 原 OPEN-E2 的落地载体。**编号 T-17**（T-16 已被「三版本兼容实测」占用） |
### T-16 ｜三版本兼容实测 ⏸

| 项 | 内容 |
|---|---|
| **资料内容** | ① 9.0.12 / 9.1 / 9.2 三版本接口差异；② `typekey_map.yaml` 是否跨版本通用；③ 客户实际用哪个版本 |
| **来源渠道** | 客户环境 + 官方文档 |
| **负责角色** | 开发 + 项目组 |
| **优先级** | P2 |
| **预计完成** | 客户版本确认后 |
| **交付物** | `docs/decisions/ADR-00X-版本兼容策略.md` |
| **存放路径** | `docs/decisions/` |
| **前置** | ⏸ 需先确认客户版本（OPEN-C2 解冻条件） |
| **当前策略** | **单版本优先**，不做多版本兼容层 |

---

## 四、阻塞项（需外部推动）

### T-05 ｜真机验证环境 ✅ **已完成**（2026-10-08）

| 项 | 内容 |
|---|---|
| **环境** | `http://172.16.2.86/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost`（易飞 9.0 测试账套） |
| **账套** | 已获取（CompanyId 走环境变量，不入库） |
| **令牌** | 已获取（走环境变量，不入库） |
| **连通性** | ✅ 内网直连可用，ping 30~32ms，**不走代理** |
| **鉴权** | ✅ `code=0` 查詢成功 |
| **探测结论** | ✅ **15/15 用例 PASS**，另做 4 组深度验证 |
| **交付物** | `scripts/probe-live-env.mjs`（可复现，只读）<br>`docs/plans/yf-live-probe-report.md`（完整报告）<br>`runs/probe-live-env-report.md`（运行产物，gitignore） |
| **连带完成** | 4 个公共头逐个验证（含易飞独有的 `digi-datakey`）；复合主键 `doc_type_no + doc_no` 确认；`selectedColumns` 确认 |
| **⚠️ 遗留** | ① 5 个未知主键未探（本账套可能无对应数据）② 写操作未测（仅只读）③ `*_data` → 物理表映射未建（转 T-17） |
### T-09 ｜22 个 `yf.ai.*` 分析端点清单 🔒

| 项 | 内容 |
|---|---|
| **资料内容** | ① 22 个端点的服务名；② 各端点入参；③ 各端点出参；④ 是否需独立权限 |
| **来源渠道** | **易飞服务端 / AI 团队**（对外问询函） |
| **负责角色** | **产品经理**（主责，问询函起草 + 跟进） |
| **优先级** | P0（决定 22 个助手是直调复刻还是改走引擎计算） |
| **预计完成** | Phase 2 |
| **交付物** | `knowledge/official/ai-endpoints/ai-endpoints.yaml`（结构对齐易助 `_routes.yaml`） |
| **存放路径** | `knowledge/official/ai-endpoints/` |
| **已确证** | ✅ `yf.ai.PurchaseBusinessWarning`（助手 06）、`yf.ai.SalesbusinessWarning`（助手 17）—— 易助侧现役运行 |
| **待补** | 其余 20 个 |
| **已知易助对照** | `yz.ai.*` 8 个（02/03/04/05/07/10/12/13/14）；`yz.oapi.*` 5 个（08/09/11/15/16）；裸typekey 5 个（18~22）；MCP 工具 2 个（23/99） |
| **顺带确认** | TypeKeyList / help 类元数据服务是否存在（OPEN-C1） |
| **降级预案** | 若清单无法获得 → 对应助手改走「`query.get` 取数 → `erp-experts` 引擎计算 → 本地生成报告」；成本可控（引擎已计划抽到 `erp-core`），但需重写该助手的 `_meta.json` 与 prompts |
| **原编号** | B6 |

---

### T-11 ｜官方文档缺陷核实 🔒

| 项 | 内容 |
|---|---|
| **资料内容** | 5 个对象的入参容器名与对象名无关（疑为官方文档复制粘贴错误） |
| **来源渠道** | 易飞官方文档维护方 / 服务端 |
| **负责角色** | 开发（发起）+ 产品（跟进） |
| **优先级** | P1（**真机调用前必须核实**，否则可能调用错误单据） |
| **预计完成** | Phase 1（T-05 环境就绪后立即验证） |
| **交付物** | 更新 `docs/plans/yf-openapi-rules.md` 的「已知文档缺陷」表 + 对照表的「⚠️ 文档异常」段 |
| **存放路径** | `docs/plans/` + `knowledge/typekey-mapping/*.md` |
| **受影响对象** | `ap.refund.doc`（应付退款单，入参写作 `wo_stockin_data` 生产入库单）、`op.stockin`、`prepayment.doc`、`transfer`、`wo.commence` |
| **原编号** | B10 |

---

## 五、优先级与时间线

```
Phase 0（本周）
  ✅ T-01 T-02 T-03 T-04完成
  🟡 T-06 进行中
  🔒 T-05 启动（需客户配合）← 关键路径
  🔒 T-09 发出问询函

Phase 1（最小可跑链路）
  T-05 真机验证 + 5 个主键探测
  T-06 菜单树交付
  T-11 文档缺陷核实（依赖 T-05）
  T-12 erp-core 本地依赖联通
  T-10 性能粗测
  → 交付：sdk + mcp + 3 助手（工厂查询/工厂读取/客户新增）

Phase 2（能力扩展）
  T-07 枚举字典完整版
  T-08 业务流程与审批规则
  T-09 AI 端点清单落地 → 22 助手
  T-10 压测
  → 交付：analysis 层 + 31 助手

Phase 3（商业化与治理）
  T-13 erp-core 发布方式
  T-14 .trellis/spec 补齐
  T-15 Skill 拆分评估
  T-16 版本兼容实测
  → 交付：双产品线 knowhow 分组 + L2 租户×产品线
```

---

## 六、交付物存放路径总表

| 路径 | 内容 | 入库 |
|---|---|---|
| `knowledge/typekey/` | TypeKey 映射表 | ✅ |
| `knowledge/typekey-mapping/` | 字段对照表 | ✅ |
| `knowledge/official/specs/` | 产品规格文档 | ✅ |
| `knowledge/official/sdd/` | 作业规格 | ✅ |
| `knowledge/official/menus/` | 菜单树（T-06） | ✅ |
| `knowledge/official/ai-endpoints/` | AI 端点清单（T-09） | ✅ |
| `knowledge/official/approval-rules/` | 审批规则（T-08） | ✅ |
| `knowledge/official/permissions/` | 权限与角色 | ✅ |
| `knowledge/official/_raw/` | 文档原件（xlsx/xml/zip/pdf） | ❌ **不入库** |
| `knowledge/enums/` | 枚举字典（T-07） | ✅ |
| `knowledge/glossary/` | 术语表 | ✅ |
| `knowledge/faq/` | 常见问题与话术 | ✅ |
| `config/*.example.yaml` | 配置模板 | ✅ |
| `config/*.local.yaml` | 实际配置（含 token） | ❌ **不入库** |

---

## 七、归档纪律（沿用既定规范）

| 规则 | 说明 |
|---|---|
| **原件保真** | 官方文档原样存放，不手工改写；结构化另存派生文件并标来源 |
| **编码先探测** | 中文Windows 文档可能 GBK/GB2312，转 UTF-8 前**先探测原编码**，禁止盲目覆写导致混合编码 |
| **行尾统一** | UTF-8 无 BOM + CRLF（不混用） |
| **写盘快照** | 批量改写前备份到 `.workbuddy/snapshots/` |
| **派生文件标溯源** | 脚本生成物须写明「由 XXX 脚本从 YYY 机械抽取生成，请勿手工编辑」 |
| **敏感信息隔离** | token、账套名（`CompanyId`）、内网 IP **一律不入库**；`npm run scan:secrets` 作门禁 |
| **大文件不入库** | xlsx / xml / zip / pdf 走 `knowledge/official/_raw/`（已 gitignore） |
