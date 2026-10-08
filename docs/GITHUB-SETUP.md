# GitHub 同步手册

> 状态：**本地已就绪，远程推送待人工授权**
> 阻塞原因：① SSH 公钥未添加到 GitHub ② GitHub 连接器 Token 缺建仓权限
> ⚠️ **本文 §一 的「网络不通」结论已被实测推翻，见下方更正**

---

## 〇、更正（2026-10-08 18:30 实测）

原判断「网络不通」**不准确**。重新实测：

| 通道 | 原判断 | 实测结果 |
|---|---|---|
| HTTPS 直连 / 代理 | ❌ 不通 | `CRYPT_E_REVOCATION_OFFLINE (0x80092013)` —— **证书吊销检查失败**，非网络问题 |
| `http.schannelCheckRevoke=false` | 未测 | **无效**，错误不变 |
| **SSH 22 端口** | 未测 | ✅ **OPEN，完全可达** |
| `ssh -T git@github.com` | 未测 | `Permission denied (publickey)` —— **通道已通，仅缺授权** |

**修正结论**：SSH 通道完全可用。推送走 **SSH 而非 HTTPS**，可绕开证书问题，且**完整保留 6 次提交历史**。

> 📌 排查教训：`000` / 超时 ≠ 不通。务必看**具体错误码**区分「网络不通」与「证书/认证问题」。

**当前进度**：远程已配 `git@github.com:github279355466/YFAgent.git`，密钥已生成，待用户添加公钥后执行 `git push -u origin main`。
详见 `.workbuddy/memory/2026-10-08-github-sync-attempt.md`。

---

## 一、环境勘察结论（2026-10-08 18:02，原始记录）

| 检查项 | 结果 | 影响 |
|---|---|---|
| `gh` CLI | ❌ 未安装 | 无法用 `gh repo create` 一键建仓 |
| SSH 密钥（`~/.ssh/`） | ❌ 目录为空 | 无法用 SSH 认证 |
| GitHub 凭据（credential helper） | ⚠️ 已配置 GCM，但**无 GitHub 凭据** | 无法 HTTPS 认证 |
| 网络直连 `github.com` | ❌ 返回 `000`（SSL error 35） | 不可达 |
| 网络走代理 `127.0.0.1:10808` | ❌ 返回 `000` | 代理不可用 |
| 代理端口存活 | ⚠️ 返回 `400`（端口在监听但非正常代理响应） | 代理工作异常 |
| 远程地址 | ❌ 未配置 `git remote` | — |

**结论**：推送被「网络不通」+「无认证凭据」双重阻塞，二者**都不是仓库配置问题**，需人工处理。

---

## 二、待你确认的三个信息

| # | 需确认 | 说明 | 建议 |
|---|---|---|---|
| 1 | **远程仓库地址** | 仓库是否已在 GitHub 创建？完整 URL 是什么？ | 若未创建，告诉我组织名，我给出建仓命令 |
| 2 | **认证方式** | SSH 还是 Token（HTTPS） | 推荐 **SSH**（免每次输入，且可长期免密） |
| 3 | **仓库可见性** | Public 还是 Private | **建议 Private** —— 含业务模块地图、产品线知识资产、鼎捷内部术语 |

---

## 三、方案 A：SSH（推荐）

### 步骤 1：生成 SSH 密钥

```bash
# Windows Git Bash
ssh-keygen -t ed25519 -C "liucb@digiwin.com" -f ~/.ssh/id_ed25519
```

生成后：
- 私钥 `~/.ssh/id_ed25519` —— **绝不提交、绝不外发**
- 公钥 `~/.ssh/id_ed25519.pub` —— 需添加到 GitHub

### 步骤 2：配置 SSH config（可选但推荐）

追加到 `~/.ssh/config`：

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  ServerAliveInterval 60
```

### 步骤 3：添加公钥到 GitHub

1. 打开 `https://github.com/settings/keys`
2. 「New SSH key」→ Title 填 `YFAgent-Administrator` →粘贴公钥内容
3. 公钥内容：`cat ~/.ssh/id_ed25519.pub`

### 步骤 4：连通性验证（网络通了之后）

```bash
ssh -T git@github.com
# 期望输出：Hi <用户名>! You've successfully authenticated...
```

### 步骤 5：配置远程并推送

```bash
cd /d/AIProject/claude/YFAgent

# 添加远程（替换为你的实际地址）
git remote add origin git@github.com:<org>/YFCLI.git

# 推送并建立上游跟踪
git push -u origin main
```

---

## 四、方案 B：HTTPS + Token

### 步骤 1：创建 Personal Access Token

1. 打开 `https://github.com/settings/tokens`
2. Generate new token (classic)
3. 勾选权限：`repo`（读写私有库）、`workflow`（若需推送 Actions）
4. 生成后**立即复制**（GitHub 只显示一次）

