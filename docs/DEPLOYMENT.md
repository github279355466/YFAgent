# YFCLI 部署指南

> 适用环境：Windows Server + PowerShell  
> 最后更新：2026-10-09  
> **部署模型：预构建包部署**——知识产物、视图 DDL、SQL 模板均在开发环境预生成，  
> 每家客户的数据库结构和 OpenAPI 接口一致，部署时直接复制即可。

---

## 部署包内容

开发环境执行 `scripts/pack-deploy.ps1` 生成部署包，包含：

```
yfcli-deploy-v{version}/
├── packages/                    # 6 个包的源码（Node.js >= 20 直接运行）
│   ├── yfcli-sdk/               # CRUD SDK（122 tests）
│   ├── yfcli-auth/              # 授权模块（64 tests）
│   ├── yfcli-mcp/               # MCP Server（41 tests）
│   ├── yfcli-analysis/          # 分析层 + 20 个 SQL 模板（49 tests）
│   │   └── sql/views/           # 9 个 vw_ai_* 视图 DDL（预生成）
│   ├── yfcli-experts/           # 专家模块（18 tests）
│   └── yfcli-skill-openapi/     # Skill 包 + 31 个助手文档
├── knowledge/                   # 知识产物（预生成，不需重新生成）
│   ├── typekey/typekey_map.yaml # 106 对象 / 595 服务名
│   ├── typekey-mapping/         # 106 份字段对照表
│   └── official/ai-assistants/  # 31 个助手 _workflow + _spec
├── config/
│   └── erp.example.yaml         # 配置模板
├── .env.example                 # 环境变量模板
├── scripts/
│   └── init-views.sql           # 9 个视图合并为单文件（可选）
└── DEPLOYMENT.md                # 本文档
```

**不需要在客户现场执行的步骤**：
- ❌ `npm run gen:all`（知识产物已预生成）
- ❌ `npm run check:all`（已在开发环境验证）
- ❌ `npm test`（294 tests 已在开发环境通过）
- ❌ 编写或调整 SQL 模板（20 个模板已预生成）

---

## 前置条件

| 项 | 要求 | 验证命令 |
|----|------|----------|
| Node.js | >= 20 | `node -v` |
| 易飞 ERP OpenAPI | 内网可达 | 见下方连通性测试 |
| SQL Server | 2014+（只读权限） | 分析层直连需要 |
| 网络 | 客户内网 | MCP Server 仅监听 localhost |

---

## 部署步骤

### 第 1 步：复制部署包

```powershell
# 将部署包复制到客户服务器
Copy-Item -Path "\\dev-server\share\yfcli-deploy-v0.1.0" -Destination "D:\YFCLI" -Recurse
cd D:\YFCLI
```

### 第 2 步：安装依赖并构建

```powershell
npm install

# 构建全部包（按依赖顺序：sdk → auth → analysis → experts → mcp）
cd packages\yfcli-sdk;      npx tsc -p tsconfig.build.json
cd ..\yfcli-auth;           npx tsc -p tsconfig.build.json
cd ..\yfcli-analysis;       npx tsc -p tsconfig.build.json
cd ..\yfcli-experts;        npx tsc -p tsconfig.build.json
cd ..\yfcli-mcp;            npx tsc -p tsconfig.build.json
cd ..\..

# 验证构建产物
Test-Path packages\yfcli-mcp\dist\cli.js   # 应为 True
```

> 如果客户服务器无法访问外网，在开发环境执行 `npm install` + 构建后将 `node_modules/` 和各包 `dist/` 一并打包。  
> 构建后的 `dist/` 目录是纯 JS，运行时只需 `node`，不需要 `tsx` 或 `typescript`。

### 第 3 步：配置环境变量

```powershell
Copy-Item .env.example .env
notepad .env
```

