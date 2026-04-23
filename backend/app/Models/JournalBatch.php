<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalBatch extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_POSTED = 'posted';

    public $timestamps = false;

    const UPDATED_AT = null;

    protected $fillable = [
        'company_id',
        'source_type',
        'source_id',
        'status',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::updating(function (self $batch): void {
            if ($batch->getOriginal('status') === self::STATUS_POSTED) {
                throw new \LogicException('Posted journal batches cannot be edited.');
            }
        });

        static::deleting(function (self $batch): void {
            if ($batch->status === self::STATUS_POSTED) {
                throw new \LogicException('Posted journal batches cannot be deleted.');
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function journals(): HasMany
    {
        return $this->hasMany(JournalEntry::class, 'batch_id');
    }
}