<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankStatementLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'bank_account_id',
        'transaction_date',
        'value_date',
        'reference',
        'description',
        'debit',
        'credit',
        'running_balance',
        'status',
        'matched_journal_line_id',
        'reconciled_at',
        'notes',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'value_date' => 'date',
        'reconciled_at' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'running_balance' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'bank_account_id');
    }

    public function matchedJournalLine(): BelongsTo
    {
        return $this->belongsTo(JournalEntryLine::class, 'matched_journal_line_id');
    }
}
