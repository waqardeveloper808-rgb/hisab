<?php

namespace Database\Seeders;

use App\Accounting\Services\BalanceService;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\InventoryItem;
use App\Models\Item;
use App\Models\Payment;
use App\Models\TaxCategory;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\LedgerService;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SessionBHardeningSeeder extends Seeder
{
    public function run(): void
    {
        $companyId = (int) (env('SESSIONB_COMPANY_ID', 2));
        $company = Company::with('settings')->findOrFail($companyId);
        $settings = $company->settings()->firstOrFail();

        $user = User::query()->updateOrCreate(
            ['email' => 'sessionb.seed@gulfhisab.local'],
            ['name' => 'Session B Seeder', 'password' => bcrypt('Test@12345')],
        );

        $defaultTax = TaxCategory::query()
            ->where('company_id', $company->id)
            ->where('is_default_sales', true)
            ->first()
            ?? TaxCategory::query()->where('company_id', $company->id)->firstOrFail();

        $customer = Contact::query()->updateOrCreate(
            ['company_id' => $company->id, 'display_name' => 'Session B Customer'],
            [
                'type' => 'customer',
                'tax_number' => '301234567890003',
                'origin_country_code' => 'KSA',
                'billing_address' => ['country' => 'KSA', 'city' => 'Riyadh'],
                'is_active' => true,
            ],
        );

        $supplier = Contact::query()->updateOrCreate(
            ['company_id' => $company->id, 'display_name' => 'Session B Supplier'],
            [
                'type' => 'supplier',
                'tax_number' => '301234567890004',
                'origin_country_code' => 'KSA',
                'billing_address' => ['country' => 'KSA', 'city' => 'Dammam'],
                'is_active' => true,
            ],
        );

        /** @var InventoryService $inventoryService */
        $inventoryService = app(InventoryService::class);
        /** @var LedgerService $ledgerService */
        $ledgerService = app(LedgerService::class);
        /** @var BalanceService $balanceService */
        $balanceService = app(BalanceService::class);

        $items = [];
        for ($i = 1; $i <= 10; $i++) {
            $item = Item::query()->updateOrCreate(
                ['company_id' => $company->id, 'sku' => sprintf('SBH-PROD-%02d', $i)],
                [
                    'uuid' => (string) Str::uuid(),
                    'type' => 'product',
                    'name' => sprintf('SessionB Product %02d', $i),
                    'tax_category_id' => $defaultTax->id,
                    'income_account_id' => $this->accountIdByCode($company->id, $settings->default_revenue_account_code),
                    'expense_account_id' => $this->accountIdByCode($company->id, $settings->default_expense_account_code),
                    'inventory_account_id' => $this->accountIdByCode($company->id, '1150'),
                    'cogs_account_id' => $this->accountIdByCode($company->id, '5000'),
                    'default_sale_price' => number_format(150 + ($i * 10), 2, '.', ''),
                    'default_purchase_price' => number_format(90 + ($i * 6), 2, '.', ''),
                    'is_active' => true,
                ],
            );
            $items[] = $item;

            $inventory = InventoryItem::query()
                ->where('company_id', $company->id)
                ->where('item_id', $item->id)
                ->first();

            if (! $inventory) {
                $inventoryService->createReceipt($company, $user, [
                    'item_id' => $item->id,
                    'product_name' => $item->name,
                    'inventory_type' => 'finished_goods',
                    'source' => 'purchase',
                    'code' => sprintf('SBH-STOCK-%02d', $i),
                    'quantity_on_hand' => '100.00',
                    'unit_cost' => (string) $item->default_purchase_price,
                    'inventory_account_code' => '1150',
                    'revenue_account_code' => $settings->default_revenue_account_code,
                    'cogs_account_code' => '5000',
                    'offset_account_code' => $settings->default_payable_account_code,
                    'transaction_date' => now()->subDays(12)->toDateString(),
                    'reference' => sprintf('SBH-OPEN-%02d', $i),
                ]);
            }
        }

        for ($i = 1; $i <= 10; $i++) {
            $item = $items[$i - 1];
            $quantity = BigDecimal::of('2');
            $unitPrice = BigDecimal::of((string) $item->default_sale_price)->toScale(2, RoundingMode::HALF_UP);
            $net = $quantity->multipliedBy($unitPrice)->toScale(2, RoundingMode::HALF_UP);
            $tax = $net->multipliedBy('0.15')->toScale(2, RoundingMode::HALF_UP);
            $gross = $net->plus($tax)->toScale(2, RoundingMode::HALF_UP);
            $docNumber = sprintf('SBH-INV-%03d', $i);

            $invoice = Document::query()->firstOrCreate(
                ['company_id' => $company->id, 'document_number' => $docNumber],
                [
                    'uuid' => (string) Str::uuid(),
                    'branch_id' => $settings->default_branch_id,
                    'contact_id' => $customer->id,
                    'type' => 'tax_invoice',
                    'status' => 'finalized',
                    'sequence_number' => $i,
                    'currency_code' => $company->base_currency,
                    'exchange_rate' => 1,
                    'issue_date' => now()->subDays(10 - $i)->toDateString(),
                    'supply_date' => now()->subDays(10 - $i)->toDateString(),
                    'supply_location' => 'KSA',
                    'vat_applicability' => 'taxable',
                    'due_date' => now()->addDays(20)->toDateString(),
                    'subtotal' => (string) $net,
                    'discount_total' => '0.00',
                    'taxable_total' => (string) $net,
                    'tax_total' => (string) $tax,
                    'grand_total' => (string) $gross,
                    'paid_total' => '0.00',
                    'credited_total' => '0.00',
                    'balance_due' => (string) $gross,
                    'finalized_at' => now(),
                    'finalized_by' => $user->id,
                ],
            );

            if (! $invoice->lines()->exists()) {
                DocumentLine::query()->create([
                    'document_id' => $invoice->id,
                    'line_number' => 1,
                    'item_id' => $item->id,
                    'tax_category_id' => $defaultTax->id,
                    'ledger_account_id' => $this->accountIdByCode($company->id, $settings->default_revenue_account_code),
                    'description' => sprintf('Seeded sales line %02d', $i),
                    'quantity' => (string) $quantity,
                    'unit_price' => (string) $unitPrice,
                    'discount_amount' => '0.00',
                    'net_amount' => (string) $net,
                    'tax_rate' => '15.00',
                    'vat_type' => 'standard',
                    'tax_amount' => (string) $tax,
                    'gross_amount' => (string) $gross,
                    'metadata' => [
                        'vat_context' => [
                            'customer_origin' => 'KSA',
                            'supply_location' => 'KSA',
                            'vat_applicability' => 'taxable',
                        ],
                    ],
                ]);
            }

            if (! $invoice->posted_journal_entry_id) {
                $journal = $ledgerService->postSalesDocument($invoice->fresh());
                $invoice->update([
                    'posted_journal_entry_id' => $journal->id,
                    'posted_at' => now(),
                ]);
            }

            $inventory = InventoryItem::query()->where('company_id', $company->id)->where('item_id', $item->id)->first();
            if ($inventory) {
                $inventoryService->createSale($company, $user, [
                    'inventory_item_id' => $inventory->id,
                    'quantity' => '2.00',
                    'unit_price' => (string) $unitPrice,
                    'unit_cost' => (string) $item->default_purchase_price,
                    'tax_rate' => '15.00',
                    'transaction_date' => $invoice->issue_date?->toDateString() ?? now()->toDateString(),
                    'reference' => sprintf('SBH-SALE-%03d', $i),
                    'document_links' => [[
                        'documentId' => $invoice->id,
                        'documentNumber' => $invoice->document_number,
                        'documentType' => 'tax_invoice',
                    ]],
                ]);
            }
        }

        for ($i = 1; $i <= 5; $i++) {
            $invoice = Document::query()->where('company_id', $company->id)->where('document_number', sprintf('SBH-INV-%03d', $i))->first();
            if (! $invoice) {
                continue;
            }

            $paymentNumber = sprintf('SBH-PAY-%03d', $i);
            $payment = Payment::query()->firstOrCreate(
                ['company_id' => $company->id, 'payment_number' => $paymentNumber],
                [
                    'uuid' => (string) Str::uuid(),
                    'contact_id' => $customer->id,
                    'branch_id' => $settings->default_branch_id,
                    'received_into_account_id' => $this->accountIdByCode($company->id, $settings->default_cash_account_code),
                    'direction' => 'incoming',
                    'status' => 'posted',
                    'method' => 'bank_transfer',
                    'payment_date' => now()->subDays(2)->toDateString(),
                    'currency_code' => $company->base_currency,
                    'amount' => (string) $invoice->grand_total,
                    'allocated_total' => (string) $invoice->grand_total,
                    'unallocated_amount' => '0.00',
                    'created_by' => $user->id,
                    'posted_at' => now(),
                ],
            );

            if (! $payment->allocations()->where('document_id', $invoice->id)->exists()) {
                $payment->allocations()->create([
                    'document_id' => $invoice->id,
                    'amount' => (string) $invoice->grand_total,
                ]);
            }

            $hasPaymentJournal = \App\Models\JournalEntry::query()
                ->where('company_id', $company->id)
                ->where('source_type', 'payment')
                ->where('source_id', $payment->id)
                ->exists();

            if (! $hasPaymentJournal) {
                $ledgerService->postIncomingPayment(
                    $payment,
                    $customer->id,
                    (string) $invoice->grand_total,
                    '0.00',
                    '0.00',
                    [[
                        'document_id' => $invoice->id,
                        'amount' => (string) $invoice->grand_total,
                        'discount_allowed_amount' => '0.00',
                    ]],
                );
            }

            $balance = $balanceService->calculate([
                'invoices' => (string) $invoice->grand_total,
                'payments_received' => (string) $invoice->grand_total,
                'credit_notes' => (string) $invoice->credited_total,
                'debit_notes' => '0.00',
                'adjustments' => '0.00',
            ]);

            $invoice->update([
                'paid_total' => (string) $invoice->grand_total,
                'balance_due' => $balance['balance'],
                'status' => 'paid',
            ]);
        }

        for ($i = 1; $i <= 5; $i++) {
            $item = $items[$i - 1];
            $quantity = BigDecimal::of('3');
            $unitCost = BigDecimal::of((string) $item->default_purchase_price)->toScale(2, RoundingMode::HALF_UP);
            $net = $quantity->multipliedBy($unitCost)->toScale(2, RoundingMode::HALF_UP);
            $tax = $net->multipliedBy('0.15')->toScale(2, RoundingMode::HALF_UP);
            $gross = $net->plus($tax)->toScale(2, RoundingMode::HALF_UP);
            $docNumber = sprintf('SBH-BILL-%03d', $i);

            $bill = Document::query()->firstOrCreate(
                ['company_id' => $company->id, 'document_number' => $docNumber],
                [
                    'uuid' => (string) Str::uuid(),
                    'branch_id' => $settings->default_branch_id,
                    'contact_id' => $supplier->id,
                    'type' => 'vendor_bill',
                    'status' => 'finalized',
                    'sequence_number' => $i,
                    'currency_code' => $company->base_currency,
                    'exchange_rate' => 1,
                    'issue_date' => now()->subDays(5 - $i)->toDateString(),
                    'supply_date' => now()->subDays(5 - $i)->toDateString(),
                    'supply_location' => 'KSA',
                    'vat_applicability' => 'taxable',
                    'due_date' => now()->addDays(30)->toDateString(),
                    'subtotal' => (string) $net,
                    'discount_total' => '0.00',
                    'taxable_total' => (string) $net,
                    'tax_total' => (string) $tax,
                    'grand_total' => (string) $gross,
                    'paid_total' => '0.00',
                    'credited_total' => '0.00',
                    'balance_due' => (string) $gross,
                    'finalized_at' => now(),
                    'finalized_by' => $user->id,
                ],
            );

            if (! $bill->lines()->exists()) {
                DocumentLine::query()->create([
                    'document_id' => $bill->id,
                    'line_number' => 1,
                    'item_id' => $item->id,
                    'tax_category_id' => $defaultTax->id,
                    'ledger_account_id' => $this->accountIdByCode($company->id, $settings->default_expense_account_code),
                    'description' => sprintf('Seeded purchase line %02d', $i),
                    'quantity' => (string) $quantity,
                    'unit_price' => (string) $unitCost,
                    'discount_amount' => '0.00',
                    'net_amount' => (string) $net,
                    'tax_rate' => '15.00',
                    'vat_type' => 'standard',
                    'tax_amount' => (string) $tax,
                    'gross_amount' => (string) $gross,
                    'metadata' => [
                        'vat_context' => [
                            'customer_origin' => 'KSA',
                            'supply_location' => 'KSA',
                            'vat_applicability' => 'taxable',
                        ],
                    ],
                ]);
            }

            if (! $bill->posted_journal_entry_id) {
                $journal = $ledgerService->postPurchaseDocument($bill->fresh());
                $bill->update([
                    'posted_journal_entry_id' => $journal->id,
                    'posted_at' => now(),
                ]);
            }
        }
    }

    private function accountIdByCode(int $companyId, string $code): int
    {
        return (int) \App\Models\Account::query()
            ->where('company_id', $companyId)
            ->where('code', $code)
            ->value('id');
    }
}