| 变量 | 必填 | 说明 |
|------|------|------|
| `YF_BASE_URL` | ✅ | 易飞 OpenAPI 入口（含完整路径） |
| `YF_COMPANY_ID` | ✅ | 账套编号 |
| `YF_USER_TOKEN` | ✅ | 身份令牌（TPASC19 获取） |
| `YF_SQL_SERVER` | 分析层 | SQL Server 地址 |
| `YF_SQL_PORT` | 否 | 默认 1433 |
| `YF_SQL_DATABASE` | 分析层 | 数据库名 |
| `YF_SQL_USER_ENV` | 分析层 | 用户名环境变量名 |
| `YF_SQL_PASSWORD_ENV` | 分析层 | 密码环境变量名 |
| `YF_MCP_PORT` | 否 | 默认 3100 |

然后设置数据库凭据的环境变量：

```powershell
[Environment]::SetEnvironmentVariable("YF_DB_USER", "sa", "Machine")
[Environment]::SetEnvironmentVariable("YF_DB_PASS", "实际密码", "Machine")
```

`.env` 中填写：
```
YF_SQL_USER_ENV=YF_DB_USER
YF_SQL_PASSWORD_ENV=YF_DB_PASS
```

### 第 4 步：执行视图 DDL（首次部署）

9 个 `vw_ai_*` 视图是分析层的数据源，**首次部署时由 DBA 执行一次**，之后不需要重复：

```powershell
# 方式一：逐个执行
Get-ChildItem packages\yfcli-analysis\sql\views\*.sql | ForEach-Object {
    Write-Host "Executing $($_.Name)..."
    sqlcmd -S $env:YF_SQL_SERVER -d $env:YF_SQL_DATABASE -i $_.FullName -b
}

# 方式二：合并脚本（如果有 init-views.sql）
if (Test-Path scripts\init-views.sql) {
    sqlcmd -S $env:YF_SQL_SERVER -d $env:YF_SQL_DATABASE -i scripts\init-views.sql -b
}
```

> 视图使用 `CREATE OR ALTER VIEW`，可重复执行不会报错。  
> 每家客户的底层表结构相同（ACMMO/CMSME/COPTG 等），视图 DDL 无需修改。

### 第 5 步：注册 Servy 服务（推荐）

使用 Servy 将 MCP Server 注册为 Windows 原生服务，支持开机自启、健康监控、故障自动重启。

**方式一：脚本注册（推荐）**

```powershell
# 以管理员身份运行
.\scripts\setup-servy-services.ps1 -ProjectRoot "D:\YFCLI" -Port 4001
```

脚本会自动完成：清理旧服务 → 释放端口 → 注册服务 → 启动 → 健康检查验证。

**方式二：Servy GUI 导入**

1. 打开 Servy 管理界面
2. 导入 `docs\yfcli-mcp.json` 模板文件
3. 修改 `StartupDirectory` 和 `StdoutPath`/`StderrPath` 为实际路径
4. 点击启动

**方式三：手动命令行**

```powershell
# 以管理员身份运行
& 'C:\Program Files\Servy\servy-cli.exe' install `
    --name="yfcli-mcp" `
    --displayName="YFCLI MCP Server" `
    --path="D:\Program Files\nodejs\node.exe" `
    --startupDir="D:\YFCLI\packages\yfcli-mcp" `
    --params="dist/index.js --http --port 4001" `
    --startupType=Automatic `
    --envVars="NODE_ENV=production" `
    --stdout="D:\YFCLI\logs\mcp.out.log" `
    --stderr="D:\YFCLI\logs\mcp.err.log" `
    --enableHealth --heartbeatInterval=30 --maxFailedChecks=3 `
    --recoveryAction=RestartProcess --maxRestartAttempts=5

