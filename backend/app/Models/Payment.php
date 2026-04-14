<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'contact_id',
        'branch_id',
        'received_into_account_id',
        'direction',
        'status',
        'payment_number',
        'method',
        'reference',
        'payment_date',
        'currency_code',
        'amount',
        'allocated_total',
        'unallocated_amount',
        'notes',
        'created_by',
        'posted_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
        'allocated_total' => 'decimal:2',
        'unallocated_amount' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $payment): void {
            if (! $payment->uuid) {
                $payment->uuid = (string) Str::uuid();
            }
        });
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }
}