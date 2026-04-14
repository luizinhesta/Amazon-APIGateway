<?php

class Database
{
    public static function getConnection(array $config): mysqli
    {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        try {
            $conn = new mysqli(
                $config['host'],
                $config['user'],
                $config['pass'],
                $config['name'],
                $config['port']
            );

            $conn->set_charset($config['charset']);

            return $conn;

        } catch (Throwable $e) {
            error_log($e->getMessage());
            die("Erro ao conectar ao banco.");
        }
    }
}