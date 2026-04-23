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
        $settings = $company->settings()->firstOrFail();

        $vatReceived = (float) DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->where('accounts.code', $settings->default_vat_payable_account_code)
            ->selectRaw('COALESCE(SUM(journal_entry_lines.credit - journal_entry_lines.debit), 0) as total')
            ->value('total');

        $vatPaid = (float) DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->where('accounts.code', $settings->default_vat_receivable_account_code)
            ->selectRaw('COALESCE(SUM(journal_entry_lines.debit - journal_entry_lines.credit), 0) as total')
            ->value('total');

        $invoiceVat = (float) DB::table('documents')
            ->where('company_id', $company->id)
            ->whereIn('type', ['tax_invoice', 'debit_note'])
            ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->sum('tax_total');

        $creditVat = (float) DB::table('documents')
            ->where('company_id', $company->id)
            ->where('type', 'credit_note')
            ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->sum('tax_total');

        $purchasesVat = (float) DB::table('documents')
            ->where('company_id', $company->id)
            ->whereIn('type', ['vendor_bill', 'purchase_invoice'])
            ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->sum('tax_total');

        $purchaseCreditsVat = (float) DB::table('documents')
            ->where('company_id', $company->id)
            ->where('type', 'purchase_credit_note')
            ->whereIn('status', ['finalized', 'partially_paid', 'paid', 'partially_credited', 'credited', 'credit_owed'])
            ->sum('tax_total');

        $expectedOutput = round($invoiceVat - $creditVat, 2);
        $expectedInput = round($purchasesVat - $purchaseCreditsVat, 2);

        return [
            'vat_received' => number_format(round($vatReceived, 2), 2, '.', ''),
            'vat_paid' => number_format(round($vatPaid, 2), 2, '.', ''),
            'vat_payable' => number_format(round($vatReceived - $vatPaid, 2), 2, '.', ''),
            'expected_output_vat_from_documents' => number_format($expectedOutput, 2, '.', ''),
            'expected_input_vat_from_documents' => number_format($expectedInput, 2, '.', ''),
            'output_vat_mismatch' => number_format(round($vatReceived - $expectedOutput, 2), 2, '.', ''),
            'input_vat_mismatch' => number_format(round($vatPaid - $expectedInput, 2), 2, '.', ''),
            'validation_status' => abs(round($vatReceived - $expectedOutput, 2)) <= 0.01 && abs(round($vatPaid - $expectedInput, 2)) <= 0.01
                ? 'matched'
                : 'mismatch',
        ];
    }

    public function detail(Company $company): array
    {
        $settings = $company->settings()->firstOrFail();

        return DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->leftJoin('documents', 'documents.id', '=', 'journal_entry_lines.document_id')
            ->where('journal_entries.company_id', $company->id)
            ->whereIn('accounts.code', [$settings->default_vat_payable_account_code, $settings->default_vat_receivable_account_code])
            ->orderByDesc('journal_entries.entry_date')
            ->selectRaw('journal_entries.entry_number, journal_entries.entry_date, journal_entries.source_type, journal_entries.source_id, accounts.code as account_code, accounts.name as account_name, documents.document_number, documents.type as document_type, journal_entry_lines.debit, journal_entry_lines.credit')
            ->get()
            ->map(fn ($row) => [
                'entry_number' => $row->entry_number,
                'entry_date' => $row->entry_date,
                'source_type' => $row->source_type,
                'source_id' => $row->source_id,
                'account_code' => $row->account_code,
                'account_name' => $row->account_name,
                'document_number' => $row->document_number,
                'document_type' => $row->document_type,
                'vat_received' => round((float) $row->credit, 2),
                'vat_paid' => round((float) $row->debit, 2),
            ])
            ->values()
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