& 'C:\Program Files\Servy\servy-cli.exe' start --name yfcli-mcp
```

**服务管理命令**：

```powershell
servy-cli status yfcli-mcp     # 查看状态
servy-cli stop yfcli-mcp       # 停止
servy-cli start yfcli-mcp      # 启动
servy-cli restart yfcli-mcp    # 重启
services.msc                   # GUI 管理
```

> 日志位置：`{ProjectRoot}\logs\mcp.out.log` / `mcp.err.log`（自动轮转，保留 5 份）

---

## 验证清单

```powershell
# ✅ 1. Node.js 版本
node -v   # 应 >= v20.0.0

# ✅ 2. MCP Server 健康检查
Invoke-RestMethod -Uri "http://localhost:3100/health"
# 期望: { status: "ok", auth: "configured", erp: "reachable" }

# ✅ 3. OpenAPI 连通性
$headers = @{
    "digi-service"    = "yf.oapi.supplier.query.get"
    "digi-user-token" = $env:YF_USER_TOKEN
    "digi-datakey"    = $env:YF_COMPANY_ID
    "Content-Type"    = "application/json"
}
$body = '{"std_data":{"parameter":{"page_no":1,"page_size":1}}}'
Invoke-RestMethod -Uri $env:YF_BASE_URL -Method Post -Headers $headers -Body $body
# 期望: code = "0"

# ✅ 4. 视图可查询（分析层）
sqlcmd -S $env:YF_SQL_SERVER -d $env:YF_SQL_DATABASE -Q "SELECT TOP 1 * FROM dbo.vw_ai_sales_margin"
# 期望: 返回数据行（空表也可以，不报错即可）

# ✅ 5. MCP 工具调用
$mcpBody = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"yf_manifest","arguments":{}}}'
Invoke-RestMethod -Uri "http://localhost:3100/mcp" -Method Post `
    -ContentType "application/json" `
    -Headers @{ Accept = "application/json, text/event-stream" } `
    -Body $mcpBody
# 期望: 返回 106 个业务对象清单
```

---

## 故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| MCP 返回 406 | 缺少 Accept 头 | 添加 `Accept: application/json, text/event-stream` |
| OpenAPI 返回 500+HTML | Token 无效/过期 | TPASC19 重新获取，更新 `.env` |
| 查询返回空数组 code=0 | 主键全错不报错 | 检查 datakeys 是否含全部主键字段 |
| 枚举条件查不到数据 | 传了 `Y.已审核` 而非 `Y` | 只传编码部分 |
| conditions not found | 用了易助数组形态 | 改用易飞对象嵌套格式 |
| npm install 失败 | erp-experts/erp-license 路径不存在 | 确保三个仓库同级目录，或将 node_modules 一并打包 |
| SQL Server 连接失败 | TCP/IP 未启用/防火墙 | 启用 TCP/IP + 放行 1433 端口 |
| 视图执行报列名无效 | 客户数据库版本差异 | 极少见，联系开发团队核实字段名 |

---

## 升级流程

```powershell
# 1. 备份当前版本
Rename-Item D:\YFCLI D:\YFCLI-backup-$(Get-Date -Format 'yyyyMMdd')

# 2. 部署新版本
Copy-Item -Path "\\dev-server\share\yfcli-deploy-v{new-version}" -Destination "D:\YFCLI" -Recurse
cd D:\YFCLI
npm install

# 3. 如果视图有变更，重新执行 DDL（CREATE OR ALTER 幂等）
Get-ChildItem packages\yfcli-analysis\sql\views\*.sql | ForEach-Object {
    sqlcmd -S $env:YF_SQL_SERVER -d $env:YF_SQL_DATABASE -i $_.FullName -b
}

# 4. 重启 MCP Server
pm2 restart yfcli-mcp

# 5. 验证
Invoke-RestMethod -Uri "http://localhost:3100/health"
```

---

## 开发环境打包命令

以下命令仅在**开发环境**执行，生成部署包：

```powershell
# 打包 Skill
.\scripts\pack-skill.ps1

# 打包完整部署包（待实现 scripts/pack-deploy.ps1）
# .\scripts\pack-deploy.ps1 -Version "0.1.0" -OutputDir "dist"
```


