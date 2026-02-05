import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../styles/components.css';

const IssueForm = ({ coords, onSubmit, onCancel }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    niveau_danger: '',
    type: '',
    surface: '',
    budget: '',
    company: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectType = (typeValue, label) => {
    setFormData({ ...formData, type: typeValue, title: label });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Erreur : vous n'êtes pas identifié.");
      return;
    }

    const payload = {
      ...formData,
      latitude: coords.lat,
      longitude: coords.lng,
      user_id: user.id, 
      status: 'EN_ATTENTE'
    };

    try {
      const response = await fetch('http://localhost:3000/road_issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Signalement enregistré avec succès !");
        onSubmit(); 
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Erreur API:", err);
    }
  };

  return (
    <div className="issue-form">
      <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>🚀 Nouveau Signalement</h4>
      
      {/* Sélection du Type */}
      <div className="form-group">
        <label className="form-label">Type de problème</label>
        <div className="button-group">
          {[
            { v: 'urgent', l: '🚨 Urgence' },
            { v: 'anomaly', l: '⚠️ Anomalie' },
            { v: 'info', l: 'ℹ️ Info' }
          ].map(t => (
            <button 
              key={t.v}
              type="button"
              onClick={() => selectType(t.v, t.l)}
              className={`type-button ${formData.type === t.v ? 'active' : ''}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Niveau de Danger */}
        <div className="form-group">
          <label className="form-label">Niveau d'importance</label>
          <select 
            name="niveau_danger" 
            value={formData.niveau_danger} 
            onChange={handleChange} 
            className="form-select"
          >
            <option value="FAIBLE">Faible (Niveau 1)</option>
            <option value="MOYEN">Moyen (Niveau 2)</option>
            <option value="ELEVE">Élevé (Niveau 3)</option>
          </select>
        </div>

        <div className="form-group">
          <textarea 
            name="description" 
            placeholder="Décrivez le problème en détail..." 
            onChange={handleChange} 
            required 
            className="form-textarea"
          />
        </div>

        <div className="form-row">
          <input 
            type="number" 
            name="surface" 
            placeholder="Surface (m²)" 
            onChange={handleChange} 
            className="form-input"
          />
          <input 
            type="number" 
            name="budget" 
            placeholder="Budget (Ar)" 
            onChange={handleChange} 
            className="form-input"
          />
        </div>

        <div className="issue-form-actions">
          <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
          <button type="button" onClick={onCancel} className="btn btn-danger btn-sm">Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default IssueForm;

