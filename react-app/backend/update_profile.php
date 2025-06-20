<?php
require_once __DIR__ . '/db.php';

session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'domain' => '', 'secure' => true, 'httponly' => true, 'samesite' => 'None']);
session_start();

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
if (!isset($_SESSION['discord_id'])) { http_response_code(401); exit; }

$data = json_decode(file_get_contents('php://input'), true);

// Validation des données (simple, peut être améliorée)
if (empty($data['first_name']) || empty($data['last_name']) || empty($data['birth_date'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Les champs nom, prénom et date de naissance sont obligatoires.']);
    exit;
}

$pdo = getDBConnection();
$sql = "UPDATE users SET 
            first_name = :first_name, 
            last_name = :last_name, 
            birth_date = :birth_date,
            linkedin_url = :linkedin_url,
            instagram_handle = :instagram_handle,
            steam_id = :steam_id,
            github_username = :github_username,
            profile_complete = TRUE
        WHERE discord_id = :discord_id";

$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([
        ':first_name' => $data['first_name'],
        ':last_name' => $data['last_name'],
        ':birth_date' => $data['birth_date'],
        ':linkedin_url' => $data['linkedin_url'] ?? null,
        ':instagram_handle' => $data['instagram_handle'] ?? null,
        ':steam_id' => $data['steam_id'] ?? null,
        ':github_username' => $data['github_username'] ?? null,
        ':discord_id' => $_SESSION['discord_id']
    ]);
    http_response_code(200);
    echo json_encode(['message' => 'Profil mis à jour avec succès.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur lors de la mise à jour.']);
}