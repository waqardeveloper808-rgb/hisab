<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunicationAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'communication_id',
        'attempt_number',
        'channel',
        'transport',
        'status',
        'target_address',
        'subject',
        'error_code',
        'error_message',
        'provider_message_id',
        'metadata',
        'attempted_at',
        'completed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'attempted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function communication(): BelongsTo
    {
        return $this->belongsTo(Communication::class);
    }
}