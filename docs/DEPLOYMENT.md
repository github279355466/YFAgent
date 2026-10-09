# YFCLI 部署指南

> 适用环境：Windows Server + PowerShell  
> 最后更新：2026-10-09

---

## 前置条件

| 项 | 要求 | 说明 |
|----|------|------|
| Node.js | >= 20 | `node -v` 验证 |
| 易飞 ERP OpenAPI | 内网可达 | `Invoke-RestMethod $env:YF_BASE_URL` 返回 HTTP 200 |
| SQL Server | 2014+ | 分析层直连（只读权限即可） |
| vw_ai_* 视图 | 9 个已创建 | 见下方「视图 DDL 执行」 |
| Git | 2.x | 克隆仓库 |

---

## 环境变量

复制 `.env.example` 为 `.env`，按实际环境填写：

```powershell
Copy-Item .env.example .env
```

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `YF_BASE_URL` | 是 | — | 易飞 OpenAPI 入口 URL（含 `/YFOAP/openapi.dll/datasnap/rest/TServerMethods1/ATNPost`） |
| `YF_COMPANY_ID` | 是 | — | 账套编号 |
| `YF_USER_TOKEN` | 是 | — | 身份令牌（通过 TPASC19 接口获取） |
| `YF_SQL_SERVER` | 分析层需要 | — | SQL Server 地址 |
| `YF_SQL_PORT` | 否 | `1433` | SQL Server 端口 |
| `YF_SQL_DATABASE` | 分析层需要 | — | 数据库名 |
| `YF_SQL_USER_ENV` | 分析层需要 | — | 用户名所在的环境变量名（间接引用，防泄漏） |
| `YF_SQL_PASSWORD_ENV` | 分析层需要 | — | 密码所在的环境变量名（间接引用，防泄漏） |
| `YF_MCP_PORT` | 否 | `3100` | MCP Server 监听端口 |
| `YF_TIMEOUT_MS` | 否 | `30000` | OpenAPI 调用超时（毫秒） |
| `LICENSE_AES_KEY` | 商业化需要 | — | 64 位 hex AES 密钥（Phase 3） |

> ⚠️ **安全红线**：`.env` 和 `config/*.local.yaml` 已被 `.gitignore` 排除。**永远不要提交凭证**。

---

## 安装与启动

### 1. 克隆与安装

```powershell
git clone https://github.com/github279355466/YFAgent.git
cd YFAgent
npm install
```

### 2. 生成知识产物

```powershell
# 生成全部（TypeKey / 字段对照 / 域归属 / 数据字典 / 枚举）
npm run gen:all

# 校验产物是否为最新
npm run check:all
```

### 3. 准备配置

```powershell
# 复制环境变量模板
Copy-Item .env.example .env

# 编辑 .env 填入实际值
notepad .env

# 提交前扫描敏感信息
npm run scan:secrets
```

### 4. 运行测试

```powershell
# 各包独立测试
cd packages\yfcli-sdk;     npx vitest run    # 122 tests
cd ..\yfcli-auth;          npx vitest run    #  64 tests
cd ..\yfcli-analysis;      npx vitest run    #  49 tests
cd ..\yfcli-mcp;           npx vitest run    #  41 tests
cd ..\yfcli-experts;       npx vitest run    #  18 tests
# 合计：294 tests [5 包]
```

---

## MCP Server 启动

### 编程式启动

```powershell
npx tsx -e "import { startServer } from 'yfcli-mcp'; await startServer({ port: 3100 });"
```

### 端点信息

| 端点 | 方法 | 说明 |
|------|------|------|
| `http://localhost:3100/mcp` | POST | MCP Streamable HTTP 传输 |
| `http://localhost:3100/mcp` | GET | SSE 连接（需 `Accept: text/event-stream`） |
| `http://localhost:3100/health` | GET | 健康检查 |

### 客户端连接示例

```powershell
# 健康检查
Invoke-RestMethod -Uri "http://localhost:3100/health" -Method Get

# MCP initialize（需 Accept 头）
$body = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
Invoke-RestMethod -Uri "http://localhost:3100/mcp" `
    -Method Post `
    -ContentType "application/json" `
    -Headers @{ Accept = "application/json, text/event-stream" } `
    -Body $body
```

> ⚠️ **必须携带** `Accept: application/json, text/event-stream` 头，否则服务器返回 `406 Not Acceptable`。

---

## 视图 DDL 执行

分析层依赖 9 个 `vw_ai_*` 视图，需 DBA 在目标数据库执行：

```powershell
# 视图 DDL 文件位置
Get-ChildItem packages\yfcli-analysis\sql\views\*.sql | Select-Object Name
```

