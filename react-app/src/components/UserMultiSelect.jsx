import React, { useState, useMemo, useRef, useEffect } from 'react';
import '../styles/_usermultiselect.css';

function UserMultiSelect({ allUsers, selectedUserIds, onChange, currentUser }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const getAvatarUrl = (user) => {
        if (!user || !user.discord_id) return '/vite.svg';
        if (user.avatar_hash) {
            return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=64`;
        } else {
            const defaultAvatarIndex = (BigInt(user.discord_id) >> 22n) % 6n;
            return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
        }
    };

    const availableUsers = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allUsers
            .filter(u => u.id !== currentUser.id) // Exclure l'utilisateur actuel
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
            {isOpen && availableUsers.length > 0 && (
                <div className="user-dropdown">
                    {availableUsers.map(user => (
                        <div key={user.id} className="user-dropdown-item" onClick={() => addUser(user.id)}>
                            <img src={getAvatarUrl(user)} alt={user.username} />
                            <span>
                                {user.first_name} {user.last_name} <span className="username-display">({user.username})</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default UserMultiSelect;
