import React, { useState, useCallback } from 'react';
import axios from 'axios';
import '../styles/_cinema.css';
import MovieSearch from '../components/MovieSearch';
import UserProfileModal from '../components/UserProfileModal';
import MovieDetailModal from '../components/MovieDetailModal';
import UserMoviesModal from '../components/UserMoviesModal';
import ProfileCompletion from '../components/ProfileCompletion';
import ConfettiRain from '../components/ConfettiRain';
import { useUserModal } from '../hooks/useUserModal';
import { useUserMovies } from '../hooks/useApi';

const CinemaHome = ({ user: currentUser }) => {
    const [latestMovies, setLatestMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingMovieId, setViewingMovieId] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [viewingUserMovies, setViewingUserMovies] = useState(null);
    
    const { viewingUserId, openUserModal, closeUserModal } = useUserModal();
    const { data: userMovies, refetch: refetchUserMovies } = useUserMovies();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchLatestMovies = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBaseUrl}/get_latest_movies.php`, { withCredentials: true });
            setLatestMovies(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des données du cinéma:", error);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    React.useEffect(() => {
        fetchLatestMovies();
    }, [fetchLatestMovies]);

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
        refetchUserMovies();
        if (viewingMovieId) {
            openMovieDetails(viewingMovieId);
        }
    };

    const handleProfileUpdated = (updatedUser) => {
        if(updatedUser.is_profile_complete) {
            setIsProfileComplete(true);
            setShowConfetti(true);
        }
    };

    const handleOpenUserMovies = (user) => {
        setViewingUserMovies(user);
    };

    const handleCloseUserMovies = () => {
        setViewingUserMovies(null);
    };

    if (loading) {
        return <div className="loading-screen">Chargement de l'activité...</div>;
    }

    return (
        <>
            <div className="page-container">
                <h1 className="page-title">Section Cinéma</h1>

                <MovieSearch />
                
                <div className="cinema-content">
                    <div className="user-movies-section">
                        <div className="movie-carousel">
                            {userMovies?.length > 0 ? (
                                userMovies.map(movie => (
                                    <div key={movie.api_movie_id} className="movie-item">
                                    </div>
                                ))
                            ) : (
                                <p>Aucun film noté pour le moment.</p>
                            )}
                        </div>
                    </div>
                    <div className="activity-feed">
                        <h3>Activité récente</h3>
                        <ul className="compact-activity-list">
                            {latestMovies.map(activity => (
                                <li key={`${activity.discord_id}-${activity.api_movie_id}`} className="compact-activity-item">
                                    <span onClick={() => openUserModal(activity)} className="username-link">{activity.username}</span>
                                    {' a noté le film '}
                                    <span className="movie-title-link" onClick={() => openMovieDetails(activity.api_movie_id)}>
                                        {activity.title}
                                    </span>
                                    <span className="activity-rating">({activity.rating}/10)</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {viewingUserId && (
                <UserProfileModal 
                    discordIdToView={viewingUserId}
                    currentUser={currentUser}
                    isOwnProfile={viewingUserId === currentUser.discord_id}
                    onClose={closeUserModal}
                    initialUser={{ discord_id: viewingUserId }}
                />
            )}

            {viewingMovieId && (
                <MovieDetailModal 
                    isLoading={isModalLoading}
                    movie={modalData}
                    onClose={closeMovieDetails}
                    onRatingSuccess={handleRatingSuccess}
                />
            )}

            {viewingUserMovies && (
                <UserMoviesModal
                    user={viewingUserMovies}
                    onClose={handleCloseUserMovies}
                />
            )}

            {showConfetti && <ConfettiRain />}
        </>
    );
};

export default CinemaHome; 