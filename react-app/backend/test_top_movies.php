<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Test très simple
echo json_encode([
    [
        'api_movie_id' => 123,
        'title' => 'Film Test',
        'poster_path' => null,
        'release_date' => '2023-01-01',
        'overview' => 'Test overview',
        'average_rating' => 8.5,
        'vote_count' => 5,
        'popularity_score' => 5.3
    ]
]);