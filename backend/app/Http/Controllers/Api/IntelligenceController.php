<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCompanyAccess;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Intelligence\IntelligenceEngine;
use App\Services\Reports\ProfitLossService;
use App\Services\Reports\VATReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntelligenceController extends Controller
{
    use ResolvesCompanyAccess;

    public function __construct(
        private readonly IntelligenceEngine $intelligenceEngine,
        private readonly ProfitLossService $profitLossService,
        private readonly VATReportService $vatReportService,
    ) {
    }

    public function overview(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        return response()->json(['data' => $this->intelligenceEngine->overview($company)]);
    }

    public function transaction(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.sales.manage');

        $payload = $request->validate([
            'contact_id' => ['nullable', 'integer'],
            'document_type' => ['required', 'string', 'max:80'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['nullable', 'string'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        return response()->json(['data' => $this->intelligenceEngine->forTransaction($company, $payload)]);
    }

    public function reports(Request $request, Company $company): JsonResponse
    {
        $this->ensureCompanyAbility($request->user(), $company, 'workspace.reports.view');

        $profitLoss = $this->profitLossService->statement($company);
        $vatSummary = collect($this->vatReportService->summary($company));
        $receivablesTotal = (float) $company->documents()->whereIn('type', ['tax_invoice', 'debit_note'])->sum('balance_due');
        $payablesTotal = (float) $company->documents()->whereIn('type', ['vendor_bill', 'purchase_invoice'])->sum('balance_due');
        $vatBalance = $vatSummary->sum(fn ($row) => (float) $row->tax_amount);

        return response()->json(['data' => $this->intelligenceEngine->forReports($company, [
            'net_profit' => (float) $profitLoss['net_profit'],
            'receivables_total' => round($receivablesTotal, 2),
            'payables_total' => round($payablesTotal, 2),
            'vat_balance' => round($vatBalance, 2),
        ])]);
    }
}