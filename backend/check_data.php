<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check company columns
$companyCols = DB::select("PRAGMA table_info(companies)");
$companyColNames = array_map(fn($c) => $c->name, $companyCols);
echo 'companies columns: ' . implode(', ', $companyColNames) . PHP_EOL;

// Which company has most finalized invoices
$rows = DB::select("SELECT company_id, COUNT(*) as cnt FROM documents WHERE type='tax_invoice' AND status IN ('finalized','partially_paid','paid','partially_credited','credit_owed','reported','issued') GROUP BY company_id ORDER BY cnt DESC LIMIT 5");
foreach ($rows as $r) {
    echo "company_id={$r->company_id} docs={$r->cnt}" . PHP_EOL;
}

echo '--- inventory ---' . PHP_EOL;
try {
    $inv = DB::select('SELECT movement_type, COUNT(*) as cnt FROM inventory_movements GROUP BY movement_type');
    foreach ($inv as $i) {
        echo $i->movement_type . ': ' . $i->cnt . PHP_EOL;
    }
} catch (Exception $e) {
    echo 'No inventory_movements table: ' . $e->getMessage() . PHP_EOL;
}

echo '--- journals ---' . PHP_EOL;
$journals = DB::select('SELECT status, COUNT(*) as cnt FROM journal_entries GROUP BY status');
foreach ($journals as $j) {
    echo $j->status . ': ' . $j->cnt . PHP_EOL;
}

echo '--- total ---' . PHP_EOL;
echo 'companies: ' . DB::table('companies')->count() . PHP_EOL;
echo 'contacts: ' . DB::table('contacts')->count() . PHP_EOL;
echo 'items: ' . DB::table('items')->count() . PHP_EOL;

