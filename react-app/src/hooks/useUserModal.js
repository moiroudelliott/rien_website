import { useState } from 'react';

/**
 * Hook personnalisé pour gérer l'affichage des modales de profil utilisateur
 */
export const useUserModal = () => {
  const [viewingUserId, setViewingUserId] = useState(null);

  const openUserModal = (user) => {
    const userId = typeof user === 'object' ? user.discord_id : user;
    setViewingUserId(userId);
  };

  const closeUserModal = () => {
    setViewingUserId(null);
  };

  const isUserModalOpen = viewingUserId !== null;

  return {
    viewingUserId,
    openUserModal,
    closeUserModal,
    isUserModalOpen
  };
}; 