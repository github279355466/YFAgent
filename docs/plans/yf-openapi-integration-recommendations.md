# YFCLI 统一规则落地建议

> 制定日期：2026-10-08
> 输入：《易飞（YF）OpenAPI 规则体系·提取报告》+《易飞 vs 易助 OpenAPI 规范差异对照表》
> 适用：`D:\AIProject\claude\YFCLI`（规划中）· `erp-core`（规划中）
> 关联：`docs/plans/yfcli-product-line-extension-plan.md`

---

## 1. 总体判断：协议同源，差异在实现质量与工程加固

三条结论决定整体策略：

| 结论 | 依据 | 策略含义 |
|---|---|---|
| **协议层 90% 同构** | `digi-service` / `digi-user-token` / `std_data` 封包 / `execution.code` / `result.success|error` 全部一致 | **不做Adapter 重写**，只做「前缀 + 少量方言」的薄适配 |
| **易飞侧文档质量较低** | `error[]` 双结构、繁简混用、`docdate`/`doc_date` 并存、URL 4 种变体、`udf07~12` 跳号 | **所有解析层必须防御性编码**，不信任文档 |
| **易助侧工程加固易飞全无** | TypeKeyList 服务、help 服务、`fastquery` SQL 缓存、Token 获取作业、16,632 行字段对照表 | 这部分**不是协议，是基建**，需在 YFCLI 从零补建 |

---

## 2. 分层落地：哪些复用、哪些适配、哪些新建

### 2.1 第一层：协议内核（`erp-core` 共享，零改动）

| 组件 | 说明 |
|---|---|
| `std_data` 封包/解包 | 两产品线完全同构，直接复用 |
| `execution.code` 判据 | **统一为 `code === "0" \|\| code === "-0"`**（覆盖易助部分成功 + 易飞成功） |
| Header Provider 接口 | `digi-service` / `digi-user-token` / `Content-Type` 三头两边同名，**接口不变** |
| 错误模型 | `result.error[]` 双通道（`message` / `information[].message`）**都要兼容** |

### 2.2 第二层：方言适配（`yfcli-sdk` 独有）

| 适配点 | 易助 | 易飞 | 实现方式 |
|---|---|---|---|
| **服务前缀** | `yz.` | `yf.` | `servicePrefix: 'yf.'` 配置项，**严禁硬编码** |
| **URL** | `http://{IP}:{PORT}` | `http://{IP}/YFOAP/openapi.dll/...` | `baseUrl` 配置项 + **路径大小写归一化校验** |
| **读取操作名** | `get` | `read` | `operationAlias: { read: 'readGet' }` 易飞专属映射表 |
| **`conditions` 结构** | 数组 + `groups` | 对象 + `fields[].group` | **双向转换层**（见 §3.1） |
| **查询回参通道** | `result.success[]` | `result.rows[]` + `total_result`/`has_next`/`cnt` | 按操作类型分流 |
| **账套头** | 无（Token 隐式定位） | `digi-datakey` **必填** | 新增 `companyId` 概念，贯穿 Token 映射 |
| **`error[]` 结构** | `{message, data}` | `{message, data}` **或** `{information:[{message,data}]}` | 双结构兼容 + 未识别时记警告 |

### 2.3 第三层：易飞从零补建的基建

| 项 | 方案 | 对应易助现有资产 |
|---|---|---|
| **Token 配置** | ✅ **零差异**：Header 三头与易助逐字一致，`yfcli-sdk` 只需 `token` 配置项 | 易助 `client.ts:44-50` |
| **TypeKey 清单** | ✅ **已解决**：`scripts/extract-typekey-map.mjs` 已产出 595 服务名 / 106 对象 / 101 主键 | 易助 `agent_typekey_map.yaml`（110 条） |
| **字段元数据** | 逐接口解析 `raw_parameter` 的 `key`/`description`/`field_type`/`not_null` → `metadata/*.json` | 易助 `json节点对照/` 21632 行 + `extract-analysis-metadata.mjs` |
| **Token 获取** | ✅ **无需确认**（2026-10-08 修正）：落地只需在配置文件填写 `digi-user-token`，易飞易助一致 | — |
| **查询性能策略** | 易飞**无 `fastquery`**，所有查询打 DB → 需实测后定 `page_size` 上限与缓存策略 | 易助「只用 fastquery」策略需**推翻重写** |
| **分析助手路线** | ✅ **维持直调**（2026-10-08 修正）：易飞同样有 22 个分析助手走 API 服务端直调，`yf.ai.*` 端点在易助侧已现役运行；仅需向易飞侧索取 22 个端点的服务名与出入参清单 | 易助 22 助手 `service` 直调模式**可复刻** |

