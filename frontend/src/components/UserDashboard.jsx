// pages/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import HeaderUser from '../components/HeaderUser';
import RoadMap from '../components/RoadMap';
import MyIssuesList from '../components/MyIssuesList';
import ReportModal from '../components/ReportModal';

const UserDashboard = ({ user }) => {
  const [issues, setIssues] = useState([]); // Tous les problèmes sur la carte
  const [showModal, setShowModal] = useState(false);

  // Charger les données de ton API locale au démarrage
  useEffect(() => {
    // Appel vers axios.get('http://127.0.0.1:3000/problems')
  }, []);

  return (
    <div style={styles.dashboard}>
      <HeaderUser user={user} />
      
      <main style={styles.mainContent}>
        {/* Section Carte */}
        <div style={styles.mapContainer}>
          <RoadMap issues={issues} />
        </div>

        {/* Section Liste latérale (ou en dessous sur mobile) */}
        <div style={styles.listContainer}>
          <h3>Mes Signalements</h3>
          <MyIssuesList userId={user.id} />
        </div>
      </main>

      {/* Bouton flottant pour signaler */}
      <button style={styles.fab} onClick={() => setShowModal(true)}>+</button>

      {/* Fenêtre surgissante pour le formulaire */}
      {showModal && <ReportModal onClose={() => setShowModal(false)} user={user} />}
    </div>
  );
};

const styles = {
  dashboard: { display: 'flex', flexDirection: 'column', height: '100vh' },
  mainContent: { display: 'flex', flex: 1, overflow: 'hidden' }, // Layout côte à côte
  mapContainer: { flex: 2, position: 'relative' },
  listContainer: { flex: 1, padding: '20px', backgroundColor: 'white', borderLeft: '1px solid #ddd', overflowY: 'auto' },
  fab: { position: 'absolute', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#4F46E5', color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1000 }
};

export default UserDashboard;