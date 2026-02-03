import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from './AuthContext';
import StatusUpdater from './StatusUpdater';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <h2>🚫 Accès Refusé</h2>
        <p>Cette interface est réservée à l'administration.</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>🛠️ Gestion des Signalements</h2>
        <p>Interface de pilotage - Manager : <strong>{user.name}</strong></p>
      </header>

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

export default ManagerDashboard;