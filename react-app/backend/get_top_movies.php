<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

try {
    $pdo = getDBConnection();
    
    $limit = $_GET['limit'] ?? 10;
    $limit = (int)min(max((int)$limit, 1), 50);
    
    // Version ultra simple : récupérer quelques films avec notes moyennes
    $sql = "
        SELECT 
            m.api_movie_id,
            m.title,
            m.poster_path,
            m.release_date,
            m.overview,
            AVG(umr.rating) as avg_rating,
            COUNT(umr.rating) as nb_votes
        FROM movies m, user_movie_ratings umr
        WHERE m.id = umr.movie_id
        GROUP BY m.id, m.api_movie_id, m.title, m.poster_path, m.release_date, m.overview
        ORDER BY avg_rating DESC
        LIMIT " . $limit;

    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calcul du score en PHP
    $formatted_results = [];
    foreach ($results as $movie) {
        $avg_rating = (float)$movie['avg_rating'];
        $vote_count = (int)$movie['nb_votes'];
        $popularity_score = ($avg_rating * $vote_count) / ($vote_count + 3);
        
        $formatted_results[] = [
            'api_movie_id' => (int)$movie['api_movie_id'],
            'title' => $movie['title'],
            'poster_path' => $movie['poster_path'],
            'release_date' => $movie['release_date'],
            'overview' => $movie['overview'],
            'average_rating' => round($avg_rating, 1),
            'vote_count' => $vote_count,
            'popularity_score' => round($popularity_score, 2)
        ];
    }
    
    // Retrier par score de popularité
    usort($formatted_results, function($a, $b) {
        return $b['popularity_score'] <=> $a['popularity_score'];
    });

    echo json_encode($formatted_results);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}