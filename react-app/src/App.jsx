// src/App.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Importe tes autres composants
import MapComponent from './components/MapComponent';
import ProfileCompletion from './components/ProfileCompletion';
import ConfettiRain from './components/ConfettiRain';
import { useKonamiCode } from './useKonamiCode';

import './styles/App.css';

// La configuration globale qui doit être ici
axios.defaults.withCredentials = true;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isKonamiActive, setIsKonamiActive] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleProfileUpdated = (updatedData) => {
    setCurrentUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  // Hook pour l'Easter Egg
  useKonamiCode(() => {
    setIsKonamiActive(true);
    setTimeout(() => setIsKonamiActive(false), 8000);
  });

  // Fonction pour vérifier la session, on peut la réutiliser
  const checkUserSession = () => {
    setLoading(true);
    axios.get(`${apiBaseUrl}/me.php`)
      .then(response => {
        setCurrentUser(response.data.user);
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Au premier chargement de l'application, on vérifie la session
  useEffect(() => {
    checkUserSession();
  }, []);

  const handleLogin = () => {
    window.location.href = `${apiBaseUrl}/login.php`;
  };

  const handleLogout = () => {
    axios.post(`${apiBaseUrl}/logout.php`)
      .then(() => {
        // Après une déconnexion réussie, on remet l'état à null
        setCurrentUser(null);
      })
      .catch(error => {
        console.error("Erreur lors de la déconnexion:", error);
        // Même si la déconnexion échoue, on force l'état local à null
        setCurrentUser(null);
      });
  };
  
  // Fonction appelée quand le profil est mis à jour
  const handleProfileComplete = (updatedUserData) => {
    // Met à jour l'utilisateur courant avec les nouvelles données
    // et s'assure que le flag profile_complete est bien à true
    setCurrentUser({ ...currentUser, ...updatedUserData, profile_complete: true });
  }

  // --- Le rendu ---

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  // Si on n'est pas en chargement, on affiche le bon écran
  return (
    <div className="app-container">
      {isKonamiActive && <ConfettiRain />}

      {/* CAS 1 : Utilisateur non connecté */}
      {!currentUser && (
        <div className="login-container">
          <h1>Rien World Map</h1>
          <p>Placez votre avatar sur la carte du monde !</p>
          <button onClick={handleLogin} className="discord-login-button">
            <img src="/discord-logo.svg" alt="Discord Logo" />
            Se connecter avec Discord
          </button>
        </div>
      )}

      {/* CAS 2 : Utilisateur connecté mais profil incomplet */}
      {currentUser && !currentUser.profile_complete && (
        <ProfileCompletion 
          currentUser={currentUser}
          onProfileComplete={handleProfileComplete} 
        />
      )}

      {/* CAS 3 : Utilisateur connecté ET profil complet */}
      {currentUser && currentUser.profile_complete && (
      <div className="map-page-container"> {/* On ajoute ce conteneur */}
        <MapComponent
          currentUser={currentUser}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
        />
      </div>
    )}
    </div>
  );
}

export default App;