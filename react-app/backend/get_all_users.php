<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

$pdo = getDBConnection();

// On sélectionne maintenant les colonnes utiles pour la CARTE ET les profils,
// et on s'assure de ne prendre que les utilisateurs qui ont des coordonnées.
$stmt = $pdo->query("
    SELECT 
        discord_id, 
        username, 
        avatar_hash, 
        first_name, 
        last_name,
        latitude,
        longitude
    FROM users 
    WHERE profile_complete = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY username
");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
