# GitHub 同步手册

> 状态：✅ **已完成推送**（首次2026-10-08 18:25，Phase 0 收尾 2026-10-09 更新）
> 仓库地址：**https://github.com/github279355466/YFAgent**
> 分支：`main`（已设上游跟踪 `origin/main`）
> 推送通道：HTTPS + `http.sslBackend=openssl`
> 可见性：**Public**（用户决策；注意含产品线知识资产，见下方风险提示）

### ⚠️ 可见性风险提示

仓库当前为 **Public**，且包含：

- 易飞业务模块地图与产品线知识资产
- 易飞 vs 易助 31维度技术差异分析
- 上游 `docs/plans/` 下的方案文档

**这些内容属鼎捷内部技术信息。** 若团队尚未确认公开范围，建议改为 Private：

```bash
# GitHub 网页：Settings → General → Danger Zone → Change visibility → Private
```

---

## 〇、同步已完成 + 关键解法

**若日后需重新推送或clone 到新机器，只记住这一条配置：**

```bash
git config http.sslBackend openssl
```

这一行同时解决了本机两个看似无解的问题（Windows 证书吊销检查失败 + SSH 公钥未授权）。

**解法推导过程**（原判断「网络不通」是错的）：

| 通道 | 表面现象 | 真实原因 |
|---|---|---|
| HTTPS 直连 / 代理 | `000` / SSL error 35 | 本机访问不到证书吊销服务器 |
| `http.schannelCheckRevoke=false` | 错误不变 | ❌ 该参数无效 |
| **SSH 22** | OPEN 但 `Permission denied` | 通道可用，但需人工加公钥 |
| **`http.sslBackend=openssl`** | **无错误** | ✅ **换掉整个 TLS 栈，不依赖 Windows 证书验证** |

📌 **教训**：`000` / 超时 ≠ 不通，必须看具体错误码区分「网络不通」与「证书问题」。
排查应从成本最低的试起：换后端 → 换端口 → 换协议，而非先去申请凭据。

**关键凭据信息**：推送使用 Git Credential Manager 已存凭据，**未新建 Token**。
`~/.ssh/id_ed25519` 密钥对已生成但未启用（公钥未添加到 GitHub），如需 SSH 可后续添加启用。

完整的 2026-10-08 执行记录（139 文件入库核对、5 项确认逐条核对）已整理进本文档 §〇/§四/§六/§七/附录，不再单独保留记忆文件；提交历史见 `git log`。

---

## 一、环境勘察结论（2026-10-08 18:02，原始记录，结论已作废）

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

> ⚠️ 以下配置**待人工在GitHub 网页完成**（连接器 Token 缺写权限，无法代劳）

| 配置项 | 值 | 状态 |
|---|---|---|
| 默认分支 | `main` | ✅ 已生效 |
| 上游跟踪 | `origin/main` | ✅ 已建立 |
| 可见性 | Public | ✅ 已设为公开 |
| 分支保护 | 需 PR + 至少 1 approve + 禁 force push + 禁直推 | ⏳ 待配置 |
| 合并方式 | 允许 squash / rebase；**禁用 merge commit** | ⏳ 待配置 |
| 自动删分支 | PR 合并后自动删除 | ⏳ 待配置 |
| Actions | `.github/workflows/verify.yml` 已就绪 | ⏳ 待启用 |

---

## 八、团队首次克隆后的准备

新成员克隆后必做：

```bash
git clone https://github.com/github279355466/YFAgent.git
cd YFAgent

# ⚠️ 若推送时报 CRYPT_E_REVOCATION_OFFLINE，先执行这一行：
git config http.sslBackend openssl

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

## 附：当前仓库状态（2026-10-08 18:25 已同步）

| 项 | 值 |
|---|---|
| 远程 | `https://github.com/github279355466/YFAgent.git` |
| 分支 | `main`（已跟踪 `origin/main`） |
| 提交数 | 7 |
| 入库文件 | 139 |
| TLS 后端 | `http.sslBackend=openssl`（本仓库 `.git/config`） |
| 敏感文件 | 零入库（`.env` / `易飞OpenAPI.json` / `*.pem` / `id_ed25519` 已排除） |
