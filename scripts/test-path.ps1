$repoRoot = Split-Path $PSScriptRoot -Parent
$skillDir = Join-Path $repoRoot "packages\yfcli-skill-openapi"
Write-Host "PSScriptRoot: $PSScriptRoot"
Write-Host "repoRoot: $repoRoot"
Write-Host "skillDir: $skillDir"
Write-Host "Exists: $(Test-Path $skillDir)"
$allFiles = Get-ChildItem -Path $skillDir -Recurse -File
Write-Host "Files: $($allFiles.Count)"