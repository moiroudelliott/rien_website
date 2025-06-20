import React, { useState } from 'react';
import axios from 'axios';
import '../styles/_ratingmodal.css';

const RatingModal = ({ movie, onClose, onSubmit }) => {
    const [rating, setRating] = useState(movie.user_rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isFavorite, setIsFavorite] = useState(movie.user_is_favorite || false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Veuillez sélectionner une note.');
            return;
        }
        setIsSubmitting(true);

        const payload = {
            api_movie_id: movie.api_movie_id || movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            overview: movie.overview,
            rating: rating,
            is_favorite: isFavorite,
        };

        console.log("Payload envoyé à rate_movie.php:", payload);

        axios.post(`${apiBaseUrl}/rate_movie.php`, payload, { withCredentials: true })
            .then(() => {
                if (onSubmit) {
                    onSubmit();
                }
                onClose();
            })
            .catch(error => {
                alert(`Erreur: ${error.response?.data?.message || error.message}`);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="rating-modal" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="close-button" title="Fermer">×</button>
                
                <div className="rating-modal-header">
                    <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="rating-movie-poster" />
                    <div className="rating-movie-info">
                        <h2>{movie.title}</h2>
                        <p>Quelle note donneriez-vous ?</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="rating-form">
                    <div className="current-rating-display">
                        {rating > 0 ? `${rating}/10` : "Choisissez votre note"}
                    </div>
                    <div className="star-rating-input">
                        {[...Array(10)].map((_, index) => {
                            const starValue = index + 1;
                            return (
                                <span 
                                    key={starValue}
                                    className={`star ${starValue <= (hoverRating || rating) ? 'filled' : ''}`}
                                    onClick={() => setRating(starValue)}
                                    onMouseEnter={() => setHoverRating(starValue)}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    ★
                                </span>
                            );
                        })}
                    </div>

                    <div className="favorite-toggle-container">
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={isFavorite} 
                                onChange={(e) => setIsFavorite(e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                        <span>Marquer comme film préféré</span>
                    </div>
                    
                    {isFavorite && movie.current_favorite_to_replace && (
                        <p className="favorite-disclaimer">
                            Attention : « {movie.current_favorite_to_replace} » ne sera plus votre film préféré.
                        </p>
                    )}

                    <button type="submit" className="submit-rating-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Enregistrement...' : 'Valider la note'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatingModal; 