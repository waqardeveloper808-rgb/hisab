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

        $vatApplicability = strtolower((string) ($decision['vat_applicability'] ?? 'taxable'));
        if ($vatApplicability === 'not_applicable' && (float) ($decision['rate'] ?? 0) > 0.0) {
            throw ValidationException::withMessages([
                "lines.$index.vat_applicability" => 'VAT applicability is invalid for a non-zero VAT rate.',
            ]);
        }

        $classification = (string) ($decision['classification'] ?? '');
        if ($classification === 'output_vat_due' && (float) ($decision['rate'] ?? 0) <= 0.0) {
            throw ValidationException::withMessages([
                "lines.$index.tax_category_id" => 'Output VAT classification requires a positive VAT rate.',
            ]);
        }
    }
}