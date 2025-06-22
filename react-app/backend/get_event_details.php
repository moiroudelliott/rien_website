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

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'ID de l\'événement manquant.']);
    exit;
}
$event_id = $_GET['id'];

$pdo = getDBConnection();

try {
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$discord_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) throw new Exception("Utilisateur non trouvé.");
    $user_id = $user['id'];

    $stmtEvent = $pdo->prepare("
        SELECT e.*, u.username as creator_username, u.avatar_hash as creator_avatar
        FROM events e
        JOIN users u ON e.creator_id = u.id
        WHERE e.id = ?
    ");
    $stmtEvent->execute([$event_id]);
    $event = $stmtEvent->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(404);
        echo json_encode(['message' => 'Événement non trouvé.']);
        exit;
    }

    // Check for access based on the attendee list for private events
    $is_attendee = false;
    if (!$event['is_public']) {
        $stmtCheckAttendee = $pdo->prepare("SELECT 1 FROM event_attendees WHERE event_id = ? AND user_id = ?");
        $stmtCheckAttendee->execute([$event_id, $user_id]);
        if ($stmtCheckAttendee->fetch()) {
            $is_attendee = true;
        }
    }

    if (!$event['is_public'] && !$is_attendee) {
        http_response_code(403);
        echo json_encode(['message' => 'Accès non autorisé à cet événement.']);
        exit;
    }

    // Fetch attendees only for private events
    $attendees = [];
    if (!$event['is_public']) {
        $stmtAttendees = $pdo->prepare("
            SELECT u.id, u.discord_id, u.username, u.avatar_hash
            FROM users u
            JOIN event_attendees ea ON u.id = ea.user_id
            WHERE ea.event_id = ?
        ");
        $stmtAttendees->execute([$event_id]);
        $attendees = $stmtAttendees->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Fetch media
    $stmtMedia = $pdo->prepare("SELECT id, media_type, file_path, thumbnail_path, uploader_id, uploaded_at FROM event_media WHERE event_id = ? ORDER BY uploaded_at DESC");
    $stmtMedia->execute([$event_id]);
    $media = $stmtMedia->fetchAll(PDO::FETCH_ASSOC);

    $event['attendees'] = $attendees;
    $event['media'] = $media;

    http_response_code(200);
    echo json_encode($event);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 