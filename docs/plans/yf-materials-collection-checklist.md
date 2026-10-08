# 易飞（YF / E10）资料收集清单 · 细化版

> 制定日期：2026-10-08
> 覆盖基准：`knowledge/typekey/typekey_map.yaml`（**106 个业务对象 / 595 个服务名**，由 `scripts/extract-typekey-map.mjs` 机械抽取）
> 关联：`docs/plans/yfcli-product-line-extension-plan.md` §5 · `docs/plans/yf-openapi-rules.md`
> 状态标记：`✅已有`（本仓已有，可直接消费）｜`🟡部分`（有但需加工）｜`🔴缺`（需收集）

---

## 0. 关键前提：已自动获得的部分

以下资料**已通过脚本从48 MB Apipost 导出中抽取完毕**，不需要人工收集：

| 已获得 | 覆盖 | 产物 |
|---|---|---|
| **服务名与操作矩阵** | 595 服务名 / 106 业务对象 / 8 种操作 | `knowledge/typekey/typekey_map.yaml` |
| **业务主键** | **101/106** 对象可自动抽取（78 个为复合主键） | 同上 `primary_key` 字段 |
| **单身节点名** | 各对象的 `*_data` 节点 | 同上 `detail_nodes` 字段 |
| **接口命名/请求体/响应体范式** | 全部 2120 节点 | 通则/查询服务等 4 份规范文档 |
| **查询条件 13 类范例** | 对象/数组/嵌套/组合/BETWEEN/IN/LIKE/EXISTS 等 | 查询服务文档 |

**因此资料收集的重心，从「接口清单」转为「业务语义与工程化」**——这是易飞侧真正缺的东西。

---

## 1. 优先级总览

| 级别 | 含义 | 类别数 | 阻塞阶段 |
|---|---|---|---|
| **P0** | 阻塞一期最小可跑链路 | 5 | Phase 0~1 |
| **P1** | 阻塞 analysis 层与助手扩展 | 6 | Phase 2 |
| **P2** | 增强项（商用品质/多客户） | 4 | Phase 3 |

| # | 类别 | 优先级 | 状态 | 一句话用途 |
|---|---|---|---|---|
| 1 | TypeKey 与服务清单 | P0 | ✅已有 | MCP 工具的数据基础 |
| 2 | 字段与单据模型 | P0 | 🟡部分 | 字段级校验、防幻觉 |
| 3 | 认证与Token 配置 | P0 | ✅已有 | Header 三头已确认一致 |
| 4 | 真机验证环境 | P0 | 🔴缺 | 契约自学习与实测 |
| 5 | 业务域清单与菜单树 | P0 | 🔴缺 | 助手路由触发词设计 |
| 6 | AI 分析端点清单 | P0 | 🔴缺 | **22 个分析助手的 service 定义** |
| 7 | 业务流程与审批规则 | P1 | 🔴缺 | 助手 `_workflow.md` 业务规则 |
| 8 | 数据库表结构 | P1 | 🔴缺 | analysis SQL 模板物理表依据 |
| 9 | 枚举与常量字典 | P1 | 🟡部分 | 防第1 类幻觉（编造枚举值） |
| 10 | 术语表 | P1 | 🔴缺 | 消除跨产品线串味 |
| 11 | 错误码与处置话术 | P1 | 🟡部分 | 错误处理与降级 |
| 12 | 自定义字段实际配置 | P1 | 🔴缺 | 客户现场差异 |
| 13 | 权限与角色 | P2 | 🔴缺 | Gateway RBAC 策略 |
| 14 | 常见问题与话术 | P2 | 🔴缺 | 助手「能力边界」章节 |
| 15 | 性能与容量基线 | P2 | 🔴缺 | 限流/退避策略标定 |
| 16 | 版本兼容实测 | P2 | 🔴缺 | 9.0.12/9.1/9.2 差异验证 |

---

## 2. P0 类别详表

### 2.1 ✅ TypeKey 与服务清单（已有）

