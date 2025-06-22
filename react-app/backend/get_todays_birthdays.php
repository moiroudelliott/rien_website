<?php
require_once __DIR__ . '/db.php'; // Inclut la configuration de la session

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-control-allow-methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Pas besoin d'être authentifié pour cette fonctionnalité publique
// if (!isset($_SESSION['discord_id'])) { ... }

$pdo = getDBConnection();

try {
    // La requête compare uniquement le mois et le jour, ignorant l'année.
    $stmt = $pdo->prepare("
        SELECT discord_id, username, first_name, last_name, avatar_hash 
        FROM users 
        WHERE MONTH(birth_date) = MONTH(CURDATE()) AND DAY(birth_date) = DAY(CURDATE())
    ");
    $stmt->execute();
    $birthday_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($birthday_users);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 