# pack-deploy.ps1 — 生成客户部署包
# 用法: .\scripts\pack-deploy.ps1 [-Version "0.1.0"] [-OutputDir "dist"]
#
# 产出: dist/yfcli-deploy-v{version}/ 目录 + .zip 压缩包
# 包含: 6个包源码 + knowledge预生成产物 + 视图DDL + 配置模板 + 部署文档
# 不包含: node_modules / .git / .trellis / __tests__ / .env / *.local.yaml

param(
    [string]$Version = "0.1.0",
    [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"
# 从脚本位置推断项目根
$scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$projectRoot = Split-Path $scriptDir -Parent

Write-Host "=== YFCLI Deploy Packager ===" -ForegroundColor Cyan
Write-Host "Project: $projectRoot"
Write-Host "Version: $Version"
Write-Host ""

$deployName = "yfcli-deploy-v$Version"
$tempDir = Join-Path $env:TEMP "yfcli-deploy-$(Get-Random)"
$targetDir = Join-Path $tempDir $deployName
$outputPath = Join-Path $projectRoot $OutputDir

# 清理
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
New-Item -ItemType Directory -Path $outputPath -Force | Out-Null

# 排除规则
$excludeDirs = @("node_modules", ".git", ".trellis", "__tests__", "dist", ".omc", ".workbuddy", "runs")
$excludeFiles = @("*.test.ts", "*.spec.ts", ".env", "*.local.yaml", "*.zip", ".gitignore", "_fix*.mjs")

function Copy-Filtered {
    param([string]$Source, [string]$Dest, [string[]]$ExcludeDirNames, [string[]]$ExcludeFilePatterns)
    
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    
    Get-ChildItem $Source -Recurse -File | Where-Object {
        $rel = $_.FullName.Substring($Source.Length).TrimStart("\", "/")
        # 排除目录
        $skip = $false
        foreach ($d in $ExcludeDirNames) {
            if ($rel -match "\\$d\\" -or $rel -match "^$d\\" -or $_.DirectoryName -match "\\$d$") {
                $skip = $true; break
            }
        }
        if ($skip) { return $false }
        # 排除文件模式
        foreach ($p in $ExcludeFilePatterns) {
            if ($_.Name -like $p) { return $false }
        }
        return $true
    } | ForEach-Object {
        $rel = $_.FullName.Substring($Source.Length).TrimStart("\", "/")
        $destFile = Join-Path $Dest $rel
        $destParent = Split-Path $destFile -Parent
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        Copy-Item $_.FullName $destFile -Force
    }
}

# 1. 复制 packages/（排除测试和 node_modules）
Write-Host "[1/5] Copying packages/..." -ForegroundColor Yellow
Copy-Filtered -Source (Join-Path $projectRoot "packages") -Dest (Join-Path $targetDir "packages") `
    -ExcludeDirNames $excludeDirs -ExcludeFilePatterns $excludeFiles

# 2. 复制 knowledge/（预生成产物，排除大文件和原始XML）
Write-Host "[2/5] Copying knowledge/..." -ForegroundColor Yellow
$knowledgeExcludes = $excludeDirs + @("_raw")
$knowledgeFileExcludes = $excludeFiles + @("*.xml", "*.xls", "*.xlsx")
Copy-Filtered -Source (Join-Path $projectRoot "knowledge") -Dest (Join-Path $targetDir "knowledge") `
    -ExcludeDirNames $knowledgeExcludes -ExcludeFilePatterns $knowledgeFileExcludes

# 3. 复制配置和文档
Write-Host "[3/5] Copying config and docs..." -ForegroundColor Yellow
$configDir = Join-Path $projectRoot "config"
if (Test-Path $configDir) {
    Copy-Filtered -Source $configDir -Dest (Join-Path $targetDir "config") `
        -ExcludeDirNames $excludeDirs -ExcludeFilePatterns @("*.local.yaml")
}
Copy-Item (Join-Path $projectRoot "docs\DEPLOYMENT.md") (Join-Path $targetDir "DEPLOYMENT.md") -Force
Copy-Item (Join-Path $projectRoot ".env.example") (Join-Path $targetDir ".env.example") -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $projectRoot "package.json") (Join-Path $targetDir "package.json") -Force
Copy-Item (Join-Path $projectRoot "package-lock.json") (Join-Path $targetDir "package-lock.json") -Force -ErrorAction SilentlyContinue

# 4. 合并视图 DDL 为单文件（可选便利）
Write-Host "[4/5] Merging view DDLs..." -ForegroundColor Yellow
$viewsDir = Join-Path $targetDir "packages\yfcli-analysis\sql\views"
if (Test-Path $viewsDir) {
    $merged = "-- YFCLI 视图初始化脚本（合并自 9 个独立文件）`r`n-- 生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n-- 使用: sqlcmd -S <server> -d <database> -i init-views.sql`r`n`r`n"
    Get-ChildItem $viewsDir -Filter "*.sql" | Sort-Object Name | ForEach-Object {
        $merged += "-- ============================================`r`n"
        $merged += "-- $($_.Name)`r`n"
        $merged += "-- ============================================`r`n"
        $merged += Get-Content $_.FullName -Raw
        $merged += "`r`n`r`n"
    }
    $scriptsDir = Join-Path $targetDir "scripts"
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    Set-Content (Join-Path $scriptsDir "init-views.sql") -Value $merged -Encoding UTF8
    Write-Host "  -> scripts/init-views.sql created"
}

# 5. 打包 zip
Write-Host "[5/5] Creating zip archive..." -ForegroundColor Yellow
$zipPath = Join-Path $outputPath "$deployName.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $targetDir -DestinationPath $zipPath -CompressionLevel Optimal

# 统计
$fileCount = (Get-ChildItem $targetDir -Recurse -File).Count
$dirSize = (Get-ChildItem $targetDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
$zipSize = (Get-Item $zipPath).Length

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Directory: $targetDir ($fileCount files, $([math]::Round($dirSize/1KB)) KB)"
Write-Host "Archive:   $zipPath ($([math]::Round($zipSize/1KB)) KB)"
Write-Host ""
Write-Host "Deploy to customer:" -ForegroundColor Cyan
Write-Host "  1. Copy $deployName.zip to customer server"
Write-Host "  2. Extract to D:\YFCLI"
Write-Host "  3. npm install"
Write-Host "  4. Configure .env"
Write-Host "  5. Execute init-views.sql (first time only)"
Write-Host "  6. Start MCP Server"

# 清理临时目录
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

