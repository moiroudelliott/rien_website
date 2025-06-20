<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';

// ESSENTIEL : Configuration du cookie de session pour le cross-domain (HTTPS vers HTTPS)
// Doit être appelé AVANT session_start()
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,     // Requis car le backend et le frontend sont en HTTPS
    'httponly' => true,   // Sécurité : le cookie n'est pas accessible en JavaScript
    'samesite' => 'None'  // Requis pour que le cookie soit envoyé d'un domaine à un autre
]);

session_start();

$client = new GuzzleHttp\Client();

// 1. Échanger le code contre un token d'accès
try {
    $response = $client->post('https://discord.com/api/oauth2/token', [
        'form_params' => [
            'client_id' => $_ENV['DISCORD_CLIENT_ID'],
            'client_secret' => $_ENV['DISCORD_CLIENT_SECRET'],
            'grant_type' => 'authorization_code',
            'code' => $_GET['code'],
            'redirect_uri' => $_ENV['DISCORD_REDIRECT_URI'],
        ]
    ]);
    $tokenData = json_decode((string) $response->getBody(), true);
    $accessToken = $tokenData['access_token'];
} catch (Exception $e) {
    die('Erreur lors de la récupération du token.');
}

// 2. Utiliser le token pour récupérer les infos de l'utilisateur
try {
    $response = $client->get('https://discord.com/api/users/@me', [
        'headers' => ['Authorization' => 'Bearer ' . $accessToken]
    ]);
    $userData = json_decode((string) $response->getBody(), true);
} catch (Exception $e) {
    die('Erreur lors de la récupération des infos utilisateur.');
}

// 3. Enregistrer ou mettre à jour l'utilisateur en BDD
$pdo = getDBConnection();
$stmt = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
$stmt->execute([$userData['id']]);

if ($stmt->fetch()) {
    $stmt = $pdo->prepare("UPDATE users SET username = ?, avatar_hash = ? WHERE discord_id = ?");
    $stmt->execute([$userData['username'], $userData['avatar'], $userData['id']]);
} else {
    $stmt = $pdo->prepare("INSERT INTO users (discord_id, username, avatar_hash) VALUES (?, ?, ?)");
    $stmt->execute([$userData['id'], $userData['username'], $userData['avatar']]);
}

// 4. Stocker l'ID Discord dans la session, ce qui crée le cookie
$_SESSION['discord_id'] = $userData['id'];

// 5. Rediriger vers le frontend React (qui est maintenant en HTTPS)
header('Location: ' . $_ENV['APP_FRONTEND_URL']);
exit();