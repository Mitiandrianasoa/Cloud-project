import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import axios from 'axios';
import '../styles/components.css';

const SyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const logRes = await axios.get('http://localhost:3000/sync_logs?status=PENDING');
      const logs = logRes.data;

      if (logs.length === 0) {
        alert("✅ Déjà synchronisé !");
        return;
      }

      const syncTasks = logs.map(async (log) => {
        try {
          const docRef = doc(db, "road_issues", log.entity_id);
          await setDoc(docRef, { ...log.data, synced_at: serverTimestamp() });

          console.log(`✅ Envoyé à Firestore : ${log.entity_id}`);
          return axios.patch(`http://localhost:3000/sync_logs/${log.id}`, {
            status: 'SUCCESS'
          });
        } catch (err) {
          console.error(`Erreur pour le log ${log.id}`, err);
          return axios.patch(`http://localhost:3000/sync_logs/${log.id}`, { status: 'FAILED' });
        }
      });

      await Promise.all(syncTasks);
      
      alert(`⚡ Synchronisation terminée : ${logs.length} éléments !`);
    } catch (err) {
      alert("❌ Erreur globale de synchro");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync} 
      disabled={isSyncing}
      className={`btn-sync ${isSyncing ? 'loading' : ''}`}
    >
      {isSyncing ? 'Synchronisation en cours...' : '🚀 Synchroniser avec Firebase Cloud'}
    </button>
  );
};

export default SyncButton;

