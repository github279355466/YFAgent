# YFAgent → GitHub 同步执行记录

> 执行时间：2026-10-08 18:16 ~ 18:25
> 结论：✅ **推送成功**，7 次提交完整保留
> 仓库地址：https://github.com/github279355466/YFAgent

---

## 零、最终结果

| 项 | 值 |
|---|---|
| 仓库地址 | **https://github.com/github279355466/YFAgent** |
| 分支 | `main`（已设上游跟踪 `origin/main`） |
| 提交数 | 7（本地 = 远程，完全一致） |
| 入库文件 | 139 个 |
| 敏感文件 | ✅ 零入库（`.env` / `易飞OpenAPI.json` / `*.pem` / `id_ed25519` 均已排除） |
| 最终通道 | **HTTPS + `http.sslBackend=openssl`**（已写入 `.git/config`） |

**决定性的一行配置**：

```bash
git config http.sslBackend openssl
```

这一条同时解决了「HTTPS 证书吊销检查失败」和「SSH 公钥未授权」两个问题 —— 绕开 SSH，改用 HTTPS，而 GCM 凭据管理器里已有可用凭据，无需新建Token。

---

## 一、五项确认逐条核对

| # | 用户要求 | 实际结果 | 状态 |
|---|---|---|---|
| 1 | 检查是否已是 Git 仓库，否则初始化 | **已是仓库**，7 次提交，分支 `main`，工作区干净 | ✅ 无需初始化 |
| 2 | 添加合适 .gitignore | **已有且完善**（142 行），实测 `.env` 已被第 50 行规则忽略 | ✅ 已满足 |
| 3 | 检查敏感信息后再提交 | `npm run scan:secrets` → **PASS**（136 文件 0 命中）；暂存区二次扫描 PASS | ✅ 已通过 |
| 4 | 公开/私有需确认，默认公开 | 已征询用户 → 选择 **Public** | ✅ 已裁决 |
| 5 | 提交并推送 | **已完成**，139 文件 / 7 提交 | ✅ 成功 |

---

## 二、关键发现：纠正了「网络不通」的错误结论

>这是本次最有价值的教训。三层递进排查：

`docs/GITHUB-SETUP.md` 记录的「网络不通」判断**不准确**，实测结论如下：

| 通道 | 实测 | 说明 |
|---|---|---|
| HTTPS 直连 `api.github.com` | `000` / SSL error 35 | 失败 |
| HTTPS 走代理 `127.0.0.1:10808` | `000` | 失败 |
| HTTPS 走 git 代理 | `CRYPT_E_REVOCATION_OFFLINE (0x80092013)` | **证书吊销检查失败，非网络不通** |
| `-c http.schannelCheckRevoke=false` | 同上错误，**参数无效** | 该绕过法无效 |
| **SSH 22 端口** | **OPEN** | 完全可达 |
| SSH 443 (ssh.github.com) | OPEN | 备用通道 |
| `ssh -T git@github.com` | `Permission denied (publickey)` | 通道打通，但需人工加公钥 |
| **`-c http.sslBackend=openssl`** | **无错误，连接成功** | **决定性解法** |

**最终结论**：真实障碍**只是 Windows schannel 的证书吊销检查**（本机无法访问吊销服务器）。
切换到 OpenSSL 后端即彻底解决 —— 无需代理、无需 SSH 公钥、无需新建 Token。

> 核心教训（务必记住）：
> 1. `000` / 超时 != 不通。**必须看具体错误码**。`CRYPT_E_REVOCATION_OFFLINE` 是证书问题，与连通性无关。
> 2. `http.schannelCheckRevoke=false` **无效**；有效的是 `http.sslBackend=openssl`。
> 3. 排查顺序应从**成本最低**的试起：换后端 -> 换端口 -> 换协议，而不是先去申请凭据。

---

## 三、最终解法（一行配置）

```bash
cd /d/AIProject/claude/YFAgent
git config http.sslBackend openssl      # 绕开 schannel 证书吊销检查
git remote set-url origin https://github.com/github279355466/YFAgent.git
git push -u origin main                 # GCM 已有凭据，直接成功
```

**为何有效**：`schannelCheckRevoke=false` 只关闭「检查吊销」这一步，schannel 仍走自己的证书链验证路径；
换 OpenSSL 后端则整个 TLS 栈换掉，不再依赖 Windows 证书验证服务，因此能通过。

已写入 `.git/config` 持久生效，后续推送无需重复指定。

### 曾被考虑但未采用的路径

| 方案 | 为何未用 |
|---|---|
| SSH 推送 | 需人工把公钥加到 GitHub，有等待成本；HTTPS 已可通 |
| 连接器代推 | Token 缺 `repo` 权限，`POST /user/repos` 返回 403；且会把 7 次提交压成 1 次 |
| 新建 Token | 不必要 —— GCM 凭据管理器里本就有可用凭据 |

---

## 四、已完成的配置

| 项 | 值 |
|---|---|
| 远程地址 | `https://github.com/github279355466/YFAgent.git` |
| TLS 后端 | `http.sslBackend=openssl`（`.git/config`，持久生效） |
| 本地分支 | `main`，已跟踪 `origin/main` |
| 提交数 | 7（本地 = 远程） |
| 入库文件 | 139 个 |
| 凭据来源 | Git Credential Manager（已存，未新建 Token） |
| 密钥对 | `~/.ssh/id_ed25519` 已生成但**未使用**，如需 SSH 可后续加公钥启用 |

---

## 五、待办提醒

- [ ] 用户添加 SSH 公钥 → 解锁阻塞 B
- [ ] 用户创建 Token（或改用 GitHub 网页建仓）→ 解锁阻塞 A
- [ ] 建仓后推送 `main`，6 次提交历史完整保留（SSH 方案不损失历史，优于连接器代推）
- [ ] 推送后按 `docs/GITHUB-SETUP.md` §七 配置分支保护、Actions
- [ ] **修正 `docs/GITHUB-SETUP.md` §一 的错误结论**（网络不通 → 实为证书吊销问题，SSH 可用）

---

## 六、用户决策记录

| 决策点 | 选择 | 备注 |
|---|---|---|
| 仓库可见性 | **Public** | 与 `GITHUB-SETUP.md` §二「建议 Private」冲突，已向用户提示商业敏感内容外泄风险 |
| 推送方式 | 连接器代推 | 后因 Token 403 不可用，**降级为 SSH 直推**（更优：保留完整提交历史） |