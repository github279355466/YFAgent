# knowledge/ — 知识资产目录规划

> 更新时间：2026-10-09
> 总大小：60.3 MB `[口径：Get-ChildItem -Recurse 实测]`

---

## 一、文件分类（三类）

### 🔵 A 类：一次性数据源（构建期输入，程序不直接读取）

从易飞服务端 / Apipost / 数据库导出的原始文件。**只用于脚本抽取，抽取完成后程序不再访问**。
部署到客户服务器时**不需要 copy**。

| 文件/目录 | 大小 | 来源 | 被谁消费 | 产出 |
|---|---|---|---|---|
| `docs/sources/ADMMD-字段信息.xml` | 24.6 MB | 易飞数据库导出 | `gen_data_dictionary.py` | `data-dictionary/field-index.csv` 等 |
| `docs/sources/ADMMC-表名信息.xml` | 0.5 MB | 易飞数据库导出 | `gen_data_dictionary.py` | `data-dictionary/table-index.csv` |
| `docs/sources/ADMMB-程序信息.xml` | 1.6 MB | 易飞数据库导出 | `gen_data_dictionary.py` | 模块级字典 |
| `docs/sources/OAPMA-openapi服务清单.xml` | 2.5 MB | 易飞 OAPMA 表导出 | `integrate_oapma.py`（一次性） | `typekey/oapma-enriched-typekey-map.yaml` + `oapma-field-aliases.csv` |
| `docs/sources/OAPMB-openapi服务节点名对应关系.xml` | 7.1 MB | 易飞 OAPMB 表导出 | `integrate_oapma.py`（一次性） | 同上 |
| `docs/sources/表结构信息/*.SDD` (64 文件) | 4.6 MB | 易飞 SDD 文件 | `extract-sdd-metadata.mjs` | `data-dictionary/sdd-table-meta.csv` + `sdd-index.csv` |
| `docs/sources/易飞单据性质MQ003.xlsx` | 0.01 MB | 手工整理 | 参考用 | — |
| `docs/sources/易飞单据性质MQ003_带中文名.csv` | < 0.01 MB | 手工整理 | 参考用 | — |

**小计：40.9 MB**（占 knowledge 总量 68%）

### 🟡 B 类：派生产物（脚本生成，程序运行时读取）

由 A 类数据源通过 `npm run gen:all` 机械生成。**程序运行时直接读取这些文件**。
部署到客户服务器时**需要 copy**（或重新跑 `gen:all` 生成）。

| 文件/目录 | 大小 | 生成脚本 | 被谁读取 | 说明 |
|---|---|---|---|---|
| `typekey/typekey_map.yaml` | 116 KB | `extract-typekey-map.mjs` | SDK catalog / MCP manifest / verify 脚本 | **核心路由表**：106 对象 / 595 服务名 / 主键 / 单身节点 |
| `typekey/_report.json` | 5.6 KB | 同上 | check 门禁 | 抽取质量报告 |
| `typekey/oapma-enriched-typekey-map.yaml` | 117 KB | `integrate_oapma.py` | 参考（暂未接入程序） | OAPMA 增强版：每个服务标注节点代码 + 字段别名 |
| `typekey/oapma-field-aliases.csv` | 3.5 MB | 同上 | 参考（暂未接入程序） | 39,117 行字段映射（service→alias→cn_name→table） |
| `typekey-mapping/*.md` (106 文件) | 1.85 MB | `extract-field-metadata.mjs` | MCP help 工具 | 字段对照表：单头/单身/通则字段 + 写操作约束 |
| `data-dictionary/field-index.csv` | 4.7 MB | `gen_data_dictionary.py` | SDK dictionary 模块 | 54,842 行字段索引 |
| `data-dictionary/table-index.csv` | 219 KB | 同上 | 参考 | 1,173 张表索引 |
| `data-dictionary/format-mask-map.csv` | 140 KB | 同上 | 参考 | 格式掩码映射 |
| `data-dictionary/node-table-map.csv` | 17 KB | `build-node-table-map.mjs` | 参考 | 逻辑节点名→物理表名 |
| `data-dictionary/sdd-table-meta.csv` | 144 KB | `extract-sdd-metadata.mjs` | 参考 | SDD 表元数据 |
| `data-dictionary/sdd-index.csv` | 15 KB | 同上 | 参考 | SDD 索引 |
| `data-dictionary/modules/*.md` (78 文件) | ~4 MB | `gen_data_dictionary.py` | 参考 | 模块级字典 |
| `data-dictionary/ER-OVERVIEW.md` | 104 KB | `gen-er-overview.py` | 参考 | ER 关系概览 |
| `data-dictionary/ER-relations.csv` | 1.5 MB | 同上 | 参考 | ER 关系明细 |
| `data-dictionary/README.md` | 41 KB | 同上 | 文档 | 数据字典说明 |
| `data-dictionary/_gen-stats.json` | 16 KB | 同上 | check 门禁 | 生成统计 |
| `enums/enums.yaml` | 117 KB | `gen_enums_from_oapmb.py` | SDK enum-guard / MCP help / Agent 枚举查询 | **673 个枚举字段 / 2,626 个枚举值**（来自 OAPMB.MB012） |

