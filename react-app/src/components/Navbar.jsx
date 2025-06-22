import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/_navbar.css';
import usersIcon from '/users.svg';
import cinemaIcon from '/clapperboard.svg';
import mapIcon from '/map.svg';
import eventIcon from '/event.svg';
import { useLocation } from 'react-router-dom';

const Navbar = ({ onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    }

    return (
        <>
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
                            <img src={cinemaIcon} alt="Cinéma" className="nav-icon" />
                            Cinéma
                        </NavLink>
                        <NavLink to="/users" className="nav-link" onClick={closeMenu}>
                            <img src={usersIcon} alt="Utilisateurs" className="nav-icon" />
                            Utilisateurs
                        </NavLink>
                        <NavLink to="/map" className="nav-link" onClick={closeMenu}>
                            <img src={mapIcon} alt="Carte" className="nav-icon" />
                            Carte
                        </NavLink>
                        <NavLink to="/events" className="nav-link" onClick={closeMenu}>
                            <img src={eventIcon} alt="Événements" className="nav-icon" />
                            Événements
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
            {isMenuOpen && <div className="navbar-overlay" onClick={closeMenu}></div>}
        </>
    );
};

export default Navbar; 