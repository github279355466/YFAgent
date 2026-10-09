$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$skillDir = Join-Path $repoRoot "packages\yfcli-skill-openapi"
Write-Host "skillDir: $skillDir"
Write-Host "Exists: $(Test-Path $skillDir)"

$allFiles = Get-ChildItem -Path $skillDir -Recurse -File
Write-Host "allFiles count: $($allFiles.Count)"

$filtered = @()
foreach ($f in $allFiles) {
    if ($f.FullName -match '\\node_modules\\') { Write-Host "SKIP nm: $($f.Name)"; continue }
    if ($f.Extension -eq '.zip') { Write-Host "SKIP zip: $($f.Name)"; continue }
    if ($f.Name -eq '.omc') { Write-Host "SKIP omc: $($f.Name)"; continue }
    if ($f.FullName -match '\\\.omc\\') { Write-Host "SKIP omcdir: $($f.Name)"; continue }
    $filtered += $f
    Write-Host "KEEP: $($f.Name)"
}
Write-Host "filtered count: $($filtered.Count)"

$tempDir = Join-Path $env:TEMP "yfcli-debug-test"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

foreach ($file in $filtered) {
    $relativePath = $file.FullName.Substring($skillDir.Length + 1)
    $destPath = Join-Path $tempDir $relativePath
    $destDir = Split-Path $destPath -Parent
    Write-Host "Copying: $relativePath -> $destPath"
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item $file.FullName $destPath
}

$packedFiles = Get-ChildItem -Path $tempDir -Recurse -File
Write-Host "packedFiles count: $($packedFiles.Count)"
foreach ($pf in $packedFiles) { Write-Host "  packed: $($pf.FullName)" }

Remove-Item $tempDir -Recurse -Force