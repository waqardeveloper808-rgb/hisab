<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DOCUMENT COUNTS ===\n";
$docs = DB::table('documents')->select('type', DB::raw('count(*) as cnt'))->groupBy('type')->get();
foreach ($docs as $d) echo $d->type . ': ' . $d->cnt . "\n";

echo "\n=== CONTACTS ===\n";
echo 'total: ' . DB::table('contacts')->count() . "\n";
echo 'customers: ' . DB::table('contacts')->where('type', 'customer')->count() . "\n";
echo 'suppliers: ' . DB::table('contacts')->where('type', 'supplier')->count() . "\n";

echo "\n=== OTHER COUNTS ===\n";
echo 'items: ' . DB::table('items')->count() . "\n";
echo 'journals (posted): ' . DB::table('journal_entries')->where('status', 'posted')->count() . "\n";
echo 'companies: ' . DB::table('companies')->count() . "\n";

echo "\n=== INVENTORY TABLES ===\n";
$tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
foreach ($tables as $t) {
    if (str_contains($t->name, 'inventor') || str_contains($t->name, 'stock') || str_contains($t->name, 'receipt') || str_contains($t->name, 'fulfillment') || str_contains($t->name, 'movement')) {
        echo 'table: ' . $t->name . "\n";
        $cnt = DB::table($t->name)->count();
        echo '  rows: ' . $cnt . "\n";
    }
}
