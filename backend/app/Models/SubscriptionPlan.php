<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'monthly_price_sar',
        'annual_price_sar',
        'trial_days',
        'invoice_limit',
        'customer_limit',
        'accountant_seat_limit',
        'feature_flags',
        'marketing_points',
        'is_visible',
        'is_free',
        'is_paid',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'monthly_price_sar' => 'decimal:2',
        'annual_price_sar' => 'decimal:2',
        'feature_flags' => 'array',
        'marketing_points' => 'array',
        'is_visible' => 'boolean',
        'is_free' => 'boolean',
        'is_paid' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public static function ensureDefaults(): void
    {
        if (static::query()->exists()) {
            return;
        }

        foreach (self::defaultPlans() as $plan) {
            static::query()->create($plan);
        }
    }

    public static function resolveForSignup(?string $planCode = null): self
    {
        static::ensureDefaults();

        if ($planCode) {
            $plan = static::query()
                ->where('code', $planCode)
                ->where('is_active', true)
                ->first();

            if ($plan) {
                return $plan;
            }
        }

        return static::query()
            ->where('code', 'zatca-monthly')
            ->firstOrFail();
    }

    public static function defaultPlans(): array
    {
        return [
            [
                'code' => 'free',
                'name' => 'Free',
                'description' => 'For very small businesses that only need one invoice each month.',
                'monthly_price_sar' => 0,
                'annual_price_sar' => 0,
                'trial_days' => 0,
                'invoice_limit' => 1,
                'customer_limit' => 25,
                'accountant_seat_limit' => 1,
                'feature_flags' => [
                    'invoice_creation' => true,
                    'vat_reports' => true,
                    'whatsapp_support' => true,
                    'agent_dashboard' => false,
                ],
                'marketing_points' => [
                    '1 invoice per month',
                    'Basic ZATCA-ready invoice',
                    'WhatsApp support access',
                ],
                'is_visible' => true,
                'is_free' => true,
                'is_paid' => false,
                'is_active' => true,
                'sort_order' => 10,
            ],
            [
                'code' => 'trial',
                'name' => '45-Day Trial',
                'description' => 'Try the full invoicing workflow before switching to the paid plan.',
                'monthly_price_sar' => 0,
                'annual_price_sar' => 0,
                'trial_days' => 45,
                'invoice_limit' => null,
                'customer_limit' => null,
                'accountant_seat_limit' => 3,
                'feature_flags' => [
                    'invoice_creation' => true,
                    'vat_reports' => true,
                    'whatsapp_support' => true,
                    'agent_dashboard' => true,
                ],
                'marketing_points' => [
                    '45 days of full access',
                    'VAT reports and registers',
                    'WhatsApp support and onboarding',
                ],
                'is_visible' => true,
                'is_free' => true,
                'is_paid' => false,
                'is_active' => true,
                'sort_order' => 20,
            ],
            [
                'code' => 'zatca-monthly',
                'name' => 'ZATCA Monthly',
                'description' => 'A simple monthly plan for businesses that need regular invoicing and compliance support.',
                'monthly_price_sar' => 40,
                'annual_price_sar' => 400,
                'trial_days' => 45,
                'invoice_limit' => null,
                'customer_limit' => null,
                'accountant_seat_limit' => 10,
                'feature_flags' => [
                    'invoice_creation' => true,
                    'vat_reports' => true,
                    'whatsapp_support' => true,
                    'agent_dashboard' => true,
                ],
                'marketing_points' => [
                    'Unlimited invoicing flow',
                    'VAT reports and business summaries',
                    'Agent referral and WhatsApp support ready',
                ],
                'is_visible' => true,
                'is_free' => false,
                'is_paid' => true,
                'is_active' => true,
                'sort_order' => 30,
            ],
        ];
    }
}