import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import UserProfileModal from './UserProfileModal';
import 'leaflet/dist/leaflet.css';
import '../styles/_map.css';

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
    return user.avatar_hash
        ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.png?size=${size}`
        : '/vite.svg'; // Fallback
};

// --- COMPOSANTS D'INTERFACE INTERNES ---

// Composant pour le header avec les infos et actions de l'utilisateur
const HeaderControl = ({ currentUser, onProfileClick, onGeolocate, onDeleteLocation }) => {
    const headerRef = useRef(null);
    useEffect(() => {
        if (headerRef.current) {
            L.DomEvent.disableClickPropagation(headerRef.current);
        }
    });

    return (
        <div className="leaflet-top leaflet-right" ref={headerRef}>
            <div className="leaflet-control user-header">
                <button onClick={onGeolocate} className="action-button geolocate-button" title="Me géolocaliser">
                    <img src="/gps.svg" alt="GPS" />
                </button>
                <button onClick={onDeleteLocation} className="action-button delete-location-button" title="Supprimer ma position">
                    <img src="/delete.svg" alt="Supprimer" />
                </button>
                <button onClick={onProfileClick} className="action-button profile-button" title="Mon Profil">
                    <img src={getAvatarUrl(currentUser, 64)} alt="Mon Profil"/>
                </button>
            </div>
        </div>
    );
};

const SaveLocationControl = ({ position, onSave, onCancel }) => {
    const bannerRef = useRef(null);
    useEffect(() => {
        if (bannerRef.current) {
            L.DomEvent.disableClickPropagation(bannerRef.current);
        }
    });

    if (!position) return null;
    return (
        <div className="leaflet-bottom leaflet-center">
            <div className="leaflet-control save-location-banner" ref={bannerRef}>
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
};

// --- COMPOSANT PRINCIPAL DE LA CARTE ---

function LocationMarker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapComponent({ currentUser, onProfileUpdated }) {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingUserId, setViewingUserId] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const mapRef = useRef(null);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchLocations = () => {
        axios.get(`${apiBaseUrl}/get_all_users.php?with_location=true`)
            .then(response => {
                const validUsers = response.data.filter(user => user.latitude != null && user.longitude != null);
                setLocations(validUsers);
            })
            .catch(error => console.error("Erreur de chargement des utilisateurs:", error))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleMarkerClick = (user) => setViewingUserId(user.discord_id);

    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setSelectedPosition(newPos);
                mapRef.current?.flyTo(newPos, 13);
            },
            () => alert("Impossible de récupérer votre position.")
        );
    };

    const handleDeleteLocation = () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer votre position de la carte ?")) {
            axios.post(`${apiBaseUrl}/delete_location.php`)
                .then(() => {
                    alert("Votre position a été supprimée.");
                    fetchLocations(); // Rafraîchit les données
                })
                .catch(error => console.error("Erreur lors de la suppression :", error));
        }
    };
    
    const handleSaveLocation = () => {
        if (!selectedPosition) return;
        axios.post(`${apiBaseUrl}/save_location.php`, { lat: selectedPosition.lat, lng: selectedPosition.lng })
            .then(() => {
                alert('Position enregistrée !');
                setSelectedPosition(null);
                fetchLocations();
            })
            .catch(error => {
                console.error("Erreur lors de la sauvegarde:", error);
                alert('Une erreur est survenue.');
            });
    };

    const handleProfileUpdateInMap = (updatedProfile) => {
        setLocations(prevLocations =>
            prevLocations.map(loc =>
                loc.discord_id === updatedProfile.discord_id
                    ? { ...loc, ...updatedProfile }
                    : loc
            )
        );
        if (currentUser.discord_id === updatedProfile.discord_id) {
            onProfileUpdated(updatedProfile);
        }
    };

    if (isLoading) return <div className="loading-spinner"></div>;

    return (
        <div className="map-wrapper">
            <MapContainer ref={mapRef} center={[20, 0]} zoom={3} scrollWheelZoom={true} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
                <ZoomControl position="topleft" />
                <LocationMarker onMapClick={(latlng) => setSelectedPosition(latlng)} />
                <HeaderControl currentUser={currentUser} onProfileClick={() => setViewingUserId(currentUser.discord_id)} onGeolocate={handleGeolocate} onDeleteLocation={handleDeleteLocation} />
                <SaveLocationControl position={selectedPosition} onSave={handleSaveLocation} onCancel={() => setSelectedPosition(null)} />
                {selectedPosition && <Marker position={selectedPosition}></Marker>}
                {locations.map(user => (
                    <Marker
                        key={user.discord_id}
                        position={[user.latitude, user.longitude]}
                        eventHandlers={{ click: () => handleMarkerClick(user) }}
                        icon={L.divIcon({
                            className: 'discord-avatar-marker',
                            html: `<div class="avatar-container"><img src="${getAvatarUrl(user)}" alt="${user.username}" /></div><div class="marker-arrow"></div>`,
                            iconSize: [60, 80],
                            iconAnchor: [30, 70]
                        })}
                    />
                ))}
            </MapContainer>
            {viewingUserId && (
                <UserProfileModal
                    discordIdToView={viewingUserId}
                    currentUser={currentUser}
                    isOwnProfile={viewingUserId === currentUser.discord_id}
                    onClose={() => setViewingUserId(null)}
                    onProfileUpdated={handleProfileUpdateInMap}
                />
            )}
        </div>
    );
}

export default MapComponent;