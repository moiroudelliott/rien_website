<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-control-allow-methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// L'utilisateur doit être connecté pour voir les commentaires
if (!isset($_SESSION['discord_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Non autorisé.']);
    exit;
}

// On attend l'ID du profil dont on veut récupérer les commentaires
$profile_user_id = isset($_GET['user_id']) ? $_GET['user_id'] : '';
if (empty($profile_user_id)) {
    http_response_code(400);
    echo json_encode(['message' => 'ID de l\'utilisateur du profil manquant.']);
    exit;
}

$pdo = getDBConnection();

try {
    $stmt = $pdo->prepare("
        SELECT
            c.id,
            c.comment_text,
            c.commenter_user_id,
            u.username AS commenter_username,
            u.first_name AS commenter_first_name,
            u.last_name AS commenter_last_name,
            u.avatar_hash AS commenter_avatar_hash
        FROM user_comments c
        JOIN users u ON c.commenter_user_id = u.discord_id
        WHERE c.profile_user_id = :profile_user_id
        ORDER BY c.created_at DESC
    ");
    $stmt->execute(['profile_user_id' => $profile_user_id]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($comments);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 