<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

echo "Total journal entries: " . DB::table('journal_entries')->count() . "\n";

$cols = DB::select("PRAGMA table_info('journal_entries')");
$colNames = array_map(fn($c) => $c->name, $cols);
echo "columns: " . implode(', ', $colNames) . "\n";

$je = DB::table('journal_entries')
    ->where('company_id', 2)
    ->orderByDesc('id')
    ->limit(5)
    ->get();
foreach ($je as $j) {
    $j = (array)$j;
    echo json_encode(array_intersect_key($j, array_flip(['id','status','notes','entry_number']))) . "\n";
}
