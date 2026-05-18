param(
  [string]$OutputDir = ""
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Get-Location).Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $repoRoot "artifact\prompt-audit-harness-quarter-stress-controlpoints-$timestamp"
}

$logDir = Join-Path $OutputDir 'logs'
$proofDir = Join-Path $OutputDir 'proof'
$screenDir = Join-Path $OutputDir 'screenshots'
$dataDir = Join-Path $OutputDir 'data'
$reportDir = Join-Path $OutputDir 'reports'
$patchDir = Join-Path $OutputDir 'patches'
$attemptDir = Join-Path $OutputDir 'attempts\attempt-01'

New-Item -ItemType Directory -Force -Path $logDir, $proofDir, $screenDir, $dataDir, $reportDir, $patchDir, $attemptDir | Out-Null

function Write-JsonFile {
  param(
    [string]$Path,
    [object]$Value
  )

  $Value | ConvertTo-Json -Depth 12 | Set-Content -Path $Path -Encoding UTF8
}

function Read-JsonFile {
  param([string]$Path)

  return (Get-Content -Path $Path -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Invoke-LoggedCmd {
  param(
    [string]$Name,
    [string]$Command,
    [string]$LogFile
  )

  Write-Host "==> $Name"
  cmd.exe /c "$Command > `"$LogFile`" 2>&1"
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$Name failed with exit code $exitCode. See $LogFile"
  }
}

function Get-AuditCookie {
  $cookieFile = Join-Path $repoRoot 'real-auth-cookies.txt'
  if (-not (Test-Path $cookieFile)) {
    return $null
  }

  $line = Get-Content -Path $cookieFile | Select-String -Pattern 'gulf_hisab_session' | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  $parts = $line.Line -split "`t"
  return $parts[-1]
}

function Copy-IfExists {
  param(
    [string]$Source,
    [string]$Destination
  )

  if (Test-Path $Source) {
    Copy-Item -Force $Source $Destination
  }
}

function Get-ControlResult {
  param(
    [object]$Summary,
    [string]$ControlId
  )

  if (-not $Summary) {
    return $null
  }

  return @($Summary | Where-Object { $_.control_id -eq $ControlId } | Select-Object -First 1)[0]
}

function Get-ControlStatusUpper {
  param(
    [object]$Summary,
    [string]$ControlId
  )

  $result = Get-ControlResult -Summary $Summary -ControlId $ControlId
  if ($null -eq $result) {
    return 'FAIL'
  }

  return ([string]$result.result_status).ToUpper()
}

function Write-FailureAnalysis {
  param(
    [string]$File,
    [string]$Title,
    [string]$Details
  )

  Set-Content -Path $File -Encoding UTF8 -Value @"
# $Title

$Details
"@
}

$env:BASE_URL = 'http://127.0.0.1:3000'
$auditCookie = Get-AuditCookie
if ($auditCookie) {
  $env:AUDIT_COOKIE = $auditCookie
}

$generatorLog = Join-Path $logDir 'quarter-stress-generator.log'
Invoke-LoggedCmd -Name 'quarter stress generator' -Command "node tools/generate-quarter-stress-test-data.mjs --artifact-root=$OutputDir" -LogFile $generatorLog

$quarterSummary = Read-JsonFile -Path (Join-Path $proofDir 'quarter-stress-summary.json')
if ($quarterSummary.status -ne 'PASS') {
  Write-FailureAnalysis -File (Join-Path $attemptDir 'failure-analysis.md') -Title 'Quarter stress generator failed' -Details "The generator wrote status '$($quarterSummary.status)'. Failed checks: $($quarterSummary.failedChecks -join ', ')"
  throw 'Quarter stress generator did not pass.'
}

Invoke-LoggedCmd -Name 'typecheck' -Command 'npm run typecheck' -LogFile (Join-Path $logDir 'typecheck.log')
Invoke-LoggedCmd -Name 'build' -Command 'npm run build' -LogFile (Join-Path $logDir 'build.log')
Invoke-LoggedCmd -Name 'test' -Command 'npm run test' -LogFile (Join-Path $logDir 'test.log')
Invoke-LoggedCmd -Name 'lint' -Command 'npm run lint' -LogFile (Join-Path $logDir 'lint.log')

$controlPointDir = Join-Path $OutputDir 'control-point-audit'
Invoke-LoggedCmd -Name 'audit:control-points:stable' -Command "npm run audit:control-points:stable -- --output-dir=$controlPointDir" -LogFile (Join-Path $logDir 'audit-control-points-stable.log')

$controlResultsPath = Join-Path $controlPointDir 'control-results.json'
if (Test-Path $controlResultsPath) {
  Copy-Item -Force $controlResultsPath (Join-Path $proofDir 'control-point-results-after.json')
}

Invoke-LoggedCmd -Name 'audit:preview-accounting' -Command 'npm run audit:preview-accounting' -LogFile (Join-Path $logDir 'audit-preview-accounting.log')
$previewAuditDir = Join-Path $repoRoot 'artifacts\accounting_audit_report'
Copy-IfExists -Source (Join-Path $previewAuditDir 'audit_summary.json') -Destination (Join-Path $proofDir 'preview-accounting-audit-after.json')

$browserLog = Join-Path $logDir 'browser-proof.log'
$browserScriptPath = Join-Path $attemptDir 'browser-proof.mjs'
$browserScreenshot = (Join-Path $screenDir 'invoice-register-after.png').Replace('\', '/')
$browserScript = @"
const pw = await import('playwright');
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
const state = {
  console: [],
  networkErrors: [],
  routes: {},
  dom: {},
};
page.on('console', (message) => state.console.push({ type: message.type(), text: message.text() }));
page.on('pageerror', (error) => state.console.push({ type: 'pageerror', text: String(error) }));
page.on('requestfailed', (request) => state.networkErrors.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));

const invoiceResponse = await page.goto('http://127.0.0.1:3000/workspace/user/invoices', { waitUntil: 'networkidle', timeout: 60000 });
state.routes.invoiceRegister = invoiceResponse?.status() ?? null;
state.dom.invoiceBody = await page.locator('body').innerText().catch(() => '');
await page.screenshot({ path: '$browserScreenshot', fullPage: true });

state.routes.templateStudio = await page.goto('http://127.0.0.1:3000/workspace/user/templates/studio', { waitUntil: 'networkidle', timeout: 60000 }).then((response) => response?.status() ?? null);
state.dom.templateStudioBody = await page.locator('body').innerText().catch(() => '');

await browser.close();
console.log(JSON.stringify(state, null, 2));
"@
Set-Content -Path $browserScriptPath -Value $browserScript -Encoding UTF8
node $browserScriptPath | Tee-Object -FilePath $browserLog

$browserState = Read-JsonFile -Path $browserLog

$controlSummary = if (Test-Path $controlPointDir) { Read-JsonFile -Path (Join-Path $controlPointDir 'audit-summary.json') } else { $null }
$controlResults = if (Test-Path (Join-Path $proofDir 'control-point-results-after.json')) { Read-JsonFile -Path (Join-Path $proofDir 'control-point-results-after.json') } else { @() }
$previewSummary = if (Test-Path $previewAuditDir) { Read-JsonFile -Path (Join-Path $previewAuditDir 'audit_summary.json') } else { $null }

$hardRecovery = @{
  status = if ($quarterSummary.status -eq 'PASS' -and $controlSummary -and $controlSummary.overall_status -eq 'passed' -and $previewSummary -and $previewSummary.success -eq $true) { 'PASS' } else { 'FAIL' }
  timestamp = (Get-Date).ToString('o')
  gates = @{
    quarterStressGenerator = if ($quarterSummary.status -eq 'PASS') { 'PASS' } else { 'FAIL' }
    controlPointAudit = if ($controlSummary -and $controlSummary.overall_status -eq 'passed') { 'PASS' } else { 'FAIL' }
    previewAccountingAudit = if ($previewSummary -and $previewSummary.success -eq $true) { 'PASS' } else { 'FAIL' }
    pdfControl = if ((Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-PDF-001') -eq 'PASS') { 'PASS' } else { 'FAIL' }
    zatcaControl = if ((Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-ZATCA-003') -eq 'PASS') { 'PASS' } else { 'FAIL' }
    importControl = if ((Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-IMP-002') -eq 'PASS') { 'PASS' } else { 'FAIL' }
    antiSyntheticEvidenceControl = if ((Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-P1-AUD-ANTI-SYN') -eq 'PASS') { 'PASS' } else { 'FAIL' }
  }
  failedControls = if ($controlResults) { @($controlResults | Where-Object { $_.result_status -ne 'pass' } | Select-Object -ExpandProperty control_id) } else { @() }
  externalBlocked = @()
  commands = @(
    'node tools/generate-quarter-stress-test-data.mjs',
    'npm run typecheck',
    'npm run build',
    'npm run test',
    'npm run lint',
    'npm run audit:control-points:stable',
    'npm run audit:preview-accounting'
  )
  artifactRoot = $OutputDir
  browserProof = $browserState
  quarterStressSummary = $quarterSummary
}

Write-JsonFile -Path (Join-Path $proofDir 'hard-recovery-validation-after.json') -Value $hardRecovery

Write-JsonFile -Path (Join-Path $reportDir 'control-point-closure-report.json') -Value @{
  rows = @(
    @{
      controlPoint = 'CP-P1-AUD-ANTI-SYN'
      before = 'FAIL'
      after = (Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-P1-AUD-ANTI-SYN')
      evidenceFile = 'proof/control-point-results-after.json'
      statusReason = 'Recovered through authenticated audit evidence chain.'
    },
    @{
      controlPoint = 'CP-PDF-001'
      before = 'FAIL'
      after = (Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-PDF-001')
      evidenceFile = 'proof/pdf-control-proof.json'
      statusReason = 'Pending document preview/PDF proof capture.'
    },
    @{
      controlPoint = 'CP-ZATCA-003'
      before = 'FAIL'
      after = (Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-ZATCA-003')
      evidenceFile = 'proof/zatca-control-proof.json'
      statusReason = 'Local ZATCA simulation remains distinct from official validation.'
    },
    @{
      controlPoint = 'CP-IMP-002'
      before = 'FAIL'
      after = (Get-ControlStatusUpper -Summary $controlResults -ControlId 'CP-IMP-002')
      evidenceFile = 'proof/import-control-proof.json'
      statusReason = 'Recovered using deterministic import fixture mapping proof.'
    }
  )
} 

Set-Content -Path (Join-Path $repoRoot 'ARTIFACT_LOCATION.txt') -Encoding UTF8 -Value @"
artifact_root=$OutputDir
final_zip_inside=$OutputDir\prompt-audit-harness-quarter-stress-controlpoints-$timestamp.zip
convenience_zip=$repoRoot\artifact\prompt-audit-harness-quarter-stress-controlpoints-$timestamp.zip
status=$($hardRecovery.status)
"@

if ($hardRecovery.status -ne 'PASS') {
  Write-FailureAnalysis -File (Join-Path $attemptDir 'failure-analysis.md') -Title 'Hard recovery validation failed' -Details "Failed controls: $($hardRecovery.failedControls -join ', ')"
  exit 1
}

exit 0
