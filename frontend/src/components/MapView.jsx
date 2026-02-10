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
  
  // URL de ton serveur de tuiles local (TileServer-GL)
  const tileUrl = 'http://localhost:8080/styles/basic-preview/512/{z}/{x}/{y}.png';

  // --- LOGIQUE DE FILTRAGE ---
  const visibleMarkers = markers.filter(m => {
    // Si l'utilisateur est un simple citoyen (role_id === 1), on cache les signalements "EN_ATTENTE"
    if (!user || user.role_id === 1) {
      return m.status?.toUpperCase() !== 'EN_ATTENTE';
    }
    return true;
  });     
   
  const MapEvents = () => {
    useMapEvents({
      click(e) { 
        // Seuls les admins/agents (role_id > 1) peuvent ajouter un point sur la carte
        if (user && user.role_id > 1) {
            setClickPos(e.latlng); 
        }
      },
    });
    return null;
  };

  return (
    <MapContainer 
      center={[-18.9149, 47.5316]} 
      zoom={13} 
      style={{ height: '600px', width: '100%', borderRadius: '8px', border: '1px solid #ccc' }}
    >
      <TileLayer url={tileUrl} />
      <MapEvents />

      {visibleMarkers.map((m, i) => {
        const lat = parseFloat(m.latitude);
        const lng = parseFloat(m.longitude);

        if (isNaN(lat) || isNaN(lng)) return null;

        const dangerLevel = m.niveau_danger?.toUpperCase() || 'FAIBLE';
        const currentIcon = icons[dangerLevel] || defaultIcon;

        return (
          <Marker key={m.id || i} position={[lat, lng]} icon={currentIcon}>
            <Popup>
              <div style={{ minWidth: '240px', maxWidth: '300px', fontFamily: 'Arial, sans-serif' }}>
                {/* Header du Popup */}
                <div style={{ 
                  backgroundColor: dangerLevel === 'ELEVÉ' ? '#fee2e2' : dangerLevel === 'MOYEN' ? '#ffedd5' : '#dbeafe',
                  padding: '8px', borderRadius: '4px', marginBottom: '10px', textAlign: 'center'
                }}>
                  <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '16px' }}>{m.title}</h4>
                </div>
                
                {/* --- SECTION IMAGES --- */}
                {m.images && m.images.length > 0 ? (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      {m.images.slice(0, 2).map((url, idx) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={idx}>
                          <img 
                            src={url} 
                            alt="Incident" 
                            style={{ 
                              width: '100%', 
                              height: '70px', 
                              objectFit: 'cover', 
                              borderRadius: '4px', 
                              border: '1px solid #ddd' 
                            }} 
                          />
                        </a>
                      ))}
                    </div>
                    {m.images.length > 2 && (
                      <p style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '4px' }}>
                        + {m.images.length - 2} autre(s) photo(s)
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', padding: '10px', background: '#f9f9f9', 
                    borderRadius: '4px', marginBottom: '10px', border: '1px dashed #ccc' 
                  }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>📷 Aucune photo disponible</span>
                  </div>
                )}

                {/* Détails techniques */}
                <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  <p style={{ margin: '4px 0' }}><strong>Danger :</strong> 
                    <span style={{ color: dangerLevel === 'ELEVÉ' ? '#dc2626' : dangerLevel === 'MOYEN' ? '#ea580c' : '#2563eb', fontWeight: 'bold' }}> {dangerLevel}</span>
                  </p>
                  <p style={{ margin: '4px 0' }}><strong>Statut :</strong> <span style={{ background: '#eee', padding: '2px 5px', borderRadius: '3px', fontSize: '11px' }}>{m.status || 'EN_ATTENTE'}</span></p>
                  <p style={{ margin: '4px 0' }}><strong>Entreprise :</strong> {m.company || 'Non assignée'}</p>
                  <p style={{ margin: '4px 0' }}><strong>Surface :</strong> {m.surface ? `${m.surface} m²` : 'N/A'}</p>
                  <p style={{ margin: '4px 0' }}><strong>Budget :</strong> {m.budget ? `${Number(m.budget).toLocaleString()} Ar` : 'À définir'}</p>
                  
                  <hr style={{ border: '0.5px solid #eee', margin: '10px 0' }} />
                  <p style={{ fontStyle: 'italic', color: '#444', backgroundColor: '#fefefe', padding: '5px' }}>
                    "{m.description || 'Pas de description'}"
                  </p>
                  <p style={{ fontSize: '11px', color: '#888', textAlign: 'right', marginTop: '5px' }}>
                    Signalé le : {new Date(m.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Formulaire pour ajouter un nouveau point après un clic */}
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
