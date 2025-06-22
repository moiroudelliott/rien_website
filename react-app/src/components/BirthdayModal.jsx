import React, { useMemo } from 'react';
import ConfettiRain from './ConfettiRain';
import '../styles/_birthdaymodal.css';

const getAvatarUrl = (user) => {
    if (!user || !user.discord_id) return '/vite.svg'; 
    if (user.avatar_hash) {
        return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=128`;
    }
    const defaultAvatarIndex = (BigInt(user.discord_id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
};

function BirthdayModal({ users, onClose }) {
    // On génère la liste des URLs d'avatar pour les confettis
    const avatarUrls = useMemo(() => users.map(user => getAvatarUrl(user)), [users]);

    return (
        <div className="birthday-modal-overlay" onClick={onClose}>
            {/* On passe les URLs des avatars au composant de confettis */}
            <ConfettiRain images={avatarUrls} />
            <div className="birthday-modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="close-button" title="Fermer">×</button>
                <div className="birthday-header">
                    <img src="/confetti1.png" alt="confetti" className="header-confetti" />
                    <h1>Joyeux Anniversaire !</h1>
                    <img src="/confetti2.png" alt="confetti" className="header-confetti" />
                </div>
                <div className="birthday-users-grid">
                    {users.map(user => (
                        <div key={user.discord_id} className="birthday-user-card">
                            <img src={getAvatarUrl(user)} alt={user.username} className="birthday-user-avatar" />
                            <p className="birthday-user-name">{user.first_name} {user.last_name}</p>
                            <p className="birthday-user-username">({user.username})</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default BirthdayModal; 