| 项 | 内容 |
|---|---|
| **用途** | `yfcli_manifest` / `yzcli_route` 的数据基础；助手路由的服务绑定 |
| **来源** | ✅ 已抽取：`docs/易飞OpenAPI.json` → `knowledge/typekey/typekey_map.yaml` |
| **格式** | YAML，含 `type_key` / `title` / `aliases` / `services{8op}` / `operations` / `primary_key` / `detail_nodes` |
| **覆盖率** | 595 服务名 / 106 对象 / 8 操作 / 主键 101 个对象 |
| **待补** | ① 5 个对象主键未知（`primary_key_unknown: true`）需真机探测；② 各对象的**中文业务名**（当前 title 从目录名机械抽取，个别不准，如 `company.detail → 公司`） |

**5 个主键未知对象**（脚本标记 `primary_key_unknown`）：需Phase 1 真机探测补齐。

### 2.2 🟡 字段与单据模型（部分）

| 项 | 内容 |
|---|---|
| **用途** | ① `yfcli_help` 的字段明细来源；② `ConditionsTranslator` 判断哪些字段属单身（需 `node_name`）；③ 防幻觉第 1 类（禁止猜字段名） |
| **现状** | Apipost JSON 内**已含全部字段元信息**（`raw_parameter` 的 `key`/`description`/`field_type`/`not_null`），但**未抽取成独立产物** |
| **待做** | 写 `scripts/extract-field-metadata.mjs`，按对象抽取为 `knowledge/typekey-mapping/{type_key}.md`，格式对齐易助的 5 列表格 |
| **格式** | `| 字段编号 | 名称 | 节点名称 | 类型 | 备注 |`（沿用易助 `knowledge/json节点对照/` 格式，便于复用 `extract-analysis-metadata.mjs`） |
| **优先级依据** | P0 —— 因为易飞**无 help 服务**，字段明细只能靠静态产物，不能运行时查 |
| **来源渠道** | ✅ 已在 JSON 内（无需外部收集）；也可从 E10 系统导出规格文档交叉校验 |

**注**：易飞字段有「节点名（小写）」与「字段名（大写物理列名）」双轨，Apipost 文档已同时给出（如 `plant_no` ↔ `PLANT_NO`），抽取时两列都要留。

### 2.3 ✅ 认证与 Token 配置（已有结论）

| 项 | 内容 |
|---|---|
| **用途** | `yfcli-sdk` 的 Header 构造 |
| **结论** | ✅ **易飞与易助完全一致，实际落地只需在配置文件填 `digi-user-token`** |
| **依据** | 易飞公共头定义与易助 `client.ts:44-50` 逐字一致：`Content-Type` / `digi-service` / `digi-user-token` |
| **易飞独有** | 必填 `digi-datakey: {"CompanyId":"..."}` → 需在 `gateway.config.yaml` 增加 `company_id` 配置项 |
| **格式** | YAML 配置：`erp.base_url` / `erp.company_id` / `erp.token_map` |
| **易助 Token 获取方式** | （参考）ERP 作业「设置授权人员 TPASC19」—— **易飞侧不阻塞**，配置时由客户/实施提供 token 值即可 |

### 2.4 🔴 真机验证环境

| 项 | 内容 |
|---|---|
| **用途** | ① `learn-erp-contracts.mjs` 契约自学习；② 5 个未知主键探测；③ 3 个一期助手真机验证；④ 性能基线 |
| **必需内容** | 测试账套地址（`http://{IP}/YFOAP/...`）、只读账号、Token、`CompanyId`、可用业务对象清单、样本数据说明 |
| **注意** | URL **大小写敏感**（官方标注「注意大小写」），跨平台部署需确认 IIS 路由 |
| **格式** | `config/local.example.json` 入库（**仅占位**），实际值走环境变量或本地不入库文件 |
| **来源渠道** | 项目组/客户环境 |
| **优先级** | P0 —— 没有实测环境，`conditions` 转换层无法验收（静默失败风险） |

### 2.5 🔴 业务域清单与菜单树

