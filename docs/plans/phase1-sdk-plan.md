# Phase 1 实施计划 —— yfcli-sdk 工程骨架

> 产出日期：2026-10-08
> 负责范围：易飞（YF / E10）OpenAPI SDK 的模块划分、类型定义、目录结构与实施步骤
> 权威依据：`AGENTS.md`（真机实测硬约束）/ `docs/plans/yf-openapi-rules.md` / `docs/plans/yf-live-probe-report.md` / `docs/plans/probe-pk-and-node-name-answers.md` / `knowledge/typekey/typekey_map.yaml`
> 产出位置：`packages/yfcli-sdk/`（工程骨架）+ 本文件（计划）
> 约束：本计划不改动 `knowledge/` 下任何既有产物
>
> ⚠️ **编号体系（2026-10-09 补注）**：本文为 2026-10-08 的历史快照，其中的 `T-xx` 是
> 当时的旧编号，**与现行两套体系均不一致**，勿按`D-xx` 解读：
> - 开发任务现行编号为 `D-xx`，见 `docs/TODO-PLAN.md`（本文「后续（T-14）写操作实测」
>   一项在TODO-PLAN 中**尚无对应任务**，未纳入 `D-xx`）
> - 资料收集任务用 `T-xx`，见 `docs/plans/yf-materials-tasks.md`
> 本文 `T-07`（枚举采集）/ `T-13`（analysis 层）主题与两套体系语义相近，但不保证同号同义。

---

## 0. 计划速览

| 项 | 结论 |
|---|---|
| SDK 定位 | 易飞 OpenAPI 调用层 + 配置 + 条件构造 + 响应解析 + 错误模型 |
| 技术栈 | TypeScript（Node 20+，`"type": "module"`，ESM + NodeNext 模块解析） |
| 运行时依赖 | 仅 `yaml`（解析 typekey_map.yaml）。传输层用 Node 20+ 内置 `fetch`，无 axios 依赖 |
| 分层 | config / conditions / transport / response / catalog / client / logging —— 依赖只向下 |
| 单文件上限 | 300 行（当前最长 282 行，`src/response/parser.ts`） |
| 类型策略 | 零 `any`。解析入口用 `unknown` + 类型守卫收敛 |
| 配置策略 | fail-fast。缺 `servicePrefix` / `companyId` / 令牌即启动失败，不静默降级 |
| 本次不含 | MCP 封装、直连 SQL、枚举码值采集、契约自学习（见 §7 边界表） |
| 阻塞项 | 无。骨架不依赖真机环境与MCP SDK 选型 |

---

## 1. 模块划分

### 1.1 分层与依赖方向

```
                      ┌──────────────────────┐
                      │  src/index.ts│
                      │  （入口 · 只做再导出）     │
                      └──────────┬───────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────┐      ┌──────────────────┐    ┌──────────────────┐
│  client/      │      │  catalog/        │    │  logging/        │
│  编排调用       │      │  服务名查表│    │  日志脱敏         │
└───┬───────┬───┘      └────────┬─────────┘    └──────────────────┘
    │       │                   │
    ▼       ▼                   │
┌──────────────────┐            │
│  transport/      │            │
│  HTTP 发起        │            │
└────────┬─────────┘            │
         │                │
         ▼                      │
┌──────────────────┐            │
│  response/       │            │
│  封包解析 + 错误归类  │◀───────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  conditions/     │      │  config/         │
│  条件构造 + 枚举守卫 │      │  校验 + 请求头     │
└────────┬─────────┘      └────────┬─────────┘
         │                          │
         └────────────┬─────────────┘
                      ▼
              ┌───────────────┐
              │    types/     │
              │  纯类型 + 常量  │
              └───────────────┘
```

**铁律（违反即退回）**

| 规则 | 落地方式 |
|---|---|
| 依赖只向下 | `tools/check-skeleton.mjs` 扫描反向 import，命中即 FAIL |
| 入口只装配 | `src/index.ts` 仅 113 行 re-export，零逻辑 |
| `types/` 不含运行时逻辑 | 只导出类型与常量（`YF_PAGE_SIZE_MAX` 等） |
| `client/` 不含协议细节 | 协议在 `response/`，条件在 `conditions/`，传输在 `transport/` |
| 不反向依赖入口 | 低层禁止 import `index.ts`（自检脚本第 6 项） |

### 1.2 各包职责与公开 API 面

