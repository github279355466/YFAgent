# 团队协作与分支管理约定

> 适用于 YFCLI（易飞 YF 产品线）仓库全体成员。
> **本文是约定而非建议** —— PR 评审以此为检查项。

---

## 一、分支模型

```
main                 ← 受保护，只接受 PR 合并
  │
  ├─ feature/xxx       功能分支（从 main 切出）
  ├─ fix/xxx           缺陷修复
  ├─ docs/xxx          文档变更
  ├─ chore/xxx         工程杂项（依赖、配置、脚本）
  └─ release/x.y.z发布分支（Phase 3 起启用）
```

### 命名规范

| 类型 | 格式 | 示例 |
|---|---|---|
| 功能 | `feature/{简述}` | `feature/conditions-translator` |
| 缺陷 | `fix/{简述}` | `fix/detail-node-path` |
| 文档 | `docs/{简述}` | `docs/openapi-rules` |
| 工程 | `chore/{简述}` | `chore/deps-upgrade` |

**规则**：
- 只用**小写字母 + 连字符**，禁用中文、空格、下划线
- 简述控制在 3~5 个词，能直接看出意图
- 关联任务号：`feature/t09-ai-endpoints`（对应资料任务 T-09）

---

## 二、`main` 分支保护规则

| 规则 | 说明 |
|---|---|
| **禁止直推** | `main` 设为受保护分支，所有变更经PR 合并 |
| **PR 必需** | 至少 1 人approve 后方可合并 |
| **CI 必需通过** | `npm run verify`（敏感扫描 + 产物一致性校验）必须绿 |
| **禁止 force push** | 如需回退用 `git revert` 新增提交，保留历史可追溯 |
| **线性历史** | 合并使用 squash 或 rebase merge，**不产生无意义的 merge commit** |

### 分支保护配置路径

GitHub 仓库 → `Settings` → `Branches` → `Add rule`（配置清单见 §六）

---

## 三、提交信息规范

采用 **Conventional Commits**：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### type 清单

| type | 用于 |
|---|---|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档变更 |
| `refactor` | 重构（不改变外部行为） |
| `perf` | 性能优化 |
| `test` | 测试 |
| `chore` | 工程杂项（依赖、配置、脚本） |
| `build` | 构建系统 |
| `ci` | CI 配置 |
| `revert` | 回退 |

### scope 约定

| scope | 对应范围 |
|---|---|
| `sdk` | `packages/yfcli-sdk` |
| `mcp` | `packages/yfcli-mcp` |
| `analysis` | `packages/yfcli-analysis` |
| `typekey` | TypeKey 映射层 |
| `fields` | 字段对照表层 |
| `skill` | `skills/yifei-erp` |
| `experts` | 专家包 |
| `knowhow` | 云端方法论/提示词 |
| `deps` | 依赖 |

### 示例

```
feat(sdk): 新增 servicePrefix 配置化，消除硬编码前缀

易飞前缀 yf. 与易助 yz. 不同，原实现沿用了易助的硬编码方式
（见 YZCLI packages/yzcli-sdk/src/client.ts:79-81），
换产品线时会导致全部调用失败。

改为从配置读取，缺省时启动即失败（fail-fast），不静默降级。

关联：docs/decisions/OPEN-DECISIONS.md OPEN-A3
```

### 约束

- `subject` 用**祈使句**（add / fix / update），不用「已添加」「修改了」
- `subject` ≤ 72 字符
- `body` 说明**为什么**，不只说做了什么
- 涉及取舍/踩坑，务必写进 `body`（上下文会丢失，文件不会）
- 禁止「update」「fix bug」「修改」这类无信息量的 subject

---

## 四、PR 评审流程

### 提交前自检（作者必做）

```bash
npm run verify
```

**全绿才可提PR。** 该命令包含两项门禁：
1. `scan:secrets` —— 7 类敏感信息扫描
2. `check:all` —— 三类知识产物的内容指纹一致性校验

### PR 描述模板

```markdown
## 变更内容
<!-- 改了什么，一两句 -->

## 变更原因
<!-- 为什么改，关联 issue / OPEN项 / 任务号 -->

## 影响范围
- [ ] 仅易飞产品线
- [ ] 影响共享层 erp-core
- [ ] 涉及 OpenAPI 契约变更
- [ ] 涉及知识产物（typekey /字段对照表）

## 验证方式
<!-- 怎么验证的；真机验证请贴 runs/ 报告路径 -->

## 风险与回滚
<!-- 可能出什么问题？怎么回滚？ -->

关联：T-xx / OPEN-xx / ADR-xxx
```

