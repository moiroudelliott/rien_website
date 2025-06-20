<?php
// backend/login.php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

session_start();

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