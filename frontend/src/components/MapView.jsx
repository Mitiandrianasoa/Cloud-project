import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import IssueForm from './IssueForm';
import 'leaflet/dist/leaflet.css';
import { useAuth } from './AuthContext';

// Icônes personnalisées par niveau de danger
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const icons = {
  'ELEVÉ': createIcon('red'),
  'MOYEN': createIcon('orange'),
  'FAIBLE': createIcon('blue')
};

const defaultIcon = createIcon('blue');

const MapView = ({ markers = [], onRefresh }) => {
  const [clickPos, setClickPos] = useState(null);
  const { user } = useAuth();
  const tileUrl = 'http://localhost:8080/styles/basic-preview/512/{z}/{x}/{y}.png';

  // --- LOGIQUE DE FILTRAGE ---
  // On filtre les marqueurs avant l'affichage
  const visibleMarkers = markers.filter(m => {
    // Si VISITEUR (role_id 1) ou non connecté : on cache "EN_ATTENTE"
    if (!user || user.role_id === 1) {
      return m.status !== 'EN_ATTENTE';
    }
    // USER (2) et MANAGER (3) voient tout
    return true;
  });

  const MapEvents = () => {
    useMapEvents({
      click(e) { 
        // Seuls USER et MANAGER peuvent cliquer pour signaler
        if (user && user.role_id >= 2) {
            setClickPos(e.latlng); 
        }
      },
    });
    return null;
  };

  return (
    <MapContainer center={[-18.9149, 47.5316]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer url={tileUrl} />
      <MapEvents />

      {/* Utilisation de visibleMarkers au lieu de markers */}
      {visibleMarkers.map((m, i) => {
        const lat = parseFloat(m.latitude);
        const lng = parseFloat(m.longitude);

        if (isNaN(lat) || isNaN(lng)) return null;

        const dangerLevel = m.niveau_danger?.toUpperCase() || 'FAIBLE';
        const currentIcon = icons[dangerLevel] || defaultIcon;

        return (
          <Marker key={m.id || i} position={[lat, lng]} icon={currentIcon}>
            <Popup>
              <div style={{ minWidth: '220px', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ 
                  backgroundColor: dangerLevel === 'ELEVE' ? '#fee2e2' : dangerLevel === 'MOYEN' ? '#ffedd5' : '#dbeafe',
                  padding: '5px', borderRadius: '4px', marginBottom: '8px', textAlign: 'center'
                }}>
                  <h4 style={{ margin: 0, color: '#1e3a8a' }}>{m.title}</h4>
                </div>
                
                <p><strong>Niveau :</strong> 
                  <span style={{ 
                    color: dangerLevel === 'ELEVE' ? 'red' : dangerLevel === 'MOYEN' ? 'orange' : 'blue',
                    fontWeight: 'bold' 
                  }}> {dangerLevel}</span>
                </p>
                
                <p><strong>Statut :</strong> <code>{m.status || 'EN_ATTENTE'}</code></p>
                <p><strong>Entreprise :</strong> {m.company || 'Non assignée'}</p>
                <p><strong>Budget :</strong> {m.budget ? `${m.budget} Ar` : 'À définir'}</p>
                
                <hr style={{ border: '0.5px solid #eee' }} />
                <p style={{ fontStyle: 'italic', color: '#555' }}>{m.description}</p>
                <small style={{ color: '#999' }}>Signalé le : {new Date(m.created_at).toLocaleDateString()}</small>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {clickPos && (
        <Popup position={clickPos} onClose={() => setClickPos(null)}>
          <IssueForm 
            coords={clickPos} 
            onSubmit={() => {
              setClickPos(null);
              if (onRefresh) onRefresh();
            }} 
            onCancel={() => setClickPos(null)} 
          />
        </Popup>
      )}
    </MapContainer>
  );
};

export default MapView;