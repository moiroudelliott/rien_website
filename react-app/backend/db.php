<?php
require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement depuis le fichier .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// --- Configuration centralisée de la session ---
// Définir une durée de vie de 30 jours
$session_lifetime = 30 * 24 * 60 * 60; // 30 jours en secondes

ini_set('session.gc_maxlifetime', $session_lifetime);
session_set_cookie_params([
    'lifetime' => $session_lifetime,
    'path' => '/',
    'domain' => '', // Mettre votre domaine si nécessaire
    'secure' => true, // Important pour HTTPS
    'httponly' => true, // Empêche l'accès via JavaScript
    'samesite' => 'None' // Requis pour les appels cross-site avec credentials
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// --- Fin de la configuration de la session ---

function getDBConnection() {
    $host = $_ENV['DB_HOST'];
    $dbname = $_ENV['DB_NAME'];
    $user = $_ENV['DB_USER'];
    $pass = $_ENV['DB_PASS'];

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        // Optionnel : renvoyer les résultats sous forme d'objets associatifs par défaut
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        // En production, ne jamais afficher les détails de l'erreur au client.
        // Vous devriez logger cette erreur dans un fichier.
        http_response_code(500);
        die(json_encode(['message' => 'Erreur interne du serveur.']));
    }
}