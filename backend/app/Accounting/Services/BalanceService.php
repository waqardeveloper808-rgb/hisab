<?php

namespace App\Accounting\Services;

use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;

class BalanceService
{
    public function calculate(array $components): array
    {
        $invoices = $this->decimal($components['invoices'] ?? '0');
        $paymentsReceived = $this->decimal($components['payments_received'] ?? '0');
        $creditNotes = $this->decimal($components['credit_notes'] ?? '0');
        $debitNotes = $this->decimal($components['debit_notes'] ?? '0');
        $adjustments = $this->decimal($components['adjustments'] ?? '0');

        $balance = $invoices
            ->minus($paymentsReceived)
            ->minus($creditNotes)
            ->plus($debitNotes)
            ->plus($adjustments)
            ->toScale(2, RoundingMode::HALF_UP);

        return [
            'invoices' => (string) $invoices->toScale(2, RoundingMode::HALF_UP),
            'payments_received' => (string) $paymentsReceived->toScale(2, RoundingMode::HALF_UP),
            'credit_notes' => (string) $creditNotes->toScale(2, RoundingMode::HALF_UP),
            'debit_notes' => (string) $debitNotes->toScale(2, RoundingMode::HALF_UP),
            'adjustments' => (string) $adjustments->toScale(2, RoundingMode::HALF_UP),
            'balance' => (string) $balance,
        ];
    }

    private function decimal(string|int|float $value): BigDecimal
    {
        return BigDecimal::of((string) $value)->toScale(2, RoundingMode::HALF_UP);
    }
}
