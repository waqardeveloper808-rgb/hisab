<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentSequence extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'branch_id',
        'document_type',
        'prefix',
        'next_number',
        'padding',
        'reset_frequency',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}