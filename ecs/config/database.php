<?php

function required_env(string $key): string
{
    $value = getenv($key);

    if ($value === false || $value === '') {
        throw new RuntimeException("Erro: variável '{$key}' não definida");
    }

    return $value;
}

return [
    'host' => required_env('DB_HOST'),
    'port' => (int) (getenv('DB_PORT') ?: 3306),
    'name' => required_env('DB_NAME'),
    'user' => required_env('DB_USER'),
    'pass' => required_env('DB_PASS'),
    'charset' => 'utf8mb4',
];