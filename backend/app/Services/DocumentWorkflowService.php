<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentWorkflowService
{
    public function __construct(private readonly TemplateEngineRuntimeService $templateEngineRuntime)
    {
    }

    public function duplicateAsDraft(Company $company, Document $document, User $user): Document
    {
        return DB::transaction(function () use ($company, $document, $user): Document {
            $document->load('lines');
            $template = $this->templateEngineRuntime->requireTemplate($company, $document->template_id, (string) $document->type);

            $copy = Document::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'branch_id' => $document->branch_id,
                'contact_id' => $document->contact_id,
                'template_id' => $template->id,
                'type' => $document->type,
                'status' => 'draft',
                'title' => $document->title,
                'currency_code' => $document->currency_code,
                'language_code' => $document->language_code,
                'exchange_rate' => $document->exchange_rate,
                'issue_date' => now()->toDateString(),
                'supply_date' => now()->toDateString(),
                'due_date' => now()->toDateString(),
                'subtotal' => $document->subtotal,
                'discount_total' => $document->discount_total,
                'taxable_total' => $document->taxable_total,
                'tax_total' => $document->tax_total,
                'grand_total' => $document->grand_total,
                'paid_total' => '0.00',
                'credited_total' => '0.00',
                'balance_due' => $document->grand_total,
                'notes' => $document->notes,
                'custom_fields' => $document->custom_fields,
                'attachments' => $document->attachments,
                'compliance_metadata' => array_merge($document->compliance_metadata ?? [], ['duplicated_from' => $document->id]),
                'finalized_by' => $user->id,
            ]);

            $copy->lines()->createMany($document->lines->map(fn ($line) => [
                'line_number' => $line->line_number,
                'item_id' => $line->item_id,
                'tax_category_id' => $line->tax_category_id,
                'ledger_account_id' => $line->ledger_account_id,
                'description' => $line->description,
                'quantity' => $line->quantity,
                'unit_price' => $line->unit_price,
                'discount_amount' => $line->discount_amount,
                'net_amount' => $line->net_amount,
                'tax_rate' => $line->tax_rate,
                'tax_amount' => $line->tax_amount,
                'gross_amount' => $line->gross_amount,
                'metadata' => $line->metadata,
            ])->all());

            $this->templateEngineRuntime->refreshCompanyRuntime($company);

            return $copy->load('lines');
        });
    }
}