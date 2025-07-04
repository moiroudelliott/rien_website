import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import '../styles/_eventdetailmodal.css'; // Importation du fichier CSS
import MediaUploader from './MediaUploader'; // 1. Importer le nouveau composant
import UserProfileModal from './UserProfileModal';

function EventDetailModal({ event, currentUser, onClose, onEventDeleted, onEdit }) {
    const [details, setDetails] = useState(event); // 1. On initialise avec les données de base
    const [loadingExtraDetails, setLoadingExtraDetails] = useState(true); // 2. State pour le chargement des détails
    const [error, setError] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [viewingUserId, setViewingUserId] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const handleDelete = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) {
            try {
                await axios.post(`${apiBaseUrl}/delete_event.php`, { event_id: details.id }, { withCredentials: true });
                onEventDeleted(); // Notify parent to refresh list
                onClose();      // Close modal
            } catch (err) {
                console.error("Erreur lors de la suppression de l'événement:", err);
                setError(err.response?.data?.message || "Impossible de supprimer l'événement.");
            }
        }
    };

    const fetchEventDetails = useCallback(() => {
        if (!event?.id) return;

        axios.get(`${apiBaseUrl}/get_event_details.php?id=${event.id}`, { withCredentials: true })
            .then(response => {
                console.log('--- Full Event Details from API ---', response.data); // Débogage
                setDetails(prevDetails => ({
                    ...prevDetails,
                    ...response.data
                }));
            })
            .catch(err => {
                console.error("Erreur de chargement des détails de l'événement:", err);
                setError(err.response?.data?.message || "Impossible de charger les détails.");
            })
            .finally(() => {
                setLoadingExtraDetails(false);
            });
    }, [event.id, apiBaseUrl]);

    useEffect(() => {
        if (event?.id) {
            setLoadingExtraDetails(true);
            fetchEventDetails();
        }
    }, [event, fetchEventDetails]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getAvatarUrl = (user) => {
        console.log('--- Avatar generation for user ---', user); // Débogage
        if (!user || !user.discord_id) return '/vite.svg'; // Fallback de sécurité

        if (user.avatar_hash) {
            return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=64`;
        } else {
            // Calcule l'avatar par défaut de Discord
            const defaultAvatarIndex = (BigInt(user.discord_id) >> 22n) % 6n;
            return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
    };

    const getMediaUrl = (filePath) => {
        if (!filePath) return '';
        const webRoot = apiBaseUrl.substring(0, apiBaseUrl.lastIndexOf('/backend'));
        return `${webRoot}/${filePath}`;
    };

    const formatEventDate = (dateString) => {
        if (!dateString) return "Date non spécifiée";
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short'
        });
    };

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <>
            <div className="event-detail-modal-overlay" onClick={handleOverlayClick}>
                <div className="event-detail-modal-content">
                    <div className="modal-top-actions">
                        {currentUser?.id === details.creator_id && (
                            <div className="event-actions">
                                <button className="icon-button edit-button" title="Modifier l'événement" onClick={onEdit}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                                </button>
                                <button className="icon-button delete-button" title="Supprimer l'événement" onClick={handleDelete}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="close-button" title="Fermer">×</button>
                    </div>
                    
                    {error && <p className="error-message">{error}</p>}
                    
                    {details && (
                        <>
                            <h2>{details.title}</h2>
                            
                            <div className="event-info">
                                <p><strong>Créé par:</strong> {details.creator_username || 'Inconnu'}</p>
                                <p><strong>Date:</strong> {formatEventDate(details.event_date)}</p>
                                <p><strong>Lieu:</strong> {details.location_text || 'Non spécifié'}</p>
                                {details.description && <p><strong>Description:</strong> {details.description}</p>}
                                <div className="privacy-status">{details.is_public ? 'Événement Public' : 'Événement Privé'}</div>
                            </div>

                            {loadingExtraDetails ? (
                                <p>Chargement des participants et médias...</p>
                            ) : (
                                <>
                                    {!details.is_public && details.attendees && details.attendees.length > 0 && (
                                        <div className="attendees-section">
                                            <h3>Participants</h3>
                                            <div className="attendees-grid">
                                                {details.attendees.map(attendee => (
                                                    <div key={attendee.id} className="attendee-item" onClick={() => setViewingUserId(attendee.discord_id)}>
                                                        <img src={getAvatarUrl(attendee)} alt={attendee.username} className="attendee-avatar" />
                                                        <span className="attendee-username">{attendee.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="media-section">
                                        <h3>Médias</h3>
                                        <MediaUploader 
                                            eventId={details.id} 
                                            apiBaseUrl={apiBaseUrl}
                                            onUploadComplete={fetchEventDetails}
                                        />
                                        <div className="media-grid" style={{marginTop: '1.5rem'}}>
                                            {details.media && details.media.map((m, index) => (
                                                <div key={m.id} className="media-item" onClick={() => openLightbox(index)}>
                                                    {m.media_type === 'photo' ? (
                                                        <img src={getMediaUrl(m.file_path)} alt={`Média de l'événement`} />
                                                    ) : (
                                                        <>
                                                            {m.thumbnail_path ? (
                                                                <img src={getMediaUrl(m.thumbnail_path)} alt={`Miniature de la vidéo`} />
                                                            ) : (
                                                                <div className="video-thumbnail">▶</div>
                                                            )}
                                                            <div className="play-icon-overlay">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            {(!details.media || details.media.length === 0) && <p>Aucun média pour cet événement.</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
            {details.media && details.media.length > 0 && (
                <Lightbox
                    open={lightboxOpen}
                    close={() => setLightboxOpen(false)}
                    slides={details.media.map(m => {
                        const url = getMediaUrl(m.file_path);
                        if (m.media_type === 'video') {
                            return {
                                type: 'video',
                                poster: m.thumbnail_path ? getMediaUrl(m.thumbnail_path) : '',
                                sources: [
                                    {
                                        src: url,
                                        type: 'video/mp4' // Assurez-vous que le type MIME est correct
                                    }
                                ],
                                download: url
                            };
                        }
                        return {
                            src: url,
                            download: url
                        };
                    })}
                    index={lightboxIndex}
                    plugins={[Video, Download]}
                />
            )}
             {viewingUserId && (
                <UserProfileModal
                    discordIdToView={viewingUserId}
                    currentUser={currentUser}
                    isOwnProfile={currentUser?.discord_id === viewingUserId}
                    onClose={() => setViewingUserId(null)}
                />
            )}
        </>
    );
}

export default EventDetailModal; 