**小计：12.4 MB**

### 🟢 C 类：官方资料 / 手工维护（程序不读取，人工参考）

| 文件/目录 | 大小 | 说明 | 部署 |
|---|---|---|---|
| `official/menus/domain-map-draft.{md,csv}` | 18 KB | 域归属草案（脚本生成） | 不需要 |
| `official/menus/_domain-report.json` | 2.3 KB | 域归属报告 | 不需要 |
| `official/ai-endpoints/oapma-ai-endpoints.md` | 1.2 KB | 13 个 AI 端点清单 | 不需要 |
| `README.md` | < 1 KB | 本文件 | 不需要 |

**小计：< 0.1 MB**

---

## 二、部署分类（哪些需要 copy 到客户服务器）

### ✅ 必须部署（程序运行时依赖）

| 文件 | 理由 |
|---|---|
| `typekey/typekey_map.yaml` | SDK catalog 启动时加载，服务名路由的唯一权威源 |
| `typekey-mapping/*.md` | MCP help 工具按需读取，返回字段说明 |
| `data-dictionary/field-index.csv` | SDK dictionary 模块加载，字段分类判定 |
| `enums/enums.yaml` | SDK enum-guard 枚举校验 + MCP help 枚举展示 + Agent 合法值查询 |

**最小部署集：约 6.8 MB**（typekey_map 116KB + mapping 1.85MB + field-index 4.7MB + enums 117KB）

### ⚠️ 可选部署（增强功能）

| 文件 | 理由 |
|---|---|
| `typekey/oapma-field-aliases.csv` | 未来可用于字段名校验/自动补全 |
| `typekey/oapma-enriched-typekey-map.yaml` | 未来可用于增强 help 输出 |
| `data-dictionary/` 其余文件 | ER 关系、格式掩码等，分析层可能用到 |

### ❌ 不需要部署（一次性数据源 / 构建期专用）

| 文件/目录 | 大小 | 理由 |
|---|---|---|
| `docs/sources/ADMMD-字段信息.xml` | 24.6 MB | 只在 `gen_data_dictionary.py` 中使用 |
| `docs/sources/OAPMB-openapi服务节点名对应关系.xml` | 7.1 MB | 只在 `integrate_oapma.py` 中使用 |
| `docs/sources/表结构信息/*.SDD` | 4.6 MB | 只在 `extract-sdd-metadata.mjs` 中使用 |
| `docs/sources/OAPMA-openapi服务清单.xml` | 2.5 MB | 只在 `integrate_oapma.py` 中使用 |
| `docs/sources/ADMMB-程序信息.xml` | 1.6 MB | 只在 `gen_data_dictionary.py` 中使用 |
| `docs/sources/ADMMC-表名信息.xml` | 0.5 MB | 只在 `gen_data_dictionary.py` 中使用 |
| `docs/sources/易飞单据性质*.xlsx/csv` | < 0.1 MB | 手工参考 |

**不需要部署的总量：40.9 MB**（占 68%）

---

## 三、建议目录重组方案

