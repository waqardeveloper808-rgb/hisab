<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'item_id',
        'inventory_account_id',
        'revenue_account_id',
        'cogs_account_id',
        'last_journal_entry_id',
        'product_name',
        'material',
        'inventory_type',
        'size',
        'source',
        'code',
        'quantity_on_hand',
        'committed_quantity',
        'reorder_level',
        'batch_number',
        'production_date',
        'average_unit_cost',
        'attachments',
        'document_links',
        'recorded_by',
    ];

    protected $casts = [
        'quantity_on_hand' => 'decimal:2',
        'committed_quantity' => 'decimal:2',
        'reorder_level' => 'decimal:2',
        'average_unit_cost' => 'decimal:2',
        'production_date' => 'date',
        'attachments' => 'array',
        'document_links' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function inventoryAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'inventory_account_id');
    }

    public function revenueAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'revenue_account_id');
    }

    public function cogsAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cogs_account_id');
    }

    public function lastJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'last_journal_entry_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class);
    }
}