import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Nos nouveaux imports
import { useKonamiCode } from './useKonamiCode';
import ConfettiRain from './ConfettiRain';

import MapComponent from './MapComponent';
import './App.css';

// Configuration globale d'axios
axios.defaults.withCredentials = true;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isKonamiActive, setIsKonamiActive] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Activation de l'Easter Egg
  useKonamiCode(() => {
    setIsKonamiActive(true);
    // On désactive les confettis après un certain temps pour ne pas surcharger
    setTimeout(() => setIsKonamiActive(false), 8000); // 8 secondes
  });

  useEffect(() => {
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
  }, []);

  const handleLogin = () => {
    window.location.href = `${apiBaseUrl}/login.php`;
  };

  const handleLogout = () => {
    axios.post(`${apiBaseUrl}/logout.php`)
      .then(() => {
        setCurrentUser(null);
      })
      .catch(error => {
        console.error("Erreur lors de la déconnexion:", error);
        setCurrentUser(null);
      });
  };

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <div className="app-container">
      {/* On affiche les confettis s'ils sont actifs */}
      {isKonamiActive && <ConfettiRain />}

      {!currentUser ? (
        <div className="login-container">
          <h1>Rien World Map</h1>
          <p>Placez votre avatar sur la carte du monde !</p>
          <button onClick={handleLogin} className="discord-login-button">
            <img src="/discord-logo.svg" alt="Discord Logo" />
            Se connecter avec Discord
          </button>
        </div>
      ) : (
        <MapComponent
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;