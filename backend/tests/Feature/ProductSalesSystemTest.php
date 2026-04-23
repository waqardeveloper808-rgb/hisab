<?php

namespace Tests\Feature;

use App\Models\Agent;
use App\Models\ProductSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductSalesSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_product_config_exposes_support_and_pricing(): void
    {
        ProductSetting::query()->create([
            'support_whatsapp_number' => '966512345678',
            'free_trial_days' => 45,
            'free_invoice_limit' => 1,
            'paid_plan_monthly_price_sar' => 40,
            'default_agent_commission_rate' => 20,
        ]);

        $this->getJson('/api/public/product-config')
            ->assertOk()
            ->assertJsonPath('data.support_whatsapp_number', '966512345678')
            ->assertJsonPath('data.free_trial_days', 45)
            ->assertJsonPath('data.paid_plan_monthly_price_sar', 40);
    }

    public function test_register_tracks_trial_subscription_and_agent_referral(): void
    {
        ProductSetting::current();
        $agentUser = User::factory()->create();
        $agent = Agent::query()->create([
            'user_id' => $agentUser->id,
            'referral_code' => 'AGENT-01',
            'commission_rate' => 20,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Huda Salem',
            'email' => 'huda@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'referral_code' => $agent->referral_code,
            'plan_code' => 'zatca-monthly',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'huda@example.com');

        $userId = $response->json('data.id');

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $userId,
            'status' => 'trialing',
            'plan_code' => 'zatca-monthly',
        ]);

        $this->assertDatabaseHas('agent_referrals', [
            'agent_id' => $agent->id,
            'referred_user_id' => $userId,
            'commission_status' => 'pending',
            'referral_code' => 'AGENT-01',
        ]);
    }

    public function test_agent_dashboard_returns_referral_summary(): void
    {
        ProductSetting::current();
        $user = User::factory()->create();
        $this->actingAs($user);

        $companyId = $this->postJson('/api/companies', [
            'legal_name' => 'Agent Company',
        ])->json('data.id');

        $referred = User::factory()->create([
            'name' => 'Referral User',
            'email' => 'referral@example.com',
        ]);

        $agent = Agent::query()->create([
            'user_id' => $user->id,
            'referral_code' => 'SELL-1234',
            'commission_rate' => 20,
            'is_active' => true,
        ]);

        $subscriptionId = \App\Models\Subscription::query()->create([
            'user_id' => $referred->id,
            'plan_code' => 'zatca-monthly',
            'plan_name' => 'ZATCA Monthly',
            'status' => 'trialing',
            'monthly_price_sar' => 40,
            'trial_days' => 45,
            'free_invoice_limit' => 1,
            'started_at' => now(),
            'trial_ends_at' => now()->addDays(45),
        ])->id;

        \App\Models\AgentReferral::query()->create([
            'agent_id' => $agent->id,
            'referred_user_id' => $referred->id,
            'subscription_id' => $subscriptionId,
            'referral_code' => 'SELL-1234',
            'commission_rate' => 20,
            'commission_amount' => 8,
            'commission_status' => 'pending',
            'signed_up_at' => now(),
        ]);

        $this->getJson("/api/companies/{$companyId}/agents/dashboard")
            ->assertOk()
            ->assertJsonPath('data.agent.referral_code', 'SELL-1234')
            ->assertJsonPath('data.summary.total_referrals', 1)
            ->assertJsonPath('data.summary.pending_commission', 8)
            ->assertJsonPath('data.referrals.0.email', 'referral@example.com');
    }
}