---

## 3. 五个必须做的重点改造

### 3.1 【最高优先】`conditions` 双向转换层

**问题**：这是全项目**最危险的差异** —— 结构不匹配时**不报错、静默返回全量**。

```
易飞（对象嵌套）                    易助（数组嵌套）
{                                  [
  "conditions": {                   {
    "operator": "AND",                "groups_operator": "OR",
    "fields": [                       "groups": [{
      { "field_name": "x",             "fields_operator": "AND",
        "operator": "=",               "fields": [
        "value": "1" },                   {"field_name":"x","operator":"=","value":"1"},
      { "group": {                     ]}]} ]}
        "operator": "OR",
        "fields": [...] } } ] } ]}
```

**建议**：在 `yfcli-sdk` 建 `ConditionsTranslator`，YFCLI 内部**统一用易飞结构**（对象 + `group`），对外暴露易助风格的数组 API 以复用上层业务代码。

| 能力 | 实现 |
|---|---|
| 数组 ⇄ 对象双向转换 | 递归处理 `group` 任意层级 |
| **静默失败防护** | 转换后**强制校验**：若输入含 `groups` 键但易飞侧不认，**立即抛错而非降级** |
| `node_name` 注入 | 查单身字段时**自动补** `node_name`，缺失则报错（易飞必需，易助无此概念） |
| 组合字段 `+` | 保留 `field_name: "a+b"` 支持（两边都有） |
| 特殊 value 格式 | `BETWEEN`/`IN`/`EXISTS` 的 SQL 片段格式**保持易飞原样，不做转换**（转换必错） |

**专项测试（必做）**：把易助 7 类 `conditions` 写法逐个转成易飞格式，用真机验证返回**行数正确**（不是全量）。这组测试是整个改造的验收闸门。

### 3.2 【高优先】服务前缀与操作名配置化

对照易助 `client.ts:79-81` 的硬编码：

```ts
// 易助现状（反面教材）
const fullName = serviceName.startsWith("yz.oapi.")
  ? serviceName : `yz.oapi.${serviceName}`;
```

**易飞侧必须改为**：

```ts
// yfcli-sdk/src/config.ts
export interface ErpConfig {
  baseUrl: string;                 // http://{IP}
  servicePrefix: string;           // 'yf.'  ← 配置项，禁止硬编码
  operationAlias: Record<string, string>;  // { read: 'readGet' }  ← 易助是 { get: 'getMultiple' }
  companyId: string;               // digi-datakey 用
}
```

**启动期校验**（fail-fast，不静默降级）：

- `servicePrefix` 未配置 → 启动失败
- `baseUrl` 不以 `/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost` 结尾 → **警告并提示大小写**
- `companyId` 为空 → 启动失败（易飞必填）

### 3.3 【高优先】分析助手：维持服务端直调，索取端点清单

**修正说明（2026-10-08）**：本节原判断「易飞无任何 `yf.ai.*` 端点」，经核实为**误判** —— Apipost 文档只收录标准 OpenAPI，私有 AI 端点本就不在其中。事实依据：易助 `_routes.yaml:29,84` 现役使用 `yf.ai.PurchaseBusinessWarning`（助手 06）与 `yf.ai.SalesbusinessWarning`（助手 17），证明**易飞侧服务端直调模式已在运行**。

**结论**：22 个分析助手**沿用易助的 `service` 直调模式**，架构不变：

```
易飞版助手 = yzcli_run({ service: "yf.ai.*", input: {...} }) → LLM 组织报告
             （与易助同构，仅服务名前缀与出入参不同）
```