| 项 | 内容 |
|---|---|
| **用途** | ① 助手路由**触发词/排除词**设计；② 业务模块地图（替代易助的 `yizhu-erp-ai-expert.md:39-50` 十域清单）；③ Skill 的意图分诊表 |
| **现状** | Apipost 目录名含 `COPI01-客户信息` / `PURI05-请购单` / `MOCI02-工单` / `QMSI07-进货检验单` 等**编号+中文名**，可作初始线索 |
| **待补** | ① **完整菜单树**（Apipost 目录 ≠ 系统菜单）；② 各对象的**业务域归属**；③ 常用业务术语 |
| **格式** | `knowledge/official/menus/menu-tree.md` + `menu-tree.csv`（便于机械处理） |
| **来源渠道** | E10 系统导出 / 官方手册截图 |
| **优先级** | P0 —— 没有菜单树，22 个助手的触发词只能靠猜 |

**已可用的域线索**（从 106 个 type_key 首段聚合）：

| 域 | 数量 | 典型 type_key |
|---|---|---|
| 采购 | 12 | `purchase.order` `purchase.receipt` `purchase.requisitions` `purchase.invoice` |
| 委外 | 10 | `outsourcing.purchase.*` `outsourcing.price` `outsourcing.approve.price` |
| 品号 | 8 | `item` `item.lot` `item.count` `item.classification` `item.customer.price` |
| 工单 | 7 | `wo` `wo.change` `wo.split` `wo.stockin` `wo.routing` `wo.commence` `work.report` |
| 销售 | 6 | `sales.order` `sales.order.change` `sales.forecast` `sales.invoice` `sales.return` `shipping.order` |
| 库存 | 2+ | `inventory.transaction` `transfer` `transfer.doc` `scrap.order` `destroy.order` `borrow.doc` |
| 财务 | 5 | `accounting.voucher` `account` `collection.doc` `payable.doc` `other.payable.doc` |
| 应收/预收 | 4 | `ar.refund.doc` `precollection.doc` `other.receivable` `expense.invoice` |
| 质量 | 3 | `inspection` `quality.control.category` `sampling.basis` `bad.cause` |
| 基础资料 | 约 20 | `plant` `warehouse` `customer` `supplier` `department` `employee` `currency` `unit` `project` `team.personnel` `calendar` `company.detail` |

### 2.6 🔴 AI 分析端点清单（**最关键缺口**）

| 项 | 内容 |
|---|---|
| **用途** | **22 个分析助手（02~23）的 `service` 定义** —— 与易助 22 个助手一一对应 |
| **已确认** | ✅ 易助侧正在使用 `yf.ai.PurchaseBusinessWarning`（助手06）/ `yf.ai.SalesbusinessWarning`（助手17），证明**易飞侧服务端直调模式已存在** |
| **待收集** | ① 22 个 `yf.ai.*` 端点的**完整清单**（服务名 + 入参 + 出参）；② 是否与易助的 `yz.ai.*` 端点同构；③ 端点是否需要独立 Token 或额外权限 |
| **格式** | `knowledge/official/ai-endpoints/ai-endpoints.yaml`（结构对齐易助 `_routes.yaml` 的 `assistants[]`） |
| **来源渠道** | 易飞服务端开发团队/AI 端点提供方（**这是易飞侧独有资产，易助侧文档里查不到**） |
| **优先级** | P0 —— 决定 22 个助手是「直调复刻」还是「改走 OpenAPI 取数」 |
| **若无法获得** | 降级方案：改走「`query.get` 取数 → `erp-experts` 引擎计算 → 本地生成报告」（详见 `yf-openapi-integration-recommendations.md` §3.3） |

**易助侧 22 个助手的 `service` 现状**（作为对照基准）：

| 路线 | 助手 | 服务名前缀 |
|---|---|---|
| `yz.ai.*` 私有端点 | 02,03,04,05,07,10,12,13,14 | 易助服务端 |
| `yf.ai.*` 私有端点 | **06, 17** | **易飞服务端** |
| `yz.oapi.*` 标准 OpenAPI | 08,09,11,15,16 | 易助标准 |
| 裸 typekey | 18,19,20,21,22 | 易助标准 |
| MCP 工具 | 23,99 | 分析内核 |