| 包 | 职责边界 | 公开 API（不含内部函数） |
|---|---|---|
| `types/protocol.ts` | 易飞线上字节的精确映射：四头、封包、双通道回参、error[] 双结构 | `YF_SUCCESS_CODES` `YF_PAGE_SIZE_MAX` `YF_PAGE_NO_MIN` |
| `types/conditions.ts` | `conditions` 对象形态的递归类型（`group` 多层嵌套） | 类型 + `YF_OPERATIONS`（在 domain） |
| `types/domain.ts` | 知识产物投影：`YfTypeKeyEntry` `YfServiceNameResolver` 查询/主键结果信封 | `YF_OPERATIONS` `YF_CODE_TEXT_SEPARATOR` |
| `types/config.ts` | 配置结构 + 校验结果 + `YfConfigError` | `YfConfigError` |
| `types/errors.ts` | 四层错误模型（transport/http/protocol/business/silent） | `YfError` `httpError` `emptyResultError` `isYfError` `isYfErrorDataCarrier` |
| `config/config.ts` | fail-fast 校验 + 端点拼接 + 令牌解析 | `YF_ENDPOINT_PATH` `YF_CONTENT_TYPE` `validateConfig` `assertValidConfig` `resolveRuntimeConfig` |
| `config/headers.ts` | 四头构造 + 误导性文案翻译 | `buildHeaders` `explainMisleadingAuthMessage` |
| `conditions/builder.ts` | 只产出易飞对象形态；高危运算符的 SQL 片段渲染 | `allRecords` `field` `compositeField` `group` `allOf` `anyOf` `between` `inList` `notInList` `like` `exists` `notExists` `pagination` `queryParameter` `asc` `desc` `assertNotYiZhuConditionsShape` |
| `conditions/enum-guard.ts` | 拦截「编码.中文」静默错误 | `looksLikeCodeText` `extractCode` `guardEnumConditionValue` `correctEnumFields` |
| `transport/http-transport.ts` | 唯一发起网络请求处；先判状态码 | `FetchTransport` `assertHttpOk` |
| `response/parser.ts` | 封包收敛 + 成功判定 + 双结构 error[] 兼容 + 双通道分流 | `isSuccessCode` `parseEnvelope` `parseErrorEntries` `buildBusinessError` `parseQueryResult` `parseActionResult` `describeEmptyResultWarning` |
| `catalog/typekey-catalog.ts` | 从 YAML 查表；存在性校验；**禁止拼接** | `TypeKeyCatalog` |
| `client/yf-client.ts` | 串联上述各层；空结果告警；主键覆盖校验 | `YfClient` `YfLogger` `NOOP_LOGGER` |
| `logging/redact.ts` | 阻断 `error[].data` 回显泄漏 | `redact` `redactErrorData` `maskToken` |

---

## 2. 类型定义设计

### 2.1 配置类型（`types/config.ts`）

设计要点：**配置中不出现令牌值本身，只有环境变量名**。

```ts
export interface YfSdkConfig {
  readonly baseUrl: string;        // 只填到主机，路径由 SDK 拼常量
  readonly companyId: string;       //写入 digi-datakey
  readonly tokenEnvVar: string;     // 只存变量名，不落明文
  readonly servicePrefix: string;   // 易飞 yf.，必填
  readonly timeoutMs: number;
  readonly warnOnSilentError: boolean;
}
```

`ResolvedRuntimeConfig` 是校验并解析令牌后的产物，`endpoint` 已拼好完整 URL。

### 2.2 请求/响应类型（`types/protocol.ts`）

关键设计：**两条数据通道用同一组可选键表达，由解析器按存在性分流**。

```ts
export interface YfResponseParameter {
  readonly total_result?: number;    // 查询通道
  readonly has_next?: boolean;       // 查询通道
  readonly result?: YfResultBlock;
}
export interface YfResultBlock {
  readonly cnt?: number;             // 查询通道
  readonly rows?: readonly YfRow[];  // 查询通道
  readonly success?: readonly unknown[]; // 主键通道
  readonly error?: readonly unknown[];   // 两通道共用
}
```

理由：`yf-openapi-rules.md` §5.3 明确查询类与主键类走不同通道，
但服务端封包本身是同一套键名。若强行拆成两个 interface，
`parseEnvelope` 就必须先判断通道再解析 —— 而通道只能靠「哪个键存在」判断，
反而绕远。用可选键 + 解析器分流更直接。

`YfRow` 用 `Record<string, unknown>` 而非静态字段集：易飞允许用户自建 `udf01~udf62`，
字段集无法穷举。收敛由上层业务方法负责（不在 SDK 层做业务映射）。

### 2.3 错误模型（`types/errors.ts`）

**双维度设计**：`layer` 回答「哪一层出问题」，`kind` 回答「什么问题」。

| layer | 触发条件 | 处置 |
|---|---|---|
| `transport` | 连接失败、超时、DNS | 视kind 决定重试 |
| `http` | 状态码非 200（错误 token 即在此层，500 + HTML） | **禁止解析 body** |
| `protocol` | 200 但封包不符（缺 `std_data` / `execution`） | SDK 与服务端脱节，须告警 |
| `business` | `code === "-1"` | 按 kind 归类 |
| `silent` | `code=0` 但空结果 / 枚举形态可疑 | WARN，**不当成功** |

`kind` 共 16 种，覆盖真机实测过的每一类报错文案（见 §2.4 归类表）。

### 2.4 业务错误归类表（`response/parser.ts` 的 `classifyBusinessError`）

| kind | 触发文案（真机原文） |
|---|---|
| `token_invalid` | 无效的身份令牌 |
| `datakey_invalid` | digi-datakey is not valid. |
| `company_not_found` | Can not found CompanyId(xxx) in DSCMB |
| `node_not_registered` | MA012未定義 |
| `field_not_found` | 找不到資料表:[XXX] |
| `conditions_invalid` | conditions not found. |
| `datakeys_invalid` | datakeys is not valid. |
| `primary_key_missing` | 缺少[doc_no]的鍵值參數 |
| `permission_denied` | 该用户XXX没有权限 |
| `exec_sql_error` | ExecSQL Error Exception :违反了 PRIMARY KEY 约束 |
| `service_not_registered` | 兜底（含空服务名被误报为令牌问题的情形） |

