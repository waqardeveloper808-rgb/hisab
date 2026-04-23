<?php

namespace App\Services\VAT;

use App\Models\Account;
use App\Models\TaxCategory;
use Illuminate\Validation\ValidationException;

class VATValidator
{
    public function validate(array $decision, ?TaxCategory $taxCategory, ?Account $ledgerAccount, int $index): void
    {
        if (! $taxCategory) {
            throw ValidationException::withMessages([
                "lines.$index.tax_category_id" => 'A VAT decision cannot be made without a tax category.',
            ]);
        }

        if (($decision['classification'] ?? null) === 'input_vat_recoverable' && ! $ledgerAccount) {
            throw ValidationException::withMessages([
                "lines.$index.ledger_account_id" => 'A recoverable VAT line requires a ledger account.',
            ]);
        }

        if (($decision['rate'] ?? 0) < 0) {
            throw ValidationException::withMessages([
                "lines.$index.tax_category_id" => 'VAT rate cannot be negative.',
            ]);
        }
    }
}