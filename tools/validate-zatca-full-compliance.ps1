param(
  [string]$ArtifactRoot = (Join-Path (Get-Location) 'artifact\prompt-zatca-full-compliance-20260507-140123'),
  [string]$BaseUrl = 'http://localhost:3000',
  [int]$DocumentId = 2166,
  [string]$DocumentNumber = 'INV-2026-0218',
  [int]$FallbackDocumentId = 0,
  [string]$ZatcaSdkCommand,
  [string]$VeraPdfCommand,
  [string]$XmlSecCommand
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Write-Log([string]$Message, [string]$LogPath) {
  $line = "[{0}] {1}" -f (Get-Date).ToString('s'), $Message
  Add-Content -LiteralPath $LogPath -Value $line
}

function Save-Json([object]$Value, [string]$Path) {
  $Value | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $Path -Encoding utf8
}

function Get-FirstPropertyValue([object]$Object, [string[]]$Names) {
  if ($null -eq $Object) {
    return $null
  }

  foreach ($name in $Names) {
    try {
      $value = $Object.$name
      if ($null -ne $value) {
        $text = $value.ToString()
        if ($text.Trim()) {
          return $value
        }
      }
    } catch {
      continue
    }
  }

  return $null
}

function Invoke-NpmCommand([string[]]$NpmArgs, [string]$LogPath) {
  $joined = $NpmArgs -join ' '
  Set-Content -LiteralPath $LogPath -Value ("[{0}] Running npm {1}" -f (Get-Date).ToString('s'), $joined) -Encoding utf8
  $stdoutPath = "$LogPath.stdout"
  $stderrPath = "$LogPath.stderr"
  foreach ($tempPath in @($stdoutPath, $stderrPath)) {
    if (Test-Path -LiteralPath $tempPath) {
      Remove-Item -LiteralPath $tempPath -Force
    }
  }

  $npmCmd = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
  $process = Start-Process `
    -FilePath $npmCmd `
    -ArgumentList $NpmArgs `
    -WorkingDirectory (Get-Location).Path `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -WindowStyle Hidden `
    -Wait `
    -PassThru

  foreach ($tempPath in @($stdoutPath, $stderrPath)) {
    if (Test-Path -LiteralPath $tempPath) {
      $content = Get-Content -LiteralPath $tempPath -Raw
      if ($content) {
        Add-Content -LiteralPath $LogPath -Value $content -Encoding utf8
      }
      Remove-Item -LiteralPath $tempPath -Force
    }
  }
  return [pscustomobject]@{
    ExitCode = $process.ExitCode
    Output = if (Test-Path -LiteralPath $LogPath) { Get-Content -LiteralPath $LogPath -Raw } else { '' }
  }
}

function Invoke-CommandTemplate([string]$CommandTemplate, [string]$TargetPath) {
  if ([string]::IsNullOrWhiteSpace($CommandTemplate)) {
    return [pscustomobject]@{
      Status   = 'blocked'
      Command  = $null
      ExitCode = $null
      Stdout   = ''
      Stderr   = 'command-template-missing'
    }
  }

  $command = $CommandTemplate.Replace('{xml}', $TargetPath).Replace('{pdf}', $TargetPath)
  $stdout = & cmd.exe /d /s /c $command 2>&1 | Out-String
  $exitCode = $LASTEXITCODE

  return [pscustomobject]@{
    Status   = if ($exitCode -eq 0) { 'ready' } else { 'blocked' }
    Command  = $command
    ExitCode = $exitCode
    Stdout   = $stdout
    Stderr   = if ($exitCode -eq 0) { '' } else { $stdout }
  }
}

function Invoke-ApiJson([string]$Uri, [string]$Method = 'GET', [object]$Body = $null, [hashtable]$Headers = @{}) {
  $params = @{
    Uri         = $Uri
    Method      = $Method
    Headers     = $Headers
    ErrorAction = 'Stop'
  }
  if ($null -ne $Body) {
    $params.ContentType = 'application/json'
    $params.Body = ($Body | ConvertTo-Json -Depth 20)
  }
  return Invoke-RestMethod @params
}

function Get-DocumentRecord([int]$CandidateId) {
  try {
    $result = Invoke-ApiJson -Uri "$BaseUrl/api/workspace/documents/$CandidateId?mode=preview"
    return $result.data
  } catch {
    return $null
  }
}

function Find-DocumentIdByNumber([string]$ExpectedNumber) {
  $candidates = @(
    "$BaseUrl/api/workspace/documents?mode=preview&search=$([uri]::EscapeDataString($ExpectedNumber))",
    "$BaseUrl/api/workspace/documents?mode=preview&group=sales&type=tax_invoice&search=$([uri]::EscapeDataString($ExpectedNumber))",
    "$BaseUrl/api/workspace/sales-documents?mode=preview&type=tax_invoice&search=$([uri]::EscapeDataString($ExpectedNumber))"
  )

  foreach ($uri in $candidates) {
    try {
      $result = Invoke-ApiJson -Uri $uri
      $records = @()
      if ($result -is [System.Collections.IEnumerable] -and $result.PSObject.Properties.Name -notcontains 'data') {
        $records = @($result)
      } elseif ($null -ne $result.data) {
        $records = @($result.data)
      }

      foreach ($record in $records) {
        $number = @($record.number, $record.documentNumber, $record.document_number) | Where-Object { $_ -and $_.ToString().Trim() } | Select-Object -First 1
        if ($number -and $number.ToString().Trim() -eq $ExpectedNumber) {
          $id = @($record.id, $record.documentId, $record.document_id) | Where-Object { $_ -is [int] -or $_ -is [long] } | Select-Object -First 1
          if ($id) { return [int]$id }
        }
      }
    } catch {
      continue
    }
  }

  return $null
}

function Find-FirstPreviewTaxInvoiceId() {
  try {
    $result = Invoke-ApiJson -Uri "$BaseUrl/api/workspace/documents?mode=preview&type=tax_invoice&page=1&pageSize=1"
    $records = @()
    if ($null -ne $result.data) {
      if ($result.data -is [System.Collections.IEnumerable] -and -not ($result.data -is [string])) {
        $records = @($result.data)
      } else {
        $records = @($result.data)
      }
    }
    foreach ($record in $records) {
      $id = Get-FirstPropertyValue $record @('id', 'documentId', 'document_id')
      if ($null -ne $id) {
        return [int]$id
      }
    }
  } catch {
    return $null
  }

  return $null
}

Ensure-Dir $ArtifactRoot
foreach ($child in @('logs', 'reports', 'proof', 'xml', 'pdf', 'qr', 'screenshots')) {
  Ensure-Dir (Join-Path $ArtifactRoot $child)
}

$logPath = Join-Path $ArtifactRoot 'logs\zatca-validation-script.log'
Set-Content -LiteralPath $logPath -Value "ZATCA validation started $(Get-Date -Format s)" -Encoding utf8

$packageLogs = @{
  typecheck = Join-Path $ArtifactRoot 'logs\typecheck.log'
  build     = Join-Path $ArtifactRoot 'logs\build.log'
  test      = Join-Path $ArtifactRoot 'logs\test.log'
  lint      = Join-Path $ArtifactRoot 'logs\lint.log'
}

$packageResults = @{}
foreach ($entry in $packageLogs.GetEnumerator()) {
  $result = Invoke-NpmCommand -NpmArgs @('run', $entry.Key) -LogPath $entry.Value
  $packageResults[$entry.Key] = @{
    exitCode = $result.ExitCode
    pass = $result.ExitCode -eq 0
  }
}

$resolvedId = $DocumentId
$resolvedDocument = Get-DocumentRecord -CandidateId $resolvedId
$resolvedDocumentNumber = $null
$targetBlockers = @()
if ($resolvedDocument) {
  $resolvedDocumentNumber = Get-FirstPropertyValue $resolvedDocument @('number', 'documentNumber', 'document_number')
  if ($resolvedDocumentNumber -and ($resolvedDocumentNumber.ToString() -ne $DocumentNumber)) {
    $targetBlockers += "target-document-number-mismatch:${resolvedId}:${resolvedDocumentNumber}"
  }
}
if (-not $resolvedDocument) {
  $found = Find-DocumentIdByNumber -ExpectedNumber $DocumentNumber
  if ($found) {
    $resolvedId = $found
    $resolvedDocument = Get-DocumentRecord -CandidateId $resolvedId
    if ($resolvedDocument) {
      $resolvedDocumentNumber = Get-FirstPropertyValue $resolvedDocument @('number', 'documentNumber', 'document_number')
    }
  }
}

if (-not $resolvedDocument) {
  $targetBlockers += "target-document-not-found:$DocumentNumber"
  if ($FallbackDocumentId -gt 0) {
    $resolvedId = $FallbackDocumentId
    $resolvedDocument = Get-DocumentRecord -CandidateId $resolvedId
    if ($resolvedDocument) {
      $targetBlockers += "fallback-document-used:$resolvedId"
    }
  } else {
    $fallbackPreviewId = Find-FirstPreviewTaxInvoiceId
    if ($fallbackPreviewId) {
      $resolvedId = $fallbackPreviewId
      $resolvedDocument = Get-DocumentRecord -CandidateId $resolvedId
      if ($resolvedDocument) {
        $targetBlockers += "fallback-preview-document-used:$resolvedId"
      }
    }
  }
}

if (-not $resolvedDocument) {
  $targetBlockers += "target-document-unverified:$DocumentNumber"
  $resolvedDocument = [pscustomobject]@{
    id = $resolvedId
    document_number = $DocumentNumber
  }
}

$resolvedNumber = Get-FirstPropertyValue $resolvedDocument @('number', 'documentNumber', 'document_number')
if (-not $resolvedNumber) {
  $resolvedNumber = $DocumentNumber
}

$xmlPath = Join-Path $ArtifactRoot "xml\$resolvedNumber-tax-invoice.xml"
$pdfPath = Join-Path $ArtifactRoot "pdf\$resolvedNumber-tax-invoice-pdfa3.pdf"
$qrTxtPath = Join-Path $ArtifactRoot "qr\$resolvedNumber-qr.txt"
$qrDecodedPath = Join-Path $ArtifactRoot "qr\$resolvedNumber-qr-decoded.json"

$null = Invoke-WebRequest -Uri "$BaseUrl/api/workspace/documents/$resolvedId/zatca/xml?mode=preview" -Headers @{ Accept = 'application/xml' } -UseBasicParsing -OutFile $xmlPath

$null = Invoke-WebRequest -Uri "$BaseUrl/api/workspace/documents/$resolvedId/zatca/pdf-a3?mode=preview" -Headers @{ Accept = 'application/pdf' } -UseBasicParsing -OutFile $pdfPath

$qrTextResponse = Invoke-RestMethod -Uri "$BaseUrl/api/workspace/documents/$resolvedId/zatca/qr?mode=preview"
($qrTextResponse.ToString().Trim()) | Set-Content -LiteralPath $qrTxtPath -Encoding utf8

$proofResponse = Invoke-ApiJson -Uri "$BaseUrl/api/workspace/documents/$resolvedId/zatca/proof?mode=preview"
$proof = $proofResponse.data
Save-Json -Value $proof -Path $qrDecodedPath

$validateResponse = Invoke-ApiJson -Uri "$BaseUrl/api/workspace/documents/$resolvedId/zatca/validate?mode=preview" -Method POST -Body @{} -Headers @{ Accept = 'application/json' }
$validate = $validateResponse.data

$xmlStructurePath = Join-Path $ArtifactRoot 'proof\xml-structure-validation.json'
$signaturePath = Join-Path $ArtifactRoot 'proof\xml-signature-validation.json'
$xmlSignatureLocalPath = Join-Path $ArtifactRoot 'proof\xml-signature-local-details.json'
$qrValidationPath = Join-Path $ArtifactRoot 'proof\qr-validation.json'
$hashChainPath = Join-Path $ArtifactRoot 'proof\hash-chain-validation.json'
$sdkValidationPath = Join-Path $ArtifactRoot 'proof\zatca-sdk-validation.json'
$pdfa3ValidationPath = Join-Path $ArtifactRoot 'proof\pdfa3-validation.json'
$embeddedXmlValidationPath = Join-Path $ArtifactRoot 'proof\pdf-embedded-xml-validation.json'

Save-Json -Value $validate.localValidation.details.xml -Path $xmlStructurePath
Save-Json -Value $validate.localValidation.details.signature -Path $xmlSignatureLocalPath
Save-Json -Value $validate.localValidation.details.qr -Path $qrValidationPath
Save-Json -Value @{
  icv = $validate.localValidation.details.icv
  previousInvoiceHash = $validate.localValidation.details.previousInvoiceHash
  canonicalHash = $validate.localValidation.details.canonicalHash
} -Path $hashChainPath

$sdkResult = Invoke-CommandTemplate -CommandTemplate $ZatcaSdkCommand -TargetPath $xmlPath
$pdfa3Result = Invoke-CommandTemplate -CommandTemplate $VeraPdfCommand -TargetPath $pdfPath
$xmlSecResult = Invoke-CommandTemplate -CommandTemplate $XmlSecCommand -TargetPath $xmlPath

Save-Json -Value $sdkResult -Path $sdkValidationPath
Save-Json -Value $pdfa3Result -Path $pdfa3ValidationPath
Save-Json -Value $xmlSecResult -Path $signaturePath

$embeddedXmlResult = @{
  status = 'blocked'
  blockers = @('pdf-embedded-xml-extraction-not-validated')
  extractedXmlHashMatches = $false
}

try {
  $pdfJson = & node -e @"
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');

const pdfPath = process.argv[1];
const xmlPath = process.argv[2];
const bytes = fs.readFileSync(pdfPath);
const text = bytes.toString('latin1');
const embeddedFileMarker = '/Type /EmbeddedFile';
const markerIndex = text.indexOf(embeddedFileMarker);
if (markerIndex < 0) {
  console.log(JSON.stringify({ status: 'blocked', blockers: ['embedded-xml-attachment-missing'] }));
  return;
}
const streamIndex = text.indexOf('stream', markerIndex);
if (streamIndex < 0) {
  console.log(JSON.stringify({ status: 'blocked', blockers: ['embedded-xml-stream-missing'] }));
  return;
}
let start = streamIndex + 'stream'.length;
if (text[start] === '\r' && text[start + 1] === '\n') {
  start += 2;
} else if (text[start] === '\n') {
  start += 1;
}
const end = text.indexOf('endstream', start);
if (end < 0) {
  console.log(JSON.stringify({ status: 'blocked', blockers: ['embedded-xml-stream-end-missing'] }));
  return;
}
const streamBytes = bytes.slice(start, end);
let xml = '';
try {
  xml = zlib.inflateSync(streamBytes).toString('utf8');
} catch (inflateError) {
  console.log(JSON.stringify({ status: 'blocked', blockers: ['embedded-xml-inflate-failed'], error: inflateError.message }));
  return;
}
const embeddedHash = crypto.createHash('sha256').update(xml, 'utf8').digest('hex');
const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(xmlPath, 'utf8'), 'utf8').digest('hex');
console.log(JSON.stringify({ status: embeddedHash === sourceHash ? 'ready' : 'blocked', blockers: embeddedHash === sourceHash ? [] : ['embedded-xml-hash-mismatch'], extractedXmlHashMatches: embeddedHash === sourceHash, embeddedHash, sourceHash }));
"@ $pdfPath $xmlPath
  $embeddedXmlResult = $pdfJson | ConvertFrom-Json
} catch {
  $embeddedXmlResult = @{
    status = 'blocked'
    blockers = @('embedded-xml-validation-error')
    extractedXmlHashMatches = $false
  }
}