**注意一处刻意的例外**：`classifyBusinessError` 允许匹配 `description` 文案，
但这与「禁止字符串匹配 description」**不矛盾**——
- 判定**成功**只能看 `code`（`isSuccessCode`），文案繁简混用不可靠；
- 归类**失败原因**可以用文案，目的是把「服务端中文报错」翻译成可编程判断的 `kind`，
  提升可诊断性。两者目的不同，不可混为一谈。

### 2.5 领域对象类型（`types/domain.ts`）

`YfServiceNameResolver` 抽成接口的原因：知识来源可能有三种形态
（YAML 文件 / 内嵌 JSON / 远端拉取），上层只依赖「按 typeKey + operation 查到确切服务名」这一件事。

```ts
export interface YfServiceNameResolver {
  resolveServiceName(typeKey: string, operation: YfOperation): string;  // 未登记必须抛错，不得回落拼接
  findEntry(typeKey: string): YfTypeKeyEntry | undefined;
  listTypeKeys(): readonly string[];
}
```

### 2.6 接口 vs 具体实现

| 抽象 | 实现 | 判定理由 |
|---|---|---|
| `YfServiceNameResolver`（接口） | `TypeKeyCatalog` | 知识来源形态可变（YAML/JSON/远端） |
| `YfTransport`（接口） | `FetchTransport` | 单测需替换；真机验证需注入定制行为 |
| `YfLogger`（接口） | `NOOP_LOGGER` + 调用方实现 | CLI / MCP / 测试三处输出形态不同 |
| `EnvLike`（类型别名） | `process.env` 直接满足 | 避免 SDK 强依赖 `@types/node` |

**刻意不做接口的地方**：`conditions/builder.ts` 与 `response/parser.ts` 全是纯函数，
无状态、无外部依赖，抽象只会增加调用成本。

---

## 3. 目录结构

```
packages/yfcli-sdk/
├── package.json                依赖与脚本声明（已接入 npm workspaces）
├── tsconfig.json                   严格模式：strict + noImplicitAny + noUncheckedIndexedAccess
├── README.md                       SDK 使用说明与约束索引
├── tools/
│   ├── check-skeleton.mjs          门禁级自检（6 项规则，离线可跑）
│   ├── offline-verify.mjs          离线功能自测（60 项，覆盖实测约束）
│   └── normalize-eol.mjs           行尾与编码规范化（UTF-8 无 BOM + CRLF，幂等，含自检）
└── src/
    ├── index.ts                    入口：只做再导出，零业务逻辑
    ├── types/
    │   ├── protocol.ts             易飞协议字节映射（四头/封包/双通道/error 双结构）
    │   ├── conditions.ts           conditions 对象形态递归类型
    │   ├── domain.ts               知识产物投影 + 服务名解析接口
    │   ├── config.ts               配置结构 + 校验结果 + 配置错误
    │   ├── errors.ts               四层错误模型
    │   ├── fields.ts               字段分层（网关注入 7 项vs 物理列；UDF 24 个泛型化）
    │   └── index.ts                类型总出口
    ├── config/
    │   ├── config.ts               fail-fast 校验 + 端点拼接 + 令牌解析
    │   └── headers.ts              四头构造 + 误导性文案翻译
    ├── conditions/
    │   ├── builder.ts              条件构造器（只产易飞形态）
    │   └── enum-guard.ts           枚举编码守卫（拦截静默错误）
    ├── transport/
    │   └── http-transport.ts       唯一网络出口 + 先判状态码
    ├── response/
    │   └── parser.ts               封包收敛 + 成功判定 + 双结构兼容 + 双通道分流
    ├── catalog/
    │   └── typekey-catalog.ts      服务名查表（禁止拼接）
    ├── client/
    │   └── yf-client.ts            编排层
    └── logging/
        └── redact.ts               日志脱敏（阻断 error[].data 回显）
```

> 落位变更（2026-10-08）：本包原按任务描述置于 `scripts/sdk/`，
> 现已迁入 `packages/yfcli-sdk/` 并接入 npm workspaces
> （`node_modules/yfcli-sdk` 为指向本包的软链）。
> 这与 `package.json` 的 `workspaces: ["packages/*"]` 及扩展方案 §3.2 一致。

### 3.1 单文件行数实测

```
 282  src/response/parser.ts
 266  src/client/yf-client.ts
 245  src/conditions/builder.ts
 202  src/catalog/typekey-catalog.ts
 191  src/types/fields.ts
 180  src/config/config.ts
 165  src/types/errors.ts
 142  src/transport/http-transport.ts
 135  src/index.ts
 129  src/conditions/enum-guard.ts
 124  src/logging/redact.ts
 122  src/types/protocol.ts
 118  src/types/conditions.ts
 117  src/types/domain.ts
  86  src/types/index.ts
  81  src/types/config.ts
  54  src/config/headers.ts
```

共 17 个 TS 文件。最长 282 行，距 300 行上限余量 18 行。
`parser.ts` 已接近上限，后续若加功能须先拆文件（建议按「封包解析」与「错误归类」拆为两文件）。

