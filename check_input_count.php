<?php

use App\Models\Priorities;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$id = 12; // The report ID being used
$priorities = Priorities::where('report_id', $id)->first();

if ($priorities) {
    $identifications = json_decode($priorities->identifications, true) ?? [];
    echo "Report ID: $id\n";
    echo "Identifications Count: " . count($identifications) . "\n";
    // echo "Items: " . json_encode($identifications, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Priorities not found for ID $id\n";
}
