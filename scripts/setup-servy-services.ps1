# ============================================================
# YFCLI -> Servy 服务注册脚本 (需以管理员身份运行)
# 将 yfcli-mcp 注册为 Windows 原生服务，开机自启 + 健康监控 + 故障自动重启
#
# 用法: 右键 PowerShell -> 以管理员身份运行 -> .\scripts\setup-servy-services.ps1
# 导入模板: docs/yfcli-mcp.json（可通过 Servy GUI 直接导入）
# ============================================================
param(
    [string]$ProjectRoot = "D:\AIProject\claude\YFAgent",
    [int]$Port = 4001,
    [string]$NodePath = "D:\Program Files\nodejs\node.exe"
)

$ErrorActionPreference = 'Continue'
$servy = 'C:\Program Files\Servy\servy-cli.exe'
$serviceName = 'yfcli-mcp'
$logDir = Join-Path $ProjectRoot 'logs'

# 前置检查
if (-not (Test-Path $servy)) {
    Write-Host "[错误] 未找到 $servy，请先安装 Servy (https://servy.io)" -ForegroundColor Red
    exit 1
}
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[错误] 请以管理员身份运行本脚本" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $NodePath)) {
    Write-Host "[错误] 未找到 Node.js: $NodePath" -ForegroundColor Red
    exit 1
}

# 确保日志目录存在
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

Write-Host "=== YFCLI Servy 服务注册 ===" -ForegroundColor Cyan
Write-Host "项目根: $ProjectRoot"
Write-Host "端口:   $Port"
Write-Host "Node:   $NodePath"
Write-Host ""

# Step 1: 清理已存在的同名服务
Write-Host "=== 1) 清理已存在的同名服务 ===" -ForegroundColor Yellow
$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "  停止旧服务..."
    & $servy stop --name $serviceName 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Host "  卸载旧服务..."
    & $servy uninstall --name $serviceName 2>&1 | Out-Null
    sc.exe delete $serviceName 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "  已清理" -ForegroundColor Green
} else {
    Write-Host "  无同名服务，跳过" -ForegroundColor Gray
}

# Step 2: 释放端口
Write-Host "=== 2) 检查端口 $Port ===" -ForegroundColor Yellow
$conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    foreach ($c in $conn) {
        Write-Host "  端口 $Port 被 PID $($c.OwningProcess) 占用，强制释放..."
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  端口 $Port 空闲" -ForegroundColor Green
}

# Step 3: 注册服务
Write-Host "=== 3) 注册 $serviceName 服务 ===" -ForegroundColor Yellow
$mcpDir = Join-Path $ProjectRoot 'packages\yfcli-mcp'
$stdoutLog = Join-Path $logDir 'mcp.out.log'
$stderrLog = Join-Path $logDir 'mcp.err.log'

& $servy install --name=$serviceName `
    --displayName="YFCLI MCP Server" `
    --description="易飞 AI 助手 MCP Server — CRUD + 分析 + 专家引擎 (port $Port)" `
    --path=$NodePath `
    --startupDir=$mcpDir `
    --params="dist/index.js --http --port $Port" `
    --startupType=Automatic `
    --envVars="NODE_ENV=production" `
    --stdout=$stdoutLog `
    --stderr=$stderrLog `
    --enableHealth `
    --heartbeatInterval=30 `
    --maxFailedChecks=3 `
    --recoveryAction=RestartProcess `
    --maxRestartAttempts=5

if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 服务注册失败" -ForegroundColor Red
    exit 1
}
Write-Host "  注册成功" -ForegroundColor Green

# Step 4: 启动服务
Write-Host "=== 4) 启动服务 ===" -ForegroundColor Yellow
& $servy start --name $serviceName
Start-Sleep -Seconds 6

# Step 5: 验证
Write-Host "=== 5) 验证 ===" -ForegroundColor Yellow

# 服务状态
$status = sc.exe query $serviceName 2>&1 | Select-String 'STATE'
Write-Host "  服务状态: $status"

# 健康检查
try {
    $health = Invoke-RestMethod -Uri "http://localhost:$Port/health" -TimeoutSec 8
    Write-Host "  健康检查: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "  健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  提示: MCP Server 可能需要先配置 .env 中的 YF_USER_TOKEN" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 完成 ===" -ForegroundColor Green
Write-Host "管理命令:" -ForegroundColor Cyan
Write-Host "  servy-cli status $serviceName    # 查看状态"
Write-Host "  servy-cli stop $serviceName      # 停止"
Write-Host "  servy-cli start $serviceName     # 启动"
Write-Host "  servy-cli restart $serviceName   # 重启"
Write-Host "  services.msc                     # GUI 管理"
Write-Host ""
Write-Host "日志位置:" -ForegroundColor Cyan
Write-Host "  stdout: $stdoutLog"
Write-Host "  stderr: $stderrLog"
Write-Host ""
Write-Host "Servy GUI 导入模板: docs\yfcli-mcp.json" -ForegroundColor Cyan
