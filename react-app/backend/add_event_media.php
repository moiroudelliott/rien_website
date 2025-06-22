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
$discord_id = $_SESSION['discord_id'];

if (!isset($_POST['event_id']) || !isset($_FILES['media'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Données manquantes : event_id ou fichier media manquant.']);
    exit;
}

$event_id = $_POST['event_id'];
$media_file = $_FILES['media'];

// Basic validation for the uploaded file
if ($media_file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['message' => 'Erreur lors du téléversement du fichier.']);
    exit;
}

$file_type = mime_content_type($media_file['tmp_name']);
$media_type = 'photo'; // Default
if (strpos($file_type, 'video') === 0) {
    $media_type = 'video';
} elseif (strpos($file_type, 'image') === 0) {
    $media_type = 'photo';
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Type de fichier non supporté.']);
    exit;
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$discord_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) throw new Exception("Utilisateur non trouvé.");
    $uploader_id = $user['id'];

    // Check if user has access to the event
    $stmtEvent = $pdo->prepare("SELECT is_public FROM events WHERE id = ?");
    $stmtEvent->execute([$event_id]);
    $event = $stmtEvent->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        throw new Exception("Événement non trouvé.");
    }

    if (!$event['is_public']) {
        $stmtCheckAttendee = $pdo->prepare("SELECT 1 FROM event_attendees WHERE event_id = ? AND user_id = ?");
        $stmtCheckAttendee->execute([$event_id, $uploader_id]);
        if (!$stmtCheckAttendee->fetch()) {
            http_response_code(403);
            throw new Exception("Accès non autorisé pour ajouter un média à cet événement.");
        }
    }

    // Process file upload
    // Use dirname(__DIR__) for more robust pathing relative to the /backend directory
    $upload_dir = dirname(__DIR__) . '/event_media/';

    // Check if the base directory exists and is writable
    if (!is_dir($upload_dir)) {
        // Attempt to create it if it doesn't exist
        if (!mkdir($upload_dir, 0755, true)) {
            throw new Exception("Le dossier de destination '{$upload_dir}' n'existe pas et n'a pas pu être créé.");
        }
    }
    if (!is_writable($upload_dir)) {
        throw new Exception("Permissions insuffisantes. Le serveur web n'a pas le droit d'écrire dans '{$upload_dir}'.");
    }
    
    $file_extension = pathinfo($media_file['name'], PATHINFO_EXTENSION);
    $new_filename = uniqid('event_'. $event_id . '_', true) . '.' . $file_extension;
    $upload_file_path = $upload_dir . $new_filename;

    if (!move_uploaded_file($media_file['tmp_name'], $upload_file_path)) {
        $error = error_get_last();
        throw new Exception("Impossible de déplacer le fichier téléversé. Erreur PHP: " . ($error['message'] ?? 'inconnue'));
    }
    
    $public_file_path = 'event_media/' . $new_filename;
    $public_thumbnail_path = null;

    // Check if a thumbnail was uploaded from the client
    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
        $thumbnail_dir = $upload_dir . 'thumbnails/';
        if (!is_dir($thumbnail_dir)) {
            if (!mkdir($thumbnail_dir, 0755, true)) {
                // We don't throw an error here to allow the main video to be uploaded anyway
                error_log("Could not create thumbnail directory: {$thumbnail_dir}");
            }
        }
        
        if (is_dir($thumbnail_dir) && is_writable($thumbnail_dir)) {
            $thumbnail_filename = 'thumb_' . pathinfo($new_filename, PATHINFO_FILENAME) . '.jpg';
            $thumbnail_path = $thumbnail_dir . $thumbnail_filename;
            
            if (move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbnail_path)) {
                $public_thumbnail_path = 'event_media/thumbnails/' . $thumbnail_filename;
            } else {
                error_log("Could not move uploaded thumbnail to {$thumbnail_path}");
            }
        }
    }

    $stmtInsertMedia = $pdo->prepare("
        INSERT INTO event_media (event_id, uploader_id, media_type, file_path, thumbnail_path)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmtInsertMedia->execute([$event_id, $uploader_id, $media_type, $public_file_path, $public_thumbnail_path]);

    $pdo->commit();

    // Temporary debug info
    $debug_info = [
        'thumbnail_exists' => isset($_FILES['thumbnail']),
        'thumbnail_error' => isset($_FILES['thumbnail']) ? $_FILES['thumbnail']['error'] : 'not_set',
    ];

    http_response_code(201);
    echo json_encode(['message' => 'Média ajouté avec succès.', 'file_path' => $public_file_path, 'debug' => $debug_info]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    // Be careful with error messages in production
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
} 