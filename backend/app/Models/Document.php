<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'company_id',
        'branch_id',
        'contact_id',
        'source_document_id',
        'template_id',
        'cost_center_id',
        'type',
        'status',
        'sequence_number',
        'document_number',
        'title',
        'currency_code',
        'language_code',
        'exchange_rate',
        'issue_date',
        'supply_date',
        'due_date',
        'subtotal',
        'discount_total',
        'taxable_total',
        'tax_total',
        'grand_total',
        'paid_total',
        'credited_total',
        'balance_due',
        'notes',
        'custom_fields',
        'attachments',
        'compliance_uuid',
        'compliance_status',
        'compliance_metadata',
        'finalized_at',
        'sent_at',
        'sent_to_email',
        'sent_via',
        'finalized_by',
        'cancelled_at',
        'status_reason',
        'locked_at',
        'reversal_of_document_id',
        'posted_journal_entry_id',
        'posted_at',
        'version',
    ];

    protected $casts = [
        'exchange_rate' => 'decimal:6',
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'taxable_total' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_total' => 'decimal:2',
        'credited_total' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'issue_date' => 'date',
        'supply_date' => 'date',
        'due_date' => 'date',
        'finalized_at' => 'datetime',
        'sent_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'locked_at' => 'datetime',
        'posted_at' => 'datetime',
        'compliance_metadata' => 'array',
        'custom_fields' => 'array',
        'attachments' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $document): void {
            if (! $document->uuid) {
                $document->uuid = (string) Str::uuid();
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
        return $this->belongsTo(DocumentTemplate::class, 'template_id');
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DocumentLine::class);
    }

    public function sourceDocument(): BelongsTo
    {
        return $this->belongsTo(self::class, 'source_document_id');
    }

    public function reversalOfDocument(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reversal_of_document_id');
    }
}