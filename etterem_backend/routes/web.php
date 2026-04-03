<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/docs', function () {
    return view('swagger-ui');
});

Route::get('/docs/openapi.yaml', function () {
    $specPath = base_path('swagger.yaml');

    if (!file_exists($specPath)) {
        abort(404, 'Swagger spec file not found.');
    }

    return response()->file($specPath, [
        'Content-Type' => 'application/yaml; charset=UTF-8',
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
    ]);
});
