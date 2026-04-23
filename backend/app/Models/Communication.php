<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Communication extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'contact_id',
        'template_id',
        'created_by',
        'source_type',
        'source_id',
        'source_record_type',
        'channel',
        'direction',
        'status',
        'target_address',
        'target_name',
        'subject',
        'body_html',
        'body_text',
        'retry_count',
        'metadata',
        'learning_snapshot',
        'scheduled_at',
        'queued_at',
        'last_attempt_at',
        'dispatched_at',
        'delivered_at',
        'failed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'retry_count' => 'integer',
        'metadata' => 'array',
        'learning_snapshot' => 'array',
        'scheduled_at' => 'datetime',
        'queued_at' => 'datetime',
        'last_attempt_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'failed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $communication): void {
            if (! $communication->uuid) {
                $communication->uuid = (string) Str::uuid();
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CommunicationTemplate::class, 'template_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(CommunicationAttempt::class)->orderBy('attempt_number');
    }
}