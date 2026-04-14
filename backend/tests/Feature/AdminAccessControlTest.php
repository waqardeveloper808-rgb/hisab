<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_plan_permissions_distinguish_view_and_manage(): void
    {
        $superAdmin = User::factory()->create([
            'platform_role' => 'super_admin',
            'is_platform_active' => true,
        ]);

        $supportUser = User::factory()->create([
            'platform_role' => 'support',
            'is_platform_active' => true,
        ]);

        $payload = [
            'code' => 'support-view-test',
            'name' => 'Support View Test',
            'description' => 'Plan created in access-control test.',
            'monthly_price_sar' => 55,
            'annual_price_sar' => 550,
            'trial_days' => 14,
            'invoice_limit' => 100,
            'customer_limit' => 100,
            'accountant_seat_limit' => 2,
            'feature_flags' => ['invoice_creation' => true],
            'marketing_points' => ['Test point'],
            'is_visible' => true,
            'is_free' => false,
            'is_paid' => true,
            'is_active' => true,
            'sort_order' => 99,
        ];

        $this->actingAs($superAdmin)
            ->postJson('/api/platform/plans', $payload)
            ->assertCreated()
            ->assertJsonPath('data.code', 'support-view-test');

        $this->actingAs($supportUser)
            ->getJson('/api/platform/plans')
            ->assertOk()
            ->assertJsonFragment(['code' => 'support-view-test']);

        $this->actingAs($supportUser)
            ->postJson('/api/platform/plans', array_merge($payload, ['code' => 'support-cannot-create']))
            ->assertForbidden();
    }

    public function test_access_profile_returns_owner_membership_and_company_abilities(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Access Profile Co',
        ])->json('data.id');

        $this->getJson("/api/companies/{$companyId}/access-profile")
            ->assertOk()
            ->assertJsonPath('data.user.id', $owner->id)
            ->assertJsonPath('data.membership.role', 'owner')
            ->assertJsonPath('data.membership.abilities.0', '*')
            ->assertJsonPath('data.company.legal_name', 'Access Profile Co');
    }

    public function test_company_user_management_enforces_accountant_seat_limits_and_permissions(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Seat Limit Co',
        ])->json('data.id');

        $plan = SubscriptionPlan::query()->create([
            'code' => 'seat-limit-plan',
            'name' => 'Seat Limit Plan',
            'description' => 'Limits active accountant seats to one.',
            'monthly_price_sar' => 40,
            'annual_price_sar' => 400,
            'trial_days' => 14,
            'invoice_limit' => null,
            'customer_limit' => null,
            'accountant_seat_limit' => 1,
            'feature_flags' => ['invoice_creation' => true],
            'marketing_points' => ['Seat limit'],
            'is_visible' => true,
            'is_free' => false,
            'is_paid' => true,
            'is_active' => true,
            'sort_order' => 10,
        ]);

        Subscription::query()->create([
            'user_id' => $owner->id,
            'company_id' => $companyId,
            'plan_id' => $plan->id,
            'plan_code' => $plan->code,
            'plan_name' => $plan->name,
            'status' => 'active',
            'monthly_price_sar' => 40,
            'trial_days' => 14,
            'free_invoice_limit' => 0,
            'started_at' => now(),
            'activated_at' => now(),
        ]);

        $firstAccountantResponse = $this->postJson("/api/companies/{$companyId}/users", [
            'name' => 'First Accountant',
            'email' => 'first-accountant@example.com',
            'password' => 'password123',
            'role' => 'accountant',
            'permissions' => ['workspace.sales.manage'],
            'is_active' => true,
        ]);

        $firstAccountantResponse->assertCreated()
            ->assertJsonPath('data.role', 'accountant');

        $this->postJson("/api/companies/{$companyId}/users", [
            'name' => 'Second Accountant',
            'email' => 'second-accountant@example.com',
            'password' => 'password123',
            'role' => 'accountant',
            'permissions' => ['workspace.sales.manage'],
            'is_active' => true,
        ])->assertStatus(422);

        $accountant = User::query()->findOrFail($firstAccountantResponse->json('data.id'));

        $this->actingAs($accountant)
            ->getJson("/api/companies/{$companyId}/users")
            ->assertForbidden();
    }
}