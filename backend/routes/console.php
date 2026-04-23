<?php

use App\Models\Company;
use App\Services\InventoryService;
use App\Services\Reports\VATReportService;
use Database\Seeders\SessionBHardeningSeeder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('sessionb:engine-harden {--company=2} {--seed}', function () {
    $companyId = (int) $this->option('company');
    $timestamp = now()->format('Ymd_His');
    $outputDir = base_path('artifacts/sessionB_engine_hardening_'.$timestamp);
    $logs = [];

    if (! is_dir($outputDir)) {
        mkdir($outputDir, 0777, true);
    }

    $steps = [
        'seed_deterministic_data',
        'dump_journal',
        'build_vat_summary',
        'build_trial_balance',
        'build_inventory_snapshot',
        'build_audit_report',
    ];

    $runStep = function (string $name, callable $action) use (&$logs, $steps) {
        $start = microtime(true);
        $startedAt = now()->toIso8601String();
        $result = $action();
        $end = microtime(true);
        $durationMs = (int) round(($end - $start) * 1000);
        $completedCount = count($logs) + 1;
        $remaining = max(0, count($steps) - $completedCount);
        $avgDuration = ($completedCount > 0)
            ? (int) round((array_sum(array_column($logs, 'duration_ms')) + $durationMs) / $completedCount)
            : $durationMs;
        $etaMs = $remaining * $avgDuration;

        $logs[] = [
            'step' => $name,
            'started_at' => $startedAt,
            'ended_at' => now()->toIso8601String(),
            'duration_ms' => $durationMs,
            'eta_ms' => $etaMs,
        ];

        return $result;
    };

    $company = Company::with('settings')->findOrFail($companyId);

    if ($this->option('seed')) {
        putenv('SESSIONB_COMPANY_ID='.$companyId);
        $runStep('seed_deterministic_data', function () {
            $seeder = app(SessionBHardeningSeeder::class);
            $seeder->run();

            return ['seeded' => true];
        });
    }

    $journalDump = $runStep('dump_journal', function () use ($company) {
        return DB::table('journal_entries')
            ->join('journal_entry_lines', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->orderBy('journal_entries.entry_date')
            ->orderBy('journal_entries.id')
            ->selectRaw('journal_entries.id as journal_id, journal_entries.entry_number, journal_entries.entry_date, journal_entries.source_type, journal_entries.source_id, journal_entries.reference, journal_entries.description, accounts.code as account_code, accounts.name as account_name, journal_entry_lines.debit, journal_entry_lines.credit, journal_entry_lines.document_id')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    });
    file_put_contents($outputDir.DIRECTORY_SEPARATOR.'journal_dump.json', json_encode($journalDump, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $vatService = app(VATReportService::class);
    $vatSummary = $runStep('build_vat_summary', function () use ($vatService, $company) {
        return [
            'summary' => $vatService->summary($company),
            'detail' => $vatService->detail($company),
        ];
    });
    file_put_contents($outputDir.DIRECTORY_SEPARATOR.'vat_summary.json', json_encode($vatSummary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $trialBalance = $runStep('build_trial_balance', function () use ($company) {
        return DB::table('journal_entry_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.company_id', $company->id)
            ->groupBy('accounts.code', 'accounts.name', 'accounts.type')
            ->orderBy('accounts.code')
            ->selectRaw('accounts.code, accounts.name, accounts.type, COALESCE(SUM(journal_entry_lines.debit), 0) as debit_total, COALESCE(SUM(journal_entry_lines.credit), 0) as credit_total, COALESCE(SUM(journal_entry_lines.debit - journal_entry_lines.credit), 0) as balance')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    });
    file_put_contents($outputDir.DIRECTORY_SEPARATOR.'trial_balance.json', json_encode($trialBalance, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $inventoryService = app(InventoryService::class);
    $inventorySnapshot = $runStep('build_inventory_snapshot', function () use ($company, $inventoryService) {
        return [
            'stock' => $inventoryService->listStock($company)->toArray(),
            'reconciliation' => $inventoryService->reconciliationSnapshot($company),
        ];
    });
    file_put_contents($outputDir.DIRECTORY_SEPARATOR.'inventory_snapshot.json', json_encode($inventorySnapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $auditReport = $runStep('build_audit_report', function () use ($company, $vatSummary, $trialBalance, $inventorySnapshot) {
        $trialDebit = collect($trialBalance)->sum(fn (array $row) => (float) ($row['debit_total'] ?? 0));
        $trialCredit = collect($trialBalance)->sum(fn (array $row) => (float) ($row['credit_total'] ?? 0));
        $vatStatus = (string) ($vatSummary['summary']['validation_status'] ?? 'mismatch');
        $inventoryStatus = (string) ($inventorySnapshot['reconciliation']['overall_status'] ?? 'mismatch');

        return [
            'company_id' => $company->id,
            'controls' => [
                [
                    'id' => 'CP-ACC-HARD-001',
                    'expected_state' => 'All journals are balanced and trial balance remains in equilibrium.',
                    'failure_condition' => 'Total trial balance debit does not equal credit.',
                    'measurable_fields' => ['trial_balance.debit_total', 'trial_balance.credit_total'],
                    'cross_validation_sources' => ['journal_dump.json', 'trial_balance.json'],
                    'status' => abs(round($trialDebit - $trialCredit, 2)) <= 0.01 ? 'PASS' : 'FAIL',
                    'observed' => ['trial_debit' => round($trialDebit, 2), 'trial_credit' => round($trialCredit, 2)],
                ],
                [
                    'id' => 'CP-VAT-HARD-001',
                    'expected_state' => 'VAT received/paid/payable reconciles with document VAT evidence.',
                    'failure_condition' => 'VAT summary mismatch against source invoices and purchases.',
                    'measurable_fields' => ['vat_received', 'vat_paid', 'vat_payable', 'output_vat_mismatch', 'input_vat_mismatch'],
                    'cross_validation_sources' => ['vat_summary.json', 'journal_dump.json'],
                    'status' => $vatStatus === 'matched' ? 'PASS' : 'FAIL',
                    'observed' => $vatSummary['summary'],
                ],
                [
                    'id' => 'CP-INV-HARD-001',
                    'expected_state' => 'Inventory valuation reconciles to inventory control accounts.',
                    'failure_condition' => 'Inventory snapshot value does not match accounting ledger value.',
                    'measurable_fields' => ['inventory_book_value', 'ledger_value', 'difference'],
                    'cross_validation_sources' => ['inventory_snapshot.json', 'journal_dump.json'],
                    'status' => $inventoryStatus === 'matched' ? 'PASS' : 'FAIL',
                    'observed' => $inventorySnapshot['reconciliation'],
                ],
            ],
        ];
    });
    file_put_contents($outputDir.DIRECTORY_SEPARATOR.'audit_report.json', json_encode($auditReport, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $executionReport = "# Session B Execution Time Report\n\n";
    foreach ($logs as $log) {
        $executionReport .= sprintf(
            "- %s\n  - start: %s\n  - end: %s\n  - duration_ms: %d\n  - eta_ms_after_step: %d\n",
            $log['step'],
            $log['started_at'],
            $log['ended_at'],
            $log['duration_ms'],
            $log['eta_ms']
        );
    }
    file_put_contents($outputDir.DIRECTORY_SEPARATOR.'execution-time-report.md', $executionReport);

    $zipPath = $outputDir.'.zip';
    if (file_exists($zipPath)) {
        unlink($zipPath);
    }

    $zip = new \ZipArchive();
    if ($zip->open($zipPath, \ZipArchive::CREATE) === true) {
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($outputDir));
        foreach ($files as $file) {
            if ($file->isDir()) {
                continue;
            }

            $absolutePath = $file->getRealPath();
            if (! $absolutePath) {
                continue;
            }

            $relativePath = ltrim(str_replace($outputDir, '', $absolutePath), DIRECTORY_SEPARATOR);
            $zip->addFile($absolutePath, $relativePath);
        }
        $zip->close();
    }

    $this->info('Session B hardening artifacts generated.');
    $this->line('artifact_dir='.$outputDir);
    $this->line('zip_path='.$zipPath);
})->purpose('Run Session B accounting/VAT/inventory hardening evidence generation');
