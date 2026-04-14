<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'referral_code',
        'commission_rate',
        'is_active',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(AgentReferral::class);
    }
}