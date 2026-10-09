# OAPMA/OAPMB 与 typekey_map 核验报告

> 核验时间：2026-10-09
> 数据源：`docs/sources/OAPMA-openapi服务清单.xml` + `docs/sources/OAPMB-openapi服务节点名对应关系.xml` + `docs/sources/表结构信息/表结构信息/OAP2-003.SDD`
> 对照：`knowledge/typekey/typekey_map.yaml`

---

## 一、总览

| 指标 | 值 |
|---|---|
| OAPMA 服务总数 | 570 |
| OAPMB 节点数 / 字段数 | 93 / 6,544 |
| typekey_map 对象数 / 服务数 | 106 / 595 |
| 操作类型匹配 | **537 / 538**（99.8%） |
| 主键一致 | **36 / 106**（34%） |
| 非正式发布服务 | 13 |
| 枚举映射字段 | 689 |

---

## 二、操作类型核验（MA003 vs typekey_map）

**537 个匹配，1 个不匹配，55 个 OAPMA 中找不到。**

### 不匹配（1 个）

| type_key | 服务名 | OAPMA MA003 | typekey_map |
|---|---|---|---|
| `item.inventory.qty` | `yf.oapi.item.inventory.qty.query.get` | `06=approve` | `query` |

**分析**：OAPMA 中该服务的 MA003=06（审核），但 typekey_map 从 Apipost 抽取时标记为 query。结合已知信息（该对象真机探测会导致 DLL 崩溃），**OAPMA 的注册可能有误**，或 Apipost 文档与 OAPMA 注册表不一致。建议以 OAPMA 为准标注为「数据异常，待确认」。

### OAPMA 中有但 typekey_map 无（55 个）

- **13 个 `yf.ai.*` AI 端点**——已单独记录到 `knowledge/official/ai-endpoints/oapma-ai-endpoints.md`
- **8 个 `yf.oapi.222.*` 测试端点**——可忽略
- **17 个标准端点**——主要是 `financial.institution` 的 create/delete/update、`item.count` 的 approve/disapprove/invalid、`subscription` 的 query 等。这些在 Apipost 文档中未收录但 OAPMA 已注册，**应补充到 typekey_map**。
- **13 个 MA024≠Y（非正式发布）**——开发状态为 3（修改中），调用可能不稳定

### OAPMA MA003 操作类型编码（来自 OAP2-003.SDD）

| 编码 | 操作 | 对应 typekey_map |
|---|---|---|
| 01 | Create | create |
| 02 | Update | update |
| 03 | Delete | delete |
| 04 | Read | read |
| 05 | Query | query |
| 06 | Approve | approve |
| 07 | Disapprove | disapprove |
| 08 | Invalid | invalid |
| 09 | Available | — (typekey_map 无此操作) |
| 10 | UnAvailable | — (typekey_map 无此操作) |

---

## 三、主键核验（OAPMB MB005 vs typekey_map primary_key）

**36 个一致，70 个不一致。** 但不一致的原因高度集中：

### 分类

| 类别 | 数量 | 说明 |
|---|---|---|
| typekey 是 OAPMB 的子集 | **65** | OAPMB 多了单身节点的 key（seq/item_serial_no 等），typekey 只记录了单头主键 |
| typekey 主键为空 | **3** | `document.type.general` / `employee` / `operation` 在 typekey_map 中未抽到主键 |
| 真正不同 | **2** | `item.customer.price` 和 `item.inventory.qty` |

### 65 个「子集」的详细分析

OAPMB 的 MB005 标记了**所有节点**（单头+单身）的主键字段，而 typekey_map 只记录了**单头主键**。多出的 key 分布：

| 多出的字段 | 出现次数 | 含义 |
|---|---|---|
| `seq` | 48 | 单身序号（最常见） |
| `units_above` | 8 | 单位以上（BOM/价格类） |
| `item_serial_no` | 7 | 料号序号（库存类） |
| `location_no` | 4 | 库位号 |
| `sub_seq` | 4 | 子序号 |
| 其余 | 各 1~3 | invoice_no / staff_no / warehouse_no 等 |

**结论**：这 65 个**不是错误**，而是 typekey_map 只记录了单头主键（用于 read/getMultiple 定位单据），OAPMB 额外包含了单身行的定位字段。**两者口径不同，不需要修正 typekey_map**。但如果未来需要精确定位单身行，需要从 OAPMB 取完整 key。

### 3 个主键为空

| type_key | OAPMB 主键 | 建议 |
|---|---|---|
| `document.type.general` | `doc_type_no` | 补充到 typekey_map |
| `employee` | `staff_no` | 补充到 typekey_map |
| `operation` | `routing_no` | 补充到 typekey_map |

### 2 个真正不同

| type_key | OAPMB 主键 | typekey_map 主键 | 差异 |
|---|---|---|---|
| `item.customer.price` | customer_no, item_no, pricing_unit, curr, effective_date, units_above | customer_no, item_no, effective_date, pricing_unit, curr, **first_trade_date** | typekey 多了 `first_trade_date`，OAPMB 多了 `units_above` |
| `item.inventory.qty` | item_no, conversion_unit, supplier_no, warehouse_no, location_no, lot_no | **空** | typekey 未抽到主键（已知该对象 DLL 崩溃） |

---

## 四、OAPMB 新增价值（typekey_map 中没有的信息）

### 4.1 字段必填性（MB010 / MB022）

