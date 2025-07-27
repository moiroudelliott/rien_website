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
    $current_user_discord_id = $_SESSION['discord_id'] ?? null;
    error_log("Current user discord_id from session: " . ($current_user_discord_id ?? 'NULL'));
    $sql_raters = "
        SELECT 
            m.api_movie_id, 
            u.discord_id, 
            u.username, 
            u.avatar_hash, 
            umr.rating,
            umr.is_favorite,
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
        // Ajouter le flag is_current_user
        $is_current = ($current_user_discord_id && $rater['discord_id'] === $current_user_discord_id);
        $rater['is_current_user'] = $is_current;
        error_log("Rater discord_id: " . $rater['discord_id'] . ", Current user: " . ($current_user_discord_id ?? 'NULL') . ", is_current_user: " . ($is_current ? 'true' : 'false'));
        $raters_by_movie[$rater['api_movie_id']][] = $rater;
    }

    foreach ($raters_by_movie as $movie_id => $raters) {
        if (isset($results[$movie_id])) {
            // S'assurer que l'utilisateur actuel est inclus s'il a noté le film
            $current_user_rater = null;
            $other_raters = [];
            
            foreach ($raters as $rater) {
                if ($rater['is_current_user']) {
                    $current_user_rater = $rater;
                } else {
                    $other_raters[] = $rater;
                }
            }
            
            // Commencer par l'utilisateur actuel s'il existe, puis ajouter les autres
            $final_raters = [];
            if ($current_user_rater) {
                $final_raters[] = $current_user_rater;
                // Ajouter jusqu'à 2 autres utilisateurs pour faire un total de 3
                $final_raters = array_merge($final_raters, array_slice($other_raters, 0, 2));
            } else {
                // Si pas d'utilisateur actuel, prendre les 3 premiers
                $final_raters = array_slice($other_raters, 0, 3);
            }
            
            $results[$movie_id]['raters'] = $final_raters;
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

// Debug log
error_log("get_ratings_for_movies results: " . json_encode($results));
echo json_encode($results);

?> 