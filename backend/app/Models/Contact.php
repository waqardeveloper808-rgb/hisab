<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'type',
        'display_name',
        'legal_name',
        'tax_number',
        'email',
        'phone',
        'billing_address',
        'currency_code',
        'payment_term_id',
        'is_active',
    ];

    protected $casts = [
        'billing_address' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $contact): void {
            if (! $contact->uuid) {
                $contact->uuid = (string) Str::uuid();
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function paymentTerm(): BelongsTo
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class);
    }
}