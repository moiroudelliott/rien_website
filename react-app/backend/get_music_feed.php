<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

try {
    $pdo = getDBConnection();

    // D'abord vérifier si les tables existent
    $stmt = $pdo->query("SHOW TABLES LIKE 'music_posts'");
    if (!$stmt->fetch()) {
        // La table n'existe pas, retourner un tableau vide
        echo json_encode([]);
        exit;
    }

    // Essayer une requête très simple
    $sql = "SELECT COUNT(*) as count FROM music_posts";
    $stmt = $pdo->query($sql);
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($count == 0) {
        // Pas de posts, retourner tableau vide
        echo json_encode([]);
        exit;
    }

    // Si on arrive ici, récupérer les posts
    $sql = "
        SELECT 
            mp.id,
            mp.text_content,
            mp.spotify_url,
            mp.spotify_track_id,
            mp.created_at,
            u.username,
            u.avatar_hash,
            u.discord_id
        FROM music_posts mp, users u
        WHERE mp.user_id = u.id
        ORDER BY mp.created_at DESC
        LIMIT 10
    ";

    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupérer l'utilisateur actuel pour vérifier ses likes
    $current_user_discord_id = $_SESSION['discord_id'] ?? null;
    $current_user_id = null;
    
    if ($current_user_discord_id) {
        $stmtCurrentUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
        $stmtCurrentUser->execute([$current_user_discord_id]);
        $currentUser = $stmtCurrentUser->fetch(PDO::FETCH_ASSOC);
        $current_user_id = $currentUser ? $currentUser['id'] : null;
    }

    $formatted_results = [];
    foreach ($results as $post) {
        // Compter les likes pour ce post
        $stmtLikes = $pdo->prepare("SELECT COUNT(*) as like_count FROM music_post_likes WHERE post_id = ?");
        $stmtLikes->execute([$post['id']]);
        $likeCount = $stmtLikes->fetch(PDO::FETCH_ASSOC)['like_count'];
        
        // Vérifier si l'utilisateur actuel a liké
        $userHasLiked = false;
        if ($current_user_id) {
            $stmtUserLike = $pdo->prepare("SELECT 1 FROM music_post_likes WHERE post_id = ? AND user_id = ?");
            $stmtUserLike->execute([$post['id'], $current_user_id]);
            $userHasLiked = $stmtUserLike->fetch() ? true : false;
        }
        
        $formatted_results[] = [
            'id' => (int)$post['id'],
            'text_content' => $post['text_content'],
            'spotify_url' => $post['spotify_url'],
            'spotify_track_id' => $post['spotify_track_id'],
            'created_at' => $post['created_at'],
            'user' => [
                'username' => $post['username'],
                'avatar_hash' => $post['avatar_hash'],
                'discord_id' => $post['discord_id']
            ],
            'like_count' => (int)$likeCount,
            'user_has_liked' => $userHasLiked
        ];
    }

    echo json_encode($formatted_results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}