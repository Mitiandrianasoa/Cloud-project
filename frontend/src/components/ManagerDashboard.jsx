import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import DangerPieChart from './DangerPieChart';
import ProgressStats from './ProgressStats';
import { useAuth } from './AuthContext';
import StatusUpdater from './StatusUpdater';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const getProgress = (status) => {
  switch (status?.toUpperCase()) {
    case 'EN_COURS': return 50;
    case 'RESOLU':
    case 'TERMINÉ': return 100;
    default: return 0;
  }
};  
  const fetchIssues = async () => {
    try {
      const response = await fetch('http://localhost:3000/road_issues');
      const data = await response.json();
      setIssues(data);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Sécurité renforcée : si l'user n'est pas manager (role_id 3), on bloque l'accès
  if (!user || Number(user.role_id) !== 3) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
       
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>🛠️ Gestion des Signalements</h2>
        <p>Interface de pilotage - Manager : <strong>{user.name}</strong></p>
      </header>
<div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
      <ProgressStats issues={issues} />
      <DangerPieChart issues={issues} />
    </div>
      {loading ? (
        <p>Chargement des données...</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th>Date</th>
              <th>Problème</th>
              <th>Danger</th>
              <th>Description</th>
              <th>Statut Actuel</th>
              <th>Actions Manager</th>
              <th>Avancement</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} style={trStyle}>
                <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                <td>
                  <span style={badgeStyle(issue.type)}>{issue.title}</span>
                </td>
                <td>
                  <b style={{ color: issue.niveau_danger === 'ELEVE' ? '#ef4444' : '#f59e0b' }}>
                    {issue.niveau_danger}
                  </b>
                </td>
                <td style={descStyle}>{issue.description}</td>
                <td>
                  <code style={statusBadgeStyle(issue.status)}>{issue.status}</code>
                </td>
                <td>
                  <StatusUpdater 
                    issueId={issue.id} 
                    currentStatus={issue.status} 
                    onUpdate={fetchIssues} // Rafraîchit la liste après modification
                  />
                </td>
                <td style={{ padding: '12px', minWidth: '200px' }}>
      {/* Barre de progression */}
      <div style={progressContainer}>
        <div style={progressBar(getProgress(issue.status))}>
          {getProgress(issue.status)}%
        </div>
      </div>

      {/* Détail des dates par étape */}
      <div style={timelineStyle}>
        <div style={stepStyle(true)}>
          <b>Signalé:</b> {new Date(issue.created_at).toLocaleDateString()}
        </div>
        
        {issue.started_at && (
          <div style={stepStyle(issue.status !== 'NOUVEAU')}>
            <b>Lancé:</b> {new Date(issue.started_at).toLocaleDateString()}
          </div>
        )}

        {issue.resolved_at && (
          <div style={stepStyle(issue.status === 'RESOLU' || issue.status === 'TERMINÉ')}>
            ✅ <b>Terminé:</b> {new Date(issue.resolved_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// --- STYLES ---
const containerStyle = { padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', margin: '20px' };
const headerStyle = { borderBottom: '2px solid #f3f4f6', marginBottom: '20px', paddingBottom: '10px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const theadStyle = { backgroundColor: '#f9fafb', color: '#4b5563', textTransform: 'uppercase', fontSize: '12px' };
const trStyle = { borderBottom: '1px solid #f3f4f6' };
const descStyle = { maxWidth: '250px', fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

const badgeStyle = (type) => ({
  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
  backgroundColor: type === 'urgent' ? '#fee2e2' : '#dcfce7', color: type === 'urgent' ? '#b91c1c' : '#15803d'
});

const statusBadgeStyle = (status) => ({
  padding: '2px 6px', borderRadius: '4px',
  backgroundColor: status === 'EN_ATTENTE' ? '#f3f4f6' : status === 'EN_COURS' ? '#dbeafe' : '#dcfce7',
  color: status === 'EN_ATTENTE' ? '#374151' : status === 'EN_COURS' ? '#1e40af' : '#166534'
});
const progressContainer = {
  width: '100%',
  backgroundColor: '#e5e7eb',
  borderRadius: '10px',
  height: '14px',
  marginBottom: '8px',
  overflow: 'hidden'
};

const progressBar = (pct) => ({
  width: `${pct}%`,
  height: '100%',
  backgroundColor: pct === 100 ? '#10b981' : pct === 50 ? '#3b82f6' : '#9ca3af',
  color: 'white',
  fontSize: '9px',
  textAlign: 'center',
  transition: 'width 0.3s ease'
});

const timelineStyle = {
  fontSize: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  borderLeft: '2px solid #ddd',
  paddingLeft: '8px'
};

const stepStyle = (isActive) => ({
  color: isActive ? '#374151' : '#9ca3af',
  fontWeight: isActive ? '500' : 'normal'
});
export default ManagerDashboard;