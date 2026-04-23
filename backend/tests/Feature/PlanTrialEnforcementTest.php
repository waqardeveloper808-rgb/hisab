<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\TaxCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanTrialEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_tax_invoice_creation_is_blocked_after_invoicing_trial_window(): void
    {
        [$user, $companyId] = $this->createCompanyContext('Trial Lock Co');
        $company = Company::findOrFail($companyId);
        $contactId = $this->createCustomer($user, $companyId, 'Trial Locked Customer');
        [$itemId, $incomeAccountId, $taxCategoryId] = $this->createServiceItem($user, $companyId, $company);

        $subscription = $this->attachSubscription($company, $user->id);
        $subscription->update([
            'started_at' => now()->subDays(61),
        ]);
        $subscription->plan->update([
            'feature_flags' => [
                ...($subscription->plan->feature_flags ?? []),
                'invoicing_trial_days' => 60,
            ],
        ]);

        $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents", [
                'type' => 'tax_invoice',
                'contact_id' => $contactId,
                'issue_date' => '2026-04-18',
                'due_date' => '2026-04-25',
                'lines' => [[
                    'item_id' => $itemId,
                    'quantity' => 1,
                    'unit_price' => 100,
                    'tax_category_id' => $taxCategoryId,
                    'ledger_account_id' => $incomeAccountId,
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['plan']);
    }

    public function test_pdf_export_is_limited_after_accounting_trial_window(): void
    {
        [$user, $companyId] = $this->createCompanyContext('Accounting Print Lock Co');
        $company = Company::findOrFail($companyId);
        $contactId = $this->createCustomer($user, $companyId, 'Accounting Locked Customer');
        [$itemId, $incomeAccountId, $taxCategoryId] = $this->createServiceItem($user, $companyId, $company);

        $invoiceId = $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents", [
                'type' => 'tax_invoice',
                'contact_id' => $contactId,
                'issue_date' => '2026-04-18',
                'due_date' => '2026-04-25',
                'lines' => [[
                    'item_id' => $itemId,
                    'quantity' => 1,
                    'unit_price' => 100,
                    'tax_category_id' => $taxCategoryId,
                    'ledger_account_id' => $incomeAccountId,
                ]],
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($user)
            ->postJson("/api/companies/{$companyId}/sales-documents/{$invoiceId}/finalize")
            ->assertOk();

        $subscription = $this->attachSubscription($company, $user->id);
        $subscription->update([
            'started_at' => now()->subDays(121),
        ]);
        $subscription->plan->update([
            'feature_flags' => [
                ...($subscription->plan->feature_flags ?? []),
                'accounting_trial_days' => 120,
                'accounting_print_limit_per_day' => 1,
            ],
        ]);

        $this->actingAs($user)
            ->get("/api/companies/{$companyId}/documents/{$invoiceId}/export-pdf")
            ->assertOk();

        $this->actingAs($user)
            ->getJson("/api/companies/{$companyId}/documents/{$invoiceId}/export-pdf")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['plan']);
    }

    private function createCompanyContext(string $legalName): array
    {
        $user = User::factory()->create();
        $companyId = $this->actingAs($user)->postJson('/api/companies', [
            'legal_name' => $legalName,
            'trade_name' => $legalName,
            'tax_number' => '300000000000003',
        ])->assertCreated()->json('data.id');

        return [$user, $companyId];
    }

    private function createCustomer(User $user, int $companyId, string $name): int
    {
        return $this->actingAs($user)->postJson("/api/companies/{$companyId}/contacts", [
            'type' => 'customer',
            'display_name' => $name,
            'tax_number' => '300000000000010',
        ])->assertCreated()->json('data.id');
    }

    private function createServiceItem(User $user, int $companyId, Company $company): array
    {
        $taxCategoryId = TaxCategory::query()
            ->where('company_id', $companyId)
            ->where('code', 'VAT15')
            ->value('id');
        $incomeAccountId = $company->accounts()->where('code', '4000')->value('id');

        $itemId = $this->actingAs($user)->postJson("/api/companies/{$companyId}/items", [
            'type' => 'service',
            'name' => 'Plan Enforcement Service',
            'tax_category_id' => $taxCategoryId,
            'income_account_id' => $incomeAccountId,
            'default_sale_price' => 100,
        ])->assertCreated()->json('data.id');

        return [$itemId, $incomeAccountId, $taxCategoryId];
    }

    private function attachSubscription(Company $company, int $userId): Subscription
    {
        SubscriptionPlan::ensureDefaults();

        return Subscription::query()->create([
            'user_id' => $userId,
            'company_id' => $company->id,
            'plan_id' => SubscriptionPlan::query()->where('code', 'zatca-monthly')->value('id'),
            'plan_code' => 'zatca-monthly',
            'plan_name' => 'ZATCA Monthly',
            'status' => 'trialing',
            'monthly_price_sar' => 40,
            'trial_days' => 45,
            'free_invoice_limit' => 1,
            'started_at' => now(),
            'trial_ends_at' => now()->addDays(45),
        ])->fresh('plan');
    }
}