<?php
require_once __DIR__ . '/db.php'; // Remonte d'un dossier pour trouver db.php

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

$pdo = getDBConnection();

$stmt = $pdo->query("
    SELECT 
        u.username,
        u.avatar_hash,
        u.discord_id,
        m.title,
        m.poster_path,
        m.api_movie_id,
        r.rating,
        r.watched_at
    FROM user_movie_ratings r
    JOIN users u ON r.user_id = u.id
    JOIN movies m ON r.movie_id = m.id
    ORDER BY r.watched_at DESC
    LIMIT 30
");

$movies = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($movies);