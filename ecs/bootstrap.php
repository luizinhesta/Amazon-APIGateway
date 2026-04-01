<?php

declare(strict_types=1);

ob_start(); // evita erro de headers

function load_env(string $path): void
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        $parts = explode('=', $line, 2);

        if (count($parts) !== 2) {
            continue;
        }

        $key = trim($parts[0]);
        $value = trim($parts[1]);

        if ($key === '') {
            continue;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

function env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        return $default;
    }

    return $value;
}

load_env(__DIR__ . '/.env');

$app = require __DIR__ . '/config/app.php';
$dbConfig = require __DIR__ . '/config/database.php';

require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Auth.php';

$sessionName = $app['session_name'] ?? 'PHPSESSID';

if (session_status() === PHP_SESSION_NONE) {
    session_name($sessionName);
    session_start();
}

function db(): mysqli
{
    static $conn = null;

    if ($conn instanceof mysqli) {
        return $conn;
    }

    global $dbConfig;
    $conn = Database::getConnection($dbConfig);

    return $conn;
}