<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'entry_number',
        'status',
        'entry_date',
        'source_type',
        'source_id',
        'description',
        'posted_at',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'posted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $entry): void {
            if (! $entry->uuid) {
                $entry->uuid = (string) Str::uuid();
            }
        });
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}