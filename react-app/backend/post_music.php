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

if (!isset($_SESSION['discord_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Utilisateur non authentifié.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['spotify_url'])) {
    http_response_code(400);
    echo json_encode(['message' => 'URL Spotify manquante.']);
    exit;
}

$pdo = getDBConnection();

try {
    // Récupérer l'ID interne de l'utilisateur
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$_SESSION['discord_id']]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception("Utilisateur non trouvé.");
    }

    // Extraire l'ID de track Spotify depuis l'URL (gère intl-fr et autres variantes)
    $spotify_url = $data['spotify_url'];
    $track_id = null;
    
    // Utiliser parse_url pour ignorer les paramètres
    $parsed_url = parse_url($spotify_url);
    $path = $parsed_url['path'] ?? '';
    
    if (preg_match('/\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)$/', $path, $matches)) {
        $track_id = $matches[1];
    }

    // Debug : log l'extraction de l'ID
    error_log("URL: " . $spotify_url);
    error_log("Track ID extrait: " . ($track_id ?? 'NULL'));

    // Insérer le post
    $stmt = $pdo->prepare("
        INSERT INTO music_posts (user_id, text_content, spotify_url, spotify_track_id) 
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $user['id'],
        $data['text_content'] ?? '',
        $spotify_url,
        $track_id
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Post ajouté avec succès!',
        'post_id' => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
}