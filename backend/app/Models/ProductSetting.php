<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'support_display_name',
        'support_whatsapp_number',
        'support_email',
        'free_trial_days',
        'free_invoice_limit',
        'paid_plan_monthly_price_sar',
        'default_agent_commission_rate',
    ];

    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'support_display_name' => 'Gulf Hisab Support',
            'support_whatsapp_number' => '966500000000',
            'support_email' => 'support@gulfhisab.sa',
            'free_trial_days' => 45,
            'free_invoice_limit' => 1,
            'paid_plan_monthly_price_sar' => 40,
            'default_agent_commission_rate' => 20,
        ]);
    }
}