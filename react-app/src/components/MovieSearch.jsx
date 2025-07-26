import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import '../styles/_moviesearch.css';
import MovieDetailModal from './MovieDetailModal';
import RatingModal from './RatingModal';

const MovieSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [topMovies, setTopMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    const [ratingsData, setRatingsData] = useState({});
    const [viewingMovieId, setViewingMovieId] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [ratingMovie, setRatingMovie] = useState(null);
    const [showingTopMovies, setShowingTopMovies] = useState(true);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchTopMovies = useCallback(async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/get_top_movies.php?limit=10`, { withCredentials: true });
            setTopMovies(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des top films:", error);
            setTopMovies([]);
        }
    }, [apiBaseUrl]);

    useEffect(() => {
        fetchTopMovies();
    }, [fetchTopMovies]);

    const searchMovies = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setShowingTopMovies(true);
            return;
        }
        setShowingTopMovies(false);
        setLoading(true);
        setError('');
        setRatingsData({});

        try {
            const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
            const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                params: {
                    api_key: tmdbApiKey,
                    query: searchQuery,
                    language: 'fr-FR',
                },
                withCredentials: false
            });
            const tmdbResults = response.data.results.filter(movie => movie.poster_path);
            setResults(tmdbResults);

            if (tmdbResults.length > 0) {
                const movieIds = tmdbResults.map(m => m.id).join(',');
                const ratingsResponse = await axios.get(`${apiBaseUrl}/get_ratings_for_movies.php?ids=${movieIds}`, { withCredentials: true });
                
                setRatingsData(ratingsResponse.data);
            }

        } catch (err) {
            setError('Erreur lors de la recherche de films.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    const openMovieDetails = useCallback((movieId) => {
        setViewingMovieId(movieId);
        setIsModalLoading(true);
        axios.get(`${apiBaseUrl}/get_movie_details.php?api_movie_id=${movieId}`, { withCredentials: true })
            .then(response => {
                setModalData(response.data);
            })
            .catch(error => {
                console.error("Erreur lors du chargement des détails du film:", error);
                setModalData(null);
            })
            .finally(() => {
                setIsModalLoading(false);
            });
    }, [apiBaseUrl]);

    const closeMovieDetails = () => {
        setViewingMovieId(null);
        setModalData(null);
    };

    const handleRatingSuccess = () => {
        if (viewingMovieId) {
            openMovieDetails(viewingMovieId);
        }
    };

    const handleRatingSuccessFromSearch = () => {
        setRatingMovie(null);
        if (showingTopMovies) {
            fetchTopMovies();
        } else {
            searchMovies(query);
        }
    };

    return (
        <div className="movie-search-container">
            <form onSubmit={(e) => {
                e.preventDefault();
                searchMovies(query);
            }} className="search-form">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un film..."
                    className="search-input"
                />
                <button type="submit" className="search-button" disabled={loading}>
                    {loading ? 'Recherche...' : 'Rechercher'}
                </button>
            </form>

            {showingTopMovies && (
                <div className="top-movies-section">
                    <h3 className="section-title">
                        🏆 Top Films du Rien 
                        <span className="score-info" title="Score calculé : (note moyenne × nb votes) / (nb votes + 3)">ℹ️</span>
                    </h3>
                    {topMovies.length === 0 && <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>Aucun film trouvé.</p>}
                    <div className="movie-results">
                        {topMovies.map((movie, index) => (
                            <div key={movie.api_movie_id} className="movie-card top-movie-card">
                                <div className="top-movie-rank">#{index + 1}</div>
                                <img 
                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/vite.svg'} 
                                    alt={movie.title} 
                                    onClick={() => openMovieDetails(movie.api_movie_id)}
                                />
                                <div className="movie-card-info">
                                    <div className="movie-card-top">
                                        <h4>{movie.title}</h4>
                                        <p>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                                    </div>

                                    <div className="movie-card-bottom">
                                        <div className="top-movie-stats">
                                            <div className="top-movie-rating">
                                                <span role="img" aria-label="Étoile">⭐</span>
                                                {movie.average_rating}/10
                                            </div>
                                            <div className="top-movie-votes">
                                                {movie.vote_count} vote{movie.vote_count > 1 ? 's' : ''}
                                            </div>
                                            <div className="top-movie-score">
                                                Score: {movie.popularity_score}
                                            </div>
                                        </div>
                                        
                                        <div className="movie-card-actions">
                                            <button className="details-button" onClick={() => openMovieDetails(movie.api_movie_id)}>
                                                Détails
                                            </button>
                                            <button className="rate-icon-button" title="Noter ce film" onClick={() => setRatingMovie(movie)}>
                                                ⭐
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="movie-results">
                {results.map(movie => {
                    const movieRatings = ratingsData[movie.id];
                    const hasValidRatings = movieRatings && movieRatings.raters && Array.isArray(movieRatings.raters);
                    
                    return (
                        <div key={movie.id} className="movie-card">
                            <img 
                                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                                alt={movie.title} 
                                onClick={() => openMovieDetails(movie.id)}
                            />
                            <div className="movie-card-info">
                                <div className="movie-card-top">
                                    <h4>{movie.title}</h4>
                                    <p>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                                </div>

                                <div className="movie-card-bottom">
                                    {hasValidRatings && (
                                        <div className="search-ratings-info">
                                            <div className="search-avg-rating">
                                                <span role="img" aria-label="Étoile">⭐</span>
                                                {movieRatings.average_rating}
                                            </div>
                                            <div className="search-raters-avatars">
                                                {movieRatings.raters.map(rater => (
                                                    <div key={rater.discord_id} className="rater-avatar" title={`${rater.username} a noté ${rater.rating}/10`}>
                                                        <img 
                                                            src={rater.avatar_hash ? `https://cdn.discordapp.com/avatars/${rater.discord_id}/${rater.avatar_hash}.png` : '/vite.svg'}
                                                            alt={rater.username}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="movie-card-actions">
                                        <button className="details-button" onClick={() => openMovieDetails(movie.id)}>
                                            Détails
                                        </button>
                                        <button className="rate-icon-button" title="Noter ce film" onClick={() => setRatingMovie(movie)}>
                                            ⭐
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {viewingMovieId && (
                <MovieDetailModal
                    isLoading={isModalLoading}
                    movie={modalData}
                    onClose={closeMovieDetails}
                    onRatingSuccess={handleRatingSuccess}
                />
            )}

            {ratingMovie && (
                <RatingModal
                    movie={ratingMovie}
                    onClose={() => setRatingMovie(null)}
                    onSubmit={handleRatingSuccessFromSearch}
                />
            )}
        </div>
    );
};

export default MovieSearch; 