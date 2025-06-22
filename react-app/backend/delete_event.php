<?php
require_once __DIR__ . '/db.php';

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
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

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->event_id)) {
    http_response_code(400);
    echo json_encode(['message' => 'ID de l\'événement manquant.']);
    exit;
}

$event_id = $data->event_id;
$discord_id = $_SESSION['discord_id'];
$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    // Get current user's DB ID
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$discord_id]);
    $user = $stmtUser->fetch();
    if (!$user) {
        throw new Exception("Utilisateur non trouvé.", 404);
    }
    $user_id = $user['id'];

    // Get event creator's ID
    $stmtEvent = $pdo->prepare("SELECT creator_id FROM events WHERE id = ?");
    $stmtEvent->execute([$event_id]);
    $event = $stmtEvent->fetch();
    if (!$event) {
        throw new Exception("Événement non trouvé.", 404);
    }

    // Check ownership
    if ($event['creator_id'] !== $user_id) {
        throw new Exception("Action non autorisée. Vous n'êtes pas le créateur de cet événement.", 403);
    }
    
    // 1. Get media file paths before deleting DB records
    $stmtMedia = $pdo->prepare("SELECT file_path, thumbnail_path FROM event_media WHERE event_id = ?");
    $stmtMedia->execute([$event_id]);
    $media_files = $stmtMedia->fetchAll(PDO::FETCH_ASSOC);

    // 2. Delete DB records
    $pdo->prepare("DELETE FROM event_attendees WHERE event_id = ?")->execute([$event_id]);
    $pdo->prepare("DELETE FROM event_media WHERE event_id = ?")->execute([$event_id]);
    $pdo->prepare("DELETE FROM events WHERE id = ?")->execute([$event_id]);
    
    // 3. Delete files from server
    $base_path = dirname(__DIR__); // Should point to /react-app
    foreach ($media_files as $file) {
        if ($file['file_path'] && file_exists($base_path . '/' . $file['file_path'])) {
            unlink($base_path . '/' . $file['file_path']);
        }
        if ($file['thumbnail_path'] && file_exists($base_path . '/' . $file['thumbnail_path'])) {
            unlink($base_path . '/' . $file['thumbnail_path']);
        }
    }

    $pdo->commit();
    http_response_code(200);
    echo json_encode(['message' => 'Événement supprimé avec succès.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $code = is_int($e->getCode()) && $e->getCode() !== 0 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(['message' => $e->getMessage()]);
} 