| # | 文件 | 用途 |
|---|------|------|
| 1 | `vw_ai_sales_margin.sql` | 销售毛利分析 |
| 2 | `vw_ai_purchase_summary.sql` | 采购汇总 |
| 3 | `vw_ai_inventory_cost.sql` | 库存成本 |
| 4 | `vw_ai_ar_balance.sql` | 应收余额 |
| 5 | `vw_ai_ap_balance.sql` | 应付余额 |
| 6 | `vw_ai_production_cost.sql` | 生产成本 |
| 7 | `vw_ai_gl_balance.sql` | 总账余额 |
| 8 | `vw_ai_collection.sql` | 收款统计 |
| 9 | `vw_ai_payment.sql` | 付款统计 |

### 执行方式

```powershell
# 使用 sqlcmd 逐个执行（替换实际连接参数）
$server = "YOUR_SQL_SERVER"
$database = "YOUR_DATABASE"

Get-ChildItem packages\yfcli-analysis\sql\views\*.sql | ForEach-Object {
    Write-Host "Executing $($_.Name)..."
    sqlcmd -S $server -d $database -i $_.FullName -b
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed: $($_.Name)"; exit 1 }
}

Write-Host "All 9 views created successfully."
```

> ⚠️ 视图依赖易飞底层表（如 `ACMMO`、`CMSME` 等），请确认目标数据库已包含完整业务数据。

---

## 验证清单

部署完成后逐项检查：

```powershell
# ✅ 1. Node.js 版本
node -v   # 应 >= v20.0.0

# ✅ 2. 知识产物完整性
npm run check:all   # 应输出 "All checks passed!"

# ✅ 3. 敏感信息扫描
npm run scan:secrets   # 应无告警

# ✅ 4. 单元测试
cd packages\yfcli-sdk; npx vitest run   # 122 passed
cd ..\yfcli-auth; npx vitest run        # 64 passed
cd ..\yfcli-analysis; npx vitest run    # 49 passed
cd ..\yfcli-mcp; npx vitest run         # 41 passed
cd ..\yfcli-experts; npx vitest run     # 18 passed

# ✅ 5. MCP Server 健康检查
Invoke-RestMethod -Uri "http://localhost:3100/health"

# ✅ 6. OpenAPI 连通性
$headers = @{
    "digi-service"    = "yf.oapi.supplier.query.get"
    "digi-user-token" = $env:YF_USER_TOKEN
    "digi-datakey"    = $env:YF_COMPANY_ID
    "Content-Type"    = "application/json"
}
$body = '{"std_data":{"parameter":{"page_no":1,"page_size":1}}}'
Invoke-RestMethod -Uri $env:YF_BASE_URL -Method Post -Headers $headers -Body $body
```

---

## 故障排查

### MCP Server 返回 406 Not Acceptable

**原因**：请求缺少 `Accept` 头。  
**解决**：添加 `Accept: application/json, text/event-stream`。

### OpenAPI 返回 HTTP 500 + HTML

**原因**：Token 无效或过期。  
**解决**：重新通过 TPASC19 接口获取 Token，更新 `.env` 中的 `YF_USER_TOKEN`。

### 查询返回空数组但 code=0

**原因**：主键全错时易飞返回 `code=0` + 空数组（不报错）。  
**解决**：检查 `datakeys` 是否包含全部主键字段；参考 `knowledge/typekey/{type_key}.md`。

### 枚举条件查不到数据

**原因**：回参形如 `Y.已审核`，但查询只认纯编码 `Y`。  
**解决**：作为 query 条件时只传编码部分，**禁止把回参值直接回传为条件**。

### conditions not found

**原因**：使用了易助的数组形态 conditions。  
**解决**：改用易飞的对象嵌套格式：

```json
{
  "conditions": {
    "operator": "AND",
    "fields": [
      { "field_name": "item_no", "operator": "=", "value": "001" }
    ]
  }
}
```

### npm install 失败（erp-experts / erp-license）

**原因**：`file:../../../erp-experts` 路径不存在。  
**解决**：确保 `erp-experts` 和 `erp-core` 仓与本仓同级目录：

```powershell
# 期望的目录结构
# D:\AIProject\claude\
#   ├── YFAgent/        ← 本仓
#   ├── erp-experts/    ← git clone https://github.com/github279355466/erp-experts.git
#   └── erp-core/       ← git clone https://github.com/github279355466/erp-core.git
```

### SQL Server 连接失败

**原因**：TCP/IP 未启用或防火墙拦截。  
**解决**：
1. SQL Server Configuration Manager → 启用 TCP/IP
2. Windows 防火墙放行 1433 端口
3. 确认 `YF_SQL_USER_ENV` / `YF_SQL_PASSWORD_ENV` 指向的环境变量已设置