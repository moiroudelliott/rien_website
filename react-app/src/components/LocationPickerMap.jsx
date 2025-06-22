import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/_map.css'; // On peut réutiliser certains styles

// Fix pour l'icône de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

function LocationPickerMap({ onLocationSelect }) {
    const [markerPosition, setMarkerPosition] = useState(null);

    const handleMapClick = (latlng) => {
        setMarkerPosition(latlng);
        onLocationSelect(latlng);
    };

    return (
        <MapContainer center={[46.603354, 1.888334]} zoom={5} style={{ height: '300px', width: '100%', borderRadius: '8px' }}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {markerPosition && <Marker position={markerPosition}></Marker>}
        </MapContainer>
    );
}

export default LocationPickerMap; 