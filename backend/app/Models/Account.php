<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'name_ar',
        'type',
        'account_class',
        'subtype',
        'group',
        'normal_balance',
        'parent_id',
        'allows_posting',
        'is_active',
        'is_system',
        'currency',
        'notes',
    ];

    protected $casts = [
        'allows_posting' => 'boolean',
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'account_id');
    }

    /**
     * Compute the account balance from posted journal lines.
     */
    public function computeBalance(): float
    {
        $totals = $this->journalLines()
            ->whereHas('journalEntry', fn ($q) => $q->where('status', 'posted'))
            ->selectRaw('COALESCE(SUM(debit), 0) as total_debit, COALESCE(SUM(credit), 0) as total_credit')
            ->first();

        $debit = (float) ($totals->total_debit ?? 0);
        $credit = (float) ($totals->total_credit ?? 0);

        return $this->normal_balance === 'debit'
            ? $debit - $credit
            : $credit - $debit;
    }
}