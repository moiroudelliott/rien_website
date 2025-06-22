<?php
require_once __DIR__ . '/db.php';

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();

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
$discord_id = $_SESSION['discord_id'];

$data = json_decode(file_get_contents('php://input'), true);

$required_fields = ['title', 'event_date', 'location_text', 'latitude', 'longitude', 'is_public'];
foreach($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['message' => "Le champ '$field' est manquant."]);
        exit;
    }
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$discord_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("Utilisateur créateur non trouvé.");
    }
    $creator_id = $user['id'];

    $stmtInsertEvent = $pdo->prepare("
        INSERT INTO events (title, description, event_date, creator_id, location_text, latitude, longitude, is_public) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmtInsertEvent->execute([
        $data['title'],
        $data['description'] ?? null,
        $data['event_date'],
        $creator_id,
        $data['location_text'],
        $data['latitude'],
        $data['longitude'],
        $data['is_public']
    ]);
    $event_id = $pdo->lastInsertId();

    // Ensure creator is in the attendees list for private events
    if (!$data['is_public']) {
        if (!in_array($creator_id, $data['attendees'])) {
            $data['attendees'][] = $creator_id;
        }
    }

    // Add attendees for private events
    if (!$data['is_public'] && !empty($data['attendees'])) {
        $sql = "INSERT INTO event_attendees (event_id, user_id) VALUES ";
        $params = [];
        $placeholders = [];
        foreach ($data['attendees'] as $attendee_id) {
            $placeholders[] = "(?, ?)";
            $params[] = $event_id;
            $params[] = $attendee_id;
        }
        $stmtInsertAttendee = $pdo->prepare($sql . implode(', ', $placeholders));
        $stmtInsertAttendee->execute($params);
    }

    $pdo->commit();

    http_response_code(201);
    echo json_encode(['message' => 'Événement créé avec succès.', 'event_id' => $event_id]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 