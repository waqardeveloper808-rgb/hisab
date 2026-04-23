<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'batch_id',
        'entry_number',
        'status',
        'entry_date',
        'posting_date',
        'source_type',
        'source_id',
        'reference',
        'description',
        'memo',
        'metadata',
        'posted_at',
        'created_by',
        'posted_by',
        'reversed_from_id',
        'period_id',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'posting_date' => 'date',
        'posted_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $entry): void {
            if (! $entry->uuid) {
                $entry->uuid = (string) Str::uuid();
            }
        });

        static::updating(function (self $entry): void {
            if ($entry->getOriginal('status') === 'posted' && $entry->status !== $entry->getOriginal('status')) {
                throw new \LogicException('Posted journal entries cannot be edited.');
            }
        });

        static::deleting(function (self $entry): void {
            if ($entry->status === 'posted') {
                throw new \LogicException('Posted journal entries cannot be deleted.');
            }
        });
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(JournalBatch::class, 'batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function reversedFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reversed_from_id');
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(AccountingPeriod::class, 'period_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'related_id')
            ->where('related_type', 'journal_entry');
    }
}