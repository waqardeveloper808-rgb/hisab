<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentReferral extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'referred_user_id',
        'subscription_id',
        'referral_code',
        'commission_rate',
        'commission_amount',
        'commission_status',
        'signed_up_at',
        'subscribed_at',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'signed_up_at' => 'datetime',
        'subscribed_at' => 'datetime',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}