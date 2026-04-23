<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\DocumentSequence;
use App\Models\User;
use App\Services\Intelligence\IntelligenceEngine;
use App\Services\Intelligence\SmartTriggerService;
use App\Services\VAT\VATLedgerService;
use Brick\Math\BigDecimal;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SalesDocumentService
{
    public function __construct(
        private readonly TaxCalculationService $taxCalculationService,
        private readonly LedgerService $ledgerService,
        private readonly AccountingPeriodService $accountingPeriodService,
        private readonly InventoryService $inventoryService,
        private readonly AccountingIntegrityService $accountingIntegrityService,
        private readonly TemplateEngineRuntimeService $templateEngineRuntime,
        private readonly IntelligenceEngine $intelligenceEngine,
        private readonly SmartTriggerService $smartTriggerService,
        private readonly VATLedgerService $vatLedgerService,
    ) {
    }

    public function createDraft(Company $company, User $user, array $payload): Document
    {
        return DB::transaction(function () use ($company, $user, $payload): Document {
            $issueDate = Carbon::parse($payload['issue_date'] ?? now()->toDateString());
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);
            $contact = Contact::query()->where('company_id', $company->id)->findOrFail($payload['contact_id']);
            $vatScopedLines = $this->withVatContextLines($payload['lines'], $contact, $payload);
            $calculation = $this->taxCalculationService->calculate($company, $vatScopedLines);
            $settings = $company->settings()->firstOrFail();
            $sourceDocument = $this->resolveSalesAdjustmentSource($company, $payload);
            $template = $this->templateEngineRuntime->requireTemplate($company, $payload['template_id'] ?? null, (string) ($payload['type'] ?? 'tax_invoice'));

            $document = Document::create(array_merge(
                Arr::only($payload, ['type', 'contact_id', 'notes', 'title', 'template_id', 'cost_center_id', 'language_code', 'custom_fields', 'attachments', 'source_document_id', 'reversal_of_document_id', 'status_reason']),
                $calculation['totals'],
                [
                    'uuid' => (string) Str::uuid(),
                    'company_id' => $company->id,
                    'branch_id' => $payload['branch_id'] ?? $settings->default_branch_id,
                    'status' => 'draft',
                    'currency_code' => $payload['currency_code'] ?? $company->base_currency,
                    'exchange_rate' => $payload['exchange_rate'] ?? 1,
                    'issue_date' => $issueDate->toDateString(),
                    'supply_date' => $payload['supply_date'] ?? $issueDate->toDateString(),
                    'supply_location' => $payload['supply_location'] ?? ($contact->billing_address['country'] ?? $company->country_code),
                    'vat_applicability' => $payload['vat_applicability'] ?? 'taxable',
                    'due_date' => $payload['due_date'] ?? $issueDate->toDateString(),
                    'compliance_metadata' => [
                        'zatca_ready' => true,
                        'xml_ready' => true,
                        'document_mode' => $payload['type'] ?? 'tax_invoice',
                        'source_invoice_uuid' => $sourceDocument?->uuid,
                    ],
                    'template_id' => $template->id,
                ],
            ));

            $document->lines()->createMany($calculation['lines']);
            $transactionIntelligence = $this->intelligenceEngine->forTransaction($company, [
                'contact_id' => $document->contact_id,
                'document_type' => $document->type,
                'issue_date' => $document->issue_date,
                'due_date' => $document->due_date,
                'payment_amount' => 0,
                'lines' => array_map(fn (array $line) => [
                    'description' => $line['description'],
                    'quantity' => (float) $line['quantity'],
                    'unit_price' => (float) $line['unit_price'],
                ], $calculation['lines']),
            ]);
            $document->update([
                'custom_fields' => array_merge($document->custom_fields ?? [], [
                    'intelligence_snapshot' => $this->smartTriggerService->buildDocumentSnapshot($company, $document, $transactionIntelligence),
                ]),
            ]);
            $this->templateEngineRuntime->refreshCompanyRuntime($company);

            $this->audit($company->id, $user->id, 'document.created', $document, null, $document->toArray());

            return $document->load('lines');
        });
    }

    public function updateDraft(Company $company, Document $document, User $user, array $payload): Document
    {
        if ($document->status !== 'draft') {
            throw ValidationException::withMessages([
                'document' => 'Only draft documents can be modified.',
            ]);
        }

        return DB::transaction(function () use ($company, $document, $user, $payload): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();
            $before = $document->load('lines')->toArray();
            $contact = Contact::query()->where('company_id', $company->id)->findOrFail($payload['contact_id']);
            $vatScopedLines = $this->withVatContextLines($payload['lines'], $contact, array_merge($document->toArray(), $payload));
            $calculation = $this->taxCalculationService->calculate($company, $vatScopedLines);
            $sourceDocument = $this->resolveSalesAdjustmentSource($company, array_merge($document->toArray(), $payload));
            $template = $this->templateEngineRuntime->requireTemplate($company, $payload['template_id'] ?? null, (string) ($payload['type'] ?? $document->type));

            $issueDate = Carbon::parse($payload['issue_date'] ?? $document->issue_date);
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);

            $document->update(array_merge(
                Arr::only($payload, ['contact_id', 'notes', 'title', 'template_id', 'cost_center_id', 'language_code', 'custom_fields', 'attachments', 'source_document_id', 'reversal_of_document_id', 'status_reason']),
                $calculation['totals'],
                [
                    'issue_date' => $issueDate->toDateString(),
                    'supply_date' => $payload['supply_date'] ?? $document->supply_date,
                    'supply_location' => $payload['supply_location'] ?? $document->supply_location,
                    'vat_applicability' => $payload['vat_applicability'] ?? $document->vat_applicability,
                    'due_date' => $payload['due_date'] ?? $document->due_date,
                    'compliance_metadata' => array_merge($document->compliance_metadata ?? [], [
                        'source_invoice_uuid' => $sourceDocument?->uuid,
                        'document_mode' => $payload['type'] ?? $document->type,
                    ]),
                    'template_id' => $template->id,
                    'version' => $document->version + 1,
                ],
            ));

            $document->lines()->delete();
            $document->lines()->createMany($calculation['lines']);
            $transactionIntelligence = $this->intelligenceEngine->forTransaction($company, [
                'contact_id' => $document->contact_id,
                'document_type' => $document->type,
                'issue_date' => $document->issue_date,
                'due_date' => $document->due_date,
                'payment_amount' => 0,
                'lines' => array_map(fn (array $line) => [
                    'description' => $line['description'],
                    'quantity' => (float) $line['quantity'],
                    'unit_price' => (float) $line['unit_price'],
                ], $calculation['lines']),
            ]);
            $document->update([
                'custom_fields' => array_merge($document->custom_fields ?? [], [
                    'intelligence_snapshot' => $this->smartTriggerService->buildDocumentSnapshot($company, $document, $transactionIntelligence),
                ]),
            ]);
            $this->templateEngineRuntime->refreshCompanyRuntime($company);

            $this->audit($company->id, $user->id, 'document.updated', $document, $before, $document->fresh()->load('lines')->toArray());

            return $document->fresh()->load('lines');
        });
    }

    public function finalize(Company $company, Document $document, User $user): Document
    {
        if ($document->status !== 'draft') {
            throw ValidationException::withMessages([
                'document' => 'Only draft documents can be finalized.',
            ]);
        }

        return DB::transaction(function () use ($company, $document, $user): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();
            $this->accountingPeriodService->ensureDateOpen($company, Carbon::parse($document->issue_date ?? now()->toDateString()));

            if ($document->type === 'delivery_note') {
                $this->inventoryService->validateStockAvailabilityForDocument($company, $document->fresh(['lines.item']), 'delivery_note');
            }

            if (in_array($document->type, ['tax_invoice', 'cash_invoice', 'api_invoice', 'debit_note'], true) && $this->shouldPostInventoryFromInvoice($document->fresh(['lines.item', 'sourceDocument']))) {
                $this->inventoryService->validateStockAvailabilityForDocument($company, $document->fresh(['lines.item', 'sourceDocument']), 'inventory');
            }

            $sequence = DocumentSequence::query()
                ->where('company_id', $company->id)
                ->where('branch_id', $document->branch_id)
                ->where('document_type', $document->type)
                ->lockForUpdate()
                ->firstOr(function () use ($document) {
                    throw ValidationException::withMessages([
                        'document' => "No numbering sequence is configured for {$document->type}.",
                    ]);
                });

            $number = sprintf('%s-%s', $sequence->prefix, str_pad((string) $sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT));
            $sequence->increment('next_number');

            $document->update([
                'status' => 'finalized',
                'sequence_number' => $sequence->next_number - 1,
                'document_number' => $number,
                'finalized_at' => now(),
                'finalized_by' => $user->id,
                'compliance_uuid' => (string) Str::uuid(),
                'compliance_status' => 'pending_submission',
                'version' => $document->version + 1,
            ]);

            if ($document->type === 'delivery_note') {
                $fulfillment = $this->inventoryService->createDeliveryFulfillment($company, $user, $document->fresh(['lines', 'contact', 'sourceDocument']));
                $document->update([
                    'posted_journal_entry_id' => $fulfillment['journal_entry_ids'][0] ?? null,
                    'posted_at' => now(),
                    'custom_fields' => array_merge($document->custom_fields ?? [], [
                        'delivery_status' => 'delivered',
                        'delivery_note_number' => $document->document_number,
                        'delivery_note_date' => $document->supply_date ?? $document->issue_date,
                    ]),
                ]);
            }

            if (in_array($document->type, ['tax_invoice', 'cash_invoice', 'api_invoice', 'debit_note'], true)) {
                $inventoryFulfillment = null;
                if ($this->shouldPostInventoryFromInvoice($document->fresh(['lines.item', 'sourceDocument']))) {
                    $inventoryFulfillment = $this->inventoryService->createSalesDocumentFulfillment($company, $user, $document->fresh(['lines.item', 'contact', 'sourceDocument']));
                }

                $appliedAdvance = $this->applyAvailableAdvanceToSalesDocument($company, $document->fresh(), $user);
                $entry = $this->ledgerService->postSalesDocument($document->fresh(), $appliedAdvance);
                $document->update([
                    'posted_journal_entry_id' => $entry->id,
                    'posted_at' => now(),
                    'compliance_metadata' => array_merge($document->compliance_metadata ?? [], [
                        'vat_ledger' => $this->vatLedgerService->buildDocumentSummary($document->fresh(['lines.taxCategory'])),
                    ]),
                    'custom_fields' => array_merge($document->custom_fields ?? [], [
                        'inventory_journal_entry_ids' => $inventoryFulfillment['journal_entry_ids'] ?? [],
                        'intelligence_snapshot' => $this->smartTriggerService->buildDocumentSnapshot(
                            $company,
                            $document,
                            $this->intelligenceEngine->forTransaction($company, [
                                'contact_id' => $document->contact_id,
                                'document_type' => $document->type,
                                'issue_date' => $document->issue_date,
                                'due_date' => $document->due_date,
                                'payment_amount' => (float) $document->paid_total,
                                'lines' => $document->fresh('lines')->lines->map(fn (DocumentLine $line) => [
                                    'description' => $line->description,
                                    'quantity' => (float) $line->quantity,
                                    'unit_price' => (float) $line->unit_price,
                                ])->all(),
                            ]),
                        ),
                    ]),
                ]);

                $this->accountingIntegrityService->validateSalesDocumentFinalization(
                    $company,
                    $document->fresh(['lines.item']),
                    $inventoryFulfillment['journal_entry_ids'] ?? [],
                    $user->id,
                );
            }

            $this->audit($company->id, $user->id, 'document.finalized', $document, null, $document->fresh()->toArray());
            $this->templateEngineRuntime->refreshCompanyRuntime($company);

            return $document->fresh()->load('lines');
        });
    }

    private function applyAvailableAdvanceToSalesDocument(Company $company, Document $document, User $user): string
    {
        if (! in_array($document->type, ['tax_invoice', 'cash_invoice', 'api_invoice'], true) || ! $document->contact_id) {
            return '0.00';
        }

        $availableAdvance = $this->ledgerService->availableCustomerAdvance($company, (int) $document->contact_id);
        $grandTotal = BigDecimal::of((string) $document->grand_total)->toScale(2);

        if ($availableAdvance->isLessThanOrEqualTo(BigDecimal::zero())) {
            return '0.00';
        }

        $applied = $availableAdvance->isLessThan($grandTotal) ? $availableAdvance : $grandTotal;

        if ($applied->isLessThanOrEqualTo(BigDecimal::zero())) {
            return '0.00';
        }

        $paidTotal = BigDecimal::of((string) $document->paid_total)->plus($applied)->toScale(2);
        $balanceDue = $grandTotal->minus($paidTotal);
        if ($balanceDue->isLessThan(BigDecimal::zero())) {
            $balanceDue = BigDecimal::zero();
        }

        $document->update([
            'paid_total' => (string) $paidTotal,
            'balance_due' => (string) $balanceDue,
            'status' => $balanceDue->isGreaterThan(BigDecimal::zero()) ? 'partially_paid' : 'paid',
            'custom_fields' => array_merge($document->custom_fields ?? [], [
                'payment_status' => $balanceDue->isGreaterThan(BigDecimal::zero()) ? 'Partially Received' : 'Fully Received',
                'advance_applied_amount' => (string) $applied,
            ]),
            'version' => $document->version + 1,
        ]);

        return (string) $applied;
    }

    private function shouldPostInventoryFromInvoice(Document $document): bool
    {
        if (($document->custom_fields['linked_delivery_note_id'] ?? null) || ($document->custom_fields['linked_delivery_note_number'] ?? null)) {
            return false;
        }

        if ($document->sourceDocument?->type === 'delivery_note') {
            return false;
        }

        return $document->lines->contains(fn (DocumentLine $line) => ($line->item?->type ?? null) === 'product');
    }

    private function withVatContextLines(array $lines, Contact $contact, array $payload): array
    {
        $origin = strtoupper((string) ($payload['customer_origin'] ?? $contact->origin_country_code ?? 'KSA'));
        $supplyLocation = strtoupper((string) ($payload['supply_location'] ?? $contact->billing_address['country'] ?? 'KSA'));
        $vatApplicability = strtolower((string) ($payload['vat_applicability'] ?? 'taxable'));

        return array_map(function (array $line) use ($origin, $supplyLocation, $vatApplicability) {
            $line['customer_origin'] = strtoupper((string) ($line['customer_origin'] ?? $origin));
            $line['supply_location'] = strtoupper((string) ($line['supply_location'] ?? $supplyLocation));
            $line['vat_applicability'] = strtolower((string) ($line['vat_applicability'] ?? $vatApplicability));

            return $line;
        }, $lines);
    }

    public function issueCreditNote(Company $company, Document $sourceDocument, User $user, array $payload): Document
    {
        if ($sourceDocument->type !== 'tax_invoice') {
            throw ValidationException::withMessages([
                'document' => 'Credit notes can only be issued against tax invoices.',
            ]);
        }

        if (! in_array($sourceDocument->status, ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credit_owed'], true)) {
            throw ValidationException::withMessages([
                'document' => 'Only finalized invoices can be credited.',
            ]);
        }

        return DB::transaction(function () use ($company, $sourceDocument, $user, $payload): Document {
            $sourceDocument = Document::query()->whereKey($sourceDocument->id)->lockForUpdate()->firstOrFail()->load('lines');
            $issueDate = Carbon::parse($payload['issue_date'] ?? now()->toDateString());
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);

            $creditLines = $this->buildCreditLines($sourceDocument, $payload['lines'] ?? []);
            $calculation = $this->taxCalculationService->calculate($company, $creditLines);

            $sequence = DocumentSequence::query()
                ->where('company_id', $company->id)
                ->where('branch_id', $sourceDocument->branch_id)
                ->where('document_type', 'credit_note')
                ->lockForUpdate()
                ->firstOrFail();

            $number = sprintf('%s-%s', $sequence->prefix, str_pad((string) $sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT));
            $sequence->increment('next_number');

            $creditNote = Document::create(array_merge($calculation['totals'], [
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'branch_id' => $sourceDocument->branch_id,
                'contact_id' => $sourceDocument->contact_id,
                'source_document_id' => $sourceDocument->id,
                'reversal_of_document_id' => $sourceDocument->id,
                'type' => 'credit_note',
                'status' => 'finalized',
                'template_id' => $sourceDocument->template_id,
                'language_code' => $sourceDocument->language_code,
                'sequence_number' => $sequence->next_number - 1,
                'document_number' => $number,
                'currency_code' => $sourceDocument->currency_code,
                'exchange_rate' => $sourceDocument->exchange_rate,
                'issue_date' => $issueDate->toDateString(),
                'supply_date' => $payload['supply_date'] ?? $issueDate->toDateString(),
                'due_date' => $issueDate->toDateString(),
                'notes' => $payload['notes'] ?? 'Credit note issued against source invoice.',
                'custom_fields' => $sourceDocument->custom_fields,
                'attachments' => $sourceDocument->attachments,
                'compliance_uuid' => (string) Str::uuid(),
                'compliance_status' => 'pending_submission',
                'compliance_metadata' => [
                    'source_invoice_uuid' => $sourceDocument->uuid,
                    'xml_ready' => true,
                    'zatca_ready' => true,
                ],
                'finalized_at' => now(),
                'finalized_by' => $user->id,
                'locked_at' => now(),
            ]));

            $creditNote->lines()->createMany(collect($calculation['lines'])
                ->values()
                ->map(fn (array $line, int $index) => array_merge($line, [
                    'source_line_id' => $creditLines[$index]['source_line_id'] ?? null,
                ]))
                ->all());

            $creditAmount = BigDecimal::of((string) $creditNote->grand_total);
            $currentBalance = BigDecimal::of((string) $sourceDocument->balance_due);
            $receivableReduction = $creditAmount->isGreaterThan($currentBalance) ? $currentBalance : $creditAmount;
            $customerAdvance = $creditAmount->minus($receivableReduction);
            $newCreditedTotal = BigDecimal::of((string) $sourceDocument->credited_total)->plus($creditAmount);
            $newNetOpenValue = BigDecimal::of((string) $sourceDocument->grand_total)->minus($newCreditedTotal);
            $newBalance = $newNetOpenValue->minus(BigDecimal::of((string) $sourceDocument->paid_total));

            if ($newBalance->isLessThan(BigDecimal::zero())) {
                $newBalance = BigDecimal::zero();
            }

            $newStatus = match (true) {
                $newBalance->isEqualTo(BigDecimal::zero()) && $customerAdvance->isGreaterThan(BigDecimal::zero()) => 'credit_owed',
                $newBalance->isEqualTo(BigDecimal::zero()) => 'credited',
                default => 'partially_credited',
            };

            $sourceDocument->update([
                'credited_total' => (string) $newCreditedTotal,
                'balance_due' => (string) $newBalance,
                'status' => $newStatus,
                'status_reason' => 'Credit note issued against source invoice.',
                'version' => $sourceDocument->version + 1,
            ]);

            $entry = $this->ledgerService->postCreditNote(
                $creditNote,
                $sourceDocument,
                (string) $receivableReduction,
                (string) $customerAdvance,
            );

            $creditNote->update([
                'posted_journal_entry_id' => $entry->id,
                'posted_at' => now(),
            ]);

            $this->audit($company->id, $user->id, 'document.credit_note_issued', $creditNote, null, $creditNote->fresh()->toArray());

            return $creditNote->fresh()->load('lines');
        });
    }

    public function issueDebitNote(Company $company, Document $sourceDocument, User $user, array $payload): Document
    {
        if ($sourceDocument->type !== 'tax_invoice') {
            throw ValidationException::withMessages([
                'document' => 'Debit notes can only be issued against tax invoices.',
            ]);
        }

        if (! in_array($sourceDocument->status, ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credit_owed', 'reported', 'issued'], true)) {
            throw ValidationException::withMessages([
                'document' => 'Only issued or finalized invoices can be adjusted with a debit note.',
            ]);
        }

        return DB::transaction(function () use ($company, $sourceDocument, $user, $payload): Document {
            $sourceDocument = Document::query()->whereKey($sourceDocument->id)->lockForUpdate()->firstOrFail()->load('lines');
            $issueDate = Carbon::parse($payload['issue_date'] ?? now()->toDateString());
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);

            $debitLines = $this->buildDebitLines($sourceDocument, $payload['lines'] ?? []);
            $calculation = $this->taxCalculationService->calculate($company, $debitLines);

            $sequence = DocumentSequence::query()
                ->where('company_id', $company->id)
                ->where('branch_id', $sourceDocument->branch_id)
                ->where('document_type', 'debit_note')
                ->lockForUpdate()
                ->firstOrFail();

            $number = sprintf('%s-%s', $sequence->prefix, str_pad((string) $sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT));
            $sequence->increment('next_number');

            $customFields = array_merge($sourceDocument->custom_fields ?? [], [
                'source_invoice_number' => $sourceDocument->document_number,
                'linked_tax_invoice_number' => $sourceDocument->document_number,
                'adjustment_reason' => $payload['status_reason'] ?? $payload['notes'] ?? 'Debit note issued against source invoice.',
            ]);

            $debitNote = Document::create(array_merge($calculation['totals'], [
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'branch_id' => $sourceDocument->branch_id,
                'contact_id' => $sourceDocument->contact_id,
                'source_document_id' => $sourceDocument->id,
                'reversal_of_document_id' => $sourceDocument->id,
                'type' => 'debit_note',
                'status' => 'finalized',
                'title' => $sourceDocument->title,
                'template_id' => $sourceDocument->template_id,
                'language_code' => $sourceDocument->language_code,
                'status_reason' => $payload['status_reason'] ?? 'Debit note issued against source invoice.',
                'sequence_number' => $sequence->next_number - 1,
                'document_number' => $number,
                'currency_code' => $sourceDocument->currency_code,
                'exchange_rate' => $sourceDocument->exchange_rate,
                'issue_date' => $issueDate->toDateString(),
                'supply_date' => $payload['supply_date'] ?? $issueDate->toDateString(),
                'due_date' => $issueDate->toDateString(),
                'notes' => $payload['notes'] ?? 'Debit note issued against source invoice.',
                'custom_fields' => $customFields,
                'attachments' => $sourceDocument->attachments,
                'compliance_uuid' => (string) Str::uuid(),
                'compliance_status' => 'pending_submission',
                'compliance_metadata' => [
                    'source_invoice_uuid' => $sourceDocument->uuid,
                    'xml_ready' => true,
                    'zatca_ready' => true,
                ],
                'finalized_at' => now(),
                'finalized_by' => $user->id,
                'locked_at' => now(),
            ]));

            $debitNote->lines()->createMany(collect($calculation['lines'])
                ->values()
                ->map(fn (array $line, int $index) => array_merge($line, [
                    'source_line_id' => $debitLines[$index]['source_line_id'] ?? null,
                ]))
                ->all());

            $entry = $this->ledgerService->postSalesDocument($debitNote->fresh());

            $inventoryFulfillment = null;
            if ($this->shouldPostInventoryFromInvoice($debitNote->fresh(['lines.item', 'sourceDocument']))) {
                $this->inventoryService->validateStockAvailabilityForDocument($company, $debitNote->fresh(['lines.item', 'sourceDocument']), 'inventory');
                $inventoryFulfillment = $this->inventoryService->createSalesDocumentFulfillment($company, $user, $debitNote->fresh(['lines.item', 'contact', 'sourceDocument']));
            }

            $debitNote->update([
                'posted_journal_entry_id' => $entry->id,
                'posted_at' => now(),
                'custom_fields' => array_merge($debitNote->custom_fields ?? [], [
                    'inventory_journal_entry_ids' => $inventoryFulfillment['journal_entry_ids'] ?? [],
                    'source_invoice_number' => $sourceDocument->document_number,
                ]),
            ]);

            $this->accountingIntegrityService->validateSalesDocumentFinalization(
                $company,
                $debitNote->fresh(['lines.item']),
                $inventoryFulfillment['journal_entry_ids'] ?? [],
                $user->id,
            );

            $this->audit($company->id, $user->id, 'document.debit_note_issued', $debitNote, null, $debitNote->fresh()->toArray());

            return $debitNote->fresh()->load('lines');
        });
    }

    private function buildCreditLines(Document $sourceDocument, array $requestedLines): array
    {
        $sourceLines = $sourceDocument->lines->keyBy('id');

        if ($sourceLines->isEmpty()) {
            throw ValidationException::withMessages([
                'lines' => 'Source invoice has no lines to credit.',
            ]);
        }

        if ($requestedLines === []) {
            return $sourceLines->map(function (DocumentLine $line, int $index) {
                $availableQuantity = $this->availableCreditQuantity($line);

                if ($availableQuantity->isLessThanOrEqualTo(BigDecimal::zero())) {
                    throw ValidationException::withMessages([
                        "lines.$index.source_line_id" => 'This source line has already been fully credited.',
                    ]);
                }

                return [
                    'source_line_id' => $line->id,
                    'item_id' => $line->item_id,
                    'description' => 'Credit for '.$line->description,
                    'quantity' => (string) $availableQuantity,
                    'unit_price' => $line->unit_price,
                    'discount_amount' => $line->discount_amount,
                    'tax_category_id' => $line->tax_category_id,
                    'ledger_account_id' => $line->ledger_account_id,
                    'cost_center_id' => $line->cost_center_id,
                ];
            })->values()->all();
        }

        return collect($requestedLines)->map(function (array $line, int $index) use ($sourceLines) {
            $sourceLine = $sourceLines->get((int) $line['source_line_id']);

            if (! $sourceLine) {
                throw ValidationException::withMessages([
                    "lines.$index.source_line_id" => 'Source line was not found on the original invoice.',
                ]);
            }

            $quantity = BigDecimal::of((string) $line['quantity']);
            $availableQuantity = $this->availableCreditQuantity($sourceLine);

            if ($quantity->isLessThanOrEqualTo(BigDecimal::zero()) || $quantity->isGreaterThan($availableQuantity)) {
                throw ValidationException::withMessages([
                    "lines.$index.quantity" => 'Credit quantity must be greater than zero and cannot exceed the remaining creditable quantity.',
                ]);
            }

            return [
                'source_line_id' => $sourceLine->id,
                'item_id' => $sourceLine->item_id,
                'description' => $line['description'] ?? 'Credit for '.$sourceLine->description,
                'quantity' => (string) $quantity,
                'unit_price' => $line['unit_price'] ?? $sourceLine->unit_price,
                'discount_amount' => $line['discount_amount'] ?? '0.00',
                'tax_category_id' => $sourceLine->tax_category_id,
                'ledger_account_id' => $sourceLine->ledger_account_id,
                'cost_center_id' => $sourceLine->cost_center_id,
            ];
        })->all();
    }

    private function buildDebitLines(Document $sourceDocument, array $requestedLines): array
    {
        $sourceLines = $sourceDocument->lines->keyBy('id');

        if ($sourceLines->isEmpty()) {
            throw ValidationException::withMessages([
                'lines' => 'Source invoice has no lines to adjust.',
            ]);
        }

        if ($requestedLines === []) {
            return $sourceLines->map(function (DocumentLine $line) {
                return [
                    'source_line_id' => $line->id,
                    'item_id' => $line->item_id,
                    'description' => 'Debit for '.$line->description,
                    'quantity' => (string) $line->quantity,
                    'unit_price' => $line->unit_price,
                    'discount_amount' => '0.00',
                    'tax_category_id' => $line->tax_category_id,
                    'ledger_account_id' => $line->ledger_account_id,
                    'cost_center_id' => $line->cost_center_id,
                    'custom_fields' => [
                        'source_line_id' => $line->id,
                    ],
                ];
            })->values()->all();
        }

        return collect($requestedLines)->map(function (array $line, int $index) use ($sourceLines) {
            $sourceLine = $sourceLines->get((int) $line['source_line_id']);

            if (! $sourceLine) {
                throw ValidationException::withMessages([
                    "lines.$index.source_line_id" => 'Source line was not found on the original invoice.',
                ]);
            }

            $quantity = BigDecimal::of((string) $line['quantity']);
            $sourceQuantity = BigDecimal::of((string) $sourceLine->quantity);

            if ($quantity->isLessThanOrEqualTo(BigDecimal::zero()) || $quantity->isGreaterThan($sourceQuantity)) {
                throw ValidationException::withMessages([
                    "lines.$index.quantity" => 'Debit quantity must be greater than zero and cannot exceed the original invoice quantity.',
                ]);
            }

            return [
                'source_line_id' => $sourceLine->id,
                'item_id' => $sourceLine->item_id,
                'description' => $line['description'] ?? 'Debit for '.$sourceLine->description,
                'quantity' => (string) $quantity,
                'unit_price' => $line['unit_price'] ?? $sourceLine->unit_price,
                'discount_amount' => $line['discount_amount'] ?? '0.00',
                'tax_category_id' => $sourceLine->tax_category_id,
                'ledger_account_id' => $sourceLine->ledger_account_id,
                'cost_center_id' => $sourceLine->cost_center_id,
                'custom_fields' => [
                    'source_line_id' => $sourceLine->id,
                ],
            ];
        })->all();
    }

    private function availableCreditQuantity(DocumentLine $sourceLine): BigDecimal
    {
        $alreadyCredited = BigDecimal::of((string) DocumentLine::query()
            ->where('source_line_id', $sourceLine->id)
            ->sum('quantity'));

        return BigDecimal::of((string) $sourceLine->quantity)->minus($alreadyCredited);
    }

    private function resolveSalesAdjustmentSource(Company $company, array $payload): ?Document
    {
        $documentType = $payload['type'] ?? null;
        $sourceDocumentId = $payload['source_document_id'] ?? $payload['reversal_of_document_id'] ?? null;

        if (! $sourceDocumentId) {
            return null;
        }

        if ($documentType !== 'debit_note') {
            return Document::query()
                ->where('company_id', $company->id)
                ->whereKey($sourceDocumentId)
                ->firstOrFail();
        }

        $sourceDocument = Document::query()
            ->where('company_id', $company->id)
            ->whereKey($sourceDocumentId)
            ->firstOrFail();

        if ($sourceDocument->type !== 'tax_invoice') {
            throw ValidationException::withMessages([
                'source_document_id' => 'Sales adjustments must reference a tax invoice.',
            ]);
        }

        if (($payload['contact_id'] ?? null) && (int) $payload['contact_id'] !== (int) $sourceDocument->contact_id) {
            throw ValidationException::withMessages([
                'contact_id' => 'The selected customer must match the referenced invoice.',
            ]);
        }

        if (! in_array($sourceDocument->status, ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed', 'reported', 'issued'], true)) {
            throw ValidationException::withMessages([
                'source_document_id' => 'Only issued or finalized invoices can be referenced by a sales adjustment.',
            ]);
        }

        return $sourceDocument;
    }

    private function audit(int $companyId, int $userId, string $event, Document $document, ?array $before, ?array $after): void
    {
        AuditLog::create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'event' => $event,
            'auditable_type' => Document::class,
            'auditable_id' => $document->id,
            'before' => $before,
            'after' => $after,
            'context' => ['document_type' => $document->type],
            'created_at' => now(),
        ]);
    }
}