---

## 4. 硬约束在代码中的落点

| 硬约束 | 落点文件与机制 |
|---|---|
| 入口大小写敏感 | `config/config.ts` 的 `YF_ENDPOINT_PATH` 常量 + `baseUrl` 校验拒绝含路径的配置 |
| 四头必填 | `config/headers.ts` 的 `buildHeaders` 一次性构造四个头 |
| `digi-datakey` 易飞独有 | `types/protocol.ts` 的 `YfDataKey` + `buildHeaders` 内`JSON.stringify({ CompanyId })` |
| 封包 `std_data` → `parameter` | `client/yf-client.ts` 的 `wrap()` |
| 成功判据只看 code | `protocol.ts` 的 `YF_SUCCESS_CODES` + `parser.ts` 的 `isSuccessCode` |
| HTTP 500 返回 HTML | `transport/http-transport.ts` 的 `assertHttpOk` 在解析 body **之前**抛错 |
| `conditions` 对象形态 | `conditions/builder.ts` 只产出对象形态 + `assertNotYiZhuConditionsShape` 显式拒绝数组形态 |
| `node_name` 用逻辑节点名 | `conditions/builder.ts` 的 `field(name, op, value, nodeName)`；文档注释写明「不可改用物理表名」 |
| 枚举回参与查询值不同 | `conditions/enum-guard.ts` 的 `looksLikeCodeText` / `guardEnumConditionValue` |
| 主键全错返回空数组 | `client/yf-client.ts` 的空结果 WARN + `response/parser.ts` 的 `describeEmptyResultWarning` |
| `error[]` 双结构 | `response/parser.ts` 的 `parseErrorEntries`，未识别抛 `unknown_error_item` |
| `error[].data` 回显 | `logging/redact.ts` 的 `redactErrorData` + `types/errors.ts` 的注释警示 |
| 服务名禁止拼接 | `catalog/typekey-catalog.ts` 只查表，未登记即抛错 |
| `page_size` 上限 10000 | `protocol.ts` 的 `YF_PAGE_SIZE_MAX` + `builder.ts` 的 `pagination` 硬校验 |
| 无 fastquery | `client/yf-client.ts` 日志注释 + `builder.ts` 的 `pagination` 注释说明代价 |
| `selectedColumns` 裁剪 | `conditions/builder.ts` 的 `queryParameter`，undefined 时不写入该键 |
| 配置 fail-fast | `config/config.ts` 的 `assertValidConfig` + `resolveRuntimeConfig` |

---

## 5. 实施步骤

每步可独立验证，不满足验收标准不进入下一步。

### 步 1：类型层落地（types/）

**动作**：6 个类型文件。
**验收**：`npm run typecheck` 通过；`types/` 内零运行时逻辑（仅常量导出）。

### 步 2：配置层落地（config/）

**动作**：`config.ts` + `headers.ts`。
**验收**：
- 缺 `servicePrefix` / `companyId` / 令牌 →抛 `YfConfigError`，`violations` 含具体字段名与原因
- `baseUrl` 含路径 → 拒绝并说明「入口路径由 SDK 拼接」
- `servicePrefix` 传 `yz.` → 拒绝并提示「应另建 yzcli-sdk」
- 令牌只从 `env[tokenEnvVar]` 取，配置结构中无令牌字段

### 步 3：条件构造层落地（conditions/）

**动作**：`builder.ts` + `enum-guard.ts`。
**验收**：
- `between('a','x','y')` → `value === "'x' AND 'y'"`
- `inList('a',['1','2'])` → `value === "('1','2')"`
- `allRecords()` → `{ operator: 'and', fields: [] }`
- `assertNotYiZhuConditionsShape([{ groups: [] }])` → 抛错并指出应改用 `group()`
- `pagination(1, 10001)` → 抛错（上限 10000）
- `guardEnumConditionValue(spec, 'Y.已审核', true)` → 抛错并给出应传`'Y'`
- `extractCode('Y.已审核')` → `'Y'`
- `extractCode('1')` → `'1'`（数字型枚举不受影响）

### 步 4：响应解析层落地（response/）

**动作**：`parser.ts`。
**验收**：
- `code='0'` 与 `code='-0'` 均判成功；`code='-1'` 判失败
- `description='查詢成功'`（繁体）不影响成功判定
-结构 A（`{message,data}`）与结构 B（`{information:[...]}`）均能解析
- 第三种结构 → 抛 `kind='unknown_error_item'`，不静默吞掉
- `execution.code` 缺失 → 抛 `protocol` 层错误，**不默认成功**
- 错误文案含 `MA012` → `kind='node_not_registered'`；含 `找不到資料表` → `kind='field_not_found'`

### 步 5：传输层落地（transport/）

**动作**：`http-transport.ts`。
**验收**：
- `assertHttpOk({status:500, preview:'<title>500...'})` 抛 `kind='token_invalid'`，提示不解析 JSON
- AbortError → `kind='timeout'`；其他异常 → 传输层错误并提示「勿走代理」
- 记录 `elapsedMs`（无 fastquery，延迟必须可见）

### 步 6：目录层落地（catalog/）

