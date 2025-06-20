<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';

session_start();

header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

$discord_id = $_GET['discord_id'] ?? null;

// Si aucun ID n'est fourni en paramètre, on prend celui de la session
if (!$discord_id) {
    if (!isset($_SESSION['discord_id'])) {
        // L'utilisateur n'est pas connecté et aucun ID n'est demandé
        http_response_code(401); // 401 Unauthorized
        echo json_encode(['message' => 'Utilisateur non authentifié.']);
        exit;
    }
    $discord_id = $_SESSION['discord_id'];
}

$pdo = getDBConnection();

$stmt = $pdo->prepare("
    SELECT 
        m.api_movie_id,
        m.title,
        m.poster_path,
        umr.rating, 
        umr.is_favorite
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    JOIN users u ON umr.user_id = u.id
    WHERE u.discord_id = ?
    ORDER BY umr.watched_at DESC
");
$stmt->execute([$discord_id]);
$usermovies = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($usermovies);