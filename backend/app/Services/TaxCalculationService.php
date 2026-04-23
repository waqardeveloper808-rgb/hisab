<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\CostCenter;
use App\Models\Item;
use App\Models\TaxCategory;
use App\Services\VAT\VATCalculationService;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TaxCalculationService
{
    public function __construct(private readonly VATCalculationService $vatCalculationService)
    {
    }

    public function calculate(Company $company, array $lines, string $context = 'sales'): array
    {
        $defaultTax = $company->taxCategories()->where($context === 'purchase' ? 'is_default_purchase' : 'is_default_sales', true)->first();

        $preparedLines = [];
        $subtotal = BigDecimal::zero();
        $discountTotal = BigDecimal::zero();
        $taxableTotal = BigDecimal::zero();
        $taxTotal = BigDecimal::zero();
        $grandTotal = BigDecimal::zero();

        foreach ($lines as $index => $line) {
            $item = isset($line['item_id']) ? Item::query()
                ->where('company_id', $company->id)
                ->findOrFail($line['item_id']) : null;

            $taxCategory = isset($line['tax_category_id'])
                ? TaxCategory::query()->where('company_id', $company->id)->findOrFail($line['tax_category_id'])
                : ($item?->taxCategory ?? $defaultTax);

            $ledgerAccount = null;
            if (! empty($line['ledger_account_id'])) {
                $ledgerAccount = Account::query()
                    ->where('company_id', $company->id)
                    ->findOrFail($line['ledger_account_id']);
            }

            $costCenter = null;
            if (! empty($line['cost_center_id'])) {
                $costCenter = CostCenter::query()
                    ->where('company_id', $company->id)
                    ->findOrFail($line['cost_center_id']);
            }

            $defaultAccountId = $context === 'purchase' ? $item?->expense_account_id : $item?->income_account_id;

            if (! $ledgerAccount && $defaultAccountId) {
                $ledgerAccount = Account::query()->where('company_id', $company->id)->find($defaultAccountId);
            }

            if (! $taxCategory) {
                throw ValidationException::withMessages([
                    "lines.$index.tax_category_id" => 'A tax category is required for each line.',
                ]);
            }

            if (! $ledgerAccount) {
                throw ValidationException::withMessages([
                    "lines.$index.ledger_account_id" => 'A ledger account is required for each line.',
                ]);
            }

            $this->validateLedgerAccount($ledgerAccount, $context, $index);

            $quantity = BigDecimal::of((string) ($line['quantity'] ?? '0'));
            $unitPrice = BigDecimal::of((string) ($line['unit_price'] ?? $item?->default_sale_price ?? '0'));
            $discount = BigDecimal::of((string) ($line['discount_amount'] ?? '0'));

            if ($quantity->isLessThanOrEqualTo(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    "lines.$index.quantity" => 'Quantity must be greater than zero.',
                ]);
            }

            if ($unitPrice->isLessThan(BigDecimal::zero()) || $discount->isLessThan(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    "lines.$index.unit_price" => 'Amounts must be zero or greater.',
                ]);
            }

            $vatDecision = $this->vatCalculationService->buildLineDecision(
                $company,
                $line,
                $context,
                $index,
                $taxCategory,
                $item,
                $ledgerAccount,
            );

            $lineSubtotal = $quantity->multipliedBy($unitPrice);
            $netAmount = $lineSubtotal->minus($discount);

            if ($netAmount->isLessThan(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    "lines.$index.discount_amount" => 'Discount cannot exceed the line amount.',
                ]);
            }

            $taxRate = BigDecimal::of((string) $taxCategory->rate);
            $vatType = strtolower((string) ($line['vat_type'] ?? ($taxRate->isGreaterThan(BigDecimal::zero()) ? 'standard' : ($taxCategory->scope === 'exempt' ? 'exempt' : 'zero'))));
            if (! in_array($vatType, ['standard', 'zero', 'exempt'], true)) {
                throw ValidationException::withMessages([
                    "lines.$index.vat_type" => 'VAT type must be one of: standard, zero, exempt.',
                ]);
            }

            if ($vatType !== 'standard' && $taxRate->isGreaterThan(BigDecimal::zero())) {
                throw ValidationException::withMessages([
                    "lines.$index.vat_type" => 'VAT type is inconsistent with a non-zero VAT rate.',
                ]);
            }

            if (($line['vat_override'] ?? false) === true) {
                Log::warning('vat.override_attempt', [
                    'company_id' => $company->id,
                    'line_index' => $index,
                    'context' => $context,
                    'line' => [
                        'vat_type' => $vatType,
                        'tax_rate' => (string) $taxRate,
                        'customer_origin' => $line['customer_origin'] ?? null,
                        'supply_location' => $line['supply_location'] ?? null,
                        'vat_applicability' => $line['vat_applicability'] ?? null,
                    ],
                ]);
            }

            $taxAmount = $netAmount->multipliedBy($taxRate)
                ->dividedBy('100', 2, RoundingMode::HALF_UP);
            $grossAmount = $netAmount->plus($taxAmount);

            $subtotal = $subtotal->plus($lineSubtotal);
            $discountTotal = $discountTotal->plus($discount);
            $taxableTotal = $taxableTotal->plus($netAmount);
            $taxTotal = $taxTotal->plus($taxAmount);
            $grandTotal = $grandTotal->plus($grossAmount);

            $preparedLines[] = [
                'line_number' => $index + 1,
                'item_id' => $item?->id,
                'tax_category_id' => $taxCategory->id,
                'ledger_account_id' => $ledgerAccount->id,
                'cost_center_id' => $costCenter?->id,
                'description' => $line['description'] ?? $item?->name ?? 'Line item',
                'quantity' => $this->decimal($quantity, 4),
                'unit_price' => $this->decimal($unitPrice, 4),
                'discount_amount' => $this->decimal($discount),
                'net_amount' => $this->decimal($netAmount),
                'tax_rate' => $this->decimal($taxRate),
                'vat_type' => $vatType,
                'tax_amount' => $this->decimal($taxAmount),
                'gross_amount' => $this->decimal($grossAmount),
                'metadata' => [
                    'tax_scope' => $taxCategory->scope,
                    'zatca_code' => $taxCategory->zatca_code,
                    'vat_decision' => $vatDecision,
                    'vat_context' => [
                        'customer_origin' => $line['customer_origin'] ?? null,
                        'supply_location' => $line['supply_location'] ?? null,
                        'vat_applicability' => $line['vat_applicability'] ?? null,
                    ],
                    'custom_fields' => $line['custom_fields'] ?? null,
                ],
            ];
        }

        return [
            'lines' => $preparedLines,
            'totals' => [
                'subtotal' => $this->decimal($subtotal),
                'discount_total' => $this->decimal($discountTotal),
                'taxable_total' => $this->decimal($taxableTotal),
                'tax_total' => $this->decimal($taxTotal),
                'grand_total' => $this->decimal($grandTotal),
                'paid_total' => '0.00',
                'balance_due' => $this->decimal($grandTotal),
            ],
        ];
    }

    private function validateLedgerAccount(Account $account, string $context, int $index): void
    {
        $allowedTypes = $context === 'purchase'
            ? ['expense', 'asset', 'cost_of_sales']
            : ['income', 'revenue', 'contra'];

        if (! in_array($account->type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                "lines.$index.ledger_account_id" => sprintf(
                    'Invalid account type %s for %s documents.',
                    $account->type,
                    $context
                ),
            ]);
        }
    }

    private function decimal(BigDecimal $value, int $scale = 2): string
    {
        return (string) $value->toScale($scale, RoundingMode::HALF_UP);
    }
}