> 结论：**22 个助手里已有 2 个（06/17）是走易飞侧端点的**，这为「易飞同样有 22 个分析助手」提供了直接证据。

---

## 3. P1 类别详表

### 3.1 🔴 业务流程与审批规则

| 项 | 内容 |
|---|---|
| **用途** | 助手 `_workflow.md` 的业务规则；审批类操作（`approve`）的前置条件判断 |
| **内容** | ① 各域单据流转链（如采购：requisitions → approve.price → order → arrival → inspection → receipt → invoice）；② 审批节点、条件、金额阈值；③ 审核码规则（对应 `approve`/`disapprove`/`invalid`）；④ 月结流程 |
| **格式** | `docs/YFAgent/{NN}/_workflow.md` + `knowledge/official/approval-rules/*.md` |
| **来源渠道** | E10 作业规格（SDD）/ 业务流程文档 / 实施访谈 |
| **可复用资产** | 易助 `knowledge/ai-assistants/`（388 文件设计工作台）可作模板骨架 |

### 3.2 🔴 数据库表结构

| 项 | 内容 |
|---|---|
| **用途** | ① analysis 20个 SQL 模板的物理表依据；② 真机验证；③ 报表明细 |
| **现状** | Apipost 文档中**未包含表结构**（仅有节点名）；易助侧有 574 个 XML（`Tbschema/`） |
| **已知易飞物理表**（从错误消息推断） | `dbo.COPMA`（客户）、`INVMB`（品号）、`COPTC`/`COPTD`（销售订单单头/单身） |
| **待收集** | 全量表结构（表名 / 中文字段名 / 类型 / 长度 / 主外键 / 索引） |
| **格式** | `knowledge/tbschema/*.xml`（沿用易助 RowSet Schema 格式，便于复用抽取脚本） |
| **来源渠道** | E10 数据库导出 / 官方建表脚本 / 系统导出 |
| **优先级** | P1 —— 不阻塞 CRUD 验证，但阻塞 analysis 层 |

### 3.3 🟡 枚举与常量字典

| 项 | 内容 |
|---|---|
| **用途** | 防幻觉第1 类（编造枚举值） |
| **已可提取** | 部分枚举值散落在 `description` 中，如 `pricing_order` 的 `1.计价单价/2.标准售价/.../I.折扣后售价定价五`、`invoice_type: A`、`taxed_code: 1`、`receive_method: 3` |
| **待收集** | 完整枚举字典（单据类型、来源代码、币种、税率、库存状态、审核状态…） |
| **格式** | `knowledge/enums/enums.yaml`（**替代易助的 GBK `match.ini`**，用 UTF-8 YAML 避免编码坑） |
| **来源渠道** | E10 系统导出 / 官方文档 |
| **特别注意** | 易助 `analysis/runtime/sql/templates.ts` 注释明确「单据来源代码（权威来源 knowledge/match.ini [Source]）：33=销货单/82=领料…」—— **易飞必须有对应字典，否则 SQL 模板全错** |

### 3.4 🔴 术语表

| 项 | 内容 |
|---|---|
| **用途** | ① 消除 LLM 跨产品线串味；② prompts 措辞统一；③ 菜单/字段/单据名的中文标准 |
| **内容** | E10 业务名词定义 + **易助↔易飞差异术语对照**（重点：如「核价单 approve.price」易助是 `approve.price` 同名，但其他可能有差异） |
| **格式** | `knowledge/glossary/glossary.md` + `glossary.csv`（三列：`易助术语` / `E10 术语` / `说明`） |
| **来源渠道** | 官方文档 + 项目组积累 + **易助侧 `knowledge/json节点对照/` 可反查** |
| **优先级** | P1 —— 影响所有 prompts 质量 |

### 3.5 🟡 错误码与处置话术

