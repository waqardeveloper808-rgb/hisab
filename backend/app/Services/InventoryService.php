<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\Document;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Item;
use App\Models\User;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function __construct(
        private readonly LedgerService $ledgerService,
        private readonly AccountingIntegrityService $accountingIntegrityService,
    )
    {
    }

    public function listStock(Company $company)
    {
        return InventoryItem::query()
            ->where('company_id', $company->id)
            ->with(['inventoryAccount:id,code,name', 'lastJournalEntry:id,entry_number', 'recorder:id,name'])
            ->orderByDesc('updated_at')
            ->get();
    }

    public function listAdjustments(Company $company)
    {
        return InventoryTransaction::query()
            ->where('company_id', $company->id)
            ->with(['inventoryItem.inventoryAccount:id,code,name', 'inventoryItem:id,code,product_name,inventory_account_id', 'journalEntry:id,entry_number', 'recorder:id,name'])
            ->whereIn('transaction_type', ['receipt', 'adjustment', 'sale'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->get();
    }

    public function createReceipt(Company $company, User $actor, array $payload): InventoryItem
    {
        return DB::transaction(function () use ($company, $actor, $payload) {
            $quantity = BigDecimal::of((string) $payload['quantity_on_hand']);
            $unitCost = BigDecimal::of((string) ($payload['unit_cost'] ?? $payload['default_unit_cost'] ?? 0));

            if ($quantity->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages(['quantity_on_hand' => 'Quantity must be greater than zero.']);
            }

            $item = null;
            if (! empty($payload['item_id'])) {
                $item = Item::query()->where('company_id', $company->id)->findOrFail($payload['item_id']);
            }

            $inventoryAccount = $this->resolveAccount($company, $payload['inventory_account_code'] ?? $this->defaultInventoryCode($payload['inventory_type'] ?? 'raw_material'));
            $revenueAccount = $this->resolveAccount($company, $payload['revenue_account_code'] ?? ($item?->incomeAccount?->code ?? '4000'));
            $cogsAccount = $this->resolveAccount($company, $payload['cogs_account_code'] ?? '5000');
            $offsetAccount = $this->resolveAccount($company, $payload['offset_account_code'] ?? ($payload['source'] === 'production' ? '1153' : $company->settings->default_payable_account_code));

            $inventory = InventoryItem::create([
                'company_id' => $company->id,
                'item_id' => $item?->id,
                'inventory_account_id' => $inventoryAccount->id,
                'revenue_account_id' => $revenueAccount->id,
                'cogs_account_id' => $cogsAccount->id,
                'product_name' => $payload['product_name'],
                'material' => $payload['material'] ?? null,
                'inventory_type' => $payload['inventory_type'] ?? 'raw_material',
                'size' => $payload['size'] ?? null,
                'source' => $payload['source'] ?? 'purchase',
                'code' => $payload['code'],
                'quantity_on_hand' => (string) $quantity->toScale(2, RoundingMode::HALF_UP),
                'committed_quantity' => (string) BigDecimal::of((string) ($payload['committed_quantity'] ?? 0))->toScale(2, RoundingMode::HALF_UP),
                'reorder_level' => (string) BigDecimal::of((string) ($payload['reorder_level'] ?? 0))->toScale(2, RoundingMode::HALF_UP),
                'batch_number' => $payload['batch_number'] ?? null,
                'production_date' => $payload['production_date'] ?? null,
                'average_unit_cost' => (string) $unitCost->toScale(2, RoundingMode::HALF_UP),
                'attachments' => $payload['attachments'] ?? [],
                'document_links' => $payload['document_links'] ?? [],
                'recorded_by' => $actor->id,
            ]);

            $journal = $this->ledgerService->postInventoryReceipt($company, $inventory, [
                'entry_date' => $payload['transaction_date'] ?? now()->toDateString(),
                'reference' => $payload['reference'] ?? ('INV-'.$inventory->code),
                'offset_account_id' => $offsetAccount->id,
                'unit_cost' => (string) $unitCost->toScale(2, RoundingMode::HALF_UP),
                'quantity' => (string) $quantity->toScale(2, RoundingMode::HALF_UP),
                'description' => $payload['source'] === 'production' ? 'Inventory production receipt' : 'Inventory purchase receipt',
            ], $actor);

            $inventory->update(['last_journal_entry_id' => $journal->id]);

            InventoryTransaction::create([
                'company_id' => $company->id,
                'inventory_item_id' => $inventory->id,
                'journal_entry_id' => $journal->id,
                'transaction_type' => 'receipt',
                'reference' => $payload['reference'] ?? ('INV-'.$inventory->code),
                'transaction_date' => $payload['transaction_date'] ?? now()->toDateString(),
                'quantity_delta' => (string) $quantity->toScale(2, RoundingMode::HALF_UP),
                'unit_cost' => (string) $unitCost->toScale(2, RoundingMode::HALF_UP),
                'reason' => $payload['source'] === 'production' ? 'Production intake' : 'Purchase receipt',
                'attachments' => $payload['attachments'] ?? [],
                'document_links' => $payload['document_links'] ?? [],
                'metadata' => ['source' => $payload['source'] ?? 'purchase'],
                'recorded_by' => $actor->id,
            ]);

            if ($item) {
                $item->update([
                    'inventory_classification' => $payload['inventory_type'] ?? 'raw_material',
                    'inventory_account_id' => $inventoryAccount->id,
                    'cogs_account_id' => $cogsAccount->id,
                    'income_account_id' => $revenueAccount->id,
                    'default_purchase_price' => (string) $unitCost->toScale(2, RoundingMode::HALF_UP),
                ]);
            }

            return $inventory->fresh(['inventoryAccount:id,code,name', 'lastJournalEntry:id,entry_number', 'recorder:id,name']);
        });
    }

    public function createAdjustment(Company $company, User $actor, array $payload): InventoryTransaction
    {
        return DB::transaction(function () use ($company, $actor, $payload) {
            $inventory = InventoryItem::query()->where('company_id', $company->id)->findOrFail($payload['inventory_item_id']);
            $delta = BigDecimal::of((string) $payload['quantity_delta']);
            if ($delta->isEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages(['quantity_delta' => 'Adjustment quantity cannot be zero.']);
            }

            $nextQuantity = BigDecimal::of((string) $inventory->quantity_on_hand)->plus($delta);
            if ($nextQuantity->isLessThan(BigDecimal::zero())) {
                throw ValidationException::withMessages(['quantity_delta' => 'Adjustment would reduce stock below zero.']);
            }

            $journal = $this->ledgerService->postInventoryAdjustment($company, $inventory, [
                'entry_date' => $payload['transaction_date'] ?? now()->toDateString(),
                'reference' => $payload['reference'] ?? ('ADJ-'.$inventory->code),
                'quantity_delta' => (string) $delta->toScale(2, RoundingMode::HALF_UP),
                'unit_cost' => (string) BigDecimal::of((string) ($payload['unit_cost'] ?? $inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                'reason' => $payload['reason'] ?? 'Inventory adjustment',
                'adjustment_account_code' => $payload['adjustment_account_code'] ?? '5050',
            ], $actor);

            $inventory->update([
                'quantity_on_hand' => (string) $nextQuantity->toScale(2, RoundingMode::HALF_UP),
                'last_journal_entry_id' => $journal->id,
                'attachments' => $payload['attachments'] ?? ($inventory->attachments ?? []),
                'document_links' => $payload['document_links'] ?? ($inventory->document_links ?? []),
                'recorded_by' => $actor->id,
            ]);

            return InventoryTransaction::create([
                'company_id' => $company->id,
                'inventory_item_id' => $inventory->id,
                'journal_entry_id' => $journal->id,
                'transaction_type' => 'adjustment',
                'reference' => $payload['reference'] ?? ('ADJ-'.$inventory->code),
                'transaction_date' => $payload['transaction_date'] ?? now()->toDateString(),
                'quantity_delta' => (string) $delta->toScale(2, RoundingMode::HALF_UP),
                'unit_cost' => (string) BigDecimal::of((string) ($payload['unit_cost'] ?? $inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                'reason' => $payload['reason'] ?? 'Inventory adjustment',
                'attachments' => $payload['attachments'] ?? [],
                'document_links' => $payload['document_links'] ?? [],
                'metadata' => Arr::only($payload, ['notes']),
                'recorded_by' => $actor->id,
            ])->fresh(['inventoryItem.inventoryAccount:id,code,name', 'inventoryItem:id,code,product_name,inventory_account_id', 'journalEntry:id,entry_number', 'recorder:id,name']);
        });
    }

    public function createSale(Company $company, User $actor, array $payload): InventoryTransaction
    {
        return DB::transaction(function () use ($company, $actor, $payload) {
            $inventory = InventoryItem::query()->where('company_id', $company->id)->findOrFail($payload['inventory_item_id']);
            $quantity = BigDecimal::of((string) $payload['quantity']);
            $unitPrice = BigDecimal::of((string) $payload['unit_price']);
            $taxRate = BigDecimal::of((string) ($payload['tax_rate'] ?? 15));

            if ($quantity->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages(['quantity' => 'Sale quantity must be greater than zero.']);
            }

            $available = BigDecimal::of((string) $inventory->quantity_on_hand);
            if ($available->isLessThan($quantity)) {
                throw ValidationException::withMessages(['quantity' => 'Sale quantity exceeds available inventory.']);
            }

            $documentLinks = $payload['document_links'] ?? [];
            $journal = $this->ledgerService->postInventorySale($company, $inventory, [
                'entry_date' => $payload['transaction_date'] ?? now()->toDateString(),
                'reference' => $payload['reference'] ?? ('SAL-'.$inventory->code),
                'quantity' => (string) $quantity->toScale(2, RoundingMode::HALF_UP),
                'unit_price' => (string) $unitPrice->toScale(2, RoundingMode::HALF_UP),
                'unit_cost' => (string) BigDecimal::of((string) ($payload['unit_cost'] ?? $inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                'tax_rate' => (string) $taxRate->toScale(2, RoundingMode::HALF_UP),
                'cash_account_code' => $payload['cash_account_code'] ?? $company->settings->default_cash_account_code,
                'document_links' => $documentLinks,
                'description' => 'Inventory sale',
            ], $actor);

            $inventory->update([
                'quantity_on_hand' => (string) $available->minus($quantity)->toScale(2, RoundingMode::HALF_UP),
                'last_journal_entry_id' => $journal->id,
                'document_links' => $documentLinks,
                'recorded_by' => $actor->id,
            ]);

            return InventoryTransaction::create([
                'company_id' => $company->id,
                'inventory_item_id' => $inventory->id,
                'journal_entry_id' => $journal->id,
                'transaction_type' => 'sale',
                'reference' => $payload['reference'] ?? ('SAL-'.$inventory->code),
                'transaction_date' => $payload['transaction_date'] ?? now()->toDateString(),
                'quantity_delta' => (string) $quantity->multipliedBy(-1)->toScale(2, RoundingMode::HALF_UP),
                'unit_cost' => (string) BigDecimal::of((string) ($payload['unit_cost'] ?? $inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                'unit_price' => (string) $unitPrice->toScale(2, RoundingMode::HALF_UP),
                'tax_rate' => (string) $taxRate->toScale(2, RoundingMode::HALF_UP),
                'tax_amount' => (string) $unitPrice->multipliedBy($quantity)->multipliedBy($taxRate)->dividedBy('100', 2, RoundingMode::HALF_UP),
                'reason' => 'Inventory sale',
                'attachments' => $payload['attachments'] ?? [],
                'document_links' => $documentLinks,
                'metadata' => [
                    'journal_intelligence' => [
                        'proforma_invoice' => $payload['proforma_invoice'] ?? null,
                        'tax_invoice' => $payload['tax_invoice'] ?? null,
                        'delivery_note' => $payload['delivery_note'] ?? null,
                    ],
                ],
                'recorded_by' => $actor->id,
            ])->fresh(['inventoryItem.inventoryAccount:id,code,name', 'inventoryItem:id,code,product_name,inventory_account_id', 'journalEntry:id,entry_number', 'recorder:id,name']);
        });
    }

    public function createDeliveryFulfillment(Company $company, User $actor, Document $document): array
    {
        return DB::transaction(function () use ($company, $actor, $document) {
            $document->loadMissing(['lines.item', 'contact', 'sourceDocument']);
            $createdTransactions = [];
            $journalEntryIds = [];

            foreach ($document->lines as $line) {
                if (! $line->item_id || ! $this->lineRequiresInventory($line)) {
                    continue;
                }

                $inventory = InventoryItem::query()
                    ->where('company_id', $company->id)
                    ->where('item_id', $line->item_id)
                    ->lockForUpdate()
                    ->first();

                if (! $inventory) {
                    throw ValidationException::withMessages([
                        'inventory' => sprintf('No inventory record exists for item %s on %s.', $line->item?->name ?? $line->item_id, $document->document_number ?? $document->uuid),
                    ]);
                }

                $quantity = BigDecimal::of((string) $line->quantity);
                $available = BigDecimal::of((string) $inventory->quantity_on_hand);

                if ($available->isLessThan($quantity)) {
                    throw ValidationException::withMessages([
                        'delivery_note' => sprintf('Delivery note %s exceeds available stock for %s.', $document->document_number ?? $document->uuid, $inventory->product_name),
                    ]);
                }

                $documentLinks = array_values(array_filter([
                    ['documentId' => $document->id, 'documentNumber' => $document->document_number, 'documentType' => 'delivery_note', 'status' => $document->status],
                    ($document->sourceDocument && $document->sourceDocument->type === 'proforma_invoice') ? ['documentId' => $document->sourceDocument->id, 'documentNumber' => $document->sourceDocument->document_number, 'documentType' => 'proforma_invoice', 'status' => $document->sourceDocument->status] : null,
                    ($document->custom_fields['linked_tax_invoice_id'] ?? null) ? ['documentId' => $document->custom_fields['linked_tax_invoice_id'], 'documentNumber' => $document->custom_fields['linked_tax_invoice_number'] ?? null, 'documentType' => 'tax_invoice', 'status' => $document->custom_fields['linked_tax_invoice_status'] ?? 'linked'] : null,
                ]));

                $journal = $this->ledgerService->postDeliveryNote(
                    $document,
                    $inventory,
                    (string) $quantity->toScale(2, RoundingMode::HALF_UP),
                    (string) BigDecimal::of((string) ($inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                    $documentLinks,
                    $actor->id,
                );

                $inventory->update([
                    'quantity_on_hand' => (string) $available->minus($quantity)->toScale(2, RoundingMode::HALF_UP),
                    'last_journal_entry_id' => $journal->id,
                    'document_links' => $documentLinks,
                    'recorded_by' => $actor->id,
                ]);

                $transaction = InventoryTransaction::create([
                    'company_id' => $company->id,
                    'inventory_item_id' => $inventory->id,
                    'journal_entry_id' => $journal->id,
                    'transaction_type' => 'sale',
                    'reference' => $document->document_number ?? ('DN-'.$inventory->code),
                    'transaction_date' => $document->supply_date ?? $document->issue_date ?? now()->toDateString(),
                    'quantity_delta' => (string) $quantity->multipliedBy(-1)->toScale(2, RoundingMode::HALF_UP),
                    'unit_cost' => (string) BigDecimal::of((string) ($inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                    'unit_price' => (string) BigDecimal::of((string) $line->unit_price)->toScale(2, RoundingMode::HALF_UP),
                    'tax_rate' => '0.00',
                    'tax_amount' => '0.00',
                    'reason' => 'Delivery note inventory issue',
                    'attachments' => $document->attachments ?? [],
                    'document_links' => $documentLinks,
                    'metadata' => [
                        'journal_intelligence' => [
                            'proforma_invoice' => $document->sourceDocument?->type === 'proforma_invoice' ? $document->sourceDocument?->document_number : ($document->custom_fields['linked_proforma_number'] ?? null),
                            'tax_invoice' => $document->custom_fields['linked_tax_invoice_number'] ?? null,
                            'delivery_note' => $document->document_number,
                        ],
                        'customer_name' => $document->contact?->display_name,
                        'receiver_name' => $document->custom_fields['receiver_name'] ?? $document->contact?->display_name,
                        'payment_status' => $document->custom_fields['payment_status'] ?? null,
                        'document_category' => 'delivery_note',
                    ],
                    'recorded_by' => $actor->id,
                ]);

                $createdTransactions[] = $transaction;
                $journalEntryIds[] = $journal->id;
            }

            if ($journalEntryIds !== [] && in_array($document->type, ['tax_invoice', 'cash_invoice', 'api_invoice', 'debit_note'], true)) {
                $this->accountingIntegrityService->validateInventoryDocumentPosting(
                    $company,
                    $document->fresh(['lines.item']),
                    $journalEntryIds,
                    $actor->id,
                );
            }

            return ['transactions' => $createdTransactions, 'journal_entry_ids' => $journalEntryIds];
        });
    }

    public function validateStockAvailabilityForDocument(Company $company, Document $document, string $errorBag = 'inventory'): void
    {
        $document->loadMissing(['lines.item']);

        foreach ($document->lines as $line) {
            if (! $line->item_id || ! $this->lineRequiresInventory($line)) {
                continue;
            }

            $inventory = InventoryItem::query()
                ->where('company_id', $company->id)
                ->where('item_id', $line->item_id)
                ->lockForUpdate()
                ->first();

            if (! $inventory) {
                throw ValidationException::withMessages([
                    $errorBag => sprintf('No inventory record exists for item %s on %s.', $line->item?->name ?? $line->item_id, $document->document_number ?? $document->uuid),
                ]);
            }

            $quantity = BigDecimal::of((string) $line->quantity);
            $available = BigDecimal::of((string) $inventory->quantity_on_hand);

            if ($available->isLessThan($quantity)) {
                throw ValidationException::withMessages([
                    $errorBag => sprintf('%s exceeds available stock for %s. Add inventory before finalizing.', $document->document_number ?? $document->uuid ?? 'Document', $inventory->product_name),
                    'redirect_to' => '/workspace/user/inventory/stock',
                    'return_to' => sprintf('/workspace/user/%s', str_replace('_', '-', $document->type)),
                ]);
            }
        }
    }

    public function createSalesDocumentFulfillment(Company $company, User $actor, Document $document): array
    {
        return DB::transaction(function () use ($company, $actor, $document) {
            $document->loadMissing(['lines.item', 'contact', 'sourceDocument']);
            $this->validateStockAvailabilityForDocument($company, $document, 'inventory');
            $createdTransactions = [];
            $journalEntryIds = [];

            foreach ($document->lines as $line) {
                if (! $line->item_id || ! $this->lineRequiresInventory($line)) {
                    continue;
                }

                $inventory = InventoryItem::query()
                    ->where('company_id', $company->id)
                    ->where('item_id', $line->item_id)
                    ->lockForUpdate()
                    ->first();

                if (! $inventory) {
                    throw ValidationException::withMessages([
                        'inventory' => sprintf('No inventory record exists for item %s on %s.', $line->item?->name ?? $line->item_id, $document->document_number ?? $document->uuid),
                    ]);
                }

                $quantity = BigDecimal::of((string) $line->quantity);
                $available = BigDecimal::of((string) $inventory->quantity_on_hand);

                if ($available->isLessThan($quantity)) {
                    throw ValidationException::withMessages([
                        'inventory' => sprintf('Invoice %s exceeds available stock for %s.', $document->document_number ?? $document->uuid, $inventory->product_name),
                    ]);
                }

                $documentLinks = array_values(array_filter([
                    ['documentId' => $document->id, 'documentNumber' => $document->document_number, 'documentType' => $document->type, 'status' => $document->status],
                    ($document->sourceDocument && $document->sourceDocument->type === 'proforma_invoice') ? ['documentId' => $document->sourceDocument->id, 'documentNumber' => $document->sourceDocument->document_number, 'documentType' => 'proforma_invoice', 'status' => $document->sourceDocument->status] : null,
                    ($document->custom_fields['linked_delivery_note_id'] ?? null) ? ['documentId' => $document->custom_fields['linked_delivery_note_id'], 'documentNumber' => $document->custom_fields['linked_delivery_note_number'] ?? null, 'documentType' => 'delivery_note', 'status' => $document->custom_fields['linked_delivery_note_status'] ?? 'linked'] : null,
                ]));

                $journal = $this->ledgerService->postDeliveryNote(
                    $document,
                    $inventory,
                    (string) $quantity->toScale(2, RoundingMode::HALF_UP),
                    (string) BigDecimal::of((string) ($inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                    $documentLinks,
                    $actor->id,
                );

                $inventory->update([
                    'quantity_on_hand' => (string) $available->minus($quantity)->toScale(2, RoundingMode::HALF_UP),
                    'last_journal_entry_id' => $journal->id,
                    'document_links' => $documentLinks,
                    'recorded_by' => $actor->id,
                ]);

                $transaction = InventoryTransaction::create([
                    'company_id' => $company->id,
                    'inventory_item_id' => $inventory->id,
                    'journal_entry_id' => $journal->id,
                    'transaction_type' => 'sale',
                    'reference' => $document->document_number ?? ('INV-'.$inventory->code),
                    'transaction_date' => $document->supply_date ?? $document->issue_date ?? now()->toDateString(),
                    'quantity_delta' => (string) $quantity->multipliedBy(-1)->toScale(2, RoundingMode::HALF_UP),
                    'unit_cost' => (string) BigDecimal::of((string) ($inventory->average_unit_cost ?? 0))->toScale(2, RoundingMode::HALF_UP),
                    'unit_price' => (string) BigDecimal::of((string) $line->unit_price)->toScale(2, RoundingMode::HALF_UP),
                    'tax_rate' => (string) BigDecimal::of((string) ($line->tax_rate ?? 0))->toScale(2, RoundingMode::HALF_UP),
                    'tax_amount' => (string) BigDecimal::of((string) ($line->tax_amount ?? 0))->toScale(2, RoundingMode::HALF_UP),
                    'reason' => 'Invoice inventory issue',
                    'attachments' => $document->attachments ?? [],
                    'document_links' => $documentLinks,
                    'metadata' => [
                        'journal_intelligence' => [
                            'proforma_invoice' => $document->sourceDocument?->type === 'proforma_invoice' ? $document->sourceDocument?->document_number : ($document->custom_fields['linked_proforma_number'] ?? null),
                            'tax_invoice' => $document->document_number,
                            'delivery_note' => $document->custom_fields['linked_delivery_note_number'] ?? null,
                        ],
                        'customer_name' => $document->contact?->display_name,
                        'payment_status' => $document->custom_fields['payment_status'] ?? null,
                        'document_category' => $document->type,
                    ],
                    'recorded_by' => $actor->id,
                ]);

                $createdTransactions[] = $transaction;
                $journalEntryIds[] = $journal->id;
            }

            return ['transactions' => $createdTransactions, 'journal_entry_ids' => $journalEntryIds];
        });
    }

    private function resolveAccount(Company $company, string $code): Account
    {
        return Account::query()
            ->where('company_id', $company->id)
            ->where('code', $code)
            ->firstOr(function () use ($code) {
                throw ValidationException::withMessages(['account' => "Required account {$code} is not configured."]);
            });
    }

    private function defaultInventoryCode(string $inventoryType): string
    {
        return match ($inventoryType) {
            'raw_material' => '1151',
            'finished_good' => '1152',
            'trading' => '1150',
            'consumables' => '6100',
            default => '1150',
        };
    }

    private function lineRequiresInventory($line): bool
    {
        return ($line->item?->type ?? null) === 'product';
    }
}