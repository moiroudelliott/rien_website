import React from 'react';
import UserProfileModal from '../components/UserProfileModal';
import { useUsers } from '../hooks/useApi';
import { useUserModal } from '../hooks/useUserModal';
import { getAvatarUrl } from '../utils';
import '../styles/_userlist.css';

function UserList({ currentUser }) {
    const { data: users, loading } = useUsers();
    const { viewingUserId, openUserModal, closeUserModal } = useUserModal();

    if (loading) {
        return <div className="loading-screen">Chargement des utilisateurs...</div>;
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Liste des utilisateurs</h1>
            <div className="users-grid">
                {users?.map(user => (
                    <div key={user.discord_id} className="user-card-list" onClick={() => openUserModal(user)}>
                        <img 
                            src={getAvatarUrl(user, 128)} 
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
                    onClose={closeUserModal}
                />
            )}
        </div>
    );
}

export default UserList; 