# CHANGELOG

> 记录本仓库的**已完成事项**。决策与理由见 `docs/decisions/`，任务规划见 `docs/TODO-PLAN.md`。
> 格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

---

## [Unreleased]

**状态**：Phase 1 进行中。当前版本尚未发布，功能待集成。

### 新增

| 项 | 位置 | 说明 |
|---|---|---|
| TypeKey 映射表 | `knowledge/typekey/typekey_map.yaml` | 106 业务对象 / 595 服务名；含复合主键、`services_by_name` 无碰撞索引、`service_conflicts` 碰撞检测 |
| 字段对照表 | `knowledge/typekey-mapping/*.md` | 106 份 / 12893 字段；单头/单身分层、必填三态判定 |
| 结构化数据字典 | `knowledge/data-dictionary/` | 78 个模块字典 + 4 份 CSV（`field-index` / `table-index` / `format-mask-map` / `node-table-map`） |
| ER 关联概览 | `knowledge/data-dictionary/ER-OVERVIEW.md` | 关联推断，**明示为推断非声明**；分HIGH/MID/LOW 三档 |
| 业务域归属草案 | `knowledge/official/menus/domain-map-draft.md` | 106 对象域归属（脚本推断，2 个待人工确认） |
| SDK 骨架 | `packages/yfcli-sdk/` | 9 模块 / 20 TS 文件；`tsc` 零错误；离线用例 60 项 + 冻结判据 50 项 |
| 抽取脚本 | `scripts/extract-typekey-map.mjs`<br>`scripts/extract-field-metadata.mjs`<br>`scripts/gen_data_dictionary.py`<br>`scripts/gen-er-overview.py`<br>`scripts/gen-domain-map.mjs` | 均可重跑；支持 `--check` 门禁 |
| 真机探测脚本 | `scripts/probe-live-env.mjs`<br>`scripts/probe-unknown-pk.mjs`<br>`scripts/build-node-table-map.mjs` | 只读探测，凭据经环境变量注入 |
| 敏感信息门禁 | `scripts/scan-secrets.mjs` | 7 类规则；接入 `npm run verify` |
| CI 门禁 | `.github/workflows/verify.yml` | PR 与 main推送时运行 |
| 决策台账 | `docs/decisions/OPEN-DECISIONS.md` | 27 条全部裁决完毕 |
| 统计口径规范 | `docs/decisions/STATISTICS-SPEC.md` | 强制口径标签；禁止跨口径相减 |
| 真机探测报告 | `docs/plans/yf-live-probe-report.md` | 15/15 PASS |
| 命名铁律 | `docs/plans/yf-field-naming-convention.md` | 并集判据，实测 98.3% 成立 |
| OpenAPI 规则体系 | `docs/plans/yf-openapi-rules.md` | 含真机实测补充（§11） |
| 易飞易助差异对照 | `docs/plans/yf-vs-yizhu-openapi-diff.md` | 31 维度 |
| SDK 实施计划 | `docs/plans/phase1-sdk-plan.md` | 模块划分 / 类型定义 / 实施步骤 |
| 团队协作约定 | `docs/COLLABORATION.md` | 分支 / 提交 / PR 规范 |
| 任务计划 | `docs/TODO-PLAN.md` | 12 项任务，含依赖与工作量 |

### 修改

| 项 | 变更 |
|---|---|
| **`.gitignore`** | 新增 `__pycache__/` / `*.py[cod]` / `.pytest_cache/` / `.mypy_cache/` / `.ruff_cache/` |
| **`docs/README.md`** | 脱敏内网 IP（原有 5 个真实地址） |
| **`README.md`** | 目录结构补 `data-dictionary/` / `.github/` / `runs/`；<br>脚本清单补 `gen:dictionary` / `check:dictionary`；<br>差异表第1 条由「静默返回全量」更正为「显式报错」；<br>进度表标注 Phase 1 进行中 |
| **`AGENTS.md`** | 新增「工程纪律」4条（反引号内联/ 逐字符 join / 统计口径 / 破坏性验证） |
| **`docs/GITHUB-SETUP.md`** | 补仓库地址与可见性风险提示 |
| **`.workbuddy/memory/2026-10-08.md`** | 529 行压缩至 85 行（稳定知识毕业进 docs） |

### 修复

| 项 | 问题 |
|---|---|
| `extract-typekey-map.mjs` | 重复 `primary_key` 键（补录主键时留下空行）→ 严格 YAML 解析抛错 |
| `extract-typekey-map.mjs` | `service_conflicts` 重复键 → `bom` 产出两行同名键 |
| `extract-typekey-map.mjs` | `no_data_segment` 误标混合形态对象 → 改为三态 `service_name_shape` |
| `gen-er-overview.py` | `(CR+LF).join(json.dumps(...))` 把换行插到每个字符间 → 产出损坏 JSON |
| `gen-er-overview.py` | 笛卡尔积爆炸（「预留字段」一词出现在 5316 张表）→ 842 MB CSV 降至 1.5 MB |
| `gen-er-overview.py` | 关联 CSV 截断未声明 → 新增第六章 + `_report.json` |

### 废弃 / 移除

| 项 | 说明 |
|---|---|
| `scripts/gen-er-injector.py` | 并发编辑冲突导致不可运行，已废弃 |
| README「两条抽取脚本」章节 | 脚本增至 9 个，改为完整清单 |
| `docs/plans/probe-pk-and-node-name-answers.md` | 内容已并入真机探测报告，保留作过程记录 |

---

## [初建] — 2026-10-08

### 新增

- 仓库初始化（`git init`，分支 `main`）
- 项目骨架：`.gitignore` / `.gitattributes` / `README.md` / `AGENTS.md` / `package.json`
- `config/erp.example.yaml`、`.env.example` 配置模板
- 远程仓库：`https://github.com/github279355466/YFAgent`（**Public**）
- 推送通道：HTTPS + `http.sslBackend=openssl`
