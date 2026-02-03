import React, { useState, useCallback } from 'react';
import Layout from './Layout/Layout';
import DashboardHome from './Dashboard/DashboardHome';
import SyncButton from './SyncButton';
import PullButton from './PullBoutton';
import '../styles/components.css';

const Dashboard = ({ user, onLogout }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          📍 Gestion des Signalements Routiers
        </h2>
        <div className="dashboard-actions">
          <SyncButton /> 
          <PullButton onRefresh={handleRefresh} />
        </div>
      </div>

      <DashboardHome refreshKey={refreshTrigger} /> 
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
  borderBottom: '2px solid #1e3a8a' // Rappel du bleu sécurité
};

export default Dashboard;