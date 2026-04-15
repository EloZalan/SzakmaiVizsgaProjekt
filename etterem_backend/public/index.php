<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader for both local and split-core deploy layouts.
$autoloadCandidates = [
    __DIR__.'/../vendor/autoload.php',
    __DIR__.'/../backendcore/vendor/autoload.php',
    __DIR__.'/core/vendor/autoload.php',
];

$autoloadPath = null;
foreach ($autoloadCandidates as $candidate) {
    if (file_exists($candidate)) {
        $autoloadPath = $candidate;
        break;
    }
}

if ($autoloadPath === null) {
    http_response_code(500);
    exit('Autoload file not found.');
}

require $autoloadPath;

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$bootstrapCandidates = [
    __DIR__.'/../bootstrap/app.php',
    __DIR__.'/../backendcore/bootstrap/app.php',
    __DIR__.'/core/bootstrap/app.php',
];

$bootstrapPath = null;
foreach ($bootstrapCandidates as $candidate) {
    if (file_exists($candidate)) {
        $bootstrapPath = $candidate;
        break;
    }
}

if ($bootstrapPath === null) {
    http_response_code(500);
    exit('Bootstrap file not found.');
}

$app = require_once $bootstrapPath;

$app->handleRequest(Request::capture());
