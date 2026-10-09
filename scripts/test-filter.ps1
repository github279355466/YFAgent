$repoRoot = Split-Path $PSScriptRoot -Parent
$skillDir = Join-Path $repoRoot "packages\yfcli-skill-openapi"
$allFiles = Get-ChildItem -Path $skillDir -Recurse -File
Write-Host "Before filter: $($allFiles.Count)"
$filtered = @()
foreach ($f in $allFiles) {
    if ($f.FullName -match '\\node_modules\\') { continue }
    if ($f.Extension -eq '.zip') { continue }
    if ($f.Name -eq '.omc') { continue }
    if ($f.FullName -match '\\\.omc\\') { continue }
    $filtered += $f
}
Write-Host "After filter: $($filtered.Count)"
foreach ($f in $filtered) { Write-Host "  $($f.Name)" }