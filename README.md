# YFCLI — 易飞（YF / E10）产品线 AI 助手

> 对标 [YZCLI](https://github.com/)（易助 ERP 产品线）的独立仓库。
> **易飞与易助同属鼎捷（Digiwin）产品体系**，但 OpenAPI 方言差异较大，故采用完全隔离架构。

---

## 仓库定位

| 维度 | 说明 |
|---|---|
| **产品线** | 易飞 YF（E10），非 E10 Cloud，非雅典娜 |
| **上游依据** | `易飞OpenAPI.json`（Apipost 导出，2120 接口节点 / 595 服务名 / 106 业务对象） |
| **对标产品线** | 易助（YZCLI，`digiwin.com` 体系，110 TypeKey） |
| **架构决策** | 三仓隔离：本仓（易飞业务知识与产物）/ `erp-core`（共享引擎与商业化）/ `YZCLI`（易助，不动） |

### 为什么不与 YZCLI 合仓

易飞与易助的 OpenAPI 存在**无法靠配置消解**的方言差异：

1. `conditions` 结构完全不同 —— 易飞是对象嵌套 `group`，易助是数组嵌套 `groups`；**结构不匹配时服务端静默返回全量、不报错**
2. 易飞**无 `fastquery`**（仅 `query.get`，每次重查数据库），易助的性能优化经验不可复用
3. 服务前缀 `yf.` / `yz.`、读取操作名 `read` / `get`、账套传递方式均不同

详见 `docs/plans/yf-vs-yizhu-openapi-diff.md`（31 维度差异对照）。

---

## 目录结构

```
YFCLI/
├── docs/
│   ├── 易飞OpenAPI.json          ← ⚠️ 不入库（含内网 IP / token 明文 / 账套名）
│   ├── plans/                    方案与规划文档
│   └── decisions/                决策记录（ADR + OPEN-DECISIONS）
├── knowledge/                    知识资产（构建期输入 = 源）
│   ├── typekey/                  TypeKey 映射表（脚本生成）
│   ├── typekey-mapping/          字段对照表（脚本生成，106 个对象）
│   └── official/                 官方文档原件（待收集，_raw/ 不入库）
├── scripts/                      抽取与校验脚本
├── packages/                     代码包（Phase 1 起）
├── skills/yifei-erp/             Skill 包（Phase 1 起）
├── experts/                      职能专家包（Phase 2 起）
└── config/                       配置模板（仅 .example 入库）
```

---

## 快速开始

```bash
# 依赖（当前无运行时依赖，仅需 Node 20+）
npm install

# 生成全部知识产物
npm run gen:all

# 校验产物是否为最新（CI 门禁）
npm run check:all
```

### 前置：准备源文件

两个抽取脚本都依赖 `docs/易飞OpenAPI.json`（46.5 MB，**不入库**）。需单独获取：

- 来源：Apipost 项目 `322f10`（易飞OpenAPI）导出
- 存放：`docs/易飞OpenAPI.json`
- 校验：`node scripts/extract-typekey-map.mjs` 输出的 `services_unique` 应为 **595**

---

## 两条抽取脚本

| 脚本 | 输入 | 输出 | 关键能力 |
|---|---|---|---|
| `scripts/extract-typekey-map.mjs` | 48 MB JSON | `knowledge/typekey/typekey_map.yaml`（106 对象 / 595 服务名 / 101 主键） | 复合主键识别、`no_data_segment` 标记 |
| `scripts/extract-field-metadata.mjs` | 同上 | `knowledge/typekey-mapping/*.md`（106 对照表 / 12,893 字段） | 单头/单身分层、必填三态判定、文档异常标注 |

两者均支持 `--check` 作 CI 门禁（内容指纹比对，篡改/缺失/过期均能检出）。

---

## 当前进度

| 阶段 | 状态 | 说明 |
|---|---|---|
| Phase 0 资料准备与基线冻结 | 🔄 进行中 | 见 `docs/decisions/OPEN-DECISIONS.md` |
| Phase 1 最小可跑链路 | ⏸ 未开始 | sdk + mcp + 3 助手 |
| Phase 2 能力扩展 | ⏸ 未开始 | analysis 层 + 31 助手 |
| Phase 3 商业化治理 | ⏸ 未开始 | 双产品线 knowhow 分组 |

---

## 关键文档

| 文档 | 内容 |
|---|---|
| `docs/plans/yfcli-product-line-extension-plan.md` | 扩展方案主文档（三仓架构 / 复用策略 / 分阶段落地） |
| `docs/plans/yf-openapi-rules.md` | 易飞 OpenAPI 规则体系提取（含 10 项「文档未说明」） |
| `docs/plans/yf-vs-yizhu-openapi-diff.md` | 易飞 vs 易助 31 维度差异对照 |
| `docs/plans/yf-openapi-integration-recommendations.md` | 统一规则落地建议（改造点 / 阻塞项） |
| `docs/plans/yf-materials-collection-checklist.md` | 资料收集清单（16 类 / P0-P2 分级） |
| `docs/plans/yf-materials-tasks.md` | 资料收集**任务化清单**（含负责人 / 时间 / 交付物） |
| `docs/decisions/OPEN-DECISIONS.md` | 全部开放项与裁决状态 |

---

## 红线

1. **禁止向仓库提交任何凭证** —— token、账套名（`CompanyId`）、内网 IP 一律不入库
2. **`knowledge/typekey/` 与 `knowledge/typekey-mapping/` 是脚本产物，禁止手工编辑** —— 改了就跑 `npm run gen:all` 重新生成
3. **禁止猜测字段名** —— 字段一律查 `knowledge/typekey-mapping/{type_key}.md`
4. **易飞无字段编号体系** —— 勿套用易助的「字段编号」概念
5. **自研字段名两套互斥** —— 易飞 `udf01~udf12`/`udf51~udf62`，易助 `udf_text1~16`/`udf_no1~16`，**混用即幻觉**