**动作**：`typekey-catalog.ts`。
**验收**（用真实 `knowledge/typekey/typekey_map.yaml` 验证）：
- `resolveServiceName('customer','query')` → `yf.oapi.customer.data.query.get`
- `resolveServiceName('supplier','query')` → `yf.oapi.supplier.query.get`（**无 .data 段**，证明未拼接）
- 未登记 type_key → 抛错，含「勿按规律推导」提示
- 已标记 `unavailable` 的对象 → 拒绝调用
- `countServices()` 与 YAML 头部 `services_unique: 595` 交叉校验

### 步 7：客户端编排落地（client/）

**动作**：`yf-client.ts`。
**验收**：
- `query` 走 `rows` 通道，`action` 走 `success` 通道
- `datakeys` 缺主键字段 → **本地**抛 `kind='primary_key_missing'`（不等服务端报错）
- 主键类返回空数组 → `warnOnSilentError=true` 时输出 WARN
- `write('create'|'update')` → 抛错并说明「真机未验证，T-14 后开放」

### 步 8：脱敏层落地（logging/）

**动作**：`redact.ts`。
**验收**：
- `{ digi_user_token: '...' }` → `{ digi_user_token: '<已脱敏>' }`
- 48 位十六进制串 → `abc***xyz` 形态
- 超长字符串截断并标注原长度
- 递归深度超限 → 占位符替代，不栈溢出

### 步 9：入口 + 门禁

**动作**：`index.ts` + `tools/check-skeleton.mjs` + `README.md`。
**验收**：
- `npm run check:skeleton` → PASS（6 项规则全过）
- `npm run typecheck` → 0 error
- `npm run check:offline` → 60 项全过
- `src/index.ts` 只含 export 语句

### 步 10：行尾与编码规范化

**动作**：`tools/normalize-eol.mjs`。
**验收**：`node tools/normalize-eol.mjs --check` → PASS（22 文件全部 UTF-8 无 BOM + CRLF）；脚本幂等，重复执行无变更。

---

## 6. 验证方式

| 层级 | 命令 | 门槛 |
|---|---|---|
| 骨架门禁 | `npm run check:skeleton` | 6 项规则全过（行数/any/emoji/占位/依赖方向/敏感值） |
| 静态检查 | `npm run typecheck` | 0 error，`strict` + `noImplicitAny` + `noUncheckedIndexedAccess` 全开 |
| 离线功能自测 | `npm run check:offline` | 60 项全过 |
| 编码规范 | `node tools/normalize-eol.mjs --check` | 22 文件全部 UTF-8 无 BOM + CRLF |
| 合并检查 | `npm run check` | 前三项均通过 |

实测结果见 §10。

---

## 7. 后续任务的边界

### 7.1 归属划分

| 事项 | 归属 | 理由 |
|---|---|---|
| OpenAPI HTTP 调用层 | 本次 SDK | 核心能力，已实测验证 |
| 配置管理（base_url / company_id / token） | 本次 SDK | 无外部依赖 |
| 条件构造器（`conditions` 对象形态） | 本次 SDK | 已实测验证 |
| 响应解析 + 错误模型 | 本次 SDK | 已实测验证，含双结构 error[] |
| 服务名查表解析器 | 本次 SDK | `typekey_map.yaml` 已在库 |
| 枚举编码守卫 | 本次 SDK | 纯本地逻辑，规则已实测 |
| 日志脱敏 | 本次 SDK | 纯本地逻辑 |
| MCP 工具封装（`yfcli_*`） | 后续 | 依赖 MCP SDK 选型（OPEN未裁） |
| 直连 SQL 只读库（analysis 层） | **后续，且需先确认** | 见 §7.2 |
| 枚举/代码表码值采集 | 后续（T-07） | 需 981 次真机 query 或厂商提供代码表 |
| 契约自学习（`learn-erp-contracts`） | 后续 | 依赖真机验证数据积累 |
| 写操作（create/update/delete/approve） | 后续（T-14） | 真机仅覆盖只读操作 |
| `item.inventory.qty` 对象 | 不可用 | 服务端 DLL 崩溃（`OAPComF2.exe` Access violation），已向厂商报缺陷 |
| 43 个 MA012 节点名 | 阻塞中 | 需易飞服务端确认是否已在 OAPMA 注册 |

### 7.2 直连数据库：**已裁决走 analysis 层**（2026-10-09）

> **原状态**：OPEN 项，待评估。
> **现状态**：用户裁定采用与 YZCLI 相同的双通道架构 —— CRUD 走 OpenAPI，分析聚合走数据库直连。
> 完整实测记录见 `docs/plans/yf-db-direct-connect-probe.md`。

**已验证前提**（实测 `172.16.2.86 / {CompanyId}`）：

- 连通可达：SQL Server 2014 (SP2)，1211 张表，仅 `dbo` 单 schema
- **库表名与数据字典 100% 一致**（52 组 3 位前缀交叉比对全部一致），无需映射层
- 字段元数据可经 `INFORMATION_SCHEMA.COLUMNS` 直查
- 易飞**无** `vw_ai_*` 分析视图（仅 4 个业务视图），需照易助视图改写后由客户 DBA 执行

**视图设计裁决**：视图**不带 `COMPANY` 过滤** —— 该字段为预留管理字段（无业务含义），
易飞架构为「独立公司账套」，不存在一表多账套。

