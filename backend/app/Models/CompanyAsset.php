<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CompanyAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'type',
        'usage',
        'original_name',
        'disk',
        'path',
        'mime_type',
        'extension',
        'size_bytes',
        'is_active',
        'uploaded_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['public_url'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getPublicUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}