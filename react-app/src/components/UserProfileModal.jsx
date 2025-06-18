import React, { useState, useRef } from 'react';
import axios from 'axios';

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

// Le composant principal de la modale
function UserProfileModal({ user, isOwnProfile, onClose, onProfileUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    // Initialise l'état du formulaire avec les données de l'utilisateur reçues en props
    const [formData, setFormData] = useState({ ...user });
    const audioRef = useRef(new Audio('/hoho.mp3'));

    // États pour les animations
    const [mickeyAnimationKey, setMickeyAnimationKey] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
    const [isImageShaking, setIsImageShaking] = useState(false);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const playHohoAndTriggerAnimation = () => {
        // Joue le son
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        
        // Déclenche l'animation du sprite
        setMickeyAnimationKey(Date.now());

        // Déclenche les animations de la modale et de l'image
        setIsShaking(true);
        setIsGlowing(true);
        setIsImageShaking(true);

        // Réinitialise les états d'animation pour pouvoir les rejouer
        setTimeout(() => setIsShaking(false), 500);
        setTimeout(() => setIsGlowing(false), 800);
        setTimeout(() => setIsImageShaking(false), 600); // Durée de l'animation jiggle
    };

    // --- GESTION DES ACTIONS ---
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
                setIsEditing(false); // Repasse en mode affichage
                if (onProfileUpdated) {
                    onProfileUpdated(formData); // Notifie le composant parent du changement
                }
            })
            .catch(error => {
                alert("Erreur: " + (error.response?.data?.message || "Veuillez vérifier les champs."));
            });
    };
    
    // Gère le clic sur l'overlay pour fermer la modale
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <>
            {/* Le sprite est ici, en dehors de la modale pour le positionnement fixed */}
            {mickeyAnimationKey && <div key={mickeyAnimationKey} className="mickey-sprite"></div>}

            <div className="profile-modal-overlay" onClick={handleOverlayClick}>
                <div 
                    className={`profile-modal-content ${isShaking ? 'modal-shake' : ''} ${isGlowing ? 'modal-glow' : ''}`}
                >
                    <button onClick={onClose} className="close-button" title="Fermer">×</button>

                    {/* Aiguillage : Affiche le profil OU le formulaire d'édition */}
                    {!isEditing ? (
                        // --- MODE AFFICHAGE DU PROFIL ---
                        <>
                            <div className="profile-modal-header">
                                <img 
                                    className={isImageShaking ? 'image-shake' : ''}
                                    src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=128`} 
                                    alt="Avatar de l'utilisateur"
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
                            {isOwnProfile && (
                                <div className="profile-actions">
                                    <button onClick={handleEditClick} className="edit-profile-button">Modifier mon profil</button>
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
                                    <button type="submit" className="save-button">Enregistrer les modifications</button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default UserProfileModal;