| 项 | 内容 |
|---|---|
| **用途** | ① `normalizeError` 双结构兼容的映射表；② 助手「能力边界」与用户话术 |
| **已收集** | 业务码 `0`/`-1`；错误消息样本（权限不足、主键重复、找不到服务）；`error[]` 双结构（`message` 与 `information[]`） |
| **待收集** | 易飞侧**完整错误码表**（若官方有）；典型错误的**用户可读话术** |
| **格式** | `knowledge/faq/error-codes.md` |
| **优先级** | P1 —— `error[]` 双结构已足够解析，但话术影响用户体验 |

### 3.6 🔴 自定义字段实际配置

| 项 | 内容 |
|---|---|
| **用途** | 易飞支持 `udf01~udf12`（文本）+ `udf51~udf62`（数值）共 24 个；**客户现场配置不同** |
| **待收集** | 各客户实际启用的自定义字段及其业务含义（否则无法把客户数据落到正确字段） |
| **格式** | `knowledge/official/custom-fields/tenant-{id}.yaml`（**按客户分文件，不入库敏感数据**） |
| **来源渠道** | 客户环境导出 / 实施访谈 |
| **优先级** | P1 —— 一期可不阻塞，二期做客户定制时必需 |

---

## 4. P2 类别详表

### 4.1 🔴 权限与角色

| 项 | 内容 |
|---|---|
| **用途** | Gateway RBAC 策略；专家包能力边界；`digi-user-token` 的权限维度（基本/成本/售价） |
| **已确认** | 易飞与易助**权限模型相同**（基本权限 / 成本权限 / 售价权限） |
| **待收集** | 角色模板、功能权限菜单树、数据权限（组织/账套/部门） |
| **格式** | `knowledge/official/permissions/*.md` |
| **优先级** | P2 —— 权限模型已确认同构，细节可后补 |

### 4.2 🔴 常见问题与话术

| 项 | 内容 |
|---|---|
| **用途** | 助手 `_spec.md` 的「能力边界」章节；售前答疑 |
| **可复用资产** | ✅ 易助 `references/hallucination-cases.md`（7 类幻觉防御案例）**可直接迁移**，只需把示例值换易飞 |
| **待收集** | 易飞侧特有的限制与不支持项（如哪些单据不支持 OpenAPI、哪些操作有权限要求） |
| **格式** | `knowledge/faq/faq.md`（按域分节） |
| **优先级** | P2 |

### 4.3 🔴 性能与容量基线

| 项 | 内容 |
|---|---|
| **用途** | ① 限流/退避策略；② `page_size` 上限标定；③ 缓存策略 |
| **关键背景** | ⚠️ **易飞无 `fastquery`**，所有查询「每次重查数据库」—— 与易助性能天差地别 |
| **待实测** | ① `page_size: 10000` 时的响应时间；② 并发承载；③ 慢查询分布；④ 官方是否有频率限制（文档未说明） |
| **格式** | `docs/guides/OPERATIONS-性能基线.md` |
| **优先级** | P2 —— 但**建议在 Phase 1 早期做一次粗测**，直接影响 `page_size` 默认值设计 |

### 4.4 🔴 版本兼容实测

| 项 | 内容 |
|---|---|
| **用途** | 支撑多版本部署（易飞有 9.0.12 / 9.1 / 9.2 三个版本线） |
| **已收集** | 变更记录：20260401（`selectedColumns`）、20260911（主表节点兼容数组与非数组）——**均向后兼容** |
| **待实测** | ① 三版本接口是否存在差异；② `typekey_map.yaml` 是否跨版本通用；③ 客户实际用哪个版本 |
| **格式** | `docs/decisions/ADR-E10-版本兼容策略.md` |
| **优先级** | P2 —— 建议一��确认客户版本后收敛为单版本支持 |

---

## 5. 收集方式与归档纪律

### 5.1 收集流程（沿用易助工程化流水线）

```
① 归档原件 → knowledge/official/<category>/（保真，不改写）
② grill-me 澄清缺失与歧义
③ 结构化加工 → knowledge/typekey/ 或 knowledge/typekey-mapping/（脚本生成，标溯源）
④ 真机交叉校验（契约自学习）
⑤ 评审入Skill 知识层
```

