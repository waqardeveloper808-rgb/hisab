<?php

namespace App\Services\VAT;

use App\Models\Account;
use App\Models\Company;
use App\Models\Item;
use App\Models\TaxCategory;

class VATCalculationService
{
    public function __construct(
        private readonly VATDecisionEngine $decisionEngine,
        private readonly VATValidator $validator,
    ) {
    }

    public function buildLineDecision(
        Company $company,
        array $line,
        string $context,
        int $index,
        ?TaxCategory $taxCategory,
        ?Item $item,
        ?Account $ledgerAccount,
    ): array {
        $decision = $this->decisionEngine->decide($company, $line, $context, $taxCategory, $item, $ledgerAccount);
        $this->validator->validate($decision, $taxCategory, $ledgerAccount, $index);

        return $decision;
    }
}