### 评审检查项（评审人逐条确认）

| # | 检查项 | 判定 |
|---|---|---|
| 1 | `npm run verify` 是否通过 | ☐ |
| 2 | 是否有敏感信息误提交（token / 账套名 / 内网IP） | ☐ |
| 3 | 知识产物是否为**脚本生成**（若是，须是脚本变更而非手工改产物） | ☐ |
| 4 | 是否引入易助专属概念到易飞侧（字段编号 / `udf_text*` / `fastquery`） | ☐ |
| 5 | 新增字段/接口是否同步更新 `knowledge/` 产物 | ☐ |
| 6 | 是否修改了 `main` 受保护文件（`config/*.example.yaml` 除外） | ☐ |
| 7 | 提交信息符合 Conventional Commits 且说明了「为什么」 | ☐ |
| 8 | 有无「文档未说明」被当作已知处理 | ☐ |

### 评审铁律

- **只标三类阻断**：正确性缺陷 / 需求未满足 / 契约或数据完整性破坏
- **不标**：风格偏好、未被要求的额外特性、为覆盖率而覆盖率
- **打回要给证据**：指明「未满足哪条 + 证据 + 期望」，不写「改改」

---

## 五、敏感信息红线

| 类别 | 示例 | 处理 |
|---|---|---|
| 用户令牌 | `digi-user-token` 值 | 走环境变量，`.env`不入库 |
| 账套名 | `CompanyId` 的实际值 | 只入 `.example` 模板 |
| 内网地址 | `172.16.*` / `192.168.*` | 用 `{IP}` 占位 |
| 私钥 | `*.pem` / `*.key` | 严禁入库 |
| 官方文档原件 | `易飞OpenAPI.json` | 不入库（46.5 MB且含敏感） |

**发现误提交立即处理**：
```bash
# 1. 立即删除该文件
git rm --cached <路径>
# 2. 若已推送，通知团队先拉取再继续操作
# 3. 若含真实凭证，**必须先去服务端轮换凭证**，再谈历史清理
```

> ⚠️ 凭证一旦 push 到公开仓库即视为泄漏，**清理 git 历史无法撤销泄漏**。处置顺序永远是「先轮换凭证，再清历史」。

---

## 六、GitHub 仓库设置清单（一次性配置）

| 配置项 | 建议值 |
|---|---|
| 默认分支 | `main` |
| 分支保护（main） | 启用：需 PR + 至少 1 approve + 禁止 force push + 禁止直推 |
| 合并方式 | 允许 squash merge 与 rebase merge；**禁用 merge commit** |
| 自动删除分支 | PR 合并后自动删除 head 分支 |
| Issues | 启用，用于任务追踪（T-xx 建议建 issue） |
| Discussions | 启用，用于技术方案讨论 |
| Actions |启用，`verify.yml` 在 PR 与 push 时跑 `npm run verify` |
| 可见性 | **Private**（含产品线知识资产与业务模块地图） |

---

## 七、常见操作速查

### 同步

```bash
git fetch origin
git pull --rebase origin main        # git config已设 pull.rebase=true
```

### 新功能分支

```bash
git switch -c feature/t09-ai-endpoints
# ... 开发 ...
npm run verify                        # 必过
git add -A && git commit -m "feat(experts): ..."
git push -u origin feature/t09-ai-endpoints
gh pr create --base main --title "..." --body "..."   # 或浏览器建 PR
```

### 知识产物变更（重要）

知识产物是**脚本生成**的，改动流程：

```bash
# 1. 改源或改脚本（不要直接改产物）
vim scripts/extract-*.mjs
# 2. 重新生成
npm run gen:all
# 3. 校验
npm run verify
# 4. 提交脚本 + 产物（两者必须同时出现在同一个 PR）
git add -A && git commit -m "feat(fields): ..."
```

**若只改产物不改脚本** → `npm run check:all` 会 FAIL，门禁会拦住。

---

## 八、待确认事项

| # | 事项 | 责任人 |
|---|---|---|
| 1 | 仓库可见性确认（建议 Private，因含业务模块地图与账套信息） | 项目总监 |
| 2 | 是否需要 CODEOWNERS（指定 `knowledge/` 与 `scripts/` 的必审人） | 项目总监 |
| 3 | 分支保护的具体审批人数（1 人还是 2 人） | 项目总监 |
| 4 | CI Actions 的 runner 环境（Windows vs Linux，行尾策略不同） | 架构 |
