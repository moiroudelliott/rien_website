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

// L'utilisateur doit être connecté pour supprimer un commentaire
if (!isset($_SESSION['discord_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Non autorisé.']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

$profile_user_id = $data->profile_user_id ?? '';
$commenter_user_id = $_SESSION['discord_id']; // Seul le propriétaire peut supprimer

if (empty($profile_user_id)) {
    http_response_code(400);
    echo json_encode(['message' => 'ID du profil manquant.']);
    exit;
}

$pdo = getDBConnection();

try {
    $stmt = $pdo->prepare("
        DELETE FROM user_comments
        WHERE profile_user_id = :profile_user_id AND commenter_user_id = :commenter_user_id
    ");

    $stmt->execute([
        'profile_user_id' => $profile_user_id,
        'commenter_user_id' => $commenter_user_id
    ]);

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(['message' => 'Commentaire supprimé avec succès.']);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Aucun commentaire à supprimer.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 