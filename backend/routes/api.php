<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AccessProfileController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\ChartOfAccountsController;
use App\Http\Controllers\Api\CompanyAssetController;
use App\Http\Controllers\Api\CompanyUserController;
use App\Http\Controllers\Api\CommunicationController;
use App\Http\Controllers\Api\CommunicationTemplateController;
use App\Http\Controllers\Api\CompanySetupController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CostCenterController;
use App\Http\Controllers\Api\CustomFieldDefinitionController;
use App\Http\Controllers\Api\DocumentCenterController;
use App\Http\Controllers\Api\DocumentTemplateController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\IntelligenceController;
use App\Http\Controllers\Api\JournalPostingController;
use App\Http\Controllers\Api\ManualJournalController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlatformAgentController;
use App\Http\Controllers\Api\PlatformConfigController;
use App\Http\Controllers\Api\PlatformCustomerController;
use App\Http\Controllers\Api\PlatformPlanController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductConfigController;
use App\Http\Controllers\Api\PurchaseDocumentController;
use App\Http\Controllers\Api\ReconciliationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SalesDocumentController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SupportAccountController;
use Illuminate\Support\Facades\Route;

Route::get('/public/product-config', [ProductConfigController::class, 'show']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'app' => config('app.name'),
        'env' => config('app.env'),
    ]);
});

