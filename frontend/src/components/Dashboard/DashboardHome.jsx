import React, { useState, useEffect } from 'react';
import MapView from '../MapView';
import axios from 'axios';
import '../../styles/components.css';
import GlobalSummaryCards from '../GlobalSummaryCards';

// 1. On ajoute 'user' dans les props ici
const DashboardHome = ({ refreshKey, user }) => { 
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'TOUS',
    danger: 'TOUS',
    mineOnly: false
  });

  const fetchIssues = async () => {
    try {
      const response = await axios.get('http://localhost:3000/road_issues');
      setMarkers(response.data);
      setFilteredMarkers(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshKey]);

  // LOGIQUE DE FILTRAGE
  useEffect(() => {
    let result = [...markers];

    if (filters.status !== 'TOUS') {
      result = result.filter(m => m.status === filters.status);
    }
    if (filters.danger !== 'TOUS') {
      result = result.filter(m => m.niveau_danger === filters.danger);
    }
    if (filters.mineOnly && user) {
      // Filtrage par l'ID de l'utilisateur connecté
      result = result.filter(m => m.user_id === user.id);
    }

    setFilteredMarkers(result);
  }, [filters, markers, user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">🔒 Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* 2. ON UTILISE filteredMarkers POUR LES STATS */}
      <GlobalSummaryCards issues={filteredMarkers} />

      <div className="dashboard-section">
        {/* BARRE DE FILTRES */}
        <div style={filterBarStyle}>
          <div style={filterGroup}>
            <label>Statut</label>
            <select style={selectStyle} onChange={(e) => setFilters({...filters, status: e.target.value})}>
              <option value="TOUS">Tous les statuts</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_COURS">En cours</option>
              <option value="RESOLU">Terminé</option>
            </select>
          </div>

          <div style={filterGroup}>
            <label>Danger</label>
            <select style={selectStyle} onChange={(e) => setFilters({...filters, danger: e.target.value})}>
              <option value="TOUS">Tous niveaux</option>
              <option value="ELEVE">Élevé</option>
              <option value="MOYEN">Moyen</option>
              <option value="FAIBLE">Faible</option>
            </select>
          </div>

          <div style={{ ...filterGroup, justifyContent: 'center' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={filters.mineOnly}
                onChange={(e) => setFilters({...filters, mineOnly: e.target.checked})} 
              /> 
              Mes signalements
            </label>
          </div>
        </div>

        <div className="map-container-wrapper">
          {/* 3. ON UTILISE filteredMarkers POUR LA CARTE */}
          <MapView 
            markers={filteredMarkers} 
            onRefresh={fetchIssues} 
          />
        </div>

        <div className="map-info-bar">
          <span>📊 Résultats filtrés</span>
          <span>Affichage de <strong>{filteredMarkers.length}</strong> sur {markers.length}</span>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const filterBarStyle = {
  display: 'flex', gap: '20px', background: '#fff', padding: '15px',
  borderRadius: '8px', marginBottom: '15px', border: '1px solid #e5e7eb', flexWrap: 'wrap'
};
const filterGroup = { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px' };
const selectStyle = { padding: '8px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '150px' };

export default DashboardHome;