<?php
session_start();

// En-têtes CORS
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$api_movie_id = $_GET['api_movie_id'] ?? null;
if (!$api_movie_id) {
    http_response_code(400);
    echo json_encode(['message' => 'api_movie_id manquant']);
    exit;
}

$pdo = getDBConnection();
$user_discord_id = $_SESSION['discord_id'] ?? null;

try {
    // Étape 1: Chercher le film dans notre base
    $stmtFindMovie = $pdo->prepare("SELECT * FROM movies WHERE api_movie_id = ?");
    $stmtFindMovie->execute([$api_movie_id]);
    $movie_in_db = $stmtFindMovie->fetch(PDO::FETCH_ASSOC);

    // Étape 2: Si le film n'existe pas, le récupérer de TMDB et l'insérer
    if (!$movie_in_db) {
        $tmdb_api_key = $_ENV['VITE_TMDB_API_KEY'];
        if (!$tmdb_api_key) {
            throw new Exception("Clé API TMDB non configurée sur le serveur.");
        }

        $client = new GuzzleHttp\Client();
        $tmdb_response = $client->request('GET', "https://api.themoviedb.org/3/movie/{$api_movie_id}", [
            'query' => [
                'api_key' => $tmdb_api_key,
                'language' => 'fr-FR'
            ]
        ]);

        if ($tmdb_response->getStatusCode() === 200) {
            $data = json_decode($tmdb_response->getBody(), true);

            $sql_insert = "INSERT INTO movies (api_movie_id, title, overview, release_date, poster_path) VALUES (?, ?, ?, ?, ?)";
            $stmt_insert = $pdo->prepare($sql_insert);
            $stmt_insert->execute([
                $data['id'],
                $data['title'],
                $data['overview'],
                $data['release_date'],
                $data['poster_path']
            ]);

            // Après l'insertion, on refait une recherche pour obtenir le film complet
            $stmtFindMovie->execute([$api_movie_id]);
            $movie_in_db = $stmtFindMovie->fetch(PDO::FETCH_ASSOC);
        } else {
             throw new Exception("Film non trouvé sur TMDB.");
        }
    }
    
    // Si à ce stade nous n'avons toujours pas de film, c'est une erreur critique
    if (!$movie_in_db) {
        throw new Exception("Impossible de trouver ou de créer le film avec l'ID TMDB " . $api_movie_id);
    }

    $movie_id_internal = $movie_in_db['id'];

    // Récupérer les détails du film et les infos de l'utilisateur en une fois
    $sql_details = "
        SELECT 
            m.*,
            (SELECT AVG(rating) FROM user_movie_ratings WHERE movie_id = m.id) as average_rating,
            umr.rating as user_rating,
            umr.is_favorite as user_is_favorite
        FROM movies m
        LEFT JOIN user_movie_ratings umr ON m.id = umr.movie_id AND umr.user_id = (SELECT id FROM users WHERE discord_id = ? LIMIT 1)
        WHERE m.id = ?
    ";
    $stmt_details = $pdo->prepare($sql_details);
    $stmt_details->execute([$user_discord_id, $movie_id_internal]);
    $movie_details = $stmt_details->fetch(PDO::FETCH_ASSOC);

    $movie_details['average_rating'] = $movie_details['average_rating'] ? round($movie_details['average_rating'], 1) : null;
    
    // Chercher le favori actuel SEULEMENT si le film consulté n'est pas déjà le favori
    $movie_details['current_favorite_to_replace'] = null;
    if ($user_discord_id && !$movie_details['user_is_favorite']) {
        $stmt_fav = $pdo->prepare("
            SELECT m.title FROM movies m
            JOIN user_movie_ratings umr ON m.id = umr.movie_id
            WHERE umr.is_favorite = 1 AND umr.user_id = (SELECT id FROM users WHERE discord_id = ?)
            LIMIT 1
        ");
        $stmt_fav->execute([$user_discord_id]);
        if ($fav_movie = $stmt_fav->fetch(PDO::FETCH_ASSOC)) {
            $movie_details['current_favorite_to_replace'] = $fav_movie['title'];
        }
    }

    // Étape 4: Récupérer les notes des utilisateurs
    $sql_ratings = "
        SELECT u.discord_id, u.username, u.avatar_hash, umr.rating 
        FROM user_movie_ratings umr
        JOIN users u ON umr.user_id = u.id
        WHERE umr.movie_id = ?
        ORDER BY umr.watched_at DESC
    ";
    $stmt_ratings = $pdo->prepare($sql_ratings);
    $stmt_ratings->execute([$movie_id_internal]);
    $ratings = $stmt_ratings->fetchAll(PDO::FETCH_ASSOC);
    
    $movie_details['ratings'] = $ratings;

    header('Content-Type: application/json');
    echo json_encode($movie_details);

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Erreur interne du serveur.',
        'error' => $e->getMessage()
    ]);
}