| 标记 | 数量 | 含义 |
|---|---|---|
| Y（必传且不可空白） | 885 | create 时必填 |
| 空（可传可不传） | 2,845 | 可选 |
| N（不可传） | 2,814 | 由 ERP 预设值写入 |

**价值**：typekey-mapping/*.md 中的「必填/可选」标注来自 Apipost 入参分析，OAPMB 提供了**服务端权威的必填性定义**。两者可能有差异，应以 OAPMB 为准。

### 4.2 枚举值映射（MB012 内存外显）

**689 个字段**有枚举值映射，格式为 `编码.中文;编码.中文;...`。

示例：
- `invoice_type`: `S.可抵扣专用发票;B.普通发票;T.卷筒发票;N.不可抵扣专用发票;A.农产品收购凭证;...`
- `tax_type`: `1.应税内含;2.应税外加;3.免税内;4.免税;9.其他税`
- `allow_batch_delivery`: `Y.是;N.否`

**价值**：这是**枚举字典的权威数据源**！之前 P0 台账标注「枚举字典缺失，需大数据量账套导出」，现在 OAPMB.MB012 直接提供了 689 个字段的枚举映射，**可以替代 T-07 的大部分工作**。

### 4.3 字段回传控制（MB029 / MB030）

- MB029 = Read 回传否（Y/N）
- MB030 = Query 回传否（Y/N）

**价值**：精确知道哪些字段在 query.get 中会返回、哪些只在 read.get 中返回。这直接支持了「query.get vs read.get」分工规则的数据依据。

### 4.4 作业类型（MA004）

| 编码 | 类型 | 数量 |
|---|---|---|
| 01 | 基本资料类 | 125 |
| 02 | 单据类 | 437 |
| 04 | 单一档案类 | 8 |

**价值**：可以据此自动判断一个 type_key 是基础数据还是业务单据，影响 Skill 分诊逻辑。

### 4.5 分页模式（MA017）

绝大部分服务支持分页（MA017=3），仅 1 个不支持。**与 AGENTS.md 硬约束 §7 一致**。

### 4.6 信息类别（MA021）

OAPMA 定义了 26 个信息类别（企业基础/客户/厂商/产品/采购/销售/生产/帐款/品管/仓储/员工/总帐等），可以作为**业务域归属的权威数据源**，替代当前 `gen-domain-map.mjs` 的启发式判定。

---

## 五、需要补充到 typekey_map 的内容

### 5.1 立即可补充（高优先级）

| # | 补充项 | 来源 | 影响 |
|---|---|---|---|
| 1 | 3 个空主键对象的主键 | OAPMB MB005 | `document.type.general`→doc_type_no, `employee`→staff_no, `operation`→routing_no |
| 2 | 17 个 OAPMA 有但 typekey 无的标准服务 | OAPMA MA001 | 补充到对应 type_key 的 services 段 |
| 3 | 13 个 AI 端点 | OAPMA MA001 | 已有独立清单，可选择性加入 typekey_map |

### 5.2 增强型补充（中优先级）

| # | 补充项 | 来源 | 影响 |
|---|---|---|---|
| 4 | 689 个枚举映射 | OAPMB MB012 | 可生成 `knowledge/enums/enums-from-oapmb.yaml`，替代 T-07 |
| 5 | 字段必填性 | OAPMB MB010/MB022 | 增强 typekey-mapping/*.md 的必填标注 |
| 6 | 字段回传控制 | OAPMB MB029/MB030 | 增强 SKILL.md 的 query/read 分工说明 |
| 7 | 作业类型 | OAPMA MA004 | 增强 domain-map 的业务域判定 |
| 8 | 信息类别 | OAPMA MA021 | 替代启发式域归属判定 |
| 9 | 开发状态 | OAPMA MA024 | 标注 13 个非正式发布服务，Skill 中告警 |

### 5.3 暂不补充（低优先级）

| # | 项 | 理由 |
|---|---|---|
| 10 | 单身行定位 key（seq 等） | 当前 read.get 只需单头主键，单身 key 留待 P4 分析层需要时再补 |
| 11 | `item.inventory.qty` 主键修正 | 该对象 DLL 崩溃，暂不可用 |

---

## 六、对 P0 台账的影响

| 台账项 | 原状态 | 核验后 |
|---|---|---|
| Q-01: 43 个 MA012 节点 | ⚠️ 可撤回（v2 验证已确认） | ✅ 已撤回 |
| M-09: 枚举字典 | ⚠️ 部分（仅 format-mask-map） | 🟢 **OAPMB.MB012 提供 689 个枚举映射，可大幅提升覆盖度** |
| G-02: 枚举字典缺口 | ❌ 数据缺失 | 🟡 **部分解决**：OAPMB 提供 689 个，但仍需大数据量账套补充运行时枚举值 |
| M-05: 业务域/菜单树 | ❌ 缺失 | 🟡 **OAPMA.MA021 提供 26 类信息类别，可作为域归属依据** |

---

## 七、产出文件

| 文件 | 内容 |
|---|---|
| `runs/oapma-typekey-verification.json` | 完整核验数据（JSON） |
| `runs/oapma-typekey-comparison.json` | OAPMA vs typekey_map 服务名对比 |
| `runs/oapma-typekey-integrated.json` | 整合数据（服务→节点→字段） |
| `knowledge/typekey/oapma-enriched-typekey-map.yaml` | 增强版 typekey_map |
| `knowledge/typekey/oapma-field-aliases.csv` | 39,117 行字段别名映射 |
| `knowledge/official/ai-endpoints/oapma-ai-endpoints.md` | 13 个 AI 端点清单 |
