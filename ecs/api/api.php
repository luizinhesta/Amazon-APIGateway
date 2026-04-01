<?php
require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true]);
    exit;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_user_by_login(mysqli $conn, string $login): ?array
{
    $stmt = $conn->prepare('SELECT id, nome, login, senha, cep, logradouro, bairro, cidade, uf, numero, complemento FROM usuarios WHERE login = ? LIMIT 1');
    $stmt->bind_param('s', $login);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    return $user ?: null;
}

function sanitize_user(array $user): array
{
    unset($user['senha']);
    return $user;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$conn = db();

if ($action === 'login' && $method === 'POST') {
    $data = json_input();
    $login = trim($data['login'] ?? '');
    $senha = $data['senha'] ?? '';

    if ($login === '' || $senha === '') {
        respond(400, ['message' => 'Preencha login e senha.']);
    }

    $user = get_user_by_login($conn, $login);
    if (!$user || !password_verify($senha, $user['senha'])) {
        respond(401, ['message' => 'Login ou senha invalidos.']);
    }

    respond(200, ['user' => sanitize_user($user)]);
}

if ($action === 'create' && $method === 'POST') {
    $data = json_input();
    $nome = trim($data['nome'] ?? '');
    $login = trim($data['login'] ?? '');
    $senha = $data['senha'] ?? '';

    if ($nome === '' || $login === '' || $senha === '') {
        respond(400, ['message' => 'Preencha nome, login e senha.']);
    }

    $stmt = $conn->prepare('SELECT id FROM usuarios WHERE login = ? LIMIT 1');
    $stmt->bind_param('s', $login);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        respond(409, ['message' => 'Login ja existe. Escolha outro.']);
    }

    $hash = password_hash($senha, PASSWORD_DEFAULT);

    $cep = trim($data['cep'] ?? '');
    $logradouro = trim($data['logradouro'] ?? '');
    $bairro = trim($data['bairro'] ?? '');
    $cidade = trim($data['cidade'] ?? '');
    $uf = trim($data['uf'] ?? '');
    $numero = trim($data['numero'] ?? '');
    $complemento = trim($data['complemento'] ?? '');

    $stmt = $conn->prepare('INSERT INTO usuarios (nome, login, senha, cep, logradouro, bairro, cidade, uf, numero, complemento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param(
        'ssssssssss',
        $nome,
        $login,
        $hash,
        $cep,
        $logradouro,
        $bairro,
        $cidade,
        $uf,
        $numero,
        $complemento
    );
    $stmt->execute();

    $user = get_user_by_login($conn, $login);
    respond(201, ['user' => sanitize_user($user)]);
}

if ($action === 'get' && $method === 'GET') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        respond(400, ['message' => 'ID invalido.']);
    }

    $stmt = $conn->prepare('SELECT id, nome, login, cep, logradouro, bairro, cidade, uf, numero, complemento FROM usuarios WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    if (!$user) {
        respond(404, ['message' => 'Usuario nao encontrado.']);
    }

    respond(200, ['user' => $user]);
}

if ($action === 'find' && $method === 'GET') {
    $login = trim($_GET['login'] ?? '');
    if ($login === '') {
        respond(400, ['message' => 'Login invalido.']);
    }

    $user = get_user_by_login($conn, $login);
    if (!$user) {
        respond(404, ['message' => 'Usuario nao encontrado.']);
    }

    respond(200, ['user' => sanitize_user($user)]);
}

if ($action === 'update' && $method === 'PUT') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        respond(400, ['message' => 'ID invalido.']);
    }

    $data = json_input();
    $nome = trim($data['nome'] ?? '');
    $login = trim($data['login'] ?? '');
    $senha = $data['senha'] ?? '';

    if ($nome === '' || $login === '') {
        respond(400, ['message' => 'Preencha nome e login.']);
    }

    $cep = trim($data['cep'] ?? '');
    $logradouro = trim($data['logradouro'] ?? '');
    $bairro = trim($data['bairro'] ?? '');
    $cidade = trim($data['cidade'] ?? '');
    $uf = trim($data['uf'] ?? '');
    $numero = trim($data['numero'] ?? '');
    $complemento = trim($data['complemento'] ?? '');

    if ($senha !== '') {
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $stmt = $conn->prepare('UPDATE usuarios SET nome = ?, login = ?, senha = ?, cep = ?, logradouro = ?, bairro = ?, cidade = ?, uf = ?, numero = ?, complemento = ? WHERE id = ?');
        $stmt->bind_param(
            'ssssssssssi',
            $nome,
            $login,
            $hash,
            $cep,
            $logradouro,
            $bairro,
            $cidade,
            $uf,
            $numero,
            $complemento,
            $id
        );
    } else {
        $stmt = $conn->prepare('UPDATE usuarios SET nome = ?, login = ?, cep = ?, logradouro = ?, bairro = ?, cidade = ?, uf = ?, numero = ?, complemento = ? WHERE id = ?');
        $stmt->bind_param(
            'sssssssssi',
            $nome,
            $login,
            $cep,
            $logradouro,
            $bairro,
            $cidade,
            $uf,
            $numero,
            $complemento,
            $id
        );
    }

    $stmt->execute();

    $stmt = $conn->prepare('SELECT id, nome, login, cep, logradouro, bairro, cidade, uf, numero, complemento FROM usuarios WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    respond(200, ['user' => $user]);
}

respond(404, ['message' => 'Endpoint nao encontrado.']);