### 5.2 归档纪律（沿用用户既定规范）

| 规则 | 说明 |
|---|---|
| **原件保真** | 官方文档原样存放，不手工改写；结构化另存派生文件并标来源 |
| **编码先探测** | 中文Windows 文档可能 GBK/GB2312，**转 UTF-8 前先探测原编码**，禁止盲目覆写导致混合编码 |
| **行尾统一** | UTF-8 无 BOM + CRLF（不混用） |
| **写盘快照** | 批量改写前备份到 `.workbuddy/snapshots/` |
| **派生文件标溯源** | 脚本生成物须写明「由 XXX 脚本从 YYY 机械抽取生成，请勿手工编辑」 |
| **敏感信息隔离** | Token、账套名（`CompanyId`）、客户名**不入库** |
| **大文件 gitignore** | `knowledge/official/_raw/` 原件大文件建议不入库，另存内部仓 |

### 5.3 建议的收集责任分工

| 类别 | 建议来源 | 收集方式 |
|---|---|---|
| 接口清单/字段 | ✅ 已自动获得 | 无需人工 |
| AI 端点清单 | **易飞服务端/AI 团队** | **对外问询函**（最关键缺口） |
| 菜单树/业务域 | 项目组/实施 | E10 系统导出 |
| 表结构 | 项目组/DBA | 数据库导出 |
| 流程/审批 | 实施顾问 | SDD 文档 + 访谈 |
| 权限/术语/FAQ | 项目组积累 + 官方手册 | 整理归档 |
| 真机环境 | 客户/测试环境 | 申请 |
| 性能基线 | 自己做 | Phase 1 实测 |

---

## 6. 覆盖度自检（一期验收标准）

| 检查项 | 目标 | 当前 |
|---|---|---|
| TypeKey 覆盖 | 106 个业务对象全部有 `service` 定义 | ✅ 100% |
| 操作矩阵 | 8种操作映射完整 | ✅ 100% |
| 业务主键 | 106 个对象全部确定 | ⚠️ **101/106**，5 个待真机探测 |
| 中文字段名 | 106 个对象全覆盖 | 🔴 待抽取（`extract-field-metadata.mjs`） |
| 单身节点 | 各对象 `*_data` 节点 | ✅ 已抽取 |
| 枚举字典 | 主要业务枚举 | 🔴 待收集 |
| AI 端点 | 22 个助手 service 定义 | 🔴 **最关键缺口** |
| 菜单树/业务域 | 11 个域 | 🔴 待收集 |
| 术语表 | 核心名词 + 易助对照 | 🔴 待收集 |
| 审批规则 | 8 种操作的审批约束 | 🔴 待收集 |
| 真机环境 | 可连通 + 可只读 | 🔴 待申请 |

**一期放行条件**：TypeKey 100% + 主键 106/106 + 菜单树 + AI 端点清单（若不可得则确认走降级方案）+ 真机环境就绪。

---

## 7. 与既有方案的差异说明

本清单是对 `yfcli-product-line-extension-plan.md` §5「资料准备清单」的**细化与修正**，主要变化：

| 项 | 原方案 | 本清单修正 |
|---|---|---|
| 覆盖基准 | 未量化 | **106 个业务对象 / 595 服务名**（脚本实测），清单按此对齐 |
| 认证方案 | 列为 P0 且标注「未核实」 | ✅ **已确认与易助一致，只需配置 Token**（你的修正） |
| 条件转换 | 未识别 | **易飞无 `fastquery`，OpenAPI 无法直接通用，必须按产品线分包**（你的修正） |
| AI 端点 | 判断易飞「无AI 端点」 | **易飞同样有 22 个分析助手，走 API 服务端直调**（你的修正）；`yf.ai.*` 在易助侧已在用 |
| 优先级 | 未分级 | P0（5 类）/ P1（6 类）/ P2（4 类），P0 阻塞一期 |
| 覆盖度验收 | 无 | 新增 §6 自检表 |
