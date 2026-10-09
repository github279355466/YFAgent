# 开发日志 · yfcli

> 每个开发者一个目录，文件名 `journal-N.md`，N 递增。
> 本文件记录**开发过程中的决策与踩坑**，不是任务台账（台账在 `.trellis/tasks/`）。
>
> **纪律**：统计数字必须带口径标签；含反引号的中文必须落文件再执行。

---

## journal-1 · MVP 分期计划与 trellis 体系建立

**日期**：2026-10-09
**范围**：P0~P5 六阶段计划 + `.trellis/` 任务体系骨架

### 做了什么

1. 产出 `docs/plans/mvp-development-plan.md` —— MVP 分期开发计划（5 阶段 + P0 前置盘点）
2. 创建 `.trellis/tasks/` 6 个任务目录（`task.json` + `map-navigation.md`）
3. 确认工程基线：知识产物 106 对象 / 595 服务名 / 门禁全绿；SDK 骨架 20 个 TS 文件 `tsc` 零错误

### 阶段划分（用户指定）

| 阶段 | slug | 工作量 |
|---|---|---|
| P0 前置条件盘点 | `mvp-p0-prerequisites` | S |
| P1 独立授权模块 | `mvp-p1-auth-module` | L |
| P2 CRUD + skill-openapi | `mvp-p2-crud-skill-openapi` | XL |
| P3 授权打通 | `mvp-p3-auth-integration` | M |
| P4 分析 + 智能问数 | `mvp-p4-analysis-qa` | XL |
| P5 专家模块 | `mvp-p5-expert-module` | L |

合计 **21~36 天** `[口径：S=1~3 / M=1~3 / L=3~5 / XL=5~12 天五阶段之和，未含外部依赖等待]`

### 关键决策

| # | 决策 | 理由 |
|---|---|---|
| 1 | **P1 排在 P2 之前**（不可调换） | 若先做 CRUD，每个工具各写一遍鉴权 —— 这正是 YZCLI 认证散落 4 处的根因 |
| 2 | **P3 排在 P4 之前**（不可调换） | P4 智能问数端到端需 P3 的鉴权。YZCLI 卡在 `end-to-end.test.ts:22` 被 `user_token` 阻塞，不能重复 |
| 3 | **Gateway 多租户（3,906 行）整体砍掉** | MVP 是单用户 / 单账套场景 `[口径：YZCLI Gateway 多租户模块行数]` |
| 4 | **License 体系（4,126 行）整体砍掉** | 不做商业化 `[口径：gateway license 1,405 + MCP guard 172 + license-server 2,064 + admin 485]` |
| 5 | **不复刻 `yzcli-finance`** | 9 文件 / 1,327 行，与 experts 凭证能力重叠且无交叉引用 —— YZCLI 自身的重复 `[口径：单模块行数]` |
| 6 | **P5 只做单域试点**，不铺 9 个专家 | MVP 验证公式框架正确性，不是铺量 |
| 7 | **P4 设「模板含物理表名即门禁失败」硬约束** | 继承 YZCLI「视图建了但没人查」的缺陷教训 |

### 踩坑记录

- **团队上下文丢失**：本会话尝试用 `SendMessage` 分派 trellis 文件给队友时返回 `Cannot resolve sender identity`（提示 teamContext 丢失）。改为全部自行完成。→ 若后续仍报错，需先修复 teamContext 再分派。

### 观察到的仓库状态（非本次改动）

`git status --short` 显示 `knowledge/data-dictionary/modules/` 下 **78 个文件为modified 未提交状态**，另有 `knowledge/data-dictionary/README.md` 与 `_gen-stats.json`。**本会话未触碰这些文件**，提交前需确认其来源与归属。

### 下一步

1. P0 启动：架构裁决台账 + 16 类资料台账 + 外部依赖问询函
2. 提交前必跑 `npm run verify`
3. `.trellis/tasks/` 已在 `.gitignore` 中（约定：任务状态以文件为准，不入 Git）
