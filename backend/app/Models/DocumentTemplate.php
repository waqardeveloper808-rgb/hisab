<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'document_types',
        'locale_mode',
        'accent_color',
        'watermark_text',
        'header_html',
        'footer_html',
        'settings',
        'logo_asset_id',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'document_types' => 'array',
        'settings' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function logoAsset(): BelongsTo
    {
        return $this->belongsTo(CompanyAsset::class, 'logo_asset_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'template_id');
    }
}