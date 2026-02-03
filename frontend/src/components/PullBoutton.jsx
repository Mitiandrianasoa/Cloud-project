import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import axios from 'axios';
import '../styles/components.css';

const PullButton = () => {
  const [isPulling, setIsPulling] = useState(false);

  const handlePull = async () => {
    setIsPulling(true);
    try {
      const metaRes = await axios.get('http://localhost:3000/sync_meta/road_issues');
      const lastLog = metaRes.data.last_firebase_log || 0;

      const q = query(
        collection(db, "road_issues"),
        where("synced_at", ">", new Date(parseInt(lastLog))),
        orderBy("synced_at", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("✅ Déjà à jour !");
        return;
      }

      const pullTasks = querySnapshot.docs.map(async (docSnap) => {
        const fireData = docSnap.data();
        const entityId = docSnap.id;

        try {
          await axios.post('http://localhost:3000/sync_pull', {
            entity: 'road_issues',
            entity_id: entityId,
            data: fireData,
            action: 'PULL'
          });
          
          console.log(`📥 Récupéré de Firebase : ${entityId}`);
        } catch (err) {
          console.error(`Erreur lors du pull de ${entityId}`, err);
        }
      });

      await Promise.all(pullTasks);
      alert(`📥 ${querySnapshot.size} nouveaux éléments récupérés du Cloud !`);

    } catch (err) {
      console.error("Erreur globale de pull", err);
      alert("❌ Erreur lors de la récupération des données");
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <button 
      onClick={handlePull} 
      disabled={isPulling}
      className={`btn-pull ${isPulling ? 'loading' : ''}`}
    >
      {isPulling ? 'Récupération...' : '📥 Récolter les données Cloud'}
    </button>
  );
};

export default PullButton;