**唯一待办**：向易飞侧索取 22 个端点的完整清单，格式对齐易助 `_routes.yaml`：

```yaml
# knowledge/official/ai-endpoints/ai-endpoints.yaml
product_line: yifei
assistants:
  - id: "02-inventory-aging"
    name: "库存呆滞查询"
    keywords: ["呆滞","库龄","呆料","积压","库存周转"]
    exclude: ["工单呆滞"]
    service: "yf.ai.AIDeadStockInventory"        # ← 待易飞侧确认
  - id: "06-procurement-anomaly"
    service: "yf.ai.PurchaseBusinessWarning"      # ✅ 已确证现役
  - id: "17-sales-anomaly"
    service: "yf.ai.SalesbusinessWarning"# ✅ 已确证现役
```

**降级预案**（若端点清单无法获得）：对对应助手改走「`query.get` 取数 → `erp-experts` 引擎计算 → 本地生成报告」。此路径已在 `erp-experts`（8 岗位引擎）中实现，成本可控，但需重写该助手的 `_meta.json` 与 prompts。

### 3.4 【已完成】TypeKey 清单生成脚本

**状态**：✅ `scripts/extract-typekey-map.mjs` 已实现并跑通，产出如下：

| 指标 | 实测值 |
|---|---|
| 源文件 | 46.5 MB / 2120 节点 |
| 服务名去重 | **595** |
| 业务对象 | **106** |
| 主键可抽 | **101/106**（78 个为复合主键） |
| 命名不规则服务 | 0 |
| 产出 | `knowledge/typekey/typekey_map.yaml`（78.4 KB）+ `_report.json` |

支持 `--check` 模式作CI 门禁（检测产物是否过期）。

**实际产出的结构**（节选，完整见 `knowledge/typekey/typekey_map.yaml`）：

```yaml
version: 1
generated_from:
  - docs/易飞OpenAPI.json
  - apipost_project_id: 322f10
product_line: yifei
service_prefix: "yf."
auth_headers: [digi-service, digi-user-token, digi-datakey]
entrypoint: "/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost"
success_code_rule: "code === '0' || code === '-0'"

typekeys:
  - type_key: accounting.voucher
    title: 会计凭证
    aliases: [会计凭证, accounting.voucher, accounting.voucher.data.query.get, ...]
    services:
      approve: yf.oapi.accounting.voucher.data.approve
      create: yf.oapi.accounting.voucher.data.create
      delete: yf.oapi.accounting.voucher.data.delete
      disapprove: yf.oapi.accounting.voucher.data.disapprove
      invalid: yf.oapi.accounting.voucher.data.invalid
      query: yf.oapi.accounting.voucher.data.query.get
      read: yf.oapi.accounting.voucher.data.read.get
      update: yf.oapi.accounting.voucher.data.update
    operations: [approve, create, delete, disapprove, invalid, query, read, update]
    primary_key: [doc_type_no, doc_no]
    composite_key: true
```

**已处理的 4 类数据质量问题**：

| 问题 | 现象 | 处理结果 |
|---|---|---|
| 目录名噪声 | `李加伟_测试目录` / `武媛媛-OPENAPI` / `PURI05-请购单-OK` / `-范例` / 同名重复 | ✅ 按服务名去重，标题剥离编号前缀与状态后缀；`title 非中文 0/106` |
| 标题残留操作词 | 曾出现 `accounting.voucher → 删除会计凭证`、`ar.refund.doc → create-兴达` | ✅ 剥离 11 个操作动词 + 中英混杂清洗；残留 2 条为 `新增BOM`/`查询EBOM`（BOM 与操作词粘连，可接受） |
| 服务名不规整 | 6 个对象无 `.data` 段（`bom` / `ecn` / `ebom` / `item.customer.price` / `item.inventory.qty` / `item.supplier.price`） | ✅ 解析器兼容两种形态，并输出 `no_data_segment: true` 标记提醒调用方 |
| 主键缺失 | 5 个对象 `read.get` 无 `datakeys` | ✅ 输出 `primary_key_unknown: true` 标记，留待真机探测 |

