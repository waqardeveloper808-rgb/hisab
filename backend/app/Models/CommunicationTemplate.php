<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CommunicationTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'code',
        'name',
        'channel',
        'source_type',
        'subject_template',
        'body_html_template',
        'body_text_template',
        'variables',
        'metadata',
        'is_system',
        'is_default',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'variables' => 'array',
        'metadata' => 'array',
        'is_system' => 'boolean',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $template): void {
            if (! $template->uuid) {
                $template->uuid = (string) Str::uuid();
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class, 'template_id');
    }
}