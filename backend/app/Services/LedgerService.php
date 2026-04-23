<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\Document;
use App\Models\InventoryItem;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Payment;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LedgerService
{
    public function __construct(private readonly AccountingPeriodService $accountingPeriodService)
    {
    }

    public function postSalesDocument(Document $document, ?string $appliedAdvanceAmount = null): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($document->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $vatPayable = $this->findAccount($company, $company->settings->default_vat_payable_account_code);
        $discountAccount = $this->findAccount($company, $company->settings->default_discount_account_code ?? '4500');

        $revenueLines = $document->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount', 'discount_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $document) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);
                $grossAmount = $lines->reduce(function (BigDecimal $carry, $line) {
                    return $carry->plus(BigDecimal::of((string) $line->net_amount)->plus((string) ($line->discount_amount ?? '0')));
                }, BigDecimal::zero())->toScale(2, RoundingMode::HALF_UP);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $document->contact_id,
                    'document_id' => $document->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Revenue from sales document',
                    'debit' => '0.00',
                    'credit' => (string) $grossAmount,
                ];
            })
            ->values()
            ->all();

        $appliedAdvance = BigDecimal::of((string) ($appliedAdvanceAmount ?? '0.00'))->toScale(2, RoundingMode::HALF_UP);
        $receivableAmount = BigDecimal::of((string) $document->grand_total)->minus($appliedAdvance)->toScale(2, RoundingMode::HALF_UP);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $document->id,
            'reference' => $document->document_number,
            'description' => sprintf('Posting for %s %s', $document->type, $document->document_number ?? $document->uuid),
            'metadata' => [
                'document_links' => [[
                    'documentId' => $document->id,
                    'documentNumber' => $document->document_number,
                    'documentType' => $document->type,
                    'status' => $document->status,
                ]],
            ],
        ], array_values(array_filter([
            $receivableAmount->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $receivable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Receivable created from sales document',
                'debit' => (string) $receivableAmount,
                'credit' => '0.00',
            ] : null,
            $appliedAdvance->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $advance->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Customer advance applied to sales document',
                'debit' => (string) $appliedAdvance,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of((string) ($document->discount_total ?? '0'))->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $discountAccount->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Sales discount allowed',
                'debit' => (string) BigDecimal::of((string) $document->discount_total)->toScale(2, RoundingMode::HALF_UP),
                'credit' => '0.00',
            ] : null,
            ...$revenueLines,
            $document->tax_total > 0 ? [
                'account_id' => $vatPayable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Output VAT',
                'debit' => '0.00',
                'credit' => $document->tax_total,
            ] : null,
        ])));
    }

    public function postDeliveryNote(Document $document, InventoryItem $inventory, string $quantity, string $unitCost, array $documentLinks, int $actorId): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($document->supply_date ?? $document->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cogs = Account::query()->where('company_id', $company->id)->findOrFail($inventory->cogs_account_id);
        $amount = BigDecimal::of($quantity)->multipliedBy($unitCost)->toScale(2, RoundingMode::HALF_UP);
        $documentLabel = str_replace('_', ' ', $document->type);
        $inventoryFlow = $document->type === 'delivery_note' ? 'delivery' : 'invoice';

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => $document->type === 'delivery_note' ? 'delivery_note' : 'document_inventory',
            'source_id' => $document->id,
            'reference' => $document->document_number,
            'description' => sprintf('%s %s inventory issue', ucfirst($documentLabel), $document->document_number ?? $document->uuid),
            'memo' => sprintf('%s inventory issue', ucfirst($documentLabel)),
            'created_by' => $actorId,
            'metadata' => [
                'inventory_flow' => $inventoryFlow,
                'document_links' => $documentLinks,
            ],
        ], [
            [
                'account_id' => $cogs->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => sprintf('Cost of goods sold from %s', $documentLabel),
                'debit' => (string) $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $inventory->inventory_account_id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => sprintf('Inventory relief from %s', $documentLabel),
                'debit' => '0.00',
                'credit' => (string) $amount,
            ],
        ]);
    }

    public function postCreditNote(Document $creditNote, Document $sourceDocument, string $receivableReduction, string $customerAdvanceIncrease): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($creditNote->company_id);
        $entryDate = Carbon::parse($creditNote->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);
        $vatPayable = $this->findAccount($company, $company->settings->default_vat_payable_account_code);

        $revenueLines = $creditNote->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $sourceDocument, $creditNote) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $sourceDocument->contact_id,
                    'document_id' => $creditNote->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Revenue reversal via credit note',
                    'debit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                    'credit' => '0.00',
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $creditNote->id,
            'description' => sprintf('Credit note reversal for %s', $sourceDocument->document_number ?? $sourceDocument->uuid),
        ], array_values(array_filter([
            ...$revenueLines,
            $creditNote->tax_total > 0 ? [
                'account_id' => $vatPayable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Output VAT reversal',
                'debit' => $creditNote->tax_total,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of($receivableReduction)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $receivable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Receivable reduction from credit note',
                'debit' => '0.00',
                'credit' => $receivableReduction,
            ] : null,
            BigDecimal::of($customerAdvanceIncrease)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $advance->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Customer credit created from credit note',
                'debit' => '0.00',
                'credit' => $customerAdvanceIncrease,
            ] : null,
        ])));
    }

    public function postPurchaseDocument(Document $document): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($document->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $vatReceivable = $this->findAccount($company, $company->settings->default_vat_receivable_account_code);

        $expenseLines = $document->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $document) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $document->contact_id,
                    'document_id' => $document->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Expense or asset recognized from purchase document',
                    'debit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                    'credit' => '0.00',
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $document->id,
            'description' => sprintf('Posting for %s %s', $document->type, $document->document_number ?? $document->uuid),
        ], array_values(array_filter([
            ...$expenseLines,
            $document->tax_total > 0 ? [
                'account_id' => $vatReceivable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Input VAT recoverable',
                'debit' => $document->tax_total,
                'credit' => '0.00',
            ] : null,
            [
                'account_id' => $payable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'cost_center_id' => $document->cost_center_id,
                'description' => 'Supplier payable created from purchase document',
                'debit' => '0.00',
                'credit' => $document->grand_total,
            ],
        ])));
    }

    public function postInventoryReceipt(Company $company, InventoryItem $inventory, array $data, $actor): JournalEntry
    {
        $entryDate = Carbon::parse($data['entry_date'] ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $amount = BigDecimal::of((string) $data['quantity'])->multipliedBy((string) $data['unit_cost'])->toScale(2, RoundingMode::HALF_UP);
        $offset = Account::query()->where('company_id', $company->id)->findOrFail($data['offset_account_id']);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'inventory_receipt',
            'source_id' => $inventory->id,
            'reference' => $data['reference'] ?? null,
            'description' => $data['description'] ?? 'Inventory receipt',
            'memo' => $data['description'] ?? 'Inventory receipt',
            'created_by' => $actor->id,
            'metadata' => ['inventory_flow' => 'receipt'],
        ], [
            [
                'account_id' => $inventory->inventory_account_id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Inventory received',
                'debit' => (string) $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $offset->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Offset for inventory receipt',
                'debit' => '0.00',
                'credit' => (string) $amount,
            ],
        ]);
    }

    public function postInventoryAdjustment(Company $company, InventoryItem $inventory, array $data, $actor): JournalEntry
    {
        $entryDate = Carbon::parse($data['entry_date'] ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $adjustment = $this->findAccount($company, $data['adjustment_account_code'] ?? '5050');
        $delta = BigDecimal::of((string) $data['quantity_delta']);
        $amount = $delta->abs()->multipliedBy((string) $data['unit_cost'])->toScale(2, RoundingMode::HALF_UP);
        $positive = $delta->isGreaterThan(BigDecimal::zero());

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'inventory_adjustment',
            'source_id' => $inventory->id,
            'reference' => $data['reference'] ?? null,
            'description' => $data['reason'] ?? 'Inventory adjustment',
            'memo' => $data['reason'] ?? 'Inventory adjustment',
            'created_by' => $actor->id,
            'metadata' => ['inventory_flow' => 'adjustment'],
        ], $positive ? [
            [
                'account_id' => $inventory->inventory_account_id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Inventory increase from adjustment',
                'debit' => (string) $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $adjustment->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Inventory adjustment offset',
                'debit' => '0.00',
                'credit' => (string) $amount,
            ],
        ] : [
            [
                'account_id' => $adjustment->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Inventory adjustment expense',
                'debit' => (string) $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $inventory->inventory_account_id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Inventory decrease from adjustment',
                'debit' => '0.00',
                'credit' => (string) $amount,
            ],
        ]);
    }

    public function postInventorySale(Company $company, InventoryItem $inventory, array $data, $actor): JournalEntry
    {
        $entryDate = Carbon::parse($data['entry_date'] ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $this->findAccount($company, $data['cash_account_code'] ?? $company->settings->default_cash_account_code);
        $revenue = Account::query()->where('company_id', $company->id)->findOrFail($inventory->revenue_account_id);
        $cogs = Account::query()->where('company_id', $company->id)->findOrFail($inventory->cogs_account_id);
        $vat = $this->findAccount($company, $company->settings->default_vat_payable_account_code);

        $quantity = BigDecimal::of((string) $data['quantity']);
        $unitPrice = BigDecimal::of((string) $data['unit_price']);
        $unitCost = BigDecimal::of((string) $data['unit_cost']);
        $taxRate = BigDecimal::of((string) ($data['tax_rate'] ?? '15'));
        $netAmount = $quantity->multipliedBy($unitPrice)->toScale(2, RoundingMode::HALF_UP);
        $taxAmount = $netAmount->multipliedBy($taxRate)->dividedBy('100', 2, RoundingMode::HALF_UP);
        $grossAmount = $netAmount->plus($taxAmount)->toScale(2, RoundingMode::HALF_UP);
        $cogsAmount = $quantity->multipliedBy($unitCost)->toScale(2, RoundingMode::HALF_UP);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'inventory_sale',
            'source_id' => $inventory->id,
            'reference' => $data['reference'] ?? null,
            'description' => $data['description'] ?? 'Inventory sale',
            'memo' => $data['description'] ?? 'Inventory sale',
            'created_by' => $actor->id,
            'metadata' => [
                'inventory_flow' => 'sale',
                'document_links' => $data['document_links'] ?? [],
            ],
        ], [
            [
                'account_id' => $cash->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Cash received from inventory sale',
                'debit' => (string) $grossAmount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $revenue->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Revenue from inventory sale',
                'debit' => '0.00',
                'credit' => (string) $netAmount,
            ],
            [
                'account_id' => $vat->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'VAT on inventory sale',
                'debit' => '0.00',
                'credit' => (string) $taxAmount,
            ],
            [
                'account_id' => $cogs->id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Cost of goods sold',
                'debit' => (string) $cogsAmount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $inventory->inventory_account_id,
                'inventory_item_id' => $inventory->item_id,
                'description' => 'Inventory relieved on sale',
                'debit' => '0.00',
                'credit' => (string) $cogsAmount,
            ],
        ]);
    }

    public function postPurchaseCreditNote(Document $creditNote, Document $sourceDocument, string $payableReduction, string $supplierAdvanceIncrease): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($creditNote->company_id);
        $entryDate = Carbon::parse($creditNote->issue_date ?? now()->toDateString());
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);
        $vatReceivable = $this->findAccount($company, $company->settings->default_vat_receivable_account_code);

        $expenseLines = $creditNote->lines()
            ->get(['ledger_account_id', 'cost_center_id', 'net_amount'])
            ->groupBy(fn ($line) => $line->ledger_account_id.'|'.($line->cost_center_id ?? 'none'))
            ->map(function ($lines) use ($company, $creditNote) {
                $sample = $lines->first();
                $account = Account::query()->where('company_id', $company->id)->findOrFail($sample->ledger_account_id);

                return [
                    'account_id' => $account->id,
                    'contact_id' => $creditNote->contact_id,
                    'document_id' => $creditNote->id,
                    'cost_center_id' => $sample->cost_center_id,
                    'description' => 'Expense or asset reversal via purchase credit note',
                    'debit' => '0.00',
                    'credit' => (string) BigDecimal::of((string) $lines->sum('net_amount'))->toScale(2),
                ];
            })
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'document',
            'source_id' => $creditNote->id,
            'description' => sprintf('Purchase credit note reversal for %s', $sourceDocument->document_number ?? $sourceDocument->uuid),
        ], array_values(array_filter([
            BigDecimal::of($payableReduction)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $payable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Supplier payable reduction from purchase credit note',
                'debit' => $payableReduction,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of($supplierAdvanceIncrease)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Supplier advance created from purchase credit note',
                'debit' => $supplierAdvanceIncrease,
                'credit' => '0.00',
            ] : null,
            $creditNote->tax_total > 0 ? [
                'account_id' => $vatReceivable->id,
                'contact_id' => $sourceDocument->contact_id,
                'document_id' => $creditNote->id,
                'cost_center_id' => $creditNote->cost_center_id,
                'description' => 'Input VAT reversal',
                'debit' => '0.00',
                'credit' => $creditNote->tax_total,
            ] : null,
            ...$expenseLines,
        ])));
    }

    public function postIncomingPayment(Payment $payment, int $contactId, string $allocatedTotal, string $unallocatedAmount, string $discountAllowedAmount = '0.00', array $allocations = []): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);
        $discountAccount = $this->findAccount($company, $company->settings->default_discount_account_code ?? '4500');

        $documentIds = collect($allocations)->pluck('document_id')->filter()->unique()->values();
        $documents = $documentIds->isNotEmpty()
            ? Document::query()->where('company_id', $company->id)->whereIn('id', $documentIds)->get()->keyBy('id')
            : collect();

        $documentLinks = collect($allocations)
            ->map(function (array $allocation) use ($documents) {
                $document = $documents->get((int) ($allocation['document_id'] ?? 0));

                if (! $document) {
                    return null;
                }

                return [
                    'documentId' => $document->id,
                    'documentNumber' => $document->document_number,
                    'documentType' => $document->type,
                    'status' => $document->status,
                ];
            })
            ->filter()
            ->unique(fn (array $link) => (string) $link['documentId'])
            ->values()
            ->all();

        $referenceDocumentNumber = count($documentLinks) === 1
            ? $documentLinks[0]['documentNumber']
            : null;

        $descriptionSuffix = $documentLinks === []
            ? ''
            : ' for '.collect($documentLinks)->pluck('documentNumber')->filter()->implode(', ');

        $receivableLines = collect($allocations)
            ->map(function (array $allocation) use ($documents, $contactId, $receivable) {
                $document = $documents->get((int) ($allocation['document_id'] ?? 0));

                if (! $document) {
                    return null;
                }

                return [
                    'account_id' => $receivable->id,
                    'contact_id' => $contactId,
                    'document_id' => $document->id,
                    'description' => sprintf('Settlement of receivable for %s', $document->document_number ?? $document->uuid),
                    'debit' => '0.00',
                    'credit' => (string) BigDecimal::of((string) ($allocation['amount'] ?? '0'))->plus((string) ($allocation['discount_allowed_amount'] ?? '0'))->toScale(2, RoundingMode::HALF_UP),
                ];
            })
            ->filter()
            ->values()
            ->all();

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'reference' => $referenceDocumentNumber,
            'description' => sprintf('Incoming payment %s%s', $payment->payment_number ?? $payment->uuid, $descriptionSuffix),
            'metadata' => [
                'document_links' => $documentLinks,
                'payment_allocations' => collect($allocations)
                    ->map(fn (array $allocation) => [
                        'document_id' => (int) ($allocation['document_id'] ?? 0),
                        'amount' => (string) BigDecimal::of((string) ($allocation['amount'] ?? '0'))->toScale(2, RoundingMode::HALF_UP),
                        'discount_allowed_amount' => (string) BigDecimal::of((string) ($allocation['discount_allowed_amount'] ?? '0'))->toScale(2, RoundingMode::HALF_UP),
                    ])
                    ->values()
                    ->all(),
            ],
        ], array_values(array_filter([
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'description' => 'Cash receipt',
                'debit' => $payment->amount,
                'credit' => '0.00',
            ],
            BigDecimal::of($discountAllowedAmount)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $discountAccount->id,
                'contact_id' => $contactId,
                'description' => 'Discount allowed on customer settlement',
                'debit' => (string) BigDecimal::of($discountAllowedAmount)->toScale(2, RoundingMode::HALF_UP),
                'credit' => '0.00',
            ] : null,
            ...$receivableLines,
            BigDecimal::of($unallocatedAmount)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $advance->id,
                'contact_id' => $contactId,
                'description' => 'Unallocated customer advance',
                'debit' => '0.00',
                'credit' => $unallocatedAmount,
            ] : null,
        ])));
    }

    public function postOutgoingPayment(Payment $payment, int $contactId, string $allocatedTotal, string $unallocatedAmount, ?int $documentId = null): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Outgoing payment %s', $payment->payment_number ?? $payment->uuid),
        ], array_values(array_filter([
            BigDecimal::of($allocatedTotal)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $payable->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Settlement of supplier payable',
                'debit' => $allocatedTotal,
                'credit' => '0.00',
            ] : null,
            BigDecimal::of($unallocatedAmount)->isGreaterThan(BigDecimal::zero()) ? [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Supplier advance created by overpayment',
                'debit' => $unallocatedAmount,
                'credit' => '0.00',
            ] : null,
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'document_id' => $documentId,
                'description' => 'Cash disbursement',
                'debit' => '0.00',
                'credit' => $payment->amount,
            ],
        ])));
    }

    public function availableCustomerAdvance(Company $company, int $contactId): BigDecimal
    {
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        $totals = JournalEntryLine::query()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->where('account_id', $advance->id)
            ->where('contact_id', $contactId)
            ->first();

        return BigDecimal::of((string) ($totals->credit_total ?? '0'))
            ->minus(BigDecimal::of((string) ($totals->debit_total ?? '0')));
    }

    public function applyCustomerAdvance(Document $document, string $amount, string $applicationDate): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($applicationDate);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $receivable = $this->findAccount($company, $company->settings->default_receivable_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'advance_application',
            'source_id' => $document->id,
            'description' => sprintf('Apply customer advance to %s', $document->document_number ?? $document->uuid),
        ], [
            [
                'account_id' => $advance->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Customer advance applied against receivable',
                'debit' => $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $receivable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Receivable settled using customer advance',
                'debit' => '0.00',
                'credit' => $amount,
            ],
        ]);
    }

    public function availableSupplierAdvance(Company $company, int $contactId): BigDecimal
    {
        $advance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        $totals = JournalEntryLine::query()
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->where('account_id', $advance->id)
            ->where('contact_id', $contactId)
            ->first();

        return BigDecimal::of((string) ($totals->debit_total ?? '0'))
            ->minus(BigDecimal::of((string) ($totals->credit_total ?? '0')));
    }

    public function applySupplierAdvance(Document $document, string $amount, string $applicationDate): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($document->company_id);
        $entryDate = Carbon::parse($applicationDate);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $payable = $this->findAccount($company, $company->settings->default_payable_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'supplier_advance_application',
            'source_id' => $document->id,
            'description' => sprintf('Apply supplier advance to %s', $document->document_number ?? $document->uuid),
        ], [
            [
                'account_id' => $payable->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Supplier payable settled using supplier advance',
                'debit' => $amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $document->contact_id,
                'document_id' => $document->id,
                'description' => 'Supplier advance consumed',
                'debit' => '0.00',
                'credit' => $amount,
            ],
        ]);
    }

    public function postCustomerAdvanceRefund(Payment $payment, int $contactId): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $advance = $this->findAccount($company, $company->settings->default_customer_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Customer advance refund %s', $payment->payment_number ?? $payment->uuid),
        ], [
            [
                'account_id' => $advance->id,
                'contact_id' => $contactId,
                'description' => 'Customer advance refunded',
                'debit' => $payment->amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'description' => 'Cash paid out for customer refund',
                'debit' => '0.00',
                'credit' => $payment->amount,
            ],
        ]);
    }

    public function postSupplierAdvanceRefund(Payment $payment, int $contactId): JournalEntry
    {
        $company = Company::with('settings')->findOrFail($payment->company_id);
        $entryDate = Carbon::parse($payment->payment_date);
        $this->accountingPeriodService->ensureDateOpen($company, $entryDate);

        $cash = $payment->received_into_account_id
            ? Account::query()->where('company_id', $company->id)->findOrFail($payment->received_into_account_id)
            : $this->findAccount($company, $company->settings->default_cash_account_code);
        $supplierAdvance = $this->findAccount($company, $company->settings->default_supplier_advance_account_code);

        return $this->createBalancedEntry($company, [
            'entry_date' => $entryDate->toDateString(),
            'source_type' => 'payment',
            'source_id' => $payment->id,
            'description' => sprintf('Supplier advance refund %s', $payment->payment_number ?? $payment->uuid),
        ], [
            [
                'account_id' => $cash->id,
                'contact_id' => $contactId,
                'description' => 'Cash received from supplier refund',
                'debit' => $payment->amount,
                'credit' => '0.00',
            ],
            [
                'account_id' => $supplierAdvance->id,
                'contact_id' => $contactId,
                'description' => 'Supplier advance refunded back to cash',
                'debit' => '0.00',
                'credit' => $payment->amount,
            ],
        ]);
    }

    public function reverseJournalEntry(Company $company, JournalEntry $entry, string $sourceType, int $sourceId, string $description): JournalEntry
    {
        $entry->load('lines');

        return $this->createBalancedEntry($company, [
            'entry_date' => now()->toDateString(),
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'description' => $description,
        ], $entry->lines->map(fn (JournalEntryLine $line) => [
            'account_id' => $line->account_id,
            'contact_id' => $line->contact_id,
            'document_id' => $line->document_id,
            'description' => 'Reversal of journal entry '.$entry->entry_number,
            'debit' => (string) $line->credit,
            'credit' => (string) $line->debit,
        ])->all());
    }

    private function findAccount(Company $company, string $code): Account
    {
        $account = Account::query()
            ->where('company_id', $company->id)
            ->where('code', $code)
            ->firstOr(function () use ($code) {
                throw ValidationException::withMessages([
                    'account' => "Required account {$code} is not configured.",
                ]);
            });

        if (! $account->allows_posting) {
            throw ValidationException::withMessages([
                'account' => "Account {$code} is not a posting account.",
            ]);
        }

        return $account;
    }

    private function nextEntryNumber(Company $company): string
    {
        $count = DB::table('journal_entries')->where('company_id', $company->id)->lockForUpdate()->count() + 1;

        return sprintf('JE-%d-%05d', $company->id, $count);
    }

    private function createBalancedEntry(Company $company, array $entryAttributes, array $lines): JournalEntry
    {
        if ($lines === []) {
            throw ValidationException::withMessages([
                'journal' => 'Journal entries must contain at least one line.',
            ]);
        }

        $debitTotal = BigDecimal::zero();
        $creditTotal = BigDecimal::zero();

        foreach ($lines as $index => $line) {
            $account = Account::query()
                ->where('company_id', $company->id)
                ->findOrFail($line['account_id']);

            if (! $account->allows_posting) {
                throw ValidationException::withMessages([
                    "lines.$index.account_id" => 'Journal entries must use posting accounts only.',
                ]);
            }

            $debit = BigDecimal::of((string) $line['debit']);
            $credit = BigDecimal::of((string) $line['credit']);

            if ($debit->isLessThan(BigDecimal::zero()) || $credit->isLessThan(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    "lines.$index" => 'Journal lines cannot contain negative debit or credit values.',
                ]);
            }

            if (($debit->isEqualTo(BigDecimal::zero()) && $credit->isEqualTo(BigDecimal::zero())) || (! $debit->isEqualTo(BigDecimal::zero()) && ! $credit->isEqualTo(BigDecimal::zero()))) {
                throw ValidationException::withMessages([
                    "lines.$index" => 'Each journal line must post to exactly one side.',
                ]);
            }

            $debitTotal = $debitTotal->plus($debit);
            $creditTotal = $creditTotal->plus($credit);
        }

        if ($debitTotal->isLessThanOrEqualTo(BigDecimal::zero())) {
            throw ValidationException::withMessages([
                'journal' => 'Journal entries must carry a positive amount.',
            ]);
        }

        if (! $debitTotal->isEqualTo($creditTotal)) {
            throw ValidationException::withMessages([
                'journal' => sprintf('Unbalanced journal entry. Debits %s must equal credits %s.', $debitTotal, $creditTotal),
            ]);
        }

        $documentIds = collect($lines)
            ->pluck('document_id')
            ->filter()
            ->unique()
            ->values();

        $documents = $documentIds->isEmpty()
            ? collect()
            : Document::query()
                ->where('company_id', $company->id)
                ->whereIn('id', $documentIds)
                ->get(['id', 'document_number', 'type', 'status'])
                ->keyBy('id');

        $primaryDocument = $documentIds->isEmpty()
            ? null
            : $documents->get($documentIds->first());

        $documentLinks = $documentIds
            ->map(function ($documentId) use ($documents) {
                $document = $documents->get($documentId);

                if (! $document) {
                    return null;
                }

                return [
                    'documentId' => $document->id,
                    'documentNumber' => $document->document_number,
                    'documentType' => $document->type,
                    'status' => $document->status,
                ];
            })
            ->filter()
            ->values()
            ->all();

        $reference = $entryAttributes['reference'] ?? $primaryDocument?->document_number;
        $description = $entryAttributes['description'] ?? null;

        if ($primaryDocument?->document_number && $description && ! str_contains($description, $primaryDocument->document_number)) {
            $description = sprintf('%s for %s', $description, $primaryDocument->document_number);
        }

        $metadata = $entryAttributes['metadata'] ?? [];

        if (! is_array($metadata)) {
            $metadata = [];
        }

        if ($primaryDocument?->document_number) {
            $metadata['document_number'] = $metadata['document_number'] ?? $primaryDocument->document_number;
        }

        if ($documentLinks !== []) {
            $metadata['document_links'] = $documentLinks;
        }

        $entry = JournalEntry::create([
            'uuid' => (string) Str::uuid(),
            'company_id' => $company->id,
            'entry_number' => $this->nextEntryNumber($company),
            'status' => 'posted',
            'entry_date' => $entryAttributes['entry_date'],
            'posting_date' => $entryAttributes['posting_date'] ?? $entryAttributes['entry_date'],
            'source_type' => $entryAttributes['source_type'] ?? null,
            'source_id' => $entryAttributes['source_id'] ?? null,
            'reference' => $reference,
            'description' => $description,
            'memo' => $entryAttributes['memo'] ?? null,
            'metadata' => $metadata !== [] ? $metadata : null,
            'posted_at' => now(),
            'created_by' => $entryAttributes['created_by'] ?? null,
            'posted_by' => $entryAttributes['created_by'] ?? null,
        ]);

        $entry->lines()->createMany($lines);

        return $entry->load('lines');
    }
}