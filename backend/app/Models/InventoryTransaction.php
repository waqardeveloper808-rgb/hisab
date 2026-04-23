<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'inventory_item_id',
        'journal_entry_id',
        'transaction_type',
        'reference',
        'transaction_date',
        'quantity_delta',
        'unit_cost',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'reason',
        'status',
        'attachments',
        'document_links',
        'metadata',
        'recorded_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'quantity_delta' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'attachments' => 'array',
        'document_links' => 'array',
        'metadata' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}