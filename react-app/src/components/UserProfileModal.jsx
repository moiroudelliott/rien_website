import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/_profile.css';
import '../styles/_usercomments.css';
import MovieDetailModal from './MovieDetailModal';
import UserMoviesModal from './UserMoviesModal';

// Un petit composant pour les liens sociaux, pour garder le code propre
const SocialLink = ({ platform, url, username }) => {
    // Ne rend rien si aucune information n'est fournie
    if (!url && !username) return null;
    
    // Construit l'URL finale en fonction de la plateforme
    let finalUrl;
    switch(platform) {
        case 'linkedin': finalUrl = url; break;
        case 'github': finalUrl = `https://github.com/${username}`; break;
        case 'instagram': finalUrl = `https://instagram.com/${username}`; break;
        case 'steam': finalUrl = `https://steamcommunity.com/profiles/${username}`; break; // Note: L'URL Steam peut varier
        default: return null;
    }

    const iconSrc = `/${platform}.svg`;

    return (
        <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="social-link" title={platform}>
            <img src={iconSrc} alt={`${platform} logo`} />
        </a>
    );
};

const getAvatarUrl = (user) => {
    if (!user || !user.discord_id) return '/vite.svg'; // Fallback
    if (user.avatar_hash) {
        return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=32`;
    }
    const defaultAvatarIndex = (BigInt(user.discord_id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
};

const CommentBubble = ({ comment, style, onPop, isPopped }) => {
    const commenterAvatarUrl = getAvatarUrl({ 
        discord_id: comment.commenter_user_id, 
        avatar_hash: comment.commenter_avatar_hash 
    });

    return (
        <div className="comment-bubble-wrapper" style={style}>
            <div 
                className={`comment-bubble ${isPopped ? 'popped' : ''}`} 
                onClick={() => onPop(comment.id)}
            >
                <div className="comment-author">
                    <img src={commenterAvatarUrl} alt={comment.commenter_username} className="comment-author-avatar" />
                    <span>{comment.commenter_first_name || comment.commenter_username}</span>
                </div>
                <p className="comment-text">{comment.comment_text}</p>
            </div>
        </div>
    );
};

// Le composant principal de la modale
function UserProfileModal({ discordIdToView, currentUser, isOwnProfile, onClose, onProfileUpdated }) {
    const [user, setUser] = useState(null); // Peut démarrer avec des données partielles
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    
    const [favoriteMovie, setFavoriteMovie] = useState(null);
    const [userMovies, setUserMovies] = useState([]);
    const [isLoadingMovies, setIsLoadingMovies] = useState(true);

    const [viewingMovieId, setViewingMovieId] = useState(null);
    const [movieModalData, setMovieModalData] = useState(null);
    const [isMovieModalLoading, setIsMovieModalLoading] = useState(false);
    const [isViewingUserMovies, setIsViewingUserMovies] = useState(false);

    const audioRef = useRef(new Audio('/hoho.mp3'));
    const [mickeyAnimationKey, setMickeyAnimationKey] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
    const [isImageShaking, setIsImageShaking] = useState(false);

    // --- NOUVEAUX ÉTATS POUR LES COMMENTAIRES ---
    const [comments, setComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [myCommentText, setMyCommentText] = useState('');

    // --- NOUVELLE REF ---
    const modalContentRef = useRef(null); 

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (discordIdToView) {
            setIsLoadingProfile(true);
            axios.get(`${apiBaseUrl}/me.php?discord_id=${discordIdToView}`, { withCredentials: true })
                .then(response => {
                    const fullUser = response.data.user;
                    setUser(fullUser);
                    setFormData(fullUser);
                })
                .catch(error => {
                    console.error("Erreur lors de la récupération du profil:", error);
                    alert("Impossible de charger le profil de cet utilisateur.");
                    onClose();
                })
                .finally(() => {
                    setIsLoadingProfile(false);
                });
        }
    }, [discordIdToView, apiBaseUrl, onClose]);

    useEffect(() => {
        if (user?.discord_id) {
            setIsLoadingMovies(true);
            axios.get(`${apiBaseUrl}/get_user_movies.php?discord_id=${user.discord_id}`, { withCredentials: true })
                .then(response => {
                    const movies = response.data || [];
                    setUserMovies(movies);
                    const favMovie = movies.find(movie => movie.is_favorite);
                    setFavoriteMovie(favMovie);
                })
                .catch(error => {
                    console.error("Erreur lors de la récupération des films de l'utilisateur:", error);
                    setUserMovies([]);
                })
                .finally(() => {
                    setIsLoadingMovies(false);
                });
        }
    }, [user, apiBaseUrl]);

    // --- useEffect pour charger et préparer les commentaires (logique améliorée) ---
    useEffect(() => {
        if (user?.discord_id) {
            setIsLoadingComments(true);
            axios.get(`${apiBaseUrl}/get_user_comments.php?user_id=${user.discord_id}`)
                .then(response => {
                    const loadedComments = response.data || [];
                    
                    const bubbleWidth = 200;
                    const bubbleHeight = 100; 
                    const screenPadding = 20;

                    // On prépare chaque commentaire avec son état et sa position UNE SEULE FOIS
                    const commentsWithState = loadedComments.map(c => ({
                        ...c,
                        popped: false,
                        style: { // La position est maintenant stockée avec le commentaire
                            top: `${Math.random() * (window.innerHeight - bubbleHeight - screenPadding)}px`,
                            left: `${Math.random() * (window.innerWidth - bubbleWidth - screenPadding)}px`,
                            animationDelay: `${Math.random() * -15}s`,
                        }
                    }));
                    
                    setComments(commentsWithState);

                    const myComment = loadedComments.find(c => c.commenter_user_id === currentUser.discord_id);
                    setMyCommentText(myComment ? myComment.comment_text : '');
                })
                .catch(error => {
                    console.error("Erreur lors du chargement des commentaires:", error);
                    setComments([]);
                })
                .finally(() => {
                    setIsLoadingComments(false);
                });
        }
    }, [user?.discord_id, apiBaseUrl, currentUser.discord_id]); // Dépendance corrigée pour ne pas se redéclencher inutilement

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    if (isLoadingProfile) {
        return (
            <div className="profile-modal-overlay" onClick={handleOverlayClick}>
                <div className="profile-modal-content">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Ne rien afficher si le chargement a échoué et qu'il n'y a pas d'utilisateur
    }
    
    const playHohoAndTriggerAnimation = () => {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        setMickeyAnimationKey(Date.now());
        setIsShaking(true);
        setIsGlowing(true);
        setIsImageShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setTimeout(() => setIsGlowing(false), 800);
        setTimeout(() => setIsImageShaking(false), 600);
    };

    const handleEditClick = () => setIsEditing(true);
    const handleCancelEdit = () => setIsEditing(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(`${apiBaseUrl}/update_profile.php`, formData)
            .then(() => {
                alert('Profil mis à jour avec succès !');
                setIsEditing(false);
                setUser(formData); // Met à jour l'état local
                if (onProfileUpdated) {
                    onProfileUpdated(formData);
                }
            })
            .catch(error => {
                alert("Erreur: " + (error.response?.data?.message || "Veuillez vérifier les champs."));
            });
    };

    const openMovieDetails = (movieId) => {
        setViewingMovieId(movieId);
        setIsMovieModalLoading(true);
        axios.get(`${apiBaseUrl}/get_movie_details.php?api_movie_id=${movieId}`, { withCredentials: true })
            .then(response => { setMovieModalData(response.data); })
            .catch(error => { setMovieModalData(null); })
            .finally(() => { setIsMovieModalLoading(false); });
    };

    const closeMovieDetails = () => {
        setViewingMovieId(null);
        setMovieModalData(null);
    };

    const openUserMovies = () => setIsViewingUserMovies(true);
    const closeUserMovies = () => setIsViewingUserMovies(false);

    // --- NOUVELLES FONCTIONS POUR GÉRER LES COMMENTAIRES ---
    const handleCommentChange = (e) => {
        setMyCommentText(e.target.value);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (myCommentText.trim() === '') return;

        axios.post(`${apiBaseUrl}/add_edit_user_comment.php`, {
            profile_user_id: user.discord_id,
            comment_text: myCommentText,
        })
        .then(() => {
            alert('Commentaire sauvegardé !');
            // Recharger les commentaires en préservant les positions existantes
            axios.get(`${apiBaseUrl}/get_user_comments.php?user_id=${user.discord_id}`)
                .then(response => {
                    const loadedComments = response.data || [];
                    
                    const bubbleWidth = 200;
                    const bubbleHeight = 100; 
                    const screenPadding = 20;

                    // Préserver les positions existantes, générer seulement pour les nouveaux
                    const commentsWithState = loadedComments.map(newComment => {
                        const existingComment = comments.find(c => c.id === newComment.id);
                        if (existingComment) {
                            // Garder la position et l'état existants, mais mettre à jour le contenu
                            return { ...newComment, popped: existingComment.popped, style: existingComment.style };
                        } else {
                            // Nouveau commentaire : générer une nouvelle position
                            return {
                                ...newComment,
                                popped: false,
                                style: {
                                    top: `${Math.random() * (window.innerHeight - bubbleHeight - screenPadding)}px`,
                                    left: `${Math.random() * (window.innerWidth - bubbleWidth - screenPadding)}px`,
                                    animationDelay: `${Math.random() * -15}s`,
                                }
                            };
                        }
                    });
                    
                    setComments(commentsWithState);
                });
        })
        .catch(error => {
            alert("Erreur: " + (error.response?.data?.message || "Impossible de sauvegarder le commentaire."));
        });
    };

    const handleCommentDelete = () => {
        if (!window.confirm("Voulez-vous vraiment supprimer votre commentaire ?")) return;

        axios.post(`${apiBaseUrl}/delete_user_comment.php`, { profile_user_id: user.discord_id })
        .then(() => {
            alert('Commentaire supprimé.');
            setMyCommentText('');
            // Recharger les commentaires en préservant les positions existantes
            axios.get(`${apiBaseUrl}/get_user_comments.php?user_id=${user.discord_id}`)
                .then(response => {
                    const loadedComments = response.data || [];
                    
                    const bubbleWidth = 200;
                    const bubbleHeight = 100; 
                    const screenPadding = 20;

                    // Préserver les positions existantes pour les commentaires restants
                    const commentsWithState = loadedComments.map(newComment => {
                        const existingComment = comments.find(c => c.id === newComment.id);
                        if (existingComment) {
                            return { ...newComment, popped: existingComment.popped, style: existingComment.style };
                        } else {
                            return {
                                ...newComment,
                                popped: false,
                                style: {
                                    top: `${Math.random() * (window.innerHeight - bubbleHeight - screenPadding)}px`,
                                    left: `${Math.random() * (window.innerWidth - bubbleWidth - screenPadding)}px`,
                                    animationDelay: `${Math.random() * -15}s`,
                                }
                            };
                        }
                    });
                    
                    setComments(commentsWithState);
                });
        })
        .catch(error => {
             alert("Erreur: " + (error.response?.data?.message || "Impossible de supprimer le commentaire."));
        });
    };

    // --- NOUVELLE FONCTION pour éclater la bulle ---
    const handlePopBubble = (commentId) => {
        setComments(prevComments =>
            prevComments.map(c => c.id === commentId ? { ...c, popped: true } : c)
        );
        setTimeout(() => {
            setComments(prevComments => prevComments.filter(c => c.id !== commentId));
        }, 400);
    };

    return (
        <>
            {/* Le sprite est ici, en dehors de la modale pour le positionnement fixed */}
            {mickeyAnimationKey && <div key={mickeyAnimationKey} className="mickey-sprite"></div>}

            {!isViewingUserMovies &&
                <div className="profile-modal-overlay" onClick={handleOverlayClick}>
                    
                    {/* Le conteneur est maintenant ici pour couvrir toute la page */}
                    <div className="comments-container">
                        {!isLoadingComments && comments.map((comment) => (
                            <CommentBubble 
                                key={comment.id}
                                comment={comment}
                                style={comment.style}
                                onPop={handlePopBubble}
                                isPopped={comment.popped}
                            />
                        ))}
                    </div>

                    <div ref={modalContentRef} className={`profile-modal-content ${isShaking ? 'modal-shake' : ''} ${isGlowing ? 'modal-glow' : ''}`} style={{ zIndex: 1000 }}>
                        <button onClick={onClose} className="close-button" title="Fermer">×</button>

                        {/* Aiguillage : Affiche le profil OU le formulaire d'édition */}
                        {!isEditing ? (
                            // --- MODE AFFICHAGE DU PROFIL ---
                            <>
                                <div className="profile-modal-header">
                                    <img 
                                        className={isImageShaking ? 'image-shake' : ''}
                                        src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=128`} 
                                        alt="Avatar"
                                        onClick={playHohoAndTriggerAnimation}
                                        style={{ cursor: 'pointer' }}
                                        title="ho ho !"
                                    />
                                    <h2>{user.first_name} {user.last_name}</h2>
                                    <span>@{user.username}</span>
                                </div>
                                <div className="profile-socials">
                                    <SocialLink platform="github" username={user.github_username} />
                                    <SocialLink platform="linkedin" url={user.linkedin_url} />
                                    <SocialLink platform="instagram" username={user.instagram_handle} />
                                    <SocialLink platform="steam" username={user.steam_id} />
                                </div>

                                {/* --- NOUVEAU : Section du film préféré --- */}
                                <div className="favorite-movie-section">
                                    <div className="favorite-movie-header">
                                        <h4>Son film préféré</h4>
                                        {!isLoadingMovies && userMovies.length > 0 && (
                                            <button onClick={openUserMovies} className="view-all-movies-link">
                                                Voir tous les films notés
                                            </button>
                                        )}
                                    </div>
                                    <div 
                                        className="favorite-movie-content" 
                                        onClick={() => favoriteMovie && openMovieDetails(favoriteMovie.api_movie_id)}
                                        style={favoriteMovie ? { cursor: 'pointer' } : {}}
                                    >
                                        {isLoadingMovies ? (
                                            <p>Chargement...</p>
                                        ) : favoriteMovie ? (
                                            <>
                                                <img 
                                                    src={`https://image.tmdb.org/t/p/w200${favoriteMovie.poster_path}`} 
                                                    alt={`Affiche de ${favoriteMovie.title}`} 
                                                    className="fav-movie-poster"
                                                />
                                                <div className="fav-movie-details">
                                                    <h5>{favoriteMovie.title}</h5>
                                                    <p>Noté {favoriteMovie.rating}/10</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p>N'a pas encore défini de film préféré.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {isOwnProfile && (
                                    <div className="profile-actions">
                                        <button onClick={handleEditClick} className="edit-profile-button">Modifier mon profil</button>
                                    </div>
                                )}

                                {currentUser && !isOwnProfile && (
                                    <div className="comment-form-container">
                                        <h4>Laissez un commentaire</h4>
                                        <form onSubmit={handleCommentSubmit} className="comment-form">
                                            <div className="textarea-wrapper">
                                                <textarea
                                                    value={myCommentText}
                                                    onChange={handleCommentChange}
                                                    placeholder="Écrivez quelque chose de sympa..."
                                                    maxLength="40"
                                                />
                                                <div className={`character-counter ${
                                                    myCommentText.length > 35 ? 'danger' : 
                                                    myCommentText.length > 25 ? 'warning' : ''
                                                }`}>
                                                    {myCommentText.length}/40
                                                </div>
                                            </div>
                                            <div className="comment-form-actions">
                                                {myCommentText && (
                                                     <button type="button" onClick={handleCommentDelete} className="btn btn-delete">Supprimer</button>
                                                )}
                                                <button type="submit" className="btn btn-save">Sauvegarder</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </>
                        ) : (
                            // --- MODE ÉDITION DU PROFIL ---
                            <>
                                <h2 className="form-title">Modifier mon profil</h2>
                                <form onSubmit={handleSubmit} className="profile-form modal-form">
                                    <fieldset>
                                        <legend>Informations requises</legend>
                                        <div className="form-group">
                                            <input type="text" name="first_name" placeholder="Prénom" value={formData.first_name || ''} required onChange={handleChange} />
                                            <input type="text" name="last_name" placeholder="Nom" value={formData.last_name || ''} required onChange={handleChange} />
                                            <input type="date" name="birth_date" value={formData.birth_date || ''} required onChange={handleChange} />
                                        </div>
                                    </fieldset>
                                    <fieldset className="optional-fieldset">
                                        <legend>Réseaux sociaux</legend>
                                        <div className="form-group">
                                            <input type="url" name="linkedin_url" placeholder="URL Profil LinkedIn" value={formData.linkedin_url || ''} onChange={handleChange} />
                                            <input type="text" name="instagram_handle" placeholder="Pseudo Instagram" value={formData.instagram_handle || ''} onChange={handleChange} />
                                            <input type="text" name="github_username" placeholder="Pseudo GitHub" value={formData.github_username || ''} onChange={handleChange} />
                                            <input type="text" name="steam_id" placeholder="ID Steam" value={formData.steam_id || ''} onChange={handleChange} />
                                        </div>
                                    </fieldset>
                                    <div className="form-actions">
                                        <button type="button" onClick={handleCancelEdit} className="cancel-button">Annuler</button>
                                        <button type="submit" className="save-button">Enregistrer</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            }
            
            {viewingMovieId && (
                <MovieDetailModal
                    isLoading={isMovieModalLoading}
                    movie={movieModalData}
                    onClose={closeMovieDetails}
                />
            )}
            {isViewingUserMovies && (
                <UserMoviesModal
                    user={user}
                    onClose={closeUserMovies}
                />
            )}
        </>
    );
}

export default UserProfileModal;