**遗留评估项**（原 6 维度中仍需推进）：

| 维度 | 结论 |
|---|---|
| 权限申请 | ✅ 已获只读账号 |
| 数据一致性 | ⚠️ OpenAPI 枚举回传 `编码.中文`，SQL 得原始值，口径不同 —— analysis 层须标注 |
| 安全边界 | ⚠️ 直连绕过 OpenAPI 权限模型，需向厂商确认是否允许 |
| 稳定性 | ⚠️ `item.inventory.qty` 已触发 `OAPComF2.exe` 崩溃（OpenAPI 侧问题，不影响 SQL） |
| 运维成本 | 待 T-13 按 `config.ts` 3 条红线落地后评估 |

**原倾向性意见作废**：曾主张「若 OpenAPI 性能可接受则不引入直连」。
用户裁定与 YZCLI 保持一致，**引入 analysis 层**。

**验收前提**：目标场景数据量与 QPS 仍待确认 —— 这影响模板设计（分页策略、超时上限），
不影响是否引入。

---

## 8. 风险与对策

| # | 风险 | 等级 | 对策 |
|---|---|---|---|
| 1 | `parser.ts` 已 282 行，距上限仅 18 行 | 中 | 后续加功能前先拆文件 |
| 2 | 写操作路径未验证却可能被误用 | 高 | `YfClient.write` 显式抛错并指明后续任务号 |
| 3 | 枚举守卫依赖调用方主动调用 | 中 | 上层查询入口强制走守卫；CLI 层加测试断言 |
| 4 | 43 个 MA012 节点名导致 `node_name` 查询失败 | 中 | 已在错误模型中归类为 `node_not_registered`，可精确识别；等厂商确认 |
| 5 | `typekey_map.yaml` 若被手工改动，查表结果失真 | 中 | 已有 `npm run check:typekey` 门禁（`--check` 三类校验） |
| 6 | `packages/yfcli-sdk/` 已按仓库 workspaces 约定落位 | 低 | 已接入 `workspaces: ["packages/*"]`，自带 tsconfig；后续统一 tsconfig 时合并 |
| 7 | 只读账套数据量小，性能结论不可靠 | 中 | 性能结论一律标注「基于小账套」，待大账套复测 |
| 8 | ~~`typekey_map.yaml` 有重复键~~ | 已解决 | 上游已修抽取脚本，严格 YAML 解析现已 PASS（见 §10.3 发现 1） |
| 9 | ~~`no_data_segment` 对象级标记误标~~ | 已解决 | 上游已改为 `service_name_shape` 三态标记（见 §10.3 发现 2） |
| 10 | `bom` 同操作存在两个合法服务名，产物只保留一个 | 中 | 头部声明 595 与产物 593 的差值根因已定位（见 §10.3 发现 3）；SDK 逐操作查表，取到的是后写入的那个 |

---

## 9. 后续任务建议顺序

| 序 | 任务 | 前置 | 产出 |
|---|---|---|---|
| 0 | 修抽取脚本两处缺陷（重复键 / `no_data_segment` 误标） | 无 | `typekey_map.yaml` 重新生成 + `--check` 复验 |
| 1 | T-14 真机验证写操作 | 测试账套 + 厂商确认 | 写操作约束实测报告，开放 `YfClient.write` |
| 2 | T-07 枚举/代码表采集 | 981 次真机 query 或厂商提供 | `knowledge/enums/enums.yaml` |
| 3 | MA012 节点名厂商确认 | 提交 43 个节点清单 | 节点名可用清单 |
| 4 | SDK 真机回归 | 步 1~3 | 复用 `probe-live-env.mjs` 15 项用例的验证报告 |
| 5 | MCP 工具封装 | MCP SDK 选型裁决 | `yfcli_*` 工具集 |
| 6 | OpenAPI 性能复测 | 大数据量账套 | 天花板数据，支撑 §7.2 裁决 |
| 7 | analysis 层直连库裁决 | 步 6 结论 + 权限申请 | ADR 或「不引入」决议 |

---

## 10. 验证结果

### 10.1 实测通过项

| 检查 | 命令 | 结果 |
|---|---|---|
| 骨架门禁 | `npm run check:skeleton` | PASS，17 个 TS 文件 0 违规 |
| 单文件行数 | 同上输出 | 最长 `src/response/parser.ts` 282 行（上限 300，余量 18） |
| 类型编译 | `npm run typecheck` | **0 error**（`strict` + `noImplicitAny` + `noUncheckedIndexedAccess` + `noImplicitOverride` + `noFallthroughCasesInSwitch`） |
| 离线功能自测 | `npm run check:offline` | **60/60 通过** |
| 编码与行尾 | `npm run check:eol` | 23 文件全部 UTF-8 无 BOM + CRLF；脚本幂等，且**自检已验证可拦截真实脏文件** |
| 合并检查 | `npm run check` | 上述四项串联全绿 |
| `any` 用量 | 门禁规则 2 | 0 处 |
| emoji | 门禁规则 3 | 0 处 |
| 模板占位 | 门禁规则 4 | 0 处 |
| 硬编码账套/令牌/内网 IP | 门禁规则 6 | 0 处 |
| 仓库级敏感扫描 | `node scripts/scan-secrets.mjs` | PASS，257 文件 0 命中 |
| 仓库级产物门禁 | `npm run check:all` | PASS（确认未改动 `knowledge/`） |

