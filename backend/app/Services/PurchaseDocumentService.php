<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\DocumentSequence;
use App\Models\User;
use Brick\Math\BigDecimal;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseDocumentService
{
    public function __construct(
        private readonly TaxCalculationService $taxCalculationService,
        private readonly LedgerService $ledgerService,
        private readonly AccountingPeriodService $accountingPeriodService,
    ) {
    }

    public function createDraft(Company $company, User $user, array $payload): Document
    {
        return DB::transaction(function () use ($company, $user, $payload): Document {
            $issueDate = Carbon::parse($payload['issue_date'] ?? now()->toDateString());
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);
            $calculation = $this->taxCalculationService->calculate($company, $payload['lines'], 'purchase');
            $settings = $company->settings()->firstOrFail();
            $contact = Contact::query()->where('company_id', $company->id)->findOrFail($payload['contact_id']);

            if (! in_array($contact->type, ['supplier', 'vendor'], true)) {
                throw ValidationException::withMessages([
                    'contact_id' => 'Purchase documents require a supplier contact.',
                ]);
            }

            $document = Document::create(array_merge(
                Arr::only($payload, ['type', 'contact_id', 'notes', 'title', 'template_id', 'cost_center_id', 'language_code', 'custom_fields', 'attachments']),
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
                    'due_date' => $payload['due_date'] ?? $issueDate->toDateString(),
                    'compliance_metadata' => [
                        'purchase_document' => true,
                        'xml_ready' => true,
                        'purchase_context' => $payload['purchase_context'] ?? [],
                    ],
                ],
            ));

            $document->lines()->createMany($calculation['lines']);
            $this->audit($company->id, $user->id, 'purchase_document.created', $document, null, $document->toArray());

            return $document->load('lines');
        });
    }

    public function updateDraft(Company $company, Document $document, User $user, array $payload): Document
    {
        if ($document->status !== 'draft') {
            throw ValidationException::withMessages([
                'document' => 'Only draft purchase documents can be modified.',
            ]);
        }

        return DB::transaction(function () use ($company, $document, $user, $payload): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();
            $before = $document->load('lines')->toArray();
            $calculation = $this->taxCalculationService->calculate($company, $payload['lines'], 'purchase');
            $contact = Contact::query()->where('company_id', $company->id)->findOrFail($payload['contact_id']);

            if (! in_array($contact->type, ['supplier', 'vendor'], true)) {
                throw ValidationException::withMessages([
                    'contact_id' => 'Purchase documents require a supplier contact.',
                ]);
            }

            $issueDate = Carbon::parse($payload['issue_date'] ?? $document->issue_date);
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);

            $document->update(array_merge(
                Arr::only($payload, ['contact_id', 'notes', 'title', 'template_id', 'cost_center_id', 'language_code', 'custom_fields', 'attachments']),
                $calculation['totals'],
                [
                    'issue_date' => $issueDate->toDateString(),
                    'supply_date' => $payload['supply_date'] ?? $document->supply_date,
                    'due_date' => $payload['due_date'] ?? $document->due_date,
                    'compliance_metadata' => array_merge($document->compliance_metadata ?? [], [
                        'purchase_context' => $payload['purchase_context'] ?? (($document->compliance_metadata ?? [])['purchase_context'] ?? []),
                    ]),
                    'version' => $document->version + 1,
                ],
            ));

            $document->lines()->delete();
            $document->lines()->createMany($calculation['lines']);

            $this->audit($company->id, $user->id, 'purchase_document.updated', $document, $before, $document->fresh()->load('lines')->toArray());

            return $document->fresh()->load('lines');
        });
    }

    public function finalize(Company $company, Document $document, User $user): Document
    {
        if ($document->status !== 'draft') {
            throw ValidationException::withMessages([
                'document' => 'Only draft purchase documents can be finalized.',
            ]);
        }

        return DB::transaction(function () use ($company, $document, $user): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();
            $this->accountingPeriodService->ensureDateOpen($company, Carbon::parse($document->issue_date ?? now()->toDateString()));

            $sequence = DocumentSequence::query()
                ->where('company_id', $company->id)
                ->where('branch_id', $document->branch_id)
                ->where('document_type', $document->type)
                ->lockForUpdate()
                ->firstOrFail();

            $number = sprintf('%s-%s', $sequence->prefix, str_pad((string) $sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT));
            $sequence->increment('next_number');

            $document->update([
                'status' => 'finalized',
                'sequence_number' => $sequence->next_number - 1,
                'document_number' => $number,
                'finalized_at' => now(),
                'finalized_by' => $user->id,
                'locked_at' => now(),
                'version' => $document->version + 1,
            ]);

            if (in_array($document->type, ['vendor_bill', 'purchase_invoice', 'debit_note'], true)) {
                $entry = $this->ledgerService->postPurchaseDocument($document->fresh());
                $document->update([
                    'posted_journal_entry_id' => $entry->id,
                    'posted_at' => now(),
                ]);
            }

            $this->audit($company->id, $user->id, 'purchase_document.finalized', $document, null, $document->fresh()->toArray());

            return $document->fresh()->load('lines');
        });
    }

    public function issueCreditNote(Company $company, Document $sourceDocument, User $user, array $payload): Document
    {
        if (! in_array($sourceDocument->type, ['vendor_bill', 'purchase_invoice'], true)) {
            throw ValidationException::withMessages([
                'document' => 'Purchase credit notes can only be issued against purchase documents.',
            ]);
        }

        if (! in_array($sourceDocument->status, ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credit_owed'], true)) {
            throw ValidationException::withMessages([
                'document' => 'Only finalized purchase documents can be credited.',
            ]);
        }

        return DB::transaction(function () use ($company, $sourceDocument, $user, $payload): Document {
            $sourceDocument = Document::query()->whereKey($sourceDocument->id)->lockForUpdate()->firstOrFail()->load('lines');
            $issueDate = Carbon::parse($payload['issue_date'] ?? now()->toDateString());
            $this->accountingPeriodService->ensureDateOpen($company, $issueDate);

            $creditLines = $this->buildCreditLines($sourceDocument, $payload['lines'] ?? []);
            $calculation = $this->taxCalculationService->calculate($company, $creditLines, 'purchase');

            $sequence = DocumentSequence::query()
                ->where('company_id', $company->id)
                ->where('branch_id', $sourceDocument->branch_id)
                ->where('document_type', 'purchase_credit_note')
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
                'type' => 'purchase_credit_note',
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
                'notes' => $payload['notes'] ?? 'Purchase credit note issued against source document.',
                'custom_fields' => $sourceDocument->custom_fields,
                'attachments' => $sourceDocument->attachments,
                'compliance_metadata' => [
                    'source_document_uuid' => $sourceDocument->uuid,
                    'purchase_document' => true,
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
            $liabilityReduction = $creditAmount->isGreaterThan($currentBalance) ? $currentBalance : $creditAmount;
            $supplierAdvance = $creditAmount->minus($liabilityReduction);
            $newCreditedTotal = BigDecimal::of((string) $sourceDocument->credited_total)->plus($creditAmount);
            $newNetOpenValue = BigDecimal::of((string) $sourceDocument->grand_total)->minus($newCreditedTotal);
            $newBalance = $newNetOpenValue->minus(BigDecimal::of((string) $sourceDocument->paid_total));

            if ($newBalance->isLessThan(BigDecimal::zero())) {
                $newBalance = BigDecimal::zero();
            }

            $newStatus = match (true) {
                $newBalance->isEqualTo(BigDecimal::zero()) && $supplierAdvance->isGreaterThan(BigDecimal::zero()) => 'credit_owed',
                $newBalance->isEqualTo(BigDecimal::zero()) => 'credited',
                default => 'partially_credited',
            };

            $sourceDocument->update([
                'credited_total' => (string) $newCreditedTotal,
                'balance_due' => (string) $newBalance,
                'status' => $newStatus,
                'status_reason' => 'Purchase credit note issued against source document.',
                'version' => $sourceDocument->version + 1,
            ]);

            $entry = $this->ledgerService->postPurchaseCreditNote(
                $creditNote,
                $sourceDocument,
                (string) $liabilityReduction,
                (string) $supplierAdvance,
            );

            $creditNote->update([
                'posted_journal_entry_id' => $entry->id,
                'posted_at' => now(),
            ]);

            $this->audit($company->id, $user->id, 'purchase_document.credit_note_issued', $creditNote, null, $creditNote->fresh()->toArray());

            return $creditNote->fresh()->load('lines');
        });
    }

    private function buildCreditLines(Document $sourceDocument, array $requestedLines): array
    {
        $sourceLines = $sourceDocument->lines->keyBy('id');

        if ($sourceLines->isEmpty()) {
            throw ValidationException::withMessages([
                'lines' => 'Source purchase document has no lines to credit.',
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
                    'description' => 'Vendor credit for '.$line->description,
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
                    "lines.$index.source_line_id" => 'Source line was not found on the original purchase document.',
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
                'description' => $line['description'] ?? 'Vendor credit for '.$sourceLine->description,
                'quantity' => (string) $quantity,
                'unit_price' => $line['unit_price'] ?? $sourceLine->unit_price,
                'discount_amount' => $line['discount_amount'] ?? '0.00',
                'tax_category_id' => $sourceLine->tax_category_id,
                'ledger_account_id' => $sourceLine->ledger_account_id,
                'cost_center_id' => $sourceLine->cost_center_id,
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