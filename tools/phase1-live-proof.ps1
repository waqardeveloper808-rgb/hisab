$ErrorActionPreference = 'Stop'

function Get-DotEnvValue($path, $key) {
    if (-not (Test-Path $path)) {
        return $null
    }

    $pattern = "^$key=(.*)$"
    $line = Get-Content $path | Where-Object { $_ -match $pattern } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    return ($line -replace $pattern, '$1').Trim().Trim('"')
}

$backendEnvPath = Join-Path (Join-Path $PSScriptRoot '..') 'backend\.env'
$workspaceToken = $env:WORKSPACE_API_TOKEN
if (-not $workspaceToken) {
    $workspaceToken = Get-DotEnvValue $backendEnvPath 'WORKSPACE_API_TOKEN'
}

$workspaceUserId = $env:WORKSPACE_API_USER_ID
if (-not $workspaceUserId) {
    $workspaceUserId = Get-DotEnvValue $backendEnvPath 'WORKSPACE_API_USER_ID'
}

if (-not $workspaceToken -or -not $workspaceUserId) {
    throw 'Workspace runtime auth values are not configured.'
}

Write-Host ("Resolved workspace runtime auth: token={0}; actor={1}" -f $workspaceToken, $workspaceUserId)

$headers = @{
    'X-Gulf-Hisab-Workspace-Token' = $workspaceToken
    'X-Gulf-Hisab-Actor-Id' = $workspaceUserId
    'Accept' = 'application/json'
    'Content-Type' = 'application/json'
}

function BodyData($response) {
    if ($null -ne $response.data) {
        return $response.data
    }

    return $response
}

function Invoke-JsonPost($uri, $body) {
    BodyData (Invoke-RestMethod -Uri $uri -Headers $headers -Method POST -Body ($body | ConvertTo-Json -Depth 8))
}

function Invoke-JsonGet($uri) {
    BodyData (Invoke-RestMethod -Uri $uri -Headers $headers -Method GET)
}

$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$company = Invoke-JsonPost 'http://127.0.0.1:8000/api/companies' @{ legal_name = "Phase1 Live Proof $stamp" }
$companyId = [int] $company.id
$accounts = @($company.accounts)
$taxCategories = @($company.tax_categories)

$incomeAccountId = [int] (($accounts | Where-Object { $_.code -eq '4000' } | Select-Object -First 1).id)
$vat15Id = [int] (($taxCategories | Where-Object { $_.code -eq 'VAT15' } | Select-Object -First 1).id)

$contact = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/contacts" @{
    type = 'customer'
    display_name = "Phase1 Customer $stamp"
}

$item = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/items" @{
    type = 'product'
    sku = "PH1-$stamp"
    name = "Phase1 Product $stamp"
    tax_category_id = $vat15Id
    income_account_id = $incomeAccountId
    default_sale_price = 100
    default_purchase_price = 60
}

$stock = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/inventory/stock" @{
    item_id = [int] $item.id
    product_name = $item.name
    material = 'Steel'
    inventory_type = 'trading'
    size = 'STD'
    source = 'purchase'
    code = "PH1-STK-$stamp"
    quantity_on_hand = 10
    reorder_level = 1
    unit_cost = 60
    transaction_date = '2026-04-18'
    reference = "PH1-STOCK-$stamp"
}

function New-Invoice($companyId, $contactId, $itemId, $taxCategoryId, $incomeAccountId, $issueDate, $dueDate, $quantity, $unitPrice) {
    $draft = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/sales-documents" @{
        type = 'tax_invoice'
        contact_id = $contactId
        issue_date = $issueDate
        due_date = $dueDate
        lines = @(@{
            item_id = $itemId
            quantity = $quantity
            unit_price = $unitPrice
            tax_category_id = $taxCategoryId
            ledger_account_id = $incomeAccountId
        })
    }

    Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/sales-documents/$($draft.id)/finalize" @{}
}

$invoiceA = New-Invoice $companyId $contact.id $item.id $vat15Id $incomeAccountId '2026-04-18' '2026-04-25' 2 100
$invoiceB = New-Invoice $companyId $contact.id $item.id $vat15Id $incomeAccountId '2026-04-19' '2026-04-26' 1 100

$advancePayment = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/payments" @{
    contact_id = [int] $contact.id
    amount = 300
    payment_date = '2026-04-20'
    reference = "PH1-ADV-$stamp"
    allocations = @(@{
        document_id = [int] $invoiceA.id
        amount = 230
    })
}

$invoiceBBeforeApply = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/sales-documents/$($invoiceB.id)"
$advanceApply = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/sales-documents/$($invoiceB.id)/apply-advance" @{
    amount = 70
    application_date = '2026-04-21'
}
$invoiceBAfterApply = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/sales-documents/$($invoiceB.id)"

