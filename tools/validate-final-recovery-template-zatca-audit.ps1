param(
  [string]$OutputDir = ""
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Get-Location).Path

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $repoRoot 'artifact\prompt-audit-harness-quarter-stress-controlpoints-latest'
}

Write-Host '==> delegating to hard recovery validation'
powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot 'tools\validate-hard-recovery-full-system.ps1') -OutputDir $OutputDir
exit $LASTEXITCODE
