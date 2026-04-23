<?php

namespace App\Services\VAT;

use App\Models\Account;
use App\Models\Company;
use App\Models\Item;
use App\Models\TaxCategory;

class VATDecisionEngine
{
    public function decide(
        Company $company,
        array $line,
        string $context,
        ?TaxCategory $taxCategory,
        ?Item $item,
        ?Account $ledgerAccount,
    ): array {
        $rate = (float) ($taxCategory?->rate ?? 0);
        $scope = (string) ($taxCategory?->scope ?? 'taxable');
        $country = strtolower((string) $company->country_code ?: (string) $company->locale);
        $customerOrigin = strtoupper((string) ($line['customer_origin'] ?? 'KSA'));
        $supplyLocation = strtoupper((string) ($line['supply_location'] ?? 'KSA'));
        $vatApplicability = strtolower((string) ($line['vat_applicability'] ?? 'taxable'));
        $classification = 'standard_rated';
        $reason = 'Standard VAT treatment applied from the selected tax category.';
        $confidence = 82;

        if ($scope === 'out_of_scope') {
            $classification = 'out_of_scope';
            $reason = 'Tax category marks this line as out of scope.';
            $confidence = 96;
        } elseif ($scope === 'exempt' || $rate === 0.0) {
            $classification = 'zero_or_exempt';
            $reason = $scope === 'exempt'
                ? 'Tax category marks this line as VAT exempt.'
                : 'Tax category rate is zero for this line.';
            $confidence = 92;
        } elseif ($context === 'purchase' && $ledgerAccount && in_array($ledgerAccount->type, ['asset', 'cost_of_sales'], true)) {
            $classification = 'input_vat_recoverable';
            $reason = 'Purchase-side VAT is attached to a recoverable asset or cost line.';
            $confidence = 88;
        } elseif ($context === 'sales') {
            $classification = 'output_vat_due';
            $reason = 'Sales-side VAT will become output tax when the document is finalized.';
            $confidence = 88;
        }

        if ($item && $item->type === 'service' && $context === 'purchase') {
            $confidence += 4;
        }

        if ($vatApplicability === 'not_applicable') {
            $classification = 'out_of_scope';
            $reason = 'VAT applicability explicitly marks this line as not applicable.';
            $confidence = 99;
        } elseif ($customerOrigin !== 'KSA' || $supplyLocation !== 'KSA') {
            $reason .= ' Cross-border context detected; VAT retained based on applicability and tax category, not origin alone.';
            $confidence = min(100, $confidence + 6);
        }

        if (str_contains($country, 'fr')) {
            $reason .= ' Country-aware hooks remain compatible with France expansion.';
        }

        return [
            'classification' => $classification,
            'scope' => $scope,
            'rate' => round($rate, 2),
            'customer_origin' => $customerOrigin,
            'supply_location' => $supplyLocation,
            'vat_applicability' => $vatApplicability,
            'reason' => $reason,
            'confidence' => max(0, min(100, $confidence)),
            'report_bucket' => $context === 'purchase' ? 'input_vat' : 'output_vat',
        ];
    }
}