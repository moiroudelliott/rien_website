<?php
require_once __DIR__ . '/db.php';

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-control-allow-methods: POST, OPTIONS");
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

$data = json_decode(file_get_contents("php://input"));

// Basic validation
if (!isset($data->event_id) || !isset($data->title) || !isset($data->event_date)) {
    http_response_code(400);
    echo json_encode(['message' => 'Données manquantes.']);
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
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("Utilisateur non trouvé.", 404);
    }
    $user_id = $user['id'];

    // Get event and verify ownership
    $stmtEvent = $pdo->prepare("SELECT creator_id FROM events WHERE id = ?");
    $stmtEvent->execute([$event_id]);
    $event = $stmtEvent->fetch(PDO::FETCH_ASSOC);
    if (!$event) {
        throw new Exception("Événement non trouvé.", 404);
    }
    if ($event['creator_id'] !== $user_id) {
        throw new Exception("Action non autorisée.", 403);
    }

    // Update the event
    $sql = "UPDATE events SET title = ?, description = ?, event_date = ?, location_text = ?, is_public = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data->title,
        $data->description ?? '',
        $data->event_date,
        $data->location_text ?? '',
        $data->is_public,
        $event_id
    ]);

    // Update attendees for private events
    if (!$data->is_public) {
        // Ensure attendees array exists
        if (!isset($data->attendees) || !is_array($data->attendees)) {
            $data->attendees = [];
        }
        // Ensure creator is in the attendees list for private events
        if (!in_array($user_id, $data->attendees)) {
            $data->attendees[] = $user_id;
        }

        // First, remove all existing attendees for this event
        $stmtDelete = $pdo->prepare("DELETE FROM event_attendees WHERE event_id = ?");
        $stmtDelete->execute([$event_id]);

        // Then, add the updated list of attendees
        if (!empty($data->attendees)) {
            $sqlInsert = "INSERT INTO event_attendees (event_id, user_id) VALUES ";
            $params = [];
            $placeholders = [];
            foreach ($data->attendees as $attendee_id) {
                $placeholders[] = "(?, ?)";
                array_push($params, $event_id, $attendee_id);
            }
            $sqlInsert .= implode(", ", $placeholders);
            $stmtInsert = $pdo->prepare($sqlInsert);
            $stmtInsert->execute($params);
        }
    } else {
        // If the event is made public, remove all existing attendee links
        $stmtDelete = $pdo->prepare("DELETE FROM event_attendees WHERE event_id = ?");
        $stmtDelete->execute([$event_id]);
    }

    $pdo->commit();
    http_response_code(200);
    echo json_encode(['message' => 'Événement mis à jour avec succès.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    $code = is_int($e->getCode()) && $e->getCode() !== 0 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(['message' => $e->getMessage()]);
}