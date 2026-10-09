# pack-skill.ps1
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$skillDir = Join-Path $repoRoot "packages\yfcli-skill-openapi"
$skillMd = Join-Path $skillDir "SKILL.md"
if (-not (Test-Path $skillMd)) { Write-Error "SKILL.md not found"; exit 1 }
$content = Get-Content $skillMd -Raw -Encoding UTF8
if ($content -match "(?m)^version:\s*(.+)$") { $version = $Matches[1].Trim() } else { Write-Error "No version"; exit 1 }
Write-Host "Skill version: $version"
$tempDir = Join-Path $env:TEMP ("yfcli-pack-" + [guid]::NewGuid().ToString("N").Substring(0,8))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
try {
  $allFiles = Get-ChildItem -Path $skillDir -Recurse -File
  $filtered = @()
  foreach ($f in $allFiles) {
    if ($f.FullName -match "\\node_modules\\") { continue }
    if ($f.Extension -eq ".zip") { continue }
    if ($f.Name -eq ".omc") { continue }
    $filtered += $f
  }
  foreach ($file in $filtered) {
    $rel = $file.FullName.Substring($skillDir.Length + 1)
    $dest = Join-Path $tempDir $rel
    $dd = Split-Path $dest -Parent
    if (-not (Test-Path $dd)) { New-Item -ItemType Directory -Path $dd -Force | Out-Null }
    Copy-Item $file.FullName $dest
  }
  $pf = Get-ChildItem -Path $tempDir -Recurse -File
  $fc = $pf.Count
  Write-Host "Files to pack: $fc"
  if ($fc -eq 0) { Write-Error "No files"; exit 1 }
  $distDir = Join-Path $repoRoot "dist"
  if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir -Force | Out-Null }
  $zipName = "yfcli-skill-openapi-v$version.zip"
  $zipPath = Join-Path $distDir $zipName
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $zipPath -CompressionLevel Optimal
  $zs = (Get-Item $zipPath).Length
  $sk = [math]::Round($zs / 1024, 1)
  Write-Host "=== Pack Complete ==="
  Write-Host "  File:   $zipPath"
  Write-Host "  Files:  $fc"
  Write-Host "  Size:   $sk KB"
  Write-Host "  Version: $version"
} finally {
  if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
}