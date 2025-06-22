<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

$pdo = getDBConnection();

// On récupère les utilisateurs qui ont un profil complet.
// On inclut maintenant l'ID interne pour les invitations.
$query = "
    SELECT 
        id, -- Ajout de l'ID interne
        discord_id, 
        username, 
        avatar_hash, 
        first_name, 
        last_name,
        latitude,
        longitude
    FROM users 
    WHERE profile_complete = TRUE
    ORDER BY username
";

// Si le paramètre 'with_location' est présent, on ne retourne que les utilisateurs localisés.
if (isset($_GET['with_location']) && $_GET['with_location'] === 'true') {
    $query = "
        SELECT 
            id, 
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
    ";
}

$stmt = $pdo->query($query);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
