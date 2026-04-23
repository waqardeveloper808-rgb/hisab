<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\User;
use Brick\Math\BigDecimal;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReversalService
{
    public function __construct(private readonly LedgerService $ledgerService)
    {
    }

    public function voidDocument(Company $company, Document $document, User $user, string $reason): Document
    {
        return DB::transaction(function () use ($company, $document, $user, $reason): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($document->company_id !== $company->id) {
                throw ValidationException::withMessages([
                    'document' => 'Document does not belong to this company.',
                ]);
            }

            if ($document->status === 'voided') {
                throw ValidationException::withMessages([
                    'document' => 'Document has already been voided.',
                ]);
            }

            if (! in_array($document->type, ['tax_invoice', 'vendor_bill', 'purchase_invoice'], true)) {
                throw ValidationException::withMessages([
                    'document' => 'This document type is not yet supported for voiding.',
                ]);
            }

            if (BigDecimal::of((string) $document->paid_total)->isGreaterThan(BigDecimal::zero()) || BigDecimal::of((string) $document->credited_total)->isGreaterThan(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'document' => 'Documents with payments or credits must be reversed through their downstream transactions first.',
                ]);
            }

            if ($document->sourceDocument()->exists() || Document::query()->where('source_document_id', $document->id)->exists()) {
                throw ValidationException::withMessages([
                    'document' => 'Documents linked to credit notes cannot be voided directly.',
                ]);
            }

            $entry = JournalEntry::query()
                ->where('company_id', $company->id)
                ->where('source_type', 'document')
                ->where('source_id', $document->id)
                ->first();

            if (! $entry) {
                throw ValidationException::withMessages([
                    'document' => 'Finalized document does not have a posted journal entry to reverse.',
                ]);
            }

            $reverseEntry = $this->ledgerService->reverseJournalEntry(
                $company,
                $entry,
                'document_void',
                $document->id,
                sprintf('Void %s %s', $document->type, $document->document_number ?? $document->uuid),
            );

            $before = $document->toArray();

            $document->update([
                'status' => 'voided',
                'balance_due' => '0.00',
                'status_reason' => $reason,
                'cancelled_at' => now(),
                'locked_at' => now(),
                'version' => $document->version + 1,
            ]);

            $freshDocument = $document->fresh()->load('lines');

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => 'document.voided',
                'auditable_type' => Document::class,
                'auditable_id' => $document->id,
                'before' => $before,
                'after' => $freshDocument->toArray(),
                'context' => [
                    'reason' => $reason,
                    'reversal_journal_entry_id' => $reverseEntry->id,
                ],
                'created_at' => now(),
            ]);

            return $freshDocument;
        });
    }

    public function voidPayment(Company $company, Payment $payment, User $user, string $reason): Payment
    {
        return DB::transaction(function () use ($company, $payment, $user, $reason): Payment {
            $payment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail()->load('allocations');

            if ($payment->company_id !== $company->id) {
                throw ValidationException::withMessages([
                    'payment' => 'Payment does not belong to this company.',
                ]);
            }

            if ($payment->status === 'voided') {
                throw ValidationException::withMessages([
                    'payment' => 'Payment has already been voided.',
                ]);
            }

            $entry = JournalEntry::query()
                ->where('company_id', $company->id)
                ->where('source_type', 'payment')
                ->where('source_id', $payment->id)
                ->first();

            if (! $entry) {
                throw ValidationException::withMessages([
                    'payment' => 'Payment does not have a posted journal entry to reverse.',
                ]);
            }

            $reverseEntry = $this->ledgerService->reverseJournalEntry(
                $company,
                $entry,
                'payment_void',
                $payment->id,
                sprintf('Void payment %s', $payment->payment_number ?? $payment->uuid),
            );

            $documents = Document::query()
                ->where('company_id', $company->id)
                ->whereIn('id', $payment->allocations->pluck('document_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($payment->allocations as $allocation) {
                $document = $documents->get($allocation->document_id);

                if (! $document) {
                    continue;
                }

                $paidTotal = BigDecimal::of((string) $document->paid_total)->minus(BigDecimal::of((string) $allocation->amount));

                if ($paidTotal->isLessThan(BigDecimal::zero())) {
                    throw ValidationException::withMessages([
                        'payment' => 'Voiding this payment would produce an invalid paid balance on the related document.',
                    ]);
                }

                $netOpenValue = BigDecimal::of((string) $document->grand_total)
                    ->minus(BigDecimal::of((string) $document->credited_total));
                $balanceDue = $netOpenValue->minus($paidTotal);

                if ($balanceDue->isLessThan(BigDecimal::zero())) {
                    $balanceDue = BigDecimal::zero();
                }

                $document->update([
                    'paid_total' => (string) $paidTotal,
                    'balance_due' => (string) $balanceDue,
                    'status' => $this->resolveDocumentStatusAfterVoid($document, $paidTotal, $balanceDue),
                    'status_reason' => 'Payment voided: '.$reason,
                    'version' => $document->version + 1,
                ]);
            }

            $before = $payment->toArray();

            $payment->update([
                'status' => 'voided',
                'notes' => trim(($payment->notes ? $payment->notes.' ' : '').'VOID: '.$reason),
            ]);

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => 'payment.voided',
                'auditable_type' => Payment::class,
                'auditable_id' => $payment->id,
                'before' => $before,
                'after' => $payment->fresh()->toArray(),
                'context' => [
                    'reason' => $reason,
                    'reversal_journal_entry_id' => $reverseEntry->id,
                ],
                'created_at' => now(),
            ]);

            return $payment->fresh()->load('allocations');
        });
    }

    private function resolveDocumentStatusAfterVoid(Document $document, BigDecimal $paidTotal, BigDecimal $balanceDue): string
    {
        if ($balanceDue->isEqualTo(BigDecimal::zero())) {
            return BigDecimal::of((string) $document->credited_total)->isGreaterThanOrEqualTo(BigDecimal::of((string) $document->grand_total))
                ? 'credited'
                : 'paid';
        }

        if ($paidTotal->isEqualTo(BigDecimal::zero()) && BigDecimal::of((string) $document->credited_total)->isEqualTo(BigDecimal::zero())) {
            return 'finalized';
        }

        return BigDecimal::of((string) $document->credited_total)->isGreaterThan(BigDecimal::zero())
            ? 'partially_credited'
            : 'partially_paid';
    }
}