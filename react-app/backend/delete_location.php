<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';

// Configuration du cookie de session pour le cross-domain
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
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
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['message' => 'Méthode non autorisée. Seul POST est accepté.']);
    exit;
}

if (!isset($_SESSION['discord_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['message' => 'Non connecté.']);
    exit;
}

try {
    $pdo = getDBConnection();
    // La requête SQL pour supprimer la position
    $stmt = $pdo->prepare("UPDATE users SET latitude = NULL, longitude = NULL WHERE discord_id = ?");
    $stmt->execute([$_SESSION['discord_id']]);

    http_response_code(200);
    echo json_encode(['message' => 'Position supprimée avec succès.']);
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['message' => 'Erreur lors de la suppression de la position.']);
}