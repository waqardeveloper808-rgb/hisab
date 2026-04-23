<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Gulf Hisab Backend',
        'role' => 'backend',
        'marketing_frontend' => 'nextjs',
        'status' => 'ok',
    ]);
});
