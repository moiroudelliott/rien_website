import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getAvatarUrl } from '../utils';
import '../styles/_usermultiselect.css';

function UserMultiSelect({ allUsers, selectedUserIds, onChange, currentUser }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const availableUsers = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allUsers
            .filter(u => u.id !== currentUser.id)
            .filter(u => !selectedUserIds.includes(u.id))
            .filter(u => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                const username = u.username.toLowerCase();
                return username.includes(lowercasedFilter) || fullName.includes(lowercasedFilter);
            });
    }, [allUsers, selectedUserIds, searchTerm, currentUser.id]);

    const selectedUsers = useMemo(() => {
        return allUsers.filter(u => selectedUserIds.includes(u.id));
    }, [allUsers, selectedUserIds]);

    const addUser = (userId) => {
        onChange([...selectedUserIds, userId]);
        setSearchTerm('');
        setIsOpen(false);
    };

    const removeUser = (userId) => {
        onChange(selectedUserIds.filter(id => id !== userId));
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);

    return (
        <div className="user-multiselect" ref={containerRef}>
            <div className="selected-users-container" onClick={() => setIsOpen(true)}>
                {selectedUsers.map(user => (
                    <div key={user.id} className="selected-user-pill">
                        <img src={getAvatarUrl(user)} alt={user.username} />
                        <span>{user.username}</span>
                        <button className="remove-user-btn" onClick={() => removeUser(user.id)}>×</button>
                    </div>
                ))}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={selectedUsers.length === 0 ? "Inviter des membres..." : ""}
                />
            </div>

            {isOpen && (
                <div className="user-dropdown">
                    {availableUsers.length > 0 ? (
                        availableUsers.slice(0, 10).map(user => (
                            <div key={user.id} className="user-dropdown-item" onClick={() => addUser(user.id)}>
                                <img src={getAvatarUrl(user)} alt={user.username} />
                                <div className="user-details">
                                    <span className="user-name">{user.first_name} {user.last_name}</span>
                                    <span className="username-display">@{user.username}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-users-message">Aucun utilisateur trouvé</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UserMultiSelect;
