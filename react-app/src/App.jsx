// src/App.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import des pages
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import UserList from './pages/UserList';
import CinemaHome from './pages/CinemaHome';
import EventsPage from './pages/EventsPage';

// Import des composants
import ProfileCompletion from './components/ProfileCompletion';
import ConfettiRain from './components/ConfettiRain';
import Navbar from './components/Navbar';
import { useKonamiCode } from './useKonamiCode';
import BirthdayModal from './components/BirthdayModal';

import './styles/App.css';

// La configuration globale qui doit être ici
axios.defaults.withCredentials = true;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isKonamiActive, setIsKonamiActive] = useState(false);
  const [birthdayUsers, setBirthdayUsers] = useState([]);
  const [theme, setTheme] = useState('theme-map'); // Thème par défaut
  const location = useLocation();

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

    // Vérifier les anniversaires au chargement de l'app
    axios.get(`${apiBaseUrl}/get_todays_birthdays.php`)
      .then(response => {
        if (response.data && response.data.length > 0) {
          setBirthdayUsers(response.data);
        }
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des anniversaires:", error);
      });

  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/cinema')) {
      setTheme('theme-cinema');
    } else if (path.includes('/users')) {
      setTheme('theme-users');
    } else if (path.includes('/events')) {
      setTheme('theme-events');
    } else if (path.includes('/home')) {
        setTheme('theme-home');
    } else {
      setTheme('theme-map'); // Thème par défaut pour la carte et le reste
    }
  }, [location]);

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
  
  // Fonction appelée quand le profil est mis à jour
  const handleProfileComplete = (updatedUserData) => {
    setCurrentUser({ ...currentUser, ...updatedUserData, profile_complete: true });
  }

  // --- Le rendu ---

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  // CAS 1 : Utilisateur non connecté -> Affiche la page de connexion
  if (!currentUser) {
    return (
      <div className="app-container">
        <div className="login-container">
          <h1>rien app</h1>
          <p>Connectez-vous pour accéder aux différentes fonctionnalités.</p>
          <button onClick={handleLogin} className="discord-login-button">
            <img src="/discord-logo.svg" alt="Discord Logo" />
            Se connecter avec Discord
          </button>
        </div>
      </div>
    );
  }

  // CAS 2 : Utilisateur connecté mais profil incomplet -> Affiche le formulaire de complétion
  if (!currentUser.profile_complete) {
    return (
        <ProfileCompletion 
          currentUser={currentUser}
          onProfileComplete={handleProfileComplete} 
        />
    );
  }

  // CAS 3 : Utilisateur connecté ET profil complet -> Affiche l'application principale avec la navigation
  return (
    <div className={`app-container main-app-layout ${theme}`}>
      {isKonamiActive && <ConfettiRain />}
      {birthdayUsers.length > 0 && 
        <BirthdayModal 
            users={birthdayUsers} 
            onClose={() => setBirthdayUsers([])} 
        />
      }
      <Navbar onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/cinema" element={<CinemaHome user={currentUser} />} />
          <Route path="/users" element={<UserList currentUser={currentUser} />} />
          <Route path="/events" element={<EventsPage currentUser={currentUser} />} />
          <Route 
            path="/map" 
            element={<MapPage currentUser={currentUser} onProfileUpdated={handleProfileUpdated} />} 
          />
          {/* Redirige toutes les autres routes non trouvées vers l'accueil */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;