<?php
require_once __DIR__ . '/db.php';

// --- AJOUT IMPORTANT ---
// Configuration de la session identique à me.php pour assurer la cohérence
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'domain' => '',
    'secure' => true, 'httponly' => true, 'samesite' => 'None'
]);
session_start();
// --- FIN DE L'AJOUT ---

header("Access-Control-Allow-Origin: " . $_ENV['APP_FRONTEND_URL']);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Gérer la requête preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// La vérification fonctionnera maintenant car la session est démarrée
if (!isset($_SESSION['discord_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Utilisateur non authentifié.']);
    exit;
}
$discord_id = $_SESSION['discord_id'];

$data = json_decode(file_get_contents('php://input'), true);

// Validation des données reçues
$required_fields = ['api_movie_id', 'title', 'rating'];
foreach($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['message' => "Le champ '$field' est manquant ou vide."]);
        exit;
    }
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    // 1. Récupérer l'ID interne de l'utilisateur
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE discord_id = ?");
    $stmtUser->execute([$discord_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if (!$user) throw new Exception("Utilisateur non trouvé.");
    $user_id = $user['id'];

    // 2. Chercher si le film existe déjà dans notre base de données
    $stmtFindMovie = $pdo->prepare("SELECT id FROM movies WHERE api_movie_id = ?");
    $stmtFindMovie->execute([$data['api_movie_id']]);
    $movie = $stmtFindMovie->fetch(PDO::FETCH_ASSOC);
    $movie_id = null;

    if ($movie) {
        // Le film existe, on utilise son ID
        $movie_id = $movie['id'];
    } else {
        // Le film n'existe pas, on l'insère
        $stmtInsertMovie = $pdo->prepare("
            INSERT INTO movies (api_movie_id, title, poster_path, release_date, overview) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmtInsertMovie->execute([
            $data['api_movie_id'],
            $data['title'],
            $data['poster_path'] ?? null,
            $data['release_date'] ?? null,
            $data['overview'] ?? null
        ]);
        // On récupère l'ID du film nouvellement créé
        $movie_id = $pdo->lastInsertId();
    }

    if (!$movie_id) {
        throw new Exception("Erreur critique lors de la création ou récupération du film.");
    }

    // 3. Gestion du film favori
    $is_favorite = !empty($data['is_favorite']);
    if ($is_favorite) {
        $stmtUnsetFavorite = $pdo->prepare("UPDATE user_movie_ratings SET is_favorite = FALSE WHERE user_id = ?");
        $stmtUnsetFavorite->execute([$user_id]);
    }

    // 4. Insérer ou mettre à jour la note
    $stmtRate = $pdo->prepare("
        INSERT INTO user_movie_ratings (user_id, movie_id, rating, is_favorite)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating), is_favorite = VALUES(is_favorite)
    ");
    $stmtRate->execute([
        $user_id,
        $movie_id,
        $data['rating'],
        $is_favorite
    ]);

    $pdo->commit();

    http_response_code(200);
    echo json_encode(['message' => 'Film noté avec succès.']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['message' => 'Erreur serveur: ' . $e->getMessage()]);
}