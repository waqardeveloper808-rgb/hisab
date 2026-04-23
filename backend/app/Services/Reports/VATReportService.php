<?php

namespace App\Services\Reports;

use App\Models\Company;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VATReportService
{
    public function summary(Company $company): array
    {
        return DB::table('document_lines')
            ->join('documents', 'documents.id', '=', 'document_lines.document_id')
            ->join('tax_categories', 'tax_categories.id', '=', 'document_lines.tax_category_id')
            ->where('documents.company_id', $company->id)
            ->whereIn('documents.type', ['tax_invoice', 'credit_note', 'debit_note', 'vendor_bill', 'purchase_invoice', 'purchase_credit_note'])
            ->whereIn('documents.status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->groupBy('tax_categories.code', 'tax_categories.name', 'document_lines.tax_rate')
            ->selectRaw("tax_categories.code, tax_categories.name, document_lines.tax_rate,
                SUM(CASE WHEN documents.type IN ('tax_invoice', 'debit_note') THEN document_lines.net_amount WHEN documents.type = 'credit_note' THEN -document_lines.net_amount ELSE 0 END) as taxable_amount,
                SUM(CASE WHEN documents.type IN ('tax_invoice', 'debit_note') THEN document_lines.tax_amount WHEN documents.type = 'credit_note' THEN -document_lines.tax_amount ELSE 0 END) as tax_amount,
                SUM(CASE WHEN documents.type IN ('tax_invoice', 'debit_note') THEN document_lines.tax_amount WHEN documents.type = 'credit_note' THEN -document_lines.tax_amount ELSE 0 END) as output_tax_amount,
                SUM(CASE WHEN documents.type IN ('vendor_bill', 'purchase_invoice') THEN document_lines.tax_amount WHEN documents.type = 'purchase_credit_note' THEN -document_lines.tax_amount ELSE 0 END) as input_tax_amount,
                SUM(CASE WHEN documents.type IN ('tax_invoice', 'debit_note') THEN document_lines.tax_amount WHEN documents.type = 'credit_note' THEN -document_lines.tax_amount ELSE 0 END)
                -
                SUM(CASE WHEN documents.type IN ('vendor_bill', 'purchase_invoice') THEN document_lines.tax_amount WHEN documents.type = 'purchase_credit_note' THEN -document_lines.tax_amount ELSE 0 END) as net_tax_amount")
            ->get()
            ->all();
    }

    public function detail(Company $company): array
    {
        return DB::table('document_lines')
            ->join('documents', 'documents.id', '=', 'document_lines.document_id')
            ->join('tax_categories', 'tax_categories.id', '=', 'document_lines.tax_category_id')
            ->where('documents.company_id', $company->id)
            ->whereIn('documents.type', ['tax_invoice', 'credit_note', 'debit_note', 'vendor_bill', 'purchase_invoice', 'purchase_credit_note'])
            ->whereIn('documents.status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->groupBy('tax_categories.code', 'tax_categories.name', 'document_lines.tax_rate')
            ->selectRaw("tax_categories.code, tax_categories.name, document_lines.tax_rate,
                SUM(CASE WHEN documents.type IN ('tax_invoice', 'debit_note') THEN document_lines.net_amount WHEN documents.type = 'credit_note' THEN -document_lines.net_amount ELSE 0 END) as output_taxable_amount,
                SUM(CASE WHEN documents.type IN ('tax_invoice', 'debit_note') THEN document_lines.tax_amount WHEN documents.type = 'credit_note' THEN -document_lines.tax_amount ELSE 0 END) as output_tax_amount,
                SUM(CASE WHEN documents.type IN ('vendor_bill', 'purchase_invoice') THEN document_lines.net_amount WHEN documents.type = 'purchase_credit_note' THEN -document_lines.net_amount ELSE 0 END) as input_taxable_amount,
                SUM(CASE WHEN documents.type IN ('vendor_bill', 'purchase_invoice') THEN document_lines.tax_amount WHEN documents.type = 'purchase_credit_note' THEN -document_lines.tax_amount ELSE 0 END) as input_tax_amount")
            ->get()
            ->all();
    }

    public function receivedDetails(Company $company, Request $request): array
    {
        return Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->whereIn('status', ['finalized', 'sent', 'issued', 'posted', 'partially_paid', 'paid'])
            ->when($request->string('from_date')->toString(), fn ($query, $fromDate) => $query->whereDate('issue_date', '>=', $fromDate))
            ->when($request->string('to_date')->toString(), fn ($query, $toDate) => $query->whereDate('issue_date', '<=', $toDate))
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->get(['id', 'contact_id', 'document_number', 'issue_date', 'taxable_total', 'tax_total'])
            ->map(fn (Document $document) => [
                'id' => $document->id,
                'document_number' => $document->document_number,
                'issue_date' => $document->issue_date,
                'customer' => $document->contact?->display_name,
                'taxable_amount' => $document->taxable_total,
                'vat_amount' => $document->tax_total,
            ])
            ->values()
            ->all();
    }

    public function paidDetails(Company $company, Request $request): array
    {
        return Document::query()
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->whereIn('status', ['approved', 'finalized', 'issued', 'posted', 'partially_paid', 'paid'])
            ->when($request->string('from_date')->toString(), fn ($query, $fromDate) => $query->whereDate('issue_date', '>=', $fromDate))
            ->when($request->string('to_date')->toString(), fn ($query, $toDate) => $query->whereDate('issue_date', '<=', $toDate))
            ->with('contact:id,display_name')
            ->orderByDesc('issue_date')
            ->get(['id', 'contact_id', 'document_number', 'issue_date', 'type', 'title', 'notes', 'tax_total'])
            ->map(function (Document $document) {
                $text = strtolower(trim(($document->title ?? '') . ' ' . ($document->notes ?? '')));

                return [
                    'id' => $document->id,
                    'reference' => $document->document_number,
                    'issue_date' => $document->issue_date,
                    'vendor' => $document->contact?->display_name,
                    'vat_amount' => $document->tax_total,
                    'category' => str_contains($text, 'rent') ? 'rent' : ($document->type === 'vendor_bill' ? 'expense' : 'purchase'),
                ];
            })
            ->values()
            ->all();
    }
}