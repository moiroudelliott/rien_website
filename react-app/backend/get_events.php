<?php
require_once __DIR__ . '/db.php';

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
$discord_id = $_SESSION['discord_id'];

$pdo = getDBConnection();

try {
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$discord_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("Utilisateur non trouvé.");
    }
    $user_id = $user['id'];

    $stmtEvents = $pdo->prepare("
        SELECT 
            e.*, 
            u.username as creator_username
        FROM events e
        JOIN users u ON e.creator_id = u.id
        LEFT JOIN event_attendees ea ON e.id = ea.event_id
        WHERE e.is_public = 1 OR ea.user_id = ?
        GROUP BY e.id
        ORDER BY e.event_date DESC
    ");
    $stmtEvents->execute([$user_id]);
    $events = $stmtEvents->fetchAll(PDO::FETCH_ASSOC);

    $now = new DateTime();
    $future_events = [];
    $past_events = [];

    foreach ($events as $event) {
        $event_date = new DateTime($event['event_date']);
        if ($event_date >= $now) {
            $future_events[] = $event;
        } else {
            $past_events[] = $event;
        }
    }

    http_response_code(200);
    echo json_encode(['future_events' => $future_events, 'past_events' => $past_events]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 