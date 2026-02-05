import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // Vérifie bien le chemin vers ta config Firebase

const StatusUpdater = ({ issueId, currentStatus, onUpdate }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  // Sécurité : Seul le manager (role_id 3) peut voir/utiliser ce composant
  if (!user || Number(user.role_id) !== 3) {
    return null;
  }

  const handleUpdate = async () => {
  setLoading(true);
  try {
    // 1. Mise à jour PostgreSQL
    const response = await fetch(`http://localhost:3000/road_issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    });

    if (!response.ok) throw new Error("Erreur PostgreSQL");

    // 2. Préparation des données pour Firebase
    const now = new Date().toISOString();
    const firebaseUpdate = {
      status: status,
      updated_at: now
    };

    // On ajoute les dates spécifiques selon le statut
    if (status === 'EN_COURS') {
      firebaseUpdate.started_at = now;
    } else if (status === 'RESOLU') {
      firebaseUpdate.resolved_at = now;
    }

    // 3. Mise à jour Firebase
    const issueRef = doc(db, "road_issues", issueId);
    await updateDoc(issueRef, firebaseUpdate);

    alert("Statut et dates mis à jour avec succès ! ✅");
    if (onUpdate) onUpdate();

  } catch (err) {
    console.error("Erreur de synchro:", err);
    alert("Erreur lors de la mise à jour.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={containerStyle}>
      <label style={labelStyle}>Action Manager :</label>
      <div style={{ display: 'flex', gap: '5px' }}>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="EN_ATTENTE">En attente</option>
          <option value="NOUVEAU">Nouveau</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLU">Résolu</option>
          <option value="ANNULÉ">Annulé</option>
        </select>
        <button 
          onClick={handleUpdate} 
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? '...' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { marginTop: '5px', padding: '8px', backgroundColor: '#f0f7ff', borderRadius: '6px', border: '1px solid #dbeafe' };
const labelStyle = { fontSize: '10px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', marginBottom: '4px' };
const selectStyle = { fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid #bfdbfe', flex: 1 };
const buttonStyle = { backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

export default StatusUpdater;