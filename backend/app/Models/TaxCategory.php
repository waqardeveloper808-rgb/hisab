<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'scope',
        'rate',
        'zatca_code',
        'is_default_sales',
        'is_default_purchase',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'is_default_sales' => 'boolean',
        'is_default_purchase' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}