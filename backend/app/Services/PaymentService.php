<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentSequence;
use App\Models\Payment;
use App\Models\User;
use Brick\Math\BigDecimal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(private readonly LedgerService $ledgerService)
    {
    }

    public function recordIncomingPayment(Company $company, Document $document, User $user, array $payload): Payment
    {
        return $this->recordIncomingPaymentForAllocations($company, $user, [
            'contact_id' => $document->contact_id,
            'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
            'method' => $payload['method'] ?? 'bank_transfer',
            'reference' => $payload['reference'] ?? null,
            'notes' => $payload['notes'] ?? null,
            'received_into_account_id' => $payload['received_into_account_id'] ?? null,
            'currency_code' => $payload['currency_code'] ?? $company->base_currency,
            'amount' => $payload['amount'],
            'allocations' => [[
                'document_id' => $document->id,
                'amount' => $payload['amount'],
            ]],
        ]);
    }

    public function recordIncomingPaymentForAllocations(Company $company, User $user, array $payload): Payment
    {
        $amount = BigDecimal::of((string) $payload['amount'])->toScale(2);

        if ($amount->isLessThanOrEqualTo(BigDecimal::zero())) {
            throw ValidationException::withMessages([
                'amount' => 'Payment amount must be greater than zero.',
            ]);
        }

        $allocations = collect($payload['allocations'] ?? [])
            ->map(fn (array $allocation) => [
                'document_id' => (int) $allocation['document_id'],
                'amount' => BigDecimal::of((string) $allocation['amount'])->toScale(2),
            ]);

        return DB::transaction(function () use ($company, $user, $payload, $amount, $allocations): Payment {
            $this->ensureContactType($company, (int) $payload['contact_id'], ['customer']);

            $documentIds = $allocations->pluck('document_id')->filter()->unique()->values();
            $documents = Document::query()
                ->where('company_id', $company->id)
                ->whereIn('id', $documentIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($documentIds->count() !== $documents->count()) {
                throw ValidationException::withMessages([
                    'allocations' => 'One or more allocated documents do not belong to this company.',
                ]);
            }

            $contactId = (int) $payload['contact_id'];
            $allocatedTotal = BigDecimal::zero();

            foreach ($allocations as $index => $allocation) {
                $document = $documents->get($allocation['document_id']);

                if (! $document) {
                    continue;
                }

                if ((int) $document->contact_id !== $contactId) {
                    throw ValidationException::withMessages([
                        "allocations.$index.document_id" => 'All allocated documents must belong to the same contact.',
                    ]);
                }

                if (! in_array($document->status, ['finalized', 'partially_paid', 'partially_credited'], true)) {
                    throw ValidationException::withMessages([
                        "allocations.$index.document_id" => 'Only open finalized documents can receive payments.',
                    ]);
                }

                if ($allocation['amount']->isLessThanOrEqualTo(BigDecimal::zero())) {
                    throw ValidationException::withMessages([
                        "allocations.$index.amount" => 'Allocation amount must be greater than zero.',
                    ]);
                }

                if ($allocation['amount']->isGreaterThan(BigDecimal::of((string) $document->balance_due))) {
                    throw ValidationException::withMessages([
                        "allocations.$index.amount" => 'Allocation amount cannot exceed the document balance due.',
                    ]);
                }

                $allocatedTotal = $allocatedTotal->plus($allocation['amount']);
            }

            if ($allocatedTotal->isGreaterThan($amount)) {
                throw ValidationException::withMessages([
                    'allocations' => 'Allocated amounts cannot exceed the payment amount.',
                ]);
            }

            [$paymentNumber, $branchId] = $this->nextPaymentNumber($company, $payload['branch_id'] ?? $documents->first()?->branch_id);

            $payment = Payment::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'contact_id' => $contactId,
                'branch_id' => $branchId,
                'received_into_account_id' => $payload['received_into_account_id'] ?? null,
                'direction' => 'incoming',
                'status' => 'posted',
                'payment_number' => $paymentNumber,
                'method' => $payload['method'] ?? 'bank_transfer',
                'reference' => $payload['reference'] ?? null,
                'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
                'currency_code' => $payload['currency_code'] ?? $company->base_currency,
                'amount' => (string) $amount,
                'allocated_total' => (string) $allocatedTotal,
                'unallocated_amount' => (string) $amount->minus($allocatedTotal),
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
                'posted_at' => now(),
            ]);

            foreach ($allocations as $allocation) {
                $document = $documents->get($allocation['document_id']);

                if (! $document) {
                    continue;
                }

                $payment->allocations()->create([
                    'document_id' => $document->id,
                    'amount' => (string) $allocation['amount'],
                ]);

                $paidTotal = BigDecimal::of((string) $document->paid_total)->plus($allocation['amount']);
                $netOpenValue = BigDecimal::of((string) $document->grand_total)
                    ->minus(BigDecimal::of((string) $document->credited_total));
                $balanceDue = $netOpenValue->minus($paidTotal);

                if ($balanceDue->isLessThan(BigDecimal::zero())) {
                    $balanceDue = BigDecimal::zero();
                }

                $document->update([
                    'paid_total' => (string) $paidTotal,
                    'balance_due' => (string) $balanceDue,
                    'status' => $balanceDue->isGreaterThan(BigDecimal::zero()) ? 'partially_paid' : 'paid',
                    'version' => $document->version + 1,
                ]);
            }

            $this->ledgerService->postIncomingPayment(
                $payment,
                $contactId,
                (string) $allocatedTotal,
                (string) $amount->minus($allocatedTotal),
                $documents->count() === 1 ? $documents->first()?->id : null,
            );

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => 'payment.recorded',
                'auditable_type' => Payment::class,
                'auditable_id' => $payment->id,
                'after' => $payment->toArray(),
                'context' => ['document_ids' => $documentIds->all()],
                'created_at' => now(),
            ]);

            return $payment->load('allocations');
        });
    }

    public function recordOutgoingPayment(Company $company, Document $document, User $user, array $payload): Payment
    {
        return $this->recordOutgoingPaymentForAllocations($company, $user, [
            'contact_id' => $document->contact_id,
            'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
            'method' => $payload['method'] ?? 'bank_transfer',
            'reference' => $payload['reference'] ?? null,
            'notes' => $payload['notes'] ?? null,
            'received_into_account_id' => $payload['received_into_account_id'] ?? null,
            'currency_code' => $payload['currency_code'] ?? $company->base_currency,
            'amount' => $payload['amount'],
            'allocations' => [[
                'document_id' => $document->id,
                'amount' => $payload['amount'],
            ]],
        ]);
    }

    public function recordOutgoingPaymentForAllocations(Company $company, User $user, array $payload): Payment
    {
        $amount = BigDecimal::of((string) $payload['amount'])->toScale(2);

        if ($amount->isLessThanOrEqualTo(BigDecimal::zero())) {
            throw ValidationException::withMessages([
                'amount' => 'Payment amount must be greater than zero.',
            ]);
        }

        $allocations = collect($payload['allocations'] ?? [])
            ->map(fn (array $allocation) => [
                'document_id' => (int) $allocation['document_id'],
                'amount' => BigDecimal::of((string) $allocation['amount'])->toScale(2),
            ]);

        return DB::transaction(function () use ($company, $user, $payload, $amount, $allocations): Payment {
            $this->ensureContactType($company, (int) $payload['contact_id'], ['supplier', 'vendor']);

            $documentIds = $allocations->pluck('document_id')->filter()->unique()->values();
            $documents = Document::query()
                ->where('company_id', $company->id)
                ->whereIn('id', $documentIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($documentIds->count() !== $documents->count()) {
                throw ValidationException::withMessages([
                    'allocations' => 'One or more allocated documents do not belong to this company.',
                ]);
            }

            $contactId = (int) $payload['contact_id'];
            $allocatedTotal = BigDecimal::zero();

            foreach ($allocations as $index => $allocation) {
                $document = $documents->get($allocation['document_id']);

                if (! $document) {
                    continue;
                }

                if ((int) $document->contact_id !== $contactId) {
                    throw ValidationException::withMessages([
                        "allocations.$index.document_id" => 'All allocated documents must belong to the same supplier.',
                    ]);
                }

                if (! in_array($document->type, ['vendor_bill', 'purchase_invoice'], true)) {
                    throw ValidationException::withMessages([
                        "allocations.$index.document_id" => 'Outgoing supplier payments can only be allocated to purchase documents.',
                    ]);
                }

                if (! in_array($document->status, ['finalized', 'partially_paid', 'partially_credited'], true)) {
                    throw ValidationException::withMessages([
                        "allocations.$index.document_id" => 'Only open finalized purchase documents can receive supplier payments.',
                    ]);
                }

                if ($allocation['amount']->isLessThanOrEqualTo(BigDecimal::zero())) {
                    throw ValidationException::withMessages([
                        "allocations.$index.amount" => 'Allocation amount must be greater than zero.',
                    ]);
                }

                if ($allocation['amount']->isGreaterThan(BigDecimal::of((string) $document->balance_due))) {
                    throw ValidationException::withMessages([
                        "allocations.$index.amount" => 'Allocation amount cannot exceed the document balance due.',
                    ]);
                }

                $allocatedTotal = $allocatedTotal->plus($allocation['amount']);
            }

            if ($allocatedTotal->isGreaterThan($amount)) {
                throw ValidationException::withMessages([
                    'allocations' => 'Allocated amounts cannot exceed the payment amount.',
                ]);
            }

            [$paymentNumber, $branchId] = $this->nextPaymentNumber($company, $payload['branch_id'] ?? $documents->first()?->branch_id);

            $payment = Payment::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'contact_id' => $contactId,
                'branch_id' => $branchId,
                'received_into_account_id' => $payload['received_into_account_id'] ?? null,
                'direction' => 'outgoing',
                'status' => 'posted',
                'payment_number' => $paymentNumber,
                'method' => $payload['method'] ?? 'bank_transfer',
                'reference' => $payload['reference'] ?? null,
                'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
                'currency_code' => $payload['currency_code'] ?? $company->base_currency,
                'amount' => (string) $amount,
                'allocated_total' => (string) $allocatedTotal,
                'unallocated_amount' => (string) $amount->minus($allocatedTotal),
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
                'posted_at' => now(),
            ]);

            foreach ($allocations as $allocation) {
                $document = $documents->get($allocation['document_id']);

                if (! $document) {
                    continue;
                }

                $payment->allocations()->create([
                    'document_id' => $document->id,
                    'amount' => (string) $allocation['amount'],
                ]);

                $this->applySettlementToDocument($document, $allocation['amount']);
            }

            $this->ledgerService->postOutgoingPayment(
                $payment,
                $contactId,
                (string) $allocatedTotal,
                (string) $amount->minus($allocatedTotal),
                $documents->count() === 1 ? $documents->first()?->id : null,
            );

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => 'supplier_payment.recorded',
                'auditable_type' => Payment::class,
                'auditable_id' => $payment->id,
                'after' => $payment->toArray(),
                'context' => ['document_ids' => $documentIds->all()],
                'created_at' => now(),
            ]);

            return $payment->load('allocations');
        });
    }

    public function applyCustomerAdvance(Company $company, Document $document, User $user, array $payload): Document
    {
        return DB::transaction(function () use ($company, $document, $user, $payload): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($document->company_id !== $company->id) {
                throw ValidationException::withMessages([
                    'document' => 'Document does not belong to this company.',
                ]);
            }

            if (! $document->contact_id) {
                throw ValidationException::withMessages([
                    'document' => 'Only customer documents can use customer advances.',
                ]);
            }

            if (! in_array($document->status, ['finalized', 'partially_paid', 'partially_credited'], true)) {
                throw ValidationException::withMessages([
                    'document' => 'Only open finalized documents can consume customer advances.',
                ]);
            }

            $balanceDue = BigDecimal::of((string) $document->balance_due);

            if ($balanceDue->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'document' => 'This document has no outstanding balance due.',
                ]);
            }

            $availableAdvance = $this->ledgerService->availableCustomerAdvance($company, (int) $document->contact_id);

            if ($availableAdvance->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'amount' => 'No available customer advance exists for this contact.',
                ]);
            }

            if (isset($payload['amount'])) {
                $amount = BigDecimal::of((string) $payload['amount'])->toScale(2);
            } else {
                $amount = $balanceDue->isLessThan($availableAdvance) ? $balanceDue : $availableAdvance;
            }

            if ($amount->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'amount' => 'Applied advance amount must be greater than zero.',
                ]);
            }

            if ($amount->isGreaterThan($balanceDue)) {
                throw ValidationException::withMessages([
                    'amount' => 'Applied advance amount cannot exceed the document balance due.',
                ]);
            }

            if ($amount->isGreaterThan($availableAdvance)) {
                throw ValidationException::withMessages([
                    'amount' => 'Applied advance amount cannot exceed the customer advance balance.',
                ]);
            }

            $entry = $this->ledgerService->applyCustomerAdvance(
                $document,
                (string) $amount,
                $payload['application_date'] ?? now()->toDateString(),
            );

            $paidTotal = BigDecimal::of((string) $document->paid_total)->plus($amount);
            $netOpenValue = BigDecimal::of((string) $document->grand_total)
                ->minus(BigDecimal::of((string) $document->credited_total));
            $newBalance = $netOpenValue->minus($paidTotal);

            if ($newBalance->isLessThan(BigDecimal::zero())) {
                $newBalance = BigDecimal::zero();
            }

            $newStatus = match (true) {
                $newBalance->isEqualTo(BigDecimal::zero()) && BigDecimal::of((string) $document->credited_total)->isGreaterThanOrEqualTo(BigDecimal::of((string) $document->grand_total)) => 'credited',
                $newBalance->isEqualTo(BigDecimal::zero()) => 'paid',
                BigDecimal::of((string) $document->credited_total)->isGreaterThan(BigDecimal::zero()) => 'partially_credited',
                default => 'partially_paid',
            };

            $before = $document->toArray();

            $document->update([
                'paid_total' => (string) $paidTotal,
                'balance_due' => (string) $newBalance,
                'status' => $newStatus,
                'status_reason' => 'Customer advance applied to receivable.',
                'version' => $document->version + 1,
            ]);

            $freshDocument = $document->fresh()->load('lines');

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => 'document.advance_applied',
                'auditable_type' => Document::class,
                'auditable_id' => $document->id,
                'before' => $before,
                'after' => $freshDocument->toArray(),
                'context' => [
                    'journal_entry_id' => $entry->id,
                    'amount' => (string) $amount,
                ],
                'created_at' => now(),
            ]);

            return $freshDocument;
        });
    }

    public function applySupplierAdvance(Company $company, Document $document, User $user, array $payload): Document
    {
        return DB::transaction(function () use ($company, $document, $user, $payload): Document {
            $document = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($document->company_id !== $company->id || ! in_array($document->type, ['vendor_bill', 'purchase_invoice'], true)) {
                throw ValidationException::withMessages([
                    'document' => 'Only purchase documents can consume supplier advances.',
                ]);
            }

            if (! in_array($document->status, ['finalized', 'partially_paid', 'partially_credited'], true)) {
                throw ValidationException::withMessages([
                    'document' => 'Only open finalized purchase documents can consume supplier advances.',
                ]);
            }

            $balanceDue = BigDecimal::of((string) $document->balance_due);

            if ($balanceDue->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'document' => 'This purchase document has no outstanding balance due.',
                ]);
            }

            $availableAdvance = $this->ledgerService->availableSupplierAdvance($company, (int) $document->contact_id);

            if ($availableAdvance->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'amount' => 'No available supplier advance exists for this supplier.',
                ]);
            }

            if (isset($payload['amount'])) {
                $amount = BigDecimal::of((string) $payload['amount'])->toScale(2);
            } else {
                $amount = $balanceDue->isLessThan($availableAdvance) ? $balanceDue : $availableAdvance;
            }

            if ($amount->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    'amount' => 'Applied supplier advance amount must be greater than zero.',
                ]);
            }

            if ($amount->isGreaterThan($balanceDue)) {
                throw ValidationException::withMessages([
                    'amount' => 'Applied supplier advance amount cannot exceed the document balance due.',
                ]);
            }

            if ($amount->isGreaterThan($availableAdvance)) {
                throw ValidationException::withMessages([
                    'amount' => 'Applied supplier advance amount cannot exceed the supplier advance balance.',
                ]);
            }

            $entry = $this->ledgerService->applySupplierAdvance(
                $document,
                (string) $amount,
                $payload['application_date'] ?? now()->toDateString(),
            );

            $before = $document->toArray();
            $this->applySettlementToDocument($document, $amount);
            $freshDocument = $document->fresh()->load('lines');

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => 'purchase_document.advance_applied',
                'auditable_type' => Document::class,
                'auditable_id' => $document->id,
                'before' => $before,
                'after' => $freshDocument->toArray(),
                'context' => [
                    'journal_entry_id' => $entry->id,
                    'amount' => (string) $amount,
                ],
                'created_at' => now(),
            ]);

            return $freshDocument;
        });
    }

    public function refundCustomerAdvance(Company $company, int $contactId, User $user, array $payload): Payment
    {
        return $this->refundAdvance($company, $contactId, $user, $payload, ['customer'], 'outgoing', 'customer_advance.refunded');
    }

    public function refundSupplierAdvance(Company $company, int $contactId, User $user, array $payload): Payment
    {
        return $this->refundAdvance($company, $contactId, $user, $payload, ['supplier', 'vendor'], 'incoming', 'supplier_advance.refunded');
    }

    private function refundAdvance(Company $company, int $contactId, User $user, array $payload, array $allowedTypes, string $direction, string $event): Payment
    {
        $contact = $this->ensureContactType($company, $contactId, $allowedTypes);
        $available = $direction === 'outgoing'
            ? $this->ledgerService->availableCustomerAdvance($company, $contactId)
            : $this->ledgerService->availableSupplierAdvance($company, $contactId);

        if ($available->isLessThanOrEqualTo(BigDecimal::zero())) {
            throw ValidationException::withMessages([
                'amount' => 'No refundable advance balance exists for this contact.',
            ]);
        }

        $amount = isset($payload['amount'])
            ? BigDecimal::of((string) $payload['amount'])->toScale(2)
            : $available;

        if ($amount->isLessThanOrEqualTo(BigDecimal::zero()) || $amount->isGreaterThan($available)) {
            throw ValidationException::withMessages([
                'amount' => 'Refund amount must be greater than zero and cannot exceed the available advance balance.',
            ]);
        }

        return DB::transaction(function () use ($company, $user, $payload, $contact, $amount, $direction, $event): Payment {
            [$paymentNumber, $branchId] = $this->nextPaymentNumber($company, $payload['branch_id'] ?? $company->settings()->firstOrFail()->default_branch_id);

            $payment = Payment::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'contact_id' => $contact->id,
                'branch_id' => $branchId,
                'received_into_account_id' => $payload['received_into_account_id'] ?? null,
                'direction' => $direction,
                'status' => 'posted',
                'payment_number' => $paymentNumber,
                'method' => $payload['method'] ?? 'bank_transfer',
                'reference' => $payload['reference'] ?? null,
                'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
                'currency_code' => $payload['currency_code'] ?? $company->base_currency,
                'amount' => (string) $amount,
                'allocated_total' => '0.00',
                'unallocated_amount' => (string) $amount,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $user->id,
                'posted_at' => now(),
            ]);

            if ($direction === 'outgoing') {
                $this->ledgerService->postCustomerAdvanceRefund($payment, $contact->id);
            } else {
                $this->ledgerService->postSupplierAdvanceRefund($payment, $contact->id);
            }

            AuditLog::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'event' => $event,
                'auditable_type' => Payment::class,
                'auditable_id' => $payment->id,
                'after' => $payment->toArray(),
                'context' => ['contact_id' => $contact->id],
                'created_at' => now(),
            ]);

            return $payment;
        });
    }

    private function ensureContactType(Company $company, int $contactId, array $allowedTypes): Contact
    {
        $contact = Contact::query()->where('company_id', $company->id)->findOrFail($contactId);

        if (! in_array($contact->type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                'contact_id' => 'Contact type is not valid for this financial operation.',
            ]);
        }

        return $contact;
    }

    private function nextPaymentNumber(Company $company, ?int $branchId): array
    {
        $resolvedBranchId = $branchId ?? $company->settings()->firstOrFail()->default_branch_id;

        $sequence = DocumentSequence::query()
            ->where('company_id', $company->id)
            ->where('branch_id', $resolvedBranchId)
            ->where('document_type', 'payment')
            ->lockForUpdate()
            ->firstOrFail();

        $paymentNumber = sprintf('%s-%s', $sequence->prefix, str_pad((string) $sequence->next_number, $sequence->padding, '0', STR_PAD_LEFT));
        $sequence->increment('next_number');

        return [$paymentNumber, $resolvedBranchId];
    }

    private function applySettlementToDocument(Document $document, BigDecimal $amount): void
    {
        $paidTotal = BigDecimal::of((string) $document->paid_total)->plus($amount);
        $netOpenValue = BigDecimal::of((string) $document->grand_total)
            ->minus(BigDecimal::of((string) $document->credited_total));
        $balanceDue = $netOpenValue->minus($paidTotal);

        if ($balanceDue->isLessThan(BigDecimal::zero())) {
            $balanceDue = BigDecimal::zero();
        }

        $document->update([
            'paid_total' => (string) $paidTotal,
            'balance_due' => (string) $balanceDue,
            'status' => $this->resolveSettlementStatus($document, $balanceDue),
            'version' => $document->version + 1,
        ]);
    }

    private function resolveSettlementStatus(Document $document, BigDecimal $balanceDue): string
    {
        if ($balanceDue->isEqualTo(BigDecimal::zero())) {
            return BigDecimal::of((string) $document->credited_total)->isGreaterThanOrEqualTo(BigDecimal::of((string) $document->grand_total))
                ? 'credited'
                : 'paid';
        }

        return BigDecimal::of((string) $document->credited_total)->isGreaterThan(BigDecimal::zero())
            ? 'partially_credited'
            : 'partially_paid';
    }
}