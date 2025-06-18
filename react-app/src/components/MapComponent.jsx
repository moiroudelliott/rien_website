import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import UserProfileModal from './UserProfileModal'; // N'oublie pas d'importer la modale

// --- CONFIGURATION & FONCTIONS UTILITAIRES ---
// Fix pour les icônes par défaut de Leaflet avec les bundlers modernes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Fonction utilitaire pour construire l'URL de l'avatar Discord
const getAvatarUrl = (user, size = 64) => {
    if (!user || !user.avatar_hash) {
        return 'https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png';
    }
    return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=${size}`;
};


// --- COMPOSANTS D'INTERFACE INTERNES ---

// Composant pour capturer les clics sur la carte
function LocationMarker({ onMapClick, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Composant pour le header avec les infos et actions de l'utilisateur
function HeaderControl({ currentUser, onLogout, onGeolocate, onDeleteLocation, onProfileClick }) {
    const headerRef = useRef(null);

    useEffect(() => {
        if (headerRef.current) {
            // Empêche les clics sur le header de se propager à la carte
            L.DomEvent.disableClickPropagation(headerRef.current);
        }
    }, []);

    return (
        <div className="leaflet-top leaflet-right" ref={headerRef}>
            <div className="leaflet-control user-header">
                <button onClick={onGeolocate} className="action-button geolocate-button" title="Me géolocaliser">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                </button>
                <button onClick={onDeleteLocation} className="action-button delete-location-button" title="Supprimer ma position">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M14.12 10.47L12 12.59l-2.13-2.12-1.41 1.41L10.59 14l-2.12 2.12 1.41 1.41L12 15.41l2.12 2.12 1.41-1.41L13.41 14l2.12-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg>
                </button>
                
                {/* L'avatar est maintenant un div conteneur pour un meilleur contrôle du style */}
                <div className="user-avatar" onClick={onProfileClick} title="Voir mon profil">
                  <img src={getAvatarUrl(currentUser, 32)} alt="Avatar" />
                </div>

                <span className="user-name">{currentUser.username}</span>

                {/* Le bouton de déconnexion n'a plus de texte */}
                <button onClick={onLogout} className="logout-button" title="Déconnexion">Déconnexion</button>
            </div>
        </div>
    );
}

function SaveLocationControl({ position, onSave, onCancel }) {
    const bannerRef = useRef(null);

    useEffect(() => {
        // Cette instruction est la méthode standard de Leaflet pour empêcher
        // les clics sur un contrôle de se propager à la carte.
        // En l'attachant à la ref de notre contrôle, on résoud le problème.
        if (bannerRef.current) {
            L.DomEvent.disableClickPropagation(bannerRef.current);
        }
    }); // Pas de tableau de dépendances pour que ça s'exécute à chaque rendu

    if (!position) return null;
    return (
        <div className="leaflet-bottom leaflet-center">
            <div className="leaflet-control save-location-banner" ref={bannerRef}>
                {/* On structure le texte avec des spans */}
                <div className="position-text">
                    <span className="position-title">Position sélectionnée :</span>
                    <span className="position-coords">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
                </div>
                <div className="button-group">
                    <button onClick={onSave} className="save-button">Placer</button>
                    <button onClick={onCancel} className="cancel-button">Annuler</button>
                </div>
            </div>
        </div>
    );
}


// --- COMPOSANT PRINCIPAL DE LA CARTE ---

function MapComponent({ currentUser, onLogout, onProfileUpdated }) {
    const [users, setUsers] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null); // État pour gérer la modale de profil
    
    const mapRef = useRef(null);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const handleProfileUpdated = (updatedUser) => {
        // Met à jour l'état local pour que la modale affiche les nouvelles données
        setSelectedUser(updatedUser);

        // Si l'utilisateur mis à jour est l'utilisateur courant
        if(currentUser.discord_id === updatedUser.discord_id) {
            onProfileUpdated(updatedUser); // On notifie App.jsx
        }
        // Met à jour la liste des utilisateurs pour refléter les changements
        fetchUsers();
    };

    // --- Fonctions de gestion des données ---
    const fetchUsers = () => {
        axios.get(`${apiBaseUrl}/get_users.php`)
            .then(response => setUsers(response.data))
            .catch(error => console.error("Erreur de chargement des utilisateurs:", error));
    };
    
    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 30000); // Rafraîchit la carte toutes les 30s
        return () => clearInterval(interval);
    }, [apiBaseUrl]);

    // --- Fonctions de gestion des actions de l'utilisateur ---
    const handleMapClick = (latlng) => { setSelectedPosition(latlng); };
    const cancelSelection = () => { setSelectedPosition(null); };
    
    const saveLocation = () => {
        if (!selectedPosition) return;
        axios.post(`${apiBaseUrl}/save_location.php`, { lat: selectedPosition.lat, lng: selectedPosition.lng })
            .then(() => {
                alert('Position enregistrée !');
                cancelSelection();
                fetchUsers();
            })
            .catch(error => {
                console.error("Erreur lors de la sauvegarde:", error);
                alert('Une erreur est survenue.');
                cancelSelection();
            });
    };
    
    const handleDeleteLocation = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer votre position de la carte ?")) {
            axios.post(`${apiBaseUrl}/delete_location.php`)
                .then(() => {
                    alert("Votre position a été supprimée.");
                    fetchUsers();
                })
                .catch(error => console.error("Erreur lors de la suppression :", error));
        }
    };

    const handleGeolocate = () => {
        if (!navigator.geolocation) { alert("La géolocalisation n'est pas supportée par votre navigateur."); return; }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setSelectedPosition(newPos);
                mapRef.current?.flyTo(newPos, 13);
            },
            () => alert("Impossible de récupérer votre position.")
        );
    };

    // --- Fonctions pour la modale de profil ---
    const openProfile = (user) => {
        // Si le profil demandé est celui de l'utilisateur courant, on passe
        // l'objet `currentUser` complet pour avoir toutes les données (ex: date de naissance).
        if (user.discord_id === currentUser.discord_id) {
            setSelectedUser(currentUser);
        } else {
            setSelectedUser(user);
        }
    };
    const closeProfile = () => setSelectedUser(null);

    return (
        <>
            <MapContainer ref={mapRef} center={[20, 0]} zoom={3} scrollWheelZoom={true} zoomControl={false}>
                <TileLayer
                    attribution='Rien server, try konami'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                <HeaderControl 
                    currentUser={currentUser} 
                    onLogout={onLogout} 
                    onGeolocate={handleGeolocate} 
                    onDeleteLocation={handleDeleteLocation}
                    onProfileClick={() => openProfile(currentUser)}
                />
                
                <SaveLocationControl 
                    position={selectedPosition} 
                    onSave={saveLocation} 
                    onCancel={cancelSelection} 
                />

                <LocationMarker 
                    onMapClick={handleMapClick} 
                />

                {selectedPosition && <Marker position={selectedPosition}></Marker>}

                {users.map(user => (
                    <Marker
                        key={user.discord_id}
                        position={[user.latitude, user.longitude]}
                        icon={L.divIcon({
                            className: 'discord-avatar-marker',
                            html: `
                              <div class="marker-username-label">${user.username}</div>
                              <div class="avatar-container">
                                <img src="${getAvatarUrl(user, 64)}" alt="${user.username}" />
                              </div>
                              <div class="marker-arrow"></div>
                            `,
                            iconSize: [60, 80],
                            iconAnchor: [30, 70] 
                        })}
                        eventHandlers={{ click: () => openProfile(user) }}
                    />
                ))}
            </MapContainer>

            {/* La modale s'affiche ici, par-dessus tout le reste */}
            {selectedUser && (
                <UserProfileModal 
                user={selectedUser}
                onClose={closeProfile}
                isOwnProfile={selectedUser.discord_id === currentUser.discord_id}
                onProfileUpdated={handleProfileUpdated} // On passe la fonction
                />
            )}
        </>
    );
}

export default MapComponent;