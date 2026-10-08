# yfcli-sdk —— 易飞（E10）OpenAPI SDK

易飞产品线的 OpenAPI 调用层。设计依据全部来自真机实测，
权威来源见「约束来源」一节。

**当前状态：工程骨架 + 离线自测全绿，尚未连接真机环境。**

---

## 快速上手

```ts
import {
  resolveRuntimeConfig,
  buildHeaders,
  YfClient,
  TypeKeyCatalog,
  allRecords,
  between,
  pagination,
  queryParameter,
} from './src/index.js';

// 1. 配置（fail-fast：缺项立即抛 YfConfigError）
const config = resolveRuntimeConfig(
  {
    baseUrl: process.env.YF_BASE_URL ?? '',
    companyId: process.env.YF_COMPANY_ID ?? '',
    tokenEnvVar: 'YF_USER_TOKEN',
    servicePrefix: 'yf.',
    timeoutMs: 30000,
    warnOnSilentError: true,
  },
  process.env,
);

// 2. 服务名查表（禁止拼接）
const catalog = new TypeKeyCatalog(yamlParse(yamlText));

// 3. 构造条件（只产易飞对象形态）
const conditions = allRecords();
const paged = pagination(1, 200);
const parameter = queryParameter({ conditions, page: paged });

// 4. 调用
const client = new YfClient({ config, catalog });
const result = await client.query('customer', parameter);
console.log(result.rows.length, result.totalResult);
```

---

## 目录与职责

| 路径 | 职责 |
|---|---|
| `src/types/` | 协议字节映射、条件类型、领域类型、配置类型、错误模型、字段分层（网关注入 vs 物理列）。零运行时逻辑 |
| `src/config/` | fail-fast 校验 + 端点拼接 + 四头构造 + 误导性文案翻译 |
| `src/conditions/` | 条件构造器（只产易飞形态）+ 枚举编码守卫 |
| `src/transport/` | 唯一网络出口。先判HTTP 状态码，非200 不解析 body |
| `src/response/` | 封包收敛 + 成功判定 + `error[]` 双结构兼容 + 双通道分流 |
| `src/catalog/` | 从 `typekey_map.yaml` 查服务名。未登记即抛错，不回落拼接 |
| `src/client/` | 编排层。串联上述各层 + 空结果告警 + 主键覆盖校验 |
| `src/logging/` | 日志脱敏。阻断 `error[].data` 回显泄漏 |
| `src/index.ts` | 入口。只做再导出，零业务逻辑 |

依赖方向只向下。`tools/check-skeleton.mjs` 会扫描反向 import 并拦截。

---

## 关键约束与代码落点

| 约束 | 落点 |
|---|---|
| 入口路径大小写敏感 | `config/config.ts` 的 `YF_ENDPOINT_PATH` |
| 四头必填（含 `digi-datakey`） | `config/headers.ts` 的 `buildHeaders` |
| 成功只认 `code === '0' \|\| '-0'` | `response/parser.ts` 的 `isSuccessCode` |
| HTTP 500 返回 HTML 而非 JSON | `transport/http-transport.ts` 的 `assertHttpOk`（在解析 body 之前） |
| `conditions` 必须是对象形态 | `conditions/builder.ts` + `assertNotYiZhuConditionsShape` |
| `node_name` 用逻辑节点名（`*_data`） | `conditions/builder.ts` 的 `field(..., nodeName)` |
| 枚举回参「编码.中文」不能当查询值 | `conditions/enum-guard.ts` |
| 主键全错返回 `code=0` + 空数组 | `client/yf-client.ts` 空结果 WARN |
| `error[]` 双结构 | `response/parser.ts` 的 `parseErrorEntries` |
| 服务名禁止拼接 | `catalog/typekey-catalog.ts` |
| `page_size` 上限 10000 | `types/protocol.ts` + `conditions/builder.ts` |
| 配置 fail-fast | `config/config.ts` 的 `assertValidConfig` |

完整对照表见 `docs/plans/phase1-sdk-plan.md` §4。

---

## 检查命令

```bash
cd packages/yfcli-sdk
npm install          # 仓库根已装好 workspace 时可跳过

npm run check:skeleton   # 骨架门禁：行数/any/emoji/占位/依赖方向/敏感值
npm run typecheck        # tsc --noEmit，strict 全开
npm run check:offline    # 60 项离线功能自测
npm run check:eol        # 行尾编码自检（含脏文件自验证）
npm run check            # 四项全跑
```

四项均不需真机环境，不需令牌。

`check:eol` 会先在系统临时目录构造一个「BOM + 混合行尾」的脏文件，
确认自身能识别并修正，再校验真实产物 ——
**门禁自身的失败路径必须被验证过，否则它等于摆设**。

---

## 已知限制

| 限制 | 说明 |
|---|---|
| 写操作未开放 | `YfClient.write('create' \| 'update')`显式抛错。真机仅验证只读操作；易飞 `update` 另有五条约束（单身须含所有输入字段、不支持删除单身、单头单身 key 必须一致等）。待 T-14 真机验证后开放 |
| `item.inventory.qty` 不可用 | 服务端 `OAPComF2.exe` DLL 内存访问崩溃（Access violation），已向厂商报缺陷 |
| 43 个 `*_data` 节点名报 MA012 | 该节点未在服务端 OAPMA 注册表登记，等厂商确认。错误模型已归类为 `node_not_registered` 可精确识别 |
| 枚举码值表未采集 | `enum-guard.ts` 只做形态识别与剥离，不做「编码是否有效」的校验。有效码值需 T-07 采集 |
| 未接真机 | 全部协议行为来自既有实测文档，实现完成后需真机回归（建议复用 `scripts/probe-live-env.mjs` 的 15 项用例） |
| 未接入 npm workspaces | 本阶段自带 `tsconfig.json` 与独立依赖。迁入 `packages/yfcli-sdk` 时接入 |

---

## 约束来源

| 文档 | 提供什么 |
|---|---|
| `AGENTS.md`「真机实测硬约束」章节 | 最高优先级行为约束 |
| `docs/plans/yf-openapi-rules.md` | 协议规则体系（§11 为真机实测补充） |
| `docs/plans/yf-live-probe-report.md` | 15 项真机探测结论 |
| `docs/plans/probe-pk-and-node-name-answers.md` | 主键反推与 `node_name` 结论修正 |
| `knowledge/typekey/typekey_map.yaml` | 服务名的唯一权威来源（禁止拼接） |
| `docs/plans/phase1-sdk-plan.md` | 本包的模块划分、类型设计、实施步骤与边界划分 |

---

## 术语说明

- **账套 / CompanyId** —— 易飞的多公司别编号，写入 `digi-datakey` 头。易助无此机制
- **type_key** —— 业务对象的稳定键，如 `purchase.order`。**不等于**服务名
- **逻辑节点名** —— `*_data` 形态的 API 层节点名，用作 `node_name`。**不是**数据库物理表名
- **数据通道** —— 易飞有两套回参结构：查询走 `result.rows`，主键类走 `result.success`