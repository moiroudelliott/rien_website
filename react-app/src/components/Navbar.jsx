import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/_navbar.css';

const Navbar = ({ onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
                    <img src={isMenuOpen ? "/close.svg" : "/hamburger.svg"} alt="Menu" />
                </button>
                <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                    <NavLink to="/home" className="nav-link" onClick={closeMenu}>
                        Accueil
                    </NavLink>
                    <NavLink to="/cinema" className="nav-link" onClick={closeMenu}>
                        <img src="/clapperboard.svg" alt="Cinéma" className="nav-icon" />
                        Cinéma
                    </NavLink>
                    <NavLink to="/users" className="nav-link" onClick={closeMenu}>
                        <img src="/users.svg" alt="Utilisateurs" className="nav-icon" />
                        Utilisateurs
                    </NavLink>
                    <NavLink to="/map" className="nav-link" onClick={closeMenu}>
                        <img src="/map.svg" alt="Carte" className="nav-icon" />
                        Carte
                    </NavLink>
                    <div className="navbar-actions-mobile">
                         <button onClick={() => { closeMenu(); onLogout(); }} className="logout-button">
                            Déconnexion
                        </button>
                    </div>
                </div>
                <div className="navbar-actions">
                    <button onClick={onLogout} className="logout-button">
                        Déconnexion
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 