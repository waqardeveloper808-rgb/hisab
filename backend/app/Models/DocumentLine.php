<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'source_line_id',
        'line_number',
        'item_id',
        'tax_category_id',
        'ledger_account_id',
        'cost_center_id',
        'description',
        'quantity',
        'unit_price',
        'discount_amount',
        'net_amount',
        'tax_rate',
        'tax_amount',
        'gross_amount',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'discount_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }
}