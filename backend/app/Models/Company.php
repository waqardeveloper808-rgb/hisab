<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'legal_name',
        'trade_name',
        'tax_number',
        'registration_number',
        'country_code',
        'base_currency',
        'locale',
        'timezone',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $company): void {
            if (! $company->uuid) {
                $company->uuid = (string) Str::uuid();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['role', 'permissions', 'is_active', 'joined_at'])
            ->withTimestamps();
    }

    public function settings(): HasOne
    {
        return $this->hasOne(CompanySetting::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function taxCategories(): HasMany
    {
        return $this->hasMany(TaxCategory::class);
    }

    public function paymentTerms(): HasMany
    {
        return $this->hasMany(PaymentTerm::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function documentSequences(): HasMany
    {
        return $this->hasMany(DocumentSequence::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function accountingPeriods(): HasMany
    {
        return $this->hasMany(AccountingPeriod::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function documentTemplates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class);
    }

    public function companyAssets(): HasMany
    {
        return $this->hasMany(CompanyAsset::class);
    }

    public function customFieldDefinitions(): HasMany
    {
        return $this->hasMany(CustomFieldDefinition::class);
    }

    public function costCenters(): HasMany
    {
        return $this->hasMany(CostCenter::class);
    }
}