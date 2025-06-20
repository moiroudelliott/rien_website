import React from 'react';
import MapComponent from '../components/MapComponent';

const MapPage = ({ currentUser, onLogout, onProfileUpdated }) => {
  return (
    // Ce conteneur existait déjà dans App.jsx, je le conserve ici
    <div className="map-page-container">
      <MapComponent
        currentUser={currentUser}
        onLogout={onLogout}
        onProfileUpdated={onProfileUpdated}
      />
    </div>
  );
};

export default MapPage; 