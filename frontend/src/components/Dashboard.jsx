import React, { useState, useCallback } from 'react';
import Layout from './Layout/Layout';
import DashboardHome from './Dashboard/DashboardHome'; // La Carte
import ManagerDashboard from './ManagerDashboard';     // Les Stats + Tableau
import SyncButton from './SyncButton';
import PullButton from './PullBoutton';
import '../styles/components.css';

const Dashboard = ({ user, onLogout }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeView, setActiveView] = useState('map'); // 'map' ou 'stats'

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <Layout 
      user={user} 
      onLogout={onLogout} 
      currentView={activeView} 
      setView={setActiveView}
    >
      <div style={headerStyle}>
        <h2 className="dashboard-title">
          {activeView === 'map' ? '📍 Carte des Signalements' : '📊 Pilotage & Statistiques'}
        </h2>
        
        <div className="dashboard-actions" style={{ display: 'flex', gap: '10px' }}>
          {/* Les boutons de synchro ne sont utiles que pour le manager */}
          <SyncButton /> 
          <PullButton onRefresh={handleRefresh} />
        </div>
      </div>

      <div className="dashboard-content" style={{ padding: '20px' }}>
        {activeView === 'map' ? (
          <DashboardHome refreshKey={refreshTrigger} />
        ) : (
          <ManagerDashboard issuesRefreshKey={refreshTrigger} />
        )}
      </div>
    </Layout>
  );
};

const headerStyle = {
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '15px 25px',
  background: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  borderBottom: '3px solid #3b82f6'
};

export default Dashboard;