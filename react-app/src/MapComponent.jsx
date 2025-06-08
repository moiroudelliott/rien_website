import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

// --- CONFIGURATION & FONCTIONS UTILITAIRES ---
// (Aucun changement ici, je le laisse pour le contexte)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const getAvatarUrl = (user, size = 64) => {
    if (!user.avatar_hash) {
        return 'https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png';
    }
    return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=${size}`;
};


// --- COMPOSANTS D'INTERFACE INTERNES ---

// ... LocationMarker (aucun changement) ...
function LocationMarker({ onMapClick, disabled }) {
  useMapEvents({ click(e) { if (disabled) return; onMapClick(e.latlng); }, });
  return null;
}

// --- MODIFICATION DANS HeaderControl ---
function HeaderControl({ currentUser, onLogout, onGeolocate, onDeleteLocation }) {
    return (
        <div className="leaflet-top leaflet-right">
            <div className="leaflet-control user-header">
                <button onClick={onGeolocate} className="geolocate-button" title="Me géolocaliser">
                    {/* SVG Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                </button>
                {/* --- NOUVEAU BOUTON DE SUPPRESSION --- */}
                <button onClick={onDeleteLocation} className="delete-location-button" title="Supprimer ma position">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px">
                        <path d="M14.12 10.47L12 12.59l-2.13-2.12-1.41 1.41L10.59 14l-2.12 2.12 1.41 1.41L12 15.41l2.12 2.12 1.41-1.41L13.41 14l2.12-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/>
                    </svg>
                </button>
                <img src={getAvatarUrl(currentUser, 32)} alt="Avatar" className="user-avatar" />
                <span className="user-name">{currentUser.username}</span>
                <button onClick={onLogout} className="logout-button">Déconnexion</button>
            </div>
        </div>
    );
}

// ... SaveLocationControl (aucun changement) ...
function SaveLocationControl({ position, onSave, onCancel }) {
    if (!position) return null;
    return (
        <div className="leaflet-bottom leaflet-center">
            <div className="leaflet-control save-location-banner">
                <span>Position sélectionnée : {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
                <button onClick={onSave} className="save-button">Placer mon avatar ici</button>
                <button onClick={onCancel} className="cancel-button">Annuler</button>
            </div>
        </div>
    );
}


// --- COMPOSANT PRINCIPAL DE LA CARTE ---

function MapComponent({ currentUser, onLogout }) {
    const [users, setUsers] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isMapClickable, setIsMapClickable] = useState(true);
    const mapRef = useRef(null);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    // Fonction pour recharger les utilisateurs, on va l'appeler souvent
    const fetchUsers = () => {
        axios.get(`${apiBaseUrl}/get_users.php`)
            .then(response => setUsers(response.data))
            .catch(error => console.error("Erreur de chargement des utilisateurs:", error));
    };
    
    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, [apiBaseUrl]);

    // ... handleMapClick, saveLocation, cancelSelection, handleGeolocate (aucun changement) ...
    const handleMapClick = (latlng) => { setSelectedPosition(latlng); setIsMapClickable(false); };
    const cancelSelection = () => { setSelectedPosition(null); setIsMapClickable(true); };
    const handleGeolocate = () => { if (!navigator.geolocation) { alert("Géolocalisation non supportée."); return; } navigator.geolocation.getCurrentPosition( (position) => { const newPos = { lat: position.coords.latitude, lng: position.coords.longitude }; setSelectedPosition(newPos); setIsMapClickable(false); if (mapRef.current) { mapRef.current.flyTo(newPos, 13); } }, () => { alert("Impossible de récupérer votre position."); } ); };
    const saveLocation = () => { if (!selectedPosition) return; axios.post(`${apiBaseUrl}/save_location.php`, { lat: selectedPosition.lat, lng: selectedPosition.lng }).then(() => { alert('Position enregistrée !'); cancelSelection(); fetchUsers(); }).catch(error => { console.error("Erreur lors de la sauvegarde:", error); alert('Une erreur est survenue.'); cancelSelection(); }); };


    // --- NOUVELLE FONCTION POUR LA SUPPRESSION ---
    const handleDeleteLocation = () => {
        // Demande de confirmation à l'utilisateur
        if (window.confirm("Êtes-vous sûr de vouloir supprimer votre position de la carte ?")) {
            axios.post(`${apiBaseUrl}/delete_location.php`)
                .then(() => {
                    alert("Votre position a été supprimée.");
                    fetchUsers(); // Met à jour la carte pour retirer le marqueur
                })
                .catch(error => {
                    console.error("Erreur lors de la suppression :", error);
                    alert("Une erreur est survenue lors de la suppression.");
                });
        }
    };

    return (
        <MapContainer ref={mapRef} center={[20, 0]} zoom={3} scrollWheelZoom={true} zoomControl={false}>
            <TileLayer
                attribution=' Rien server, try konami'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            <HeaderControl 
                currentUser={currentUser} 
                onLogout={onLogout} 
                onGeolocate={handleGeolocate} 
                onDeleteLocation={handleDeleteLocation} // On passe la nouvelle fonction
            />
            
            <SaveLocationControl 
                position={selectedPosition} 
                onSave={saveLocation} 
                onCancel={cancelSelection} 
            />

            <LocationMarker 
                onMapClick={handleMapClick} 
                disabled={!isMapClickable} 
            />

            {selectedPosition && <Marker position={selectedPosition}></Marker>}

            {users.map(user => (
                <Marker
                    key={user.discord_id}
                    position={[user.latitude, user.longitude]}
                    icon={L.divIcon({
                        // On ajoute une classe pour le centrage et le positionnement
                        className: 'discord-avatar-marker',
                        
                        // --- MODIFICATION MAJEURE DU HTML DE L'ICÔNE ---
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
                >
                </Marker>
            ))}
        </MapContainer>
    );
}

export default MapComponent;