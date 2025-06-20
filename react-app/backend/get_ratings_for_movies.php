<?php
// get_ratings_for_movies.php

// Démarrer la session en premier
session_start();

// Activation du rapport d'erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// En-têtes CORS
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-control-allow-headers: content-type, authorization");
header('Content-Type: application/json');

// Gérer la requête pre-flight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204); // No Content
    exit();
}

require 'db.php'; // Inclure la connexion à la BDD

// La ligne qui manquait est juste au-dessus.
// Maintenant, on peut initialiser la connexion.
$pdo = getDBConnection();

$api_movie_ids_str = $_GET['ids'] ?? '';

if (empty($api_movie_ids_str)) {
    echo json_encode([]);
    exit;
}

// Nettoyer les IDs reçus
$api_movie_ids = explode(',', $api_movie_ids_str);
$sanitized_ids = array_filter(array_map('intval', $api_movie_ids));

if (empty($sanitized_ids)) {
    echo json_encode([]);
    exit;
}

$placeholders = implode(',', array_fill(0, count($sanitized_ids), '?'));
$results = [];

try {
    // Étape 1: Obtenir les notes moyennes et le nombre de votes pour tous les films demandés
    $sql_avg = "
        SELECT m.api_movie_id, AVG(umr.rating) as average_rating, COUNT(umr.rating) as rating_count
        FROM movies m
        JOIN user_movie_ratings umr ON m.id = umr.movie_id
        WHERE m.api_movie_id IN ($placeholders)
        GROUP BY m.api_movie_id
    ";

    $stmt_avg = $pdo->prepare($sql_avg);
    $stmt_avg->execute($sanitized_ids);
    $avg_ratings = $stmt_avg->fetchAll(PDO::FETCH_ASSOC);

    // Initialiser le tableau de résultats avec les notes moyennes
    foreach ($avg_ratings as $row) {
        $results[$row['api_movie_id']] = [
            'average_rating' => round($row['average_rating'], 1),
            'rating_count' => (int)$row['rating_count'],
            'raters' => []
        ];
    }

    // Étape 2: Pour chaque film qui a des notes, obtenir les 3 derniers évaluateurs
    $sql_raters = "
        SELECT 
            m.api_movie_id, 
            u.discord_id, 
            u.username, 
            u.avatar_hash, 
            umr.rating,
            umr.watched_at
        FROM user_movie_ratings umr
        JOIN users u ON umr.user_id = u.id
        JOIN movies m ON umr.movie_id = m.id
        WHERE m.api_movie_id IN ($placeholders)
        ORDER BY m.api_movie_id, umr.watched_at DESC
    ";

    $stmt_raters_all = $pdo->prepare($sql_raters);
    $stmt_raters_all->execute($sanitized_ids);
    $all_raters = $stmt_raters_all->fetchAll(PDO::FETCH_ASSOC);

    $raters_by_movie = [];
    foreach ($all_raters as $rater) {
        $raters_by_movie[$rater['api_movie_id']][] = $rater;
    }

    foreach ($raters_by_movie as $movie_id => $raters) {
        if (isset($results[$movie_id])) {
            // Garder seulement les 3 plus récents
            $results[$movie_id]['raters'] = array_slice($raters, 0, 3);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

echo json_encode($results);

?> 