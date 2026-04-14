<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'company_id',
        'user_id',
        'event',
        'auditable_type',
        'auditable_id',
        'before',
        'after',
        'context',
        'created_at',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'context' => 'array',
        'created_at' => 'datetime',
    ];
}