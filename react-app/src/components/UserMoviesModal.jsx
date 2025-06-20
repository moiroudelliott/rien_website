import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/_usermoviesmodal.css'; // Créez ce fichier CSS

function UserMoviesModal({ user, onClose }) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (user?.discord_id) {
            setIsLoading(true);
            axios.get(`${apiBaseUrl}/get_user_movies.php?discord_id=${user.discord_id}`, { withCredentials: true })
                .then(response => {
                    // Trier les films par note, du plus haut au plus bas
                    const sortedMovies = response.data.sort((a, b) => b.rating - a.rating);
                    setMovies(sortedMovies);
                })
                .catch(error => {
                    console.error("Erreur lors de la récupération des films de l'utilisateur:", error);
                    setMovies([]); // Assurer que movies n'est pas undefined
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [user, apiBaseUrl]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="user-movies-modal-overlay" onClick={handleOverlayClick}>
            <div className="user-movies-modal-content">
                <button onClick={onClose} className="close-button" title="Fermer">×</button>
                <h3>Films notés par {user.first_name}</h3>
                
                {isLoading ? (
                    <p>Chargement des films...</p>
                ) : movies.length > 0 ? (
                    <ul className="user-movies-list">
                        {movies.map(movie => (
                            <li key={movie.api_movie_id} className="user-movie-item">
                                <img 
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                                    alt={`Affiche de ${movie.title}`} 
                                    className="user-movie-poster"
                                />
                                <div className="user-movie-details">
                                    <span className="user-movie-title">{movie.title}</span>
                                    <span className="user-movie-rating">Note : {movie.rating}/10</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Cet utilisateur n'a noté aucun film pour le moment.</p>
                )}
            </div>
        </div>
    );
}

export default UserMoviesModal; 