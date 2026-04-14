<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_id',
        'plan_id',
        'plan_code',
        'plan_name',
        'status',
        'monthly_price_sar',
        'trial_days',
        'free_invoice_limit',
        'started_at',
        'trial_ends_at',
        'activated_at',
        'cancelled_at',
    ];

    protected $casts = [
        'monthly_price_sar' => 'decimal:2',
        'started_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'activated_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(AgentReferral::class);
    }
}