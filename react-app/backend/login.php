<?php
// backend/login.php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/vendor/autoload.php';

// Le démarrage et la configuration de la session sont maintenant gérés dans db.php

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Détermine si la demande vient du développement ou de la production
// 'from=dev' sera ajouté à l'URL par notre app React locale
$isDev = isset($_GET['from']) && $_GET['from'] === 'dev';

// Le 'state' va nous permettre de savoir où rediriger à la fin
$state = $isDev ? 'dev' : 'prod';

$queryParams = http_build_query([
    'client_id' => $_ENV['DISCORD_CLIENT_ID'],
    'redirect_uri' => $_ENV['DISCORD_REDIRECT_URI'],
    'response_type' => 'code',
    'scope' => 'identify',
    'state' => $state // On envoie le state à Discord
]);

$discordLoginUrl = "https://discord.com/api/oauth2/authorize?" . $queryParams;

header('Location: ' . $discordLoginUrl);
exit();