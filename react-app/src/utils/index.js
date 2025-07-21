/**
 * Utilitaires communs pour l'application
 */

/**
 * Construit l'URL de l'avatar Discord d'un utilisateur
 */
export const getAvatarUrl = (user, size = 64) => {
  if (!user || !user.discord_id) return '/vite.svg';
  
  if (user.avatar_hash) {
    return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=${size}`;
  } else {
    const defaultAvatarIndex = (BigInt(user.discord_id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
  }
};

/**
 * Formate une date d'événement en français
 */
export const formatEventDate = (dateString) => {
  if (!dateString) return "Date non spécifiée";
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
};

/**
 * Construit l'URL complète d'un fichier média
 */
export const getMediaUrl = (filePath, apiBaseUrl) => {
  if (!filePath) return '';
  const webRoot = apiBaseUrl.substring(0, apiBaseUrl.lastIndexOf('/backend'));
  return `${webRoot}/${filePath}`;
};

/**
 * Standardise la gestion des erreurs API
 */
export const handleApiError = (error, defaultMessage = "Une erreur est survenue") => {
  console.error(defaultMessage, error);
  return error.response?.data?.message || defaultMessage;
}; 