### 步骤 2：配置凭据

已配置 Git Credential Manager（GCM），首次push 会弹窗输入：
- Username：GitHub 用户名
- Password：粘贴 Token

或手动写入：

```bash
git config --global credential.helper manager
# 然后在 push 时交互输入，勿用git config credential.username store
```

### 步骤 3：推送

```bash
git remote add origin https://github.com/<org>/YFCLI.git
git push -u origin main
```

⚠️ **不要** 把 Token 写进 remote URL：

```bash
# ❌ 错误：Token 会留在 .git/config，且易泄漏
git remote add origin https://user:TOKEN@github.com/org/repo.git
```

---

## 五、网络不通的处理

按可能性排序，逐个试：

### 方案 1：确认本机代理软件是否在运行

当前 git 配置了 `http.proxy=http://127.0.0.1:10808`，但该端口响应 `400`（异常）。

```bash
# 检查端口占用
netstat -ano | findstr :10808
```

若代理软件未运行：启动它（常见 Clash/V2Ray 类工具默认监听 10808），或改用其他端口。

### 方案 2：改用其他代理端口

若本机代理实际在其他端口（如 7890）：

```bash
# 分作用域设置，避免影响其他项目
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
# 取消设置
# git config --global --unset http.proxy
# git config --global --unset https.proxy
```

### 方案 3：改走内网可达的 Git 私服

若团队有 GitLab / Gitea / 内网 Git 服务，优先用内网地址（`172.16.*` 段通常直连可达）。

### 方案 4：离线交付

网络确实不通时，可将仓库打包交付：

```bash
cd /d/AIProject/claude
git clone --bare YFCLI YFCLI.git          # 裸库，可直接 push 到内网 Git
# 或
tar czf YFCLI-$(date +%Y%m%d).tar.gz YFCLI/  # 排除 node_modules 与源文件
```

---

## 六、推送前的最后检查（**必做**）

```bash
cd /d/AIProject/claude/YFAgent

# 1. 敏感信息扫描
npm run scan:secrets

# 2. 知识产物一致性
npm run check:all

# 3. 确认源文件未被暂存
git status --porcelain | grep -i "易飞OpenAPI" && echo "❌ 源文件被暂存，终止" || echo "✅ 源文件未暂存"

# 4. 确认待推送内容
git diff --stat origin/main..HEAD 2>/dev/null || git show --stat HEAD
```

### 当前状态（已验证）

| 检查 | 结果 |
|---|---|
| `scan:secrets` | ✅ PASS（135 个文件） |
| `check:all` | ✅ 3/3 PASS（typekey / fields / domain） |
| 行尾与编码 | ✅ 111 个文件全部 UTF-8 无 BOM + 纯 CRLF |
| 源文件忽略 | ✅ `docs/易飞OpenAPI.json` 已被 `.gitignore` 排除 |
| 敏感配置忽略 | ✅ `.env`、`config/*.local.yaml` 已排除 |
| 提交历史 | ✅ 4 次提交，**从未包含敏感信息**（每次提交前均跑过扫描） |

---

## 七、推送后的仓库设置（一次性）

推送成功后，按 `docs/COLLABORATION.md` §六 配置：

| 配置项 | 值 |
|---|---|
| 默认分支 | `main`（已是） |
| 分支保护 | 启用：需 PR + 至少 1 approve + 禁 force push + 禁直推 |
| 合并方式 | 允许 squash / rebase；**禁用 merge commit** |
| 自动删分支 | PR 合并后自动删除 |
| 可见性 | **Private** |
| Actions | 启用（`.github/workflows/verify.yml` 已就绪） |

---

## 八、团队首次克隆后的准备

新成员克隆后必做：

```bash
git clone git@github.com:<org>/YFCLI.git
cd YFCLI

# 1. 放入源文件（不入库，需单独获取）
#    从 Apipost 项目 322f10 导出 JSON → docs/易飞OpenAPI.json

# 2. 安装 + 生成 + 校验
npm install
npm run gen:all
npm run verify          # 应全绿；services_unique 应为 595

# 3. 配置本地连接（若需联调）
cp config/erp.example.yaml config/erp.local.yaml
cp .env.example .env
```

**注意**：新成员必须自行获取 46.5 MB 源文件。这是刻意的设计（源文件含敏感信息），README「本地环境准备」章节已写明获取方式。

---

## 附：当前本地提交历史

```
a348b23 chore: 团队协作规范 + 配置模板 + CI 门禁
1b958d7 docs: 追加 Phase 0 执行记录到项目记忆
b36942d feat: Phase 0 裁决与任务化（关闭全部 OPEN 项）
4653413 chore: YFCLI 仓库初始化（Phase 0 建仓）
```

分支：`main`（尚未设置上游跟踪）
远程：`未配置`
