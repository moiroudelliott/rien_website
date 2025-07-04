<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-control-allow-methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// L'utilisateur doit être connecté pour commenter
if (!isset($_SESSION['discord_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Non autorisé.']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

$profile_user_id = $data->profile_user_id ?? '';
$comment_text = trim($data->comment_text ?? '');
$commenter_user_id = $_SESSION['discord_id'];

if (empty($profile_user_id) || empty($comment_text)) {
    http_response_code(400);
    echo json_encode(['message' => 'Données manquantes.']);
    exit;
}

// Un utilisateur ne peut pas commenter son propre profil
if ($profile_user_id === $commenter_user_id) {
    http_response_code(403);
    echo json_encode(['message' => 'Vous ne pouvez pas commenter votre propre profil.']);
    exit;
}

$pdo = getDBConnection();

try {
    // Insère un nouveau commentaire ou met à jour l'existant si la paire
    // (profile_user_id, commenter_user_id) existe déjà.
    $stmt = $pdo->prepare("
        INSERT INTO user_comments (profile_user_id, commenter_user_id, comment_text)
        VALUES (:profile_user_id, :commenter_user_id, :comment_text)
        ON DUPLICATE KEY UPDATE comment_text = VALUES(comment_text)
    ");

    $stmt->execute([
        'profile_user_id' => $profile_user_id,
        'commenter_user_id' => $commenter_user_id,
        'comment_text' => $comment_text
    ]);

    http_response_code(200);
    echo json_encode(['message' => 'Commentaire sauvegardé avec succès.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 