Route::prefix('/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('workspace.access')->group(function () {
    Route::post('/journal/post', [JournalPostingController::class, 'store']);

    Route::prefix('/platform')->group(function () {
        Route::get('/config', [PlatformConfigController::class, 'show']);
        Route::put('/config', [PlatformConfigController::class, 'update']);
        Route::get('/plans', [PlatformPlanController::class, 'index']);
        Route::post('/plans', [PlatformPlanController::class, 'store']);
        Route::put('/plans/{plan}', [PlatformPlanController::class, 'update']);
        Route::get('/agents', [PlatformAgentController::class, 'index']);
        Route::put('/agents/{agent}', [PlatformAgentController::class, 'update']);
        Route::get('/customers', [PlatformCustomerController::class, 'index']);
        Route::get('/customers/{company}', [PlatformCustomerController::class, 'show']);
        Route::put('/customers/{company}', [PlatformCustomerController::class, 'update']);
        Route::get('/support-accounts', [SupportAccountController::class, 'index']);
        Route::post('/support-accounts', [SupportAccountController::class, 'store']);
        Route::put('/support-accounts/{user}', [SupportAccountController::class, 'update']);
    });

    Route::post('/companies', CompanySetupController::class);

    Route::prefix('/companies/{company}')->group(function () {
        Route::get('/access-profile', [AccessProfileController::class, 'show']);
        Route::get('/contacts', [ContactController::class, 'index']);
        Route::post('/contacts', [ContactController::class, 'store']);
        Route::get('/products/search', [ProductController::class, 'search']);
        Route::get('/products/stock', [ProductController::class, 'stock']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::get('/items', [ItemController::class, 'index']);
        Route::post('/items', [ItemController::class, 'store']);
        Route::get('/items/search', [ItemController::class, 'search']);
        Route::get('/items/stock', [ItemController::class, 'stock']);
        Route::get('/items/{item}', [ItemController::class, 'show']);
        Route::put('/items/{item}', [ItemController::class, 'update']);
        Route::delete('/items/{item}', [ItemController::class, 'destroy']);
        Route::get('/services', [ServiceController::class, 'index']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::get('/services/{service}', [ServiceController::class, 'show']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);
        Route::get('/documents', [DocumentCenterController::class, 'index']);
        Route::get('/documents/{document}', [DocumentCenterController::class, 'show']);
        Route::get('/documents/{document}/preview', [DocumentCenterController::class, 'preview']);
        Route::get('/documents/{document}/export-pdf', [DocumentCenterController::class, 'exportPdf']);
        Route::post('/documents/{document}/send', [DocumentCenterController::class, 'send']);
        Route::post('/documents/{document}/duplicate', [DocumentCenterController::class, 'duplicate']);
        Route::get('/communications', [CommunicationController::class, 'index']);
        Route::post('/communications', [CommunicationController::class, 'store']);
        Route::get('/communications/source/{sourceType}/{sourceId}', [CommunicationController::class, 'timeline']);
        Route::get('/communications/{communication}', [CommunicationController::class, 'show']);
        Route::post('/communications/{communication}/retry', [CommunicationController::class, 'retry']);
        Route::post('/communications/{communication}/cancel', [CommunicationController::class, 'cancel']);
        Route::get('/communications/templates', [CommunicationTemplateController::class, 'index']);
        Route::post('/communications/templates', [CommunicationTemplateController::class, 'store']);
        Route::put('/communications/templates/{template}', [CommunicationTemplateController::class, 'update']);
        Route::get('/templates', [DocumentTemplateController::class, 'index']);
        Route::post('/templates/preview', [DocumentTemplateController::class, 'preview']);
        Route::post('/templates', [DocumentTemplateController::class, 'store']);
        Route::put('/templates/{template}', [DocumentTemplateController::class, 'update']);
        Route::get('/assets', [CompanyAssetController::class, 'index']);
        Route::post('/assets', [CompanyAssetController::class, 'store']);
        Route::get('/cost-centers', [CostCenterController::class, 'index']);
        Route::post('/cost-centers', [CostCenterController::class, 'store']);
        Route::put('/cost-centers/{costCenter}', [CostCenterController::class, 'update']);
        Route::get('/custom-fields', [CustomFieldDefinitionController::class, 'index']);
        Route::post('/custom-fields', [CustomFieldDefinitionController::class, 'store']);
        Route::put('/custom-fields/{customField}', [CustomFieldDefinitionController::class, 'update']);
        Route::get('/users', [CompanyUserController::class, 'index']);
        Route::post('/users', [CompanyUserController::class, 'store']);
        Route::put('/users/{user}', [CompanyUserController::class, 'update']);
        Route::get('/payments', [PaymentController::class, 'indexForCompany']);
        Route::post('/payments', [PaymentController::class, 'storeForCompany']);
        Route::post('/supplier-payments', [PaymentController::class, 'storeOutgoingForCompany']);
        Route::get('/settings', [SettingsController::class, 'show']);
        Route::put('/settings', [SettingsController::class, 'update']);
        Route::get('/agents/dashboard', [AgentController::class, 'show']);
        Route::post('/contacts/{contact}/customer-advance-refunds', [PaymentController::class, 'refundCustomerAdvance']);
        Route::post('/contacts/{contact}/supplier-advance-refunds', [PaymentController::class, 'refundSupplierAdvance']);
        Route::post('/payments/{payment}/void', [PaymentController::class, 'void']);

        Route::get('/sales-documents', [SalesDocumentController::class, 'index']);
        Route::post('/sales-documents', [SalesDocumentController::class, 'store']);
        Route::put('/sales-documents/{document}', [SalesDocumentController::class, 'update']);
        Route::get('/sales-documents/{document}', [SalesDocumentController::class, 'show']);
        Route::post('/sales-documents/{document}/finalize', [SalesDocumentController::class, 'finalize']);
        Route::post('/sales-documents/{document}/credit-notes', [SalesDocumentController::class, 'issueCreditNote']);
        Route::post('/sales-documents/{document}/debit-notes', [SalesDocumentController::class, 'issueDebitNote']);
        Route::post('/sales-documents/{document}/void', [SalesDocumentController::class, 'void']);

        Route::post('/sales-documents/{document}/payments', [PaymentController::class, 'store']);
        Route::post('/sales-documents/{document}/apply-advance', [PaymentController::class, 'applyAdvance']);

        Route::get('/purchase-documents', [PurchaseDocumentController::class, 'index']);
        Route::post('/purchase-documents', [PurchaseDocumentController::class, 'store']);
        Route::put('/purchase-documents/{document}', [PurchaseDocumentController::class, 'update']);
        Route::get('/purchase-documents/{document}', [PurchaseDocumentController::class, 'show']);
        Route::post('/purchase-documents/{document}/finalize', [PurchaseDocumentController::class, 'finalize']);
        Route::post('/purchase-documents/{document}/credit-notes', [PurchaseDocumentController::class, 'issueCreditNote']);
        Route::post('/purchase-documents/{document}/void', [PurchaseDocumentController::class, 'void']);
        Route::post('/purchase-documents/{document}/payments', [PaymentController::class, 'storeOutgoing']);
        Route::post('/purchase-documents/{document}/apply-advance', [PaymentController::class, 'applySupplierAdvance']);

        Route::get('/reports/dashboard-summary', [ReportController::class, 'dashboardSummary']);
        Route::get('/reports/invoice-register', [ReportController::class, 'invoiceRegister']);
        Route::get('/reports/bills-register', [ReportController::class, 'billsRegister']);
        Route::get('/reports/payments-register', [ReportController::class, 'paymentsRegister']);
        Route::get('/reports/vat-summary', [ReportController::class, 'vatSummary']);
        Route::get('/reports/vat-detail', [ReportController::class, 'vatDetail']);
        Route::get('/reports/vat-received-details', [ReportController::class, 'vatReceivedDetails']);
        Route::get('/reports/vat-paid-details', [ReportController::class, 'vatPaidDetails']);
        Route::get('/reports/receivables-aging', [ReportController::class, 'receivablesAging']);
        Route::get('/reports/payables-aging', [ReportController::class, 'payablesAging']);
        Route::get('/reports/customer-statements/{contact}', [ReportController::class, 'customerStatement']);
        Route::get('/reports/trial-balance', [ReportController::class, 'trialBalance']);
        Route::get('/reports/general-ledger', [ReportController::class, 'generalLedger']);
        Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);
        Route::get('/reports/balance-sheet', [ReportController::class, 'balanceSheet']);
        Route::get('/reports/profit-by-customer', [ReportController::class, 'profitByCustomer']);
        Route::get('/reports/profit-by-product', [ReportController::class, 'profitByProduct']);
        Route::get('/reports/expense-breakdown', [ReportController::class, 'expenseBreakdown']);
        Route::get('/reports/audit-trail', [ReportController::class, 'auditTrail']);
        Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow']);
        Route::get('/intelligence/overview', [IntelligenceController::class, 'overview']);
        Route::post('/intelligence/transaction', [IntelligenceController::class, 'transaction']);
        Route::get('/intelligence/reports', [IntelligenceController::class, 'reports']);

        // ── Chart of Accounts ─────────────────────────────────────
        Route::get('/accounts', [ChartOfAccountsController::class, 'index']);
        Route::post('/accounts', [ChartOfAccountsController::class, 'store']);
        Route::put('/accounts/{account}', [ChartOfAccountsController::class, 'update']);

        // ── Manual Journals ───────────────────────────────────────
        Route::get('/journals', [ManualJournalController::class, 'index']);
        Route::post('/journals', [ManualJournalController::class, 'store']);
        Route::get('/journals/{journal}', [ManualJournalController::class, 'show']);
        Route::post('/journals/{journal}/post', [ManualJournalController::class, 'post']);
        Route::post('/journals/{journal}/reverse', [ManualJournalController::class, 'reverse']);

        // ── Inventory Engine ─────────────────────────────────────
        Route::get('/inventory/stock', [InventoryController::class, 'stock']);
        Route::post('/inventory/stock', [InventoryController::class, 'createStock']);
        Route::get('/inventory/adjustments', [InventoryController::class, 'adjustments']);
        Route::post('/inventory/adjustments', [InventoryController::class, 'createAdjustment']);
        Route::post('/inventory/sales', [InventoryController::class, 'createSale']);

        // ── Bank Reconciliation ───────────────────────────────────
        Route::get('/reconciliation/bank-accounts', [ReconciliationController::class, 'bankAccounts']);
        Route::get('/reconciliation/{account}/statements', [ReconciliationController::class, 'statementLines']);
        Route::post('/reconciliation/{account}/import', [ReconciliationController::class, 'importStatementLines']);
        Route::post('/reconciliation/{account}/statements/import', [ReconciliationController::class, 'importStatementLines']);
        Route::get('/reconciliation/{account}/statements/{statementLine}/candidates', [ReconciliationController::class, 'candidates']);
        Route::post('/reconciliation/{account}/statements/{statementLine}/match', [ReconciliationController::class, 'match']);
        Route::post('/reconciliation/{account}/reconcile', [ReconciliationController::class, 'reconcile']);
    });
});