当前所有文件混在 `knowledge/` 根目录，一次性数据源和运行时产物没有物理隔离。建议拆分为：

```
knowledge/
├── runtime/                    ← 部署时必须 copy（程序运行时读取）
│   ├── typekey/
│   │   └── typekey_map.yaml        ← SDK/MCP 核心路由表
│   ├── typekey-mapping/            ← MCP help 工具字段说明
│   │   └── *.md (106 files)
│   └── data-dictionary/
│       └── field-index.csv         ← SDK dictionary 模块
│
├── enhanced/                   ← 可选部署（增强功能，暂未接入程序）
│   ├── oapma-enriched-typekey-map.yaml
│   ├── oapma-field-aliases.csv
│   └── data-dictionary/            ← ER/掩码/模块字典等
│
├── sources/                    ← 一次性数据源（不部署，仅构建期使用）
│   ├── ADMMD-字段信息.xml
│   ├── ADMMC-表名信息.xml
│   ├── ADMMB-程序信息.xml
│   ├── OAPMA-openapi服务清单.xml
│   ├── OAPMB-openapi服务节点名对应关系.xml
│   ├── 表结构信息/*.SDD
│   └── 易飞单据性质*
│
├── official/                   ← 官方资料 / 手工维护
│   ├── menus/
│   └── ai-endpoints/
│
└── README.md
```

### 重组收益

| 项 | 当前 | 重组后 |
|---|---|---|
| 部署 copy | 整个 knowledge/ 60 MB | 只 copy `runtime/` 6.7 MB |
| .gitignore | 按扩展名排除（`.xml/.xlsx`） | 按目录排除（`sources/`） |
| 新人理解 | 需读 README 才知道哪些是源哪些是产物 | 目录名即语义 |
| 脚本路径 | `knowledge/typekey/typekey_map.yaml` | `knowledge/runtime/typekey/typekey_map.yaml` |

### 重组代价

- 所有引用 `knowledge/` 路径的脚本和代码需要更新（约 15 处）
- `.gitignore` 规则需要调整
- `npm run gen:all` 的输出路径需要调整

**已于 2026-10-09 执行重组**：A 类数据源已移至 `docs/sources/`，knowledge/ 仅保留运行时产物 + 官方资料。

---

## 四、数据流图

```
┌─────────────────────────────────────────────────────────┐
│  A 类：一次性数据源 (sources/)                            │
│  40.9 MB · 不部署 · 仅构建期使用                          │
│                                                         │
│  ADMMD.xml (24.6M) ──┐                                  │
│  ADMMC.xml (0.5M)  ──┤── gen_data_dictionary.py ──┐     │
│  ADMMB.xml (1.6M)  ──┘                            │     │
│  表结构信息/*.SDD (4.6M) ── extract-sdd-metadata ──┤     │
│  OAPMA.xml (2.5M) ──┐                             │     │
│  OAPMB.xml (7.1M) ──┴── integrate_oapma.py ───────┤     │
│  Apipost JSON ──────── extract-typekey-map.mjs ───┤     │
│                       extract-field-metadata.mjs ──┤     │
└────────────────────────────────────────────────────┼─────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────┐
│  B 类：派生产物 (runtime/ + enhanced/)                    │
│  12.3 MB · 部署 runtime/ 6.7 MB                          │
│                                                         │
│  runtime/typekey/typekey_map.yaml ◄── SDK catalog       │
│  runtime/typekey-mapping/*.md     ◄── MCP help          │
│  runtime/data-dictionary/field-index.csv ◄── SDK dict   │
│  enhanced/oapma-field-aliases.csv ◄── 未来字段校验       │
│  enhanced/data-dictionary/*       ◄── 未来分析层         │
└─────────────────────────────────────────────────────────┘
```

---

## 五、禁止事项

1. **禁止手工编辑 B 类派生产物** —— `npm run gen:all` 会覆盖
2. **禁止把 A 类数据源提交到 Git** —— `.gitignore` 已排除 `.xml/.xlsx`
3. **禁止在程序中硬编码 A 类路径** —— 程序只读 B 类
4. **新增数据源放 `sources/`**（或当前根目录），新增产物放对应子目录
