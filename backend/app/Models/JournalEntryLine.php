<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JournalEntryLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_entry_id',
        'line_no',
        'account_id',
        'contact_id',
        'document_id',
        'inventory_item_id',
        'cost_center_id',
        'branch_id',
        'description',
        'debit',
        'credit',
        'tax_code',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'inventory_item_id');
    }

    public function matchedStatementLine(): HasOne
    {
        return $this->hasOne(BankStatementLine::class, 'matched_journal_line_id');
    }
}