$invoiceC = New-Invoice $companyId $contact.id $item.id $vat15Id $incomeAccountId '2026-04-22' '2026-04-29' 1 100
$invoiceD = New-Invoice $companyId $contact.id $item.id $vat15Id $incomeAccountId '2026-04-23' '2026-04-30' 1 100

$multiPayment = Invoke-JsonPost "http://127.0.0.1:8000/api/companies/$companyId/payments" @{
    contact_id = [int] $contact.id
    amount = 230
    payment_date = '2026-04-24'
    reference = "PH1-MULTI-$stamp"
    allocations = @(
        @{ document_id = [int] $invoiceC.id; amount = 115 },
        @{ document_id = [int] $invoiceD.id; amount = 115 }
    )
}

$invoiceCAfter = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/sales-documents/$($invoiceC.id)"
$invoiceDAfter = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/sales-documents/$($invoiceD.id)"

$journalsForC = @(Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/journals?document_number=$($invoiceC.document_number)")
$multiJournal = $journalsForC | Where-Object { $_.source_type -eq 'payment' } | Select-Object -First 1
$multiJournalDetail = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/journals/$($multiJournal.id)"
$ledgerC = @(Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/reports/general-ledger?document_number=$($invoiceC.document_number)")
$ledgerD = @(Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/reports/general-ledger?document_number=$($invoiceD.document_number)")
$trialBalance = @(Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/reports/trial-balance")
$profitLoss = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/reports/profit-loss"
$balanceSheet = Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/reports/balance-sheet"
$vatDetail = @(Invoke-JsonGet "http://127.0.0.1:8000/api/companies/$companyId/reports/vat-detail")

$result = [ordered]@{
    company_id = $companyId
    stock = [ordered]@{
        id = $stock.id
        code = $stock.code
        quantity_on_hand = $stock.quantity_on_hand
        journal_entry_number = $stock.journal_entry_number
        inventory_account_code = $stock.inventory_account_code
    }
    advance_flow = [ordered]@{
        payment_number = $advancePayment.payment_number
        unallocated_amount = $advancePayment.unallocated_amount
        invoice_before_apply = [ordered]@{
            document_number = $invoiceBBeforeApply.document_number
            status = $invoiceBBeforeApply.status
            paid_total = $invoiceBBeforeApply.paid_total
            balance_due = $invoiceBBeforeApply.balance_due
        }
        apply_result = [ordered]@{
            status = $advanceApply.status
            paid_total = $advanceApply.paid_total
            balance_due = $advanceApply.balance_due
        }
        invoice_after_apply = [ordered]@{
            document_number = $invoiceBAfterApply.document_number
            status = $invoiceBAfterApply.status
            paid_total = $invoiceBAfterApply.paid_total
            balance_due = $invoiceBAfterApply.balance_due
        }
    }
    multi_invoice_flow = [ordered]@{
        payment_number = $multiPayment.payment_number
        allocated_total = $multiPayment.allocated_total
        unallocated_amount = $multiPayment.unallocated_amount
        allocations = @($multiPayment.allocations | ForEach-Object {
            [ordered]@{
                document_id = $_.document_id
                amount = $_.amount
            }
        })
        invoice_c = [ordered]@{
            document_number = $invoiceCAfter.document_number
            status = $invoiceCAfter.status
            balance_due = $invoiceCAfter.balance_due
        }
        invoice_d = [ordered]@{
            document_number = $invoiceDAfter.document_number
            status = $invoiceDAfter.status
            balance_due = $invoiceDAfter.balance_due
        }
        journal = [ordered]@{
            entry_number = $multiJournalDetail.entry_number
            document_numbers = @($multiJournalDetail.document_numbers)
            line_count = @($multiJournalDetail.lines).Count
            debit_total = $multiJournalDetail.debit_total
            credit_total = $multiJournalDetail.credit_total
            receivable_lines = @($multiJournalDetail.lines | Where-Object { $_.account_code -eq '1100' } | ForEach-Object {
                [ordered]@{
                    document_number = $_.document_number
                    credit = $_.credit
                }
            })
        }
        ledger_invoice_c = @($ledgerC | Select-Object -First 6)
        ledger_invoice_d = @($ledgerD | Select-Object -First 6)
    }
    reports = [ordered]@{
        trial_balance_2300 = ($trialBalance | Where-Object { $_.code -eq '2300' } | Select-Object -First 1)
        trial_balance_1100 = ($trialBalance | Where-Object { $_.code -eq '1100' } | Select-Object -First 1)
        profit_loss = $profitLoss
        balance_sheet = $balanceSheet
        vat15 = ($vatDetail | Where-Object { $_.code -eq 'VAT15' } | Select-Object -First 1)
    }
}

$result | ConvertTo-Json -Depth 10