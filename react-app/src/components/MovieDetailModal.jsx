import React, { useState } from 'react';
import axios from 'axios';
import RatingModal from './RatingModal';
import '../styles/_moviedetailmodal.css';

const MovieDetailModal = ({ movie, isLoading, onClose, onRatingSuccess, onUserClick }) => {
    const [showRatingModal, setShowRatingModal] = useState(false);

    const handleRatingSubmit = () => {
        setShowRatingModal(false);
        if (onRatingSuccess) {
            onRatingSuccess();
        }
    };

    if (isLoading) {
        return (
            <div className="modal-overlay">
                <div className="movie-detail-modal" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="movie-detail-modal" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="close-button" title="Fermer">×</button>
                    <p>Erreur: Impossible de charger les détails de ce film.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="movie-detail-modal" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="close-button" title="Fermer">×</button>
                <div className="modal-header-movie">
                    <img 
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} 
                        alt={`Affiche de ${movie.title}`} 
                        className="modal-poster"
                    />
                    <div className="modal-title-section">
                        <h1>{movie.title}</h1>
                        <p>{new Date(movie.release_date).getFullYear()}</p>
                        
                        {movie.average_rating != null && (
                            <div className="average-rating-section">
                                Note moyenne des utilisateurs :
                                <span className="average-rating">
                                    {movie.average_rating} / 10
                                </span>
                            </div>
                        )}

                        <div className="user-ratings-list">
                            {movie.ratings && movie.ratings.length > 0 ? (
                                movie.ratings.map(rating => (
                                    <div 
                                        key={rating.discord_id} 
                                        className="user-rating-bubble"
                                        title={`${rating.username} a noté ${rating.rating}/10 ${rating.is_favorite ? ' (Favori)' : ''}`}
                                        onClick={() => onUserClick(rating.discord_id)}
                                    >
                                        <img 
                                            src={rating.avatar_hash ? `https://cdn.discordapp.com/avatars/${rating.discord_id}/${rating.avatar_hash}.png` : '/vite.svg'} 
                                            alt={rating.username}
                                        />
                                        <div className="user-rating-bubble-score">{rating.rating}</div>
                                        {rating.is_favorite ? <span className="user-rating-bubble-favorite">⭐</span> : null}
                                    </div>
                                ))
                            ) : (
                                <p className="no-ratings-text">Personne n'a encore noté ce film.</p>
                            )}
                        </div>

                        <button onClick={() => setShowRatingModal(true)} className="add-rating-button" title="Noter ce film">
                            Noter le film
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="movie-overview">
                        <h3>Synopsis</h3>
                        <p>{movie.overview}</p>
                    </div>
                </div>
            </div>

            {showRatingModal && (
                <RatingModal 
                    movie={movie}
                    onClose={() => setShowRatingModal(false)}
                    onSubmit={handleRatingSubmit}
                />
            )}
        </div>
    );
};

export default MovieDetailModal; 