### 10.2 离线自测覆盖的实测约束（抽样）

| 约束 | 用例 | 结果 |
|---|---|---|
| `conditions` 必须是对象形态 | `allRecords()` 返回 `{operator,fields:[]}` 且 `Array.isArray === false` | PASS |
| 拒绝易助数组形态 | `assertNotYiZhuConditionsShape([{groups:[]}])` 抛错并指向 `group()` | PASS |
| `BETWEEN` 需 SQL 片段 | `between('doc_no','A','B')` → `"'A' AND 'B'"` | PASS |
| `IN` 需引号列表 | `inList('item_no',['000','001'])` → `"('000','001')"` | PASS |
| 空 IN 返回 0 条且 code=0 | `inList('item_no',[])` 抛错 | PASS |
| `EXISTS` 的 `field_name` 留空 | `field('item_no','EXISTS',...)` 抛错 | PASS |
| `page_size` 上限 10000 | `pagination(1,10001)` 抛错 | PASS |
| 枚举「编码.中文」形态识别 | `looksLikeCodeText('Y.已审核') === true`；`'Y'` / `'1'` / `'00WKTEST'` 均 false | PASS |
| 枚举守卫拦截并给正确值 | `guardEnumConditionValue(spec,'Y.已审核',true)` 抛错且提示应传 `"Y"` | PASS |
| 成功只看 code | `code='0'` 与 `'-0'` 均成功；繁体「查詢成功」不影响判定 | PASS |
| `execution.code` 缺失不默认成功 | 抛 `protocol` 层错误 | PASS |
| `error[]` 双结构 | 结构 A（`{message,data}`）与结构 B（`{information:[]}`）均解析成功 | PASS |
| 未识别 error 结构不静默吞 | 第三种结构抛 `kind='unknown_error_item'` | PASS |
| `MA012` 与 `找不到資料表` 分别归类 | 分别得 `node_not_registered` / `field_not_found` | PASS |
| 双数据通道 | 查询读 `rows`（cnt=2/total=2），主键类读 `success`（空则 `empty=true`） | PASS |
| HTTP 500 返回 HTML | `assertHttpOk({status:500})` 抛 `token_invalid` 且提示「勿尝试解析 JSON」 | PASS |
| 四头齐备且值形态正确 | `digi-service` / `digi-datakey` 为 JSON 字符串，`digi-user-token` 原样 | PASS |
| 端点大小写敏感 | 拼接结果为 `.../YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost` | PASS |
| 配置 fail-fast | 缺 `servicePrefix` / `companyId` / 令牌均抛 `YfConfigError` | PASS |
| 易助前缀被拒 | `servicePrefix='yz.'` 报错并指向「另建 yzcli-sdk」 | PASS |
| `baseUrl` 含路径被拒 | 报错说明「入口路径由 SDK 拼接」 | PASS |
| 空服务名误导性提示翻译 | `explainMisleadingAuthMessage` 返回「勿据此排查令牌」 | PASS |
| `error[].data` 脱敏 | 令牌键整体脱敏；48 位十六进制串掩码；超长文本截断并标注原长 | PASS |
| 递归深度超限不栈溢出 | 8 层嵌套以「深度超限」占位 | PASS |
| 网关注入 7 字段齐备 | `GATEWAY_INJECTED_FIELD_NAMES` 与文档 §6.4 一致 | PASS |
| UDF 泛型化 | 12 文本 + 12 数值 = 24，互不重叠；`udf13` / `udf50` 判为非 UDF；易助 `udf_text*` 不混入 | PASS |
| 剥离网关注入字段 | `stripGatewayInjectedFields` 输出去掉 7 项后的物理列视图 | PASS |
| 写入预检不可赋值字段 | `findUnassignableFields` 识别 `creator` / `flag` / `modi_date` | PASS |
| 非 ISO 时间戳解析 | `20250305181000333` 解析为正确年月日时分秒；ISO 串与短串返回 undefined | PASS |
| 严格 YAML 解析 | 产物重复键已修，`YAML.parse` 不带 `uniqueKeys:false` 亦通过（回归即失败） | PASS |
| 服务名逐条原样返回 | 与 `typekey_map.yaml` 逐字段比对 **593 条全等** | PASS |
| 声明 595 与实际 593 的差值 | 断言差值恒为 2（见 §10.3 发现 3），超出即报漂移 | PASS |
| 无 query 服务对象 | `item.count` 调 query 抛「无 query 服务」而非返回拼接值 | PASS |
| `service_name_shape` 三态自洽 | 逐对象比对形状与标记一致（standard / mixed / 全无段） | PASS |
| 混合形态对象逐操作核对 | `bom` 4 个服务名 + `supplier` 3 个服务名逐条锁定，含 `supplier.query.get` 无 `.data` 而 `supplier.data.create` 有 | PASS |
| 无 `.data` 段对象按真机核对 | `document.type.general` / `function.category` / `supplier` 三者均无 `.data` 段 | PASS |
| `unavailable` 对象拒绝调用 | `item.inventory.qty`（DLL 崩溃）被拦截 | PASS |
| 未登记 type_key 抛错 | 提示「勿按规律推导」 | PASS |
| 对象无该操作时抛错 | 列出该对象已有服务 | PASS |