Save-Json -Value $embeddedXmlResult -Path $embeddedXmlValidationPath

$final = @{
  documentNumber = $resolvedNumber
  documentId = $resolvedId
  targetDocumentNumber = $DocumentNumber
  targetResolutionBlockers = $targetBlockers
  packageResults = $packageResults
  localValidation = $validate.localValidation
  externalValidation = @{
    zatcaSdk = $sdkResult
    pdfa3 = $pdfa3Result
    xmlSec = $xmlSecResult
  }
  embeddedXml = $embeddedXmlResult
  qr = @{
    base64 = $proof.qrBase64
    decoded = $proof.qrDecoded
  }
}

$finalPath = Join-Path $ArtifactRoot 'proof\phase1-final-validation.json'
Save-Json -Value $final -Path $finalPath

$packagePass = (@($packageResults.Values | Where-Object { -not $_.pass })).Count -eq 0
$localPass = $validate.localValidation.xmlValid -and ($validate.localValidation.signatureValid -eq $true -or $validate.localValidation.signatureValid -eq 'blocked') -and $validate.localValidation.qrValid
$embeddedPass = $false
if ($embeddedXmlResult) {
  try {
    $embeddedPass = [bool]$embeddedXmlResult.extractedXmlHashMatches
  } catch {
    $embeddedPass = $false
  }
}
$sdkPass = $sdkResult.Status -eq 'ready'
$pdfaPass = $pdfa3Result.Status -eq 'ready'
$xmlSecPass = $xmlSecResult.Status -eq 'ready'

$overall = if ($packagePass -and $localPass -and $embeddedPass -and $sdkPass -and $pdfaPass -and $xmlSecPass -and $targetBlockers.Count -eq 0) { 'PASS' } elseif ($packagePass -and $localPass -and $embeddedPass) { 'BLOCKED' } else { 'FAIL' }

Write-Log "Validation completed with status: $overall" $logPath

if ($overall -eq 'PASS') {
  exit 0
}
if ($overall -eq 'BLOCKED') {
  exit 2
}
exit 1
