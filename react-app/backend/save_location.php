<?php
require_once __DIR__ . '/db.php';

// Configuration de la session (doit être identique à callback.php)
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();

// Configuration des en-têtes CORS
header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Gère la requête "pre-flight" OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    exit;
}

if (!isset($_SESSION['discord_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['message' => 'Vous devez être connecté pour effectuer cette action.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['lat']) || !isset($data['lng'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['message' => 'Coordonnées manquantes.']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare("UPDATE users SET latitude = ?, longitude = ? WHERE discord_id = ?");
$stmt->execute([$data['lat'], $data['lng'], $_SESSION['discord_id']]);

echo json_encode(['message' => 'Position enregistrée avec succès.']);