import React, { useState, useCallback } from 'react';
import axios from 'axios';
import '../styles/_moviesearch.css';
import MovieDetailModal from './MovieDetailModal';
import RatingModal from './RatingModal';

const MovieSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    const [ratingsData, setRatingsData] = useState({});
    const [viewingMovieId, setViewingMovieId] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [ratingMovie, setRatingMovie] = useState(null);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    const searchMovies = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
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
                
                console.log("Données de notation reçues du serveur :", ratingsResponse.data);
                
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
        searchMovies(query);
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

            <div className="movie-results">
                {results.map(movie => {
                    const movieRatings = ratingsData[movie.id];
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
                                    {movieRatings && (
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