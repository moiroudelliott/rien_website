<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Vérifier l'authentification
    if (!isset($_SESSION['discord_id'])) {
        throw new Exception('Utilisateur non authentifié');
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['post_id'])) {
        throw new Exception('ID du post manquant');
    }

    $pdo = getDBConnection();
    
    // Vérifier si la table existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'music_post_likes'");
    if (!$stmt->fetch()) {
        throw new Exception('Table music_post_likes non trouvée');
    }

    // Récupérer l'utilisateur
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$_SESSION['discord_id']]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('Utilisateur non trouvé');
    }

    $post_id = (int)$data['post_id'];
    $user_id = $user['id'];

    // Vérifier si l'utilisateur a déjà liké
    $stmtCheck = $pdo->prepare("SELECT id FROM music_post_likes WHERE post_id = ? AND user_id = ?");
    $stmtCheck->execute([$post_id, $user_id]);
    $existing_like = $stmtCheck->fetch();

    if ($existing_like) {
        // Supprimer le like (unlike)
        $stmtDelete = $pdo->prepare("DELETE FROM music_post_likes WHERE post_id = ? AND user_id = ?");
        $stmtDelete->execute([$post_id, $user_id]);
        $action = 'unliked';
    } else {
        // Ajouter le like
        $stmtInsert = $pdo->prepare("INSERT INTO music_post_likes (post_id, user_id) VALUES (?, ?)");
        $stmtInsert->execute([$post_id, $user_id]);
        $action = 'liked';
    }

    // Compter le nouveau nombre de likes
    $stmtCount = $pdo->prepare("SELECT COUNT(*) as like_count FROM music_post_likes WHERE post_id = ?");
    $stmtCount->execute([$post_id]);
    $count = $stmtCount->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'action' => $action,
        'like_count' => (int)$count['like_count']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur: ' . $e->getMessage()]);
}