import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfileModal from '../components/UserProfileModal';
import '../styles/_userlist.css';

function UserList({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingUserId, setViewingUserId] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        axios.get(`${apiBaseUrl}/get_all_users.php`)
            .then(response => {
                setUsers(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erreur de chargement des utilisateurs:", error);
                setLoading(false);
            });
    }, [apiBaseUrl]);

    const handleUserClick = (user) => {
        setViewingUserId(user.discord_id);
    };

    const handleCloseModal = () => {
        setViewingUserId(null);
    };

    if (loading) {
        return <div className="loading-screen">Chargement des utilisateurs...</div>;
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Liste des utilisateurs</h1>
            <div className="users-grid">
                {users.map(user => (
                    <div key={user.discord_id} className="user-card-list" onClick={() => handleUserClick(user)}>
                        <img 
                            src={user.avatar_hash ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=128` : '/vite.svg'} 
                            alt={`Avatar de ${user.username}`} 
                            className="user-avatar"
                        />
                        <div className="user-info">
                            <div className="user-name">{user.first_name} {user.last_name}</div>
                            <div className="user-username">@{user.username}</div>
                        </div>
                    </div>
                ))}
            </div>

            {viewingUserId && (
                <UserProfileModal 
                    discordIdToView={viewingUserId}
                    currentUser={currentUser}
                    isOwnProfile={currentUser?.discord_id === viewingUserId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

export default UserList; 