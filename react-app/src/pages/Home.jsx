import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/_home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1 className="home-title">Bienvenue</h1>
      <p className="home-subtitle">Choisissez une application à explorer</p>
      <div className="apps-grid">
        <Link to="/cinema" className="app-card">
          <img src="/clapperboard.svg" alt="Cinéma" className="app-icon" />
          <h2 className="app-title">Cinéma</h2>
          <p className="app-description">Découvrez les films vus et notés par la communauté.</p>
        </Link>
        <Link to="/users" className="app-card">
          <img src="/users.svg" alt="Utilisateurs" className="app-icon" />
          <h2 className="app-title">Utilisateurs</h2>
          <p className="app-description">Parcourez la liste des membres de l'application.</p>
        </Link>
        <Link to="/map" className="app-card">
          <img src="/map.svg" alt="Carte" className="app-icon" />
          <h2 className="app-title">Carte Interactive</h2>
          <p className="app-description">Explorez la carte des utilisateurs.</p>
        </Link>
      </div>
    </div>
  );
};

export default Home; 