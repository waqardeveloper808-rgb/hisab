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
        'commercial_registration_number',
        'opening_balance',
        'opening_balance_type',
        'opening_balance_as_of',
        'email',
        'phone',
        'billing_address',
        'currency_code',
        'origin_country_code',
        'payment_term_id',
        'is_active',
    ];

    protected $casts = [
        'billing_address' => 'array',
        'is_active' => 'boolean',
        'opening_balance' => 'decimal:2',
        'opening_balance_as_of' => 'date',
    ];

    /**
     * Date-only columns must serialize as Y-m-d in JSON (no UTC shifting for calendar dates).
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        if ($this->opening_balance_as_of !== null) {
            $d = $this->opening_balance_as_of;
            $array['opening_balance_as_of'] = $d instanceof \Carbon\CarbonInterface ? $d->format('Y-m-d') : (string) $d;
        }

        return $array;
    }

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