<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\Document;
use App\Models\JournalEntry;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class AccountingAccountGuardService
{
    public function allowedAccountsForDocumentType(Company $company, string $documentType, string $lineContext): Collection
    {
        $documentType = strtolower(trim($documentType));
        $lineContext = strtolower(trim($lineContext));

        $allowedTypes = match ($documentType) {
            'tax_invoice', 'cash_invoice', 'api_invoice' => $lineContext === 'inventory'
                ? ['income', 'revenue', 'contra', 'asset', 'cost_of_sales']
                : ['income', 'revenue', 'contra'],
            'credit_note' => ['income', 'revenue', 'contra', 'asset'],
            'debit_note' => ['income', 'revenue', 'contra', 'asset'],
            'purchase_invoice', 'vendor_bill' => ['expense', 'asset', 'cost_of_sales', 'liability'],
            'purchase_order' => ['expense', 'asset', 'cost_of_sales', 'liability'],
            'delivery_note' => ['income', 'revenue', 'contra', 'asset'],
            default => ['income', 'revenue', 'contra', 'expense', 'asset', 'cost_of_sales', 'liability'],
        };

        return Account::query()
            ->where('company_id', $company->id)
            ->where('allows_posting', true)
            ->where('is_active', true)
            ->whereIn('type', $allowedTypes)
            ->orderBy('code')
            ->get();
    }

    public function validateDocumentLineAccount(Company $company, string $documentType, Account $account, int $lineIndex): void
    {
        $documentType = strtolower(trim($documentType));
        $lineContext = match ($documentType) {
            'purchase_invoice', 'vendor_bill', 'purchase_order' => 'purchase',
            'delivery_note' => 'inventory',
            default => 'sales',
        };

        $allowedTypes = $this->allowedAccountsForDocumentType($company, $documentType, $lineContext)
            ->pluck('type')
            ->unique()
            ->values()
            ->all();

        if (! in_array($account->type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                "lines.$lineIndex.account_id" => sprintf(
                    'Account %s is not allowed for %s lines.',
                    $account->code,
                    $documentType,
                ),
            ]);
        }

        if (in_array($documentType, ['tax_invoice', 'cash_invoice', 'api_invoice'], true)) {
            if (in_array($account->type, ['expense', 'cost_of_sales', 'liability'], true)) {
                throw ValidationException::withMessages([
                    "lines.$lineIndex.account_id" => sprintf(
                        'Account %s cannot be used on sales documents.',
                        $account->code,
                    ),
                ]);
            }
        }

        if (in_array($documentType, ['purchase_invoice', 'vendor_bill', 'purchase_order'], true)) {
            if (in_array($account->type, ['income', 'revenue'], true)) {
                throw ValidationException::withMessages([
                    "lines.$lineIndex.account_id" => sprintf(
                        'Account %s cannot be used on purchase documents.',
                        $account->code,
                    ),
                ]);
            }
        }
    }

    public function validateManualJournalLine(Company $company, array $line, array $allLines, string $sourceContext): void
    {
        $account = Account::query()
            ->where('company_id', $company->id)
            ->whereKey($line['account_id'] ?? 0)
            ->first();

        if (! $account) {
            throw ValidationException::withMessages([
                'lines' => 'Referenced account was not found.',
            ]);
        }

        if (! $account->allows_posting || ! $account->is_active) {
            throw ValidationException::withMessages([
                'lines' => sprintf('Account %s cannot be posted to.', $account->code),
            ]);
        }

        $controlledTypes = ['accounts_receivable', 'accounts_payable', 'vat_payable', 'vat_receivable', 'inventory_asset', 'cost_of_sales', 'customer_advance', 'supplier_advance'];
        $hasReference = filled($line['document_id'] ?? null)
            || filled($line['reference'] ?? null)
            || filled($line['source_document_id'] ?? null)
            || filled($line['memo'] ?? null);

        if (in_array($account->type, $controlledTypes, true)) {
            if (! $hasReference) {
                throw ValidationException::withMessages([
                    'lines' => sprintf(
                        'Controlled account %s requires a document reference or adjustment context.',
                        $account->code,
                    ),
                ]);
            }

            if (! in_array($sourceContext, ['document_adjustment', 'audit_adjustment', 'reversal', 'opening_balance'], true)) {
                throw ValidationException::withMessages([
                    'lines' => sprintf(
                        'Controlled account %s cannot be posted directly from %s.',
                        $account->code,
                        $sourceContext,
                    ),
                ]);
            }
        }

        $debit = (float) ($line['debit'] ?? 0);
        $credit = (float) ($line['credit'] ?? 0);
        if ($debit <= 0 && $credit <= 0) {
            throw ValidationException::withMessages([
                'lines' => 'Each journal line must contain either a debit or a credit amount.',
            ]);
        }

        if ($debit > 0 && $credit > 0) {
            throw ValidationException::withMessages([
                'lines' => 'A journal line cannot contain both debit and credit amounts.',
            ]);
        }
    }

    public function validatePostingPropagation(Document $document): void
    {
        $journal = $document->postedJournalEntry()
            ->with('lines')
            ->first();

        if (! $journal instanceof JournalEntry) {
            throw ValidationException::withMessages([
                'posted_journal_entry_id' => sprintf('Document %s does not have a posted journal entry.', $document->document_number ?? $document->id),
            ]);
        }

        if ($journal->lines->isEmpty()) {
            throw ValidationException::withMessages([
                'posted_journal_entry_id' => sprintf('Journal entry %s has no lines.', $journal->entry_number),
            ]);
        }
    }
}
