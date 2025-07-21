import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { handleApiError } from '../utils';

/**
 * Hook générique pour les appels API avec gestion du loading et des erreurs
 */
export const useApiCall = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const execute = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${apiBaseUrl}/${url}`, { 
        withCredentials: true,
        ...options 
      });
      setData(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err, `Erreur lors de l'appel à ${url}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, apiBaseUrl]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
};

/**
 * Hook spécialisé pour récupérer la liste des utilisateurs
 */
export const useUsers = (withLocation = false) => {
  const url = withLocation ? 'get_all_users.php?with_location=true' : 'get_all_users.php';
  return useApiCall(url);
};

/**
 * Hook spécialisé pour récupérer les détails d'un événement
 */
export const useEventDetails = (eventId) => {
  const url = eventId ? `get_event_details.php?id=${eventId}` : null;
  return useApiCall(url);
};

/**
 * Hook spécialisé pour récupérer les films d'un utilisateur
 */
export const useUserMovies = (discordId = null) => {
  const url = discordId 
    ? `get_user_movies.php?discord_id=${discordId}` 
    : 'get_user_movies.php';
  return useApiCall(url);
}; 