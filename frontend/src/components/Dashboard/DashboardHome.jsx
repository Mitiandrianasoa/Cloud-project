import React, { useState, useEffect } from 'react';
import MapView from '../MapView';
import axios from 'axios';
import ManagerDashboard from '../ManagerDashboard';
import Statistiques from '../Statistiques';
import '../../styles/components.css';
import HasRole from '../HasRole';
const DashboardHome = ({ refreshKey }) => {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const response = await axios.get('http://localhost:3000/road_issues');
      setMarkers(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">🔒 Chargement des données de sécurité routière...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">
          🚧 Carte des Interventions - Antananarivo
        </h3>
        
        <div className="map-container-wrapper">
          <MapView 
            markers={markers} 
            onRefresh={fetchIssues} 
          />
        </div>

        <div className="map-info-bar">
          <span>📊 Points affichés sur la carte</span>
          <span>Total: <strong>{markers.length}</strong> signalements</span>
        </div>
        
        <button onClick={fetchIssues} className="btn-refresh" style={{ marginTop: '15px' }}>
          🔄 Recharger la carte
        </button>
      </div>
      <HasRole minRoleId={3}> <Statistiques markers={markers} /> 
      <ManagerDashboard />
      </HasRole>

    </div>
  );
};

export default DashboardHome;