### 10.3 实施过程中发现的既有产物缺陷

> 状态更新：发现 1 与发现 2 已由上游修复（产物已重新生成并通过严格 YAML 解析）；
> 发现 3 为新发现，根因已精确定位，待上游裁决。

**发现 1：`typekey_map.yaml` 存在重复键（阻断严格 YAML 解析）—— 已解决**

- 原位置：`knowledge/typekey/typekey_map.yaml:224-225`（`company.detail`）与 `:299-300`
- 原现象：
  ```yaml
  primary_key: []
  primary_key: [company_no]   # 真机探测反推
  ```
- 成因：抽取脚本先写空数组，真机探测反推后又追加一行，形成同键重复。
- 影响：曾使严格 YAML 解析器（`yaml` 库默认 `uniqueKeys: true`）直接抛错。
- **修复状态：已解决。** 产物重新生成后严格解析 PASS（实测 106 个 type_key 全部可解析），
  `awk` 独立扫描确认无同块内重复 `primary_key`。

**发现 2：`no_data_segment` 是对象级标记，对混合形态对象不可靠 —— 已解决**

- 原位置：`scripts/extract-typekey-map.mjs:239`
- 原成因：`has_data_segment: svc.includes('.data.')` 中的 `svc` 是该对象
  **第一个被遍历到的服务名**（`sample_service`）。当同一对象的服务名形态混合时，
  整个对象会被误标或漏标。
- 原实测：`bom` 被标 `no_data_segment: true`，但其 8 个服务名中有 2 个
  （`query` / `read`）确实含 `.data` 段。
- **修复状态：已解决。** 上游改为按操作分别计数，输出三态标记：
  ```
  service_name_shape: standard   # 全部 N 个服务名均带 .data 段
  service_name_shape: mixed      # 混合形态：N 个带 / M 个不带，**不可拼接服务名**
  ```
  实测分布：`standard` 99 个、`mixed` 2 个、无标记 5 个。
  `bom` 现正确标为 `mixed`（6 个带 / 16 个不带）。
  文档中「6 个无 `.data` 段的对象」这一表述应随之修正为「2 个混合形态对象」。

**发现 3：`bom` 同操作存在两个合法服务名，产物只保留一个（待上游裁决）**

- 现象：产物头部声明 `services_unique: 595`，但 `services` 字段去重后只有 **593** 个。
- 根因（已从源文档 `docs/易飞OpenAPI.json` 复刻抽取逻辑逐步定位）：
  `scripts/extract-typekey-map.mjs:249` 的 `rec.services[op] = svc` **以操作名为键**，
  而 `bom` 的 `query` 与 `read` 各有两个合法服务名同时存在：

  | 键 | 服务名 A | 服务名 B |
  |---|---|---|
  | `bom \| query` | `yf.oapi.bom.query.get` | `yf.oapi.bom.data.query.get` |
  | `bom \| read` | `yf.oapi.bom.read.get` | `yf.oapi.bom.data.read.get` |

  遍历时后写入者覆盖先写入者，`query` 与 `read` 各丢失 1 个候选，
  故 595 - 2 = 593。
  实测各服务名在源文档中的出现次数：`bom.query.get` 2 次、
  `bom.data.query.get` 3 次（另 bom.read.get 2 次、`bom.data.read.get` 3 次）——
  即两个键各有多个叶子节点指向**不同**的服务名，属真冲突而非重复。
- 已排除的其他可能：源文档 106 个业务对象与产物 106 个**完全一致**（无对象丢失）；
  `unparsable_services` 为空数组；产物内 `(obj|op)` 无键冲突。
- 影响面：
  - SDK **不会报错**，但 `resolveServiceName('bom','query')` 只能返回两个中的一个，
    取到哪个取决于源文档中的遍历顺序 —— 这是一个**不可预测的行为**。
  - 真机验证记录（`docs/plans/yf-live-probe-report.md` §七）显示
    `yf.oapi.bom.data.query.get` 返回 `code=0`，故当前产物保留的应是 `.data` 版本；
    但「靠遍历顺序决定用哪个服务名」本身不可接受。
- 建议修法（三选一，需上游裁决）：
  1. `services` 值改为数组，保留同操作的全部候选服务名；
  2. 新增 `services_alt` 字段存放被覆盖的候选；
  3. 若确认 `bom` 的两个服务名都可用，则在 SDK 侧提供「候选服务名 + 失败重试」机制。
- SDK 侧现状：`TypeKeyCatalog` 只读 `services[op]` 单值，
  离线用例「服务名逐条原样返回」已锁定当前行为（与产物一致）。
  若上游采纳方案 1 或 2，需同步扩展 `YfTypeKeyEntry.services` 的类型。

### 10.4 未验证项（明确声明）

本阶段全部产出为**静态骨架 + 离线自测，尚未连接真机环境**。
所有协议行为均来自既有实测文档，实现完成后需以真机回归验证
（建议复用 `scripts/probe-live-env.mjs` 的 15 项用例 + `verify-node-names.mjs`）。