### 3.5 【中优先】`error[]` 双结构兼容与脱敏

```ts
// yfcli-sdk/src/response.ts
interface NormalizedError {
  message: string;
  data?: unknown;
  raw: unknown;
  source: 'message' | 'information' | 'unknown';
}

export function normalizeError(error: unknown): NormalizedError {
  const e = error as Record<string, unknown>;
  if (typeof e.message === 'string') {
    return { message: e.message, data: e.data, raw: e, source: 'message' };
  }
  const info = e.information as Array<{ message?: string; data?: unknown }> | undefined;
  if (Array.isArray(info) && info.length > 0) {
    return { message: info[0].message ?? '(无消息)', data: info[0].data, raw: e, source: 'information' };
  }
  return { message: '(未识别的错误结构)', data: undefined, raw: e, source: 'unknown' };
}
```

**`source: 'unknown'` 必须打 WARN 日志** —— 这是「错误被静默吞掉」的唯一防线。

**脱敏**：易飞 `error[].data` 会**完整回显传入数据**（实测回显了整个客户对象）。写入审计日志前须脱敏：`udf*`（可能含自定义敏感数据）、`digi-user-token`、客户/供应商名称类字段。参照 `erp-gateway/src/middleware/masking.ts` 现有能力复用。

---

## 4. YFCLI 侧SKILL 与 Prompt 的硬性约束

### 4.1 防幻觉规则必须按产品线重写

易助 `SKILL.md` 的「字段标识读取优先级」四级链在易飞侧**部分失效**：

| 优先级 | 易助 | 易飞建议 |
|---|---|---|
| 1 | `~/.yzcli/learned-contracts/<tenant>.json` | `~/.yfcli/learned-contracts/<tenant>.json`（路径改前缀，机制复用） |
| 2 | `yzcli_help(type_key).key_fields` |⚠️ **易飞无 help 服务** → 降级为「查预生成 `typekey_map.yaml` 的 `primary_key`」 |
| 3 | 真机回读探测三步法 |✅ 保留（更重要了，因无 help 服务兜底） |
| 4 | `references/field-mapping-matrix.md` |✅ 保留，但**编号前缀含义全部重写**（易飞是 `COPMA`/`INVMB`/`COPTC`/`COPTD` 体系） |

### 4.2 三个必须在 Skill 里写死的易飞专属规则

| 规则 | 原因 |
|---|---|
| **禁止猜自定义字段名** | 易飞是 `udf01~udf12`/`udf51~udf62`，易助是 `udf_text1~16`/`udf_no1~16`。**两套命名体系互斥**，写错即幻觉 |
| **查询条件查单身字段必须带 `node_name`** | 易飞**强制要求**，易助无此概念。缺失会报错或行为异常 |
| **成功判据只用 `code === "0"`** | 易飞 description 繁简混用（`查詢成功`/`执行成功`），**禁止字符串匹配判断成功** |

### 4.3 条件运算符的高危格式（写入 references）

易飞侧 `BETWEEN` / `IN` / `EXISTS` 的 value 需带 **SQL 片段格式**，这是 LLM 极易写错的点：

| 运算符 | 易飞要求 | LLM 常错写法 |
|---|---|---|
| `BETWEEN` | `"value": "'起' AND '止'"` | `"value": ["起","止"]` ❌ |
| `IN` | `"value": "(N'000',N'001')"` | `"value": ["000","001"]` ❌ |
| `EXISTS` | `"field_name": ""`（**留空**）+ `"value": "(SELECT ...)"` | 填field_name ❌ |
| `IN` + 子查询 | `$$INVMB` 前缀 + **必须起别名** | 漏别名导致 SQL 歧义 ❌ |

---

## 5. 待确认事项（阻塞项）

| # | 事项 | 阻塞阶段 | 动作 |
|---|---|---|---|
| **B1** | ~~易飞 `digi-user-token` 的获取方式~~ | — | ✅ **已关闭（2026-10-08）**：Header 三头与易助逐字一致，`yfcli-sdk` 只需 token 配置项，无需关心获取途径 |
| **B2** | 易飞 `page_size` 实际性能边界（无 `fastquery`，查询全打 DB） | Phase 1 | 真机压测：`page_size` 10000 时的响应时间与并发承载 |
| **B3** | 易飞是否有 TypeKeyList / help 类元数据服务（文档未提及，但可能存在未公开） | Phase 0 | 向厂商确认。若存在可省下大量基建 |
| **B4** | `digi-datakey` 的 `CompanyId` 与 Token 的绑定关系（一个 Token 可跨多公司？） | Phase 1 | 决定 `token_map` 是否需升级为 `{userId, companyId, token}` |
| **B5** | `udf07~udf12` 中文描述跳号（标13-18）是否为文档笔误 | Phase 2 | 不阻塞，按节点名 `udf07~udf12` 写即可 |
| **B6** | **22 个 `yf.ai.*` 分析端点的服务名与出入参清单** | Phase 2 | 向易飞服务端/AI 团队索取。其中 06/17 已确证现役，其余 20 个待补|
| **B7** | 易飞**无 `fastquery`** → OpenAPI 层无法直接通用，须按产品线分包（`yfcli-sdk` 与 `yzcli-sdk` 各自独立） | — | ✅ **已确认为架构决策**（2026-10-08），非阻塞项；对应扩展方案「完全物理隔离 + 独立仓」 |

---

## 6. 一期交付建议（对应扩展方案 Phase 1）

| 步 | 内容 | 验收标准 |
|---|---|---|
| 1 | ✅ `extract-typekey-map.mjs`：**已完成**，产出 595 服务名 / 106 对象 / 101 主键 | ✅ 已达成（78.4 KB YAML + _report.json） |
| 2 | `yfcli-sdk`：`servicePrefix`/`operationAlias`/`companyId` 配置化 + fail-fast 校验 | 缺配置时启动即失败 |
| 3 | `ConditionsTranslator` 双向转换 + **静默失败防护** | **7 类 `conditions` 写法逐个真机验证行数正确**（不是全量） |
| 4 | `normalizeError` 双结构兼容 + 脱敏接入 | 两种错误结构都能取到 message；unknown 时有 WARN |
| 5 | 3 个助手（覆盖 `query.get` / `read.get` / `create` 三条路径） | 真机跑通 + `learn-erp-contracts` 契约入库 |

**建议的3 个一期助手**（调整后）：

| 助手 | 服务 | 验证目标 |
|---|---|---|
| `01-plant-query` 工厂查询 | `yf.oapi.plant.data.query.get` | `conditions` 转换 + 分页 + `digi-datakey` |
| `02-plant-read` 工厂读取 | `yf.oapi.plant.data.read.get` | `datakeys` + 主键识别 |
| `03-customer-create` 客户新增 | `yf.oapi.customer.data.create` | 写操作 + 错误结构（`information[]`）+ 主键冲突处理 |

> 相比扩展方案原定（呆滞/供应商/采购订单），这 3 个更聚焦**协议层验证**，而非业务语义。业务助手可留二期。

---

## 7. 与既有方案的一致性说明

本报告是对 `yfcli-product-line-extension-plan.md` 的**规则层补充**，不推翻既有决策，但**新增 1 个阻塞项**并**调整 1 项实施内容**：

| 项 | 原方案 | 本报告调整 |
|---|---|---|
| 阻塞项 | 5 个 OPEN 项（OPEN-01~05） | **新增 B1（Token 获取方式）为最高优先级**，与 OPEN-04（E10 认证）合并跟踪 |
| 一期助手 | 呆滞/ 供应商报告 / 采购订单 CRUD | **改为工厂查询 / 工厂读取 / 客户新增**（聚焦协议层验证） |
| 分析层复制 | 完全复制 `yfcli-analysis` | **维持**，但 20 个 SQL 模板需按易飞物理表（`COPMA`/`INVMB`/`COPTC`/`COPTD` 体系）重写，**且不能沿用易助的 `fastquery` 优化路径** |
| `conditions` 转换 | 未识别为风险 | **升级为最高优先改造项**，需专项测试闸门 |
