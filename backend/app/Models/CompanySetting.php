<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'default_branch_id',
        'default_language',
        'invoice_prefix',
        'quotation_prefix',
        'proforma_prefix',
        'credit_note_prefix',
        'payment_prefix',
        'vendor_bill_prefix',
        'purchase_invoice_prefix',
        'purchase_credit_note_prefix',
        'default_receivable_account_code',
        'default_payable_account_code',
        'default_revenue_account_code',
        'default_expense_account_code',
        'default_cash_account_code',
        'default_customer_advance_account_code',
        'default_supplier_advance_account_code',
        'default_vat_payable_account_code',
        'default_vat_receivable_account_code',
        'zatca_environment',
        'numbering_rules',
    ];

    protected $casts = [
        'numbering_rules' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}