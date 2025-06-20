<?php
require_once __DIR__ . '/db.php';

// Configuration de la session (doit être identique à callback.php)
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();

// Configuration des en-têtes CORS
header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

$discord_id_to_fetch = null;

// On regarde si un ID spécifique est demandé (pour voir le profil d'un autre)
if (isset($_GET['discord_id'])) {
    $discord_id_to_fetch = $_GET['discord_id'];
} 
// Sinon, on prend celui de la session (pour voir son propre profil)
else if (isset($_SESSION['discord_id'])) {
    $discord_id_to_fetch = $_SESSION['discord_id'];
}

if ($discord_id_to_fetch) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE discord_id = ?"); 
    $stmt->execute([$discord_id_to_fetch]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $user['profile_complete'] = (bool) $user['profile_complete'];
        // On ajoute une information pour savoir si c'est notre propre profil
        $user['is_own_profile'] = isset($_SESSION['discord_id']) && ($user['discord_id'] === $_SESSION['discord_id']);
        echo json_encode(['user' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Utilisateur non trouvé.']);
    }
} else {
    http_response_code(401);
    echo json_encode(['message' => 'Non connecté ou aucun utilisateur spécifié.']);
}