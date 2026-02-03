import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import '../styles/components.css';

const Statistiques = ({ markers }) => {
  const data = useMemo(() => {
    const counts = { 'urgent': 0, 'moyen': 0, 'faible': 0 };
    
    markers.forEach(m => {
      const s = m.status?.toLowerCase() || 'moyen';
      if (counts.hasOwnProperty(s)) {
        counts[s]++;
      } else {
        counts['moyen']++;
      }
    });

    return [
      { name: 'Urgent', quantite: counts['urgent'], color: '#dc2626' },
      { name: 'Moyen', quantite: counts['moyen'], color: '#f59e0b' },
      { name: 'Faible', quantite: counts['faible'], color: '#10b981' }
    ];
  }, [markers]);

  const COLORS = ['#1e3a8a', '#f59e0b', '#dc2626', '#10b981', '#6366f1'];

  return (
    <div className="statistiques-container">
      <h3 className="statistiques-title">📊 Analyse des Signalements Routiers</h3>
      
      <div className="statistiques-grid">
        <div className="statistiques-chart-box">
          <h4 className="statistiques-subtitle">Répartition par niveau d'urgence</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tick={{fill: '#374151'}} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="quantite" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="statistiques-cards">
          <div className="statistiques-card primary">
            <span className="statistiques-card-label">Total Signalements</span>
            <span className="statistiques-card-value">{markers.length}</span>
          </div>
          <div className="statistiques-card danger">
            <span className="statistiques-card-label">Plus fréquent</span>
            <span className="statistiques-card-value-small">{data[0]?.name || "N/A"}</span>
          </div>
          <div className="statistiques-card warning">
            <span className="statistiques-card-label">En attente</span>
            <span className="statistiques-card-value-small">{data[1]?.quantite || 0}</span>
          </div>
          <div className="statistiques-card success">
            <span className="statistiques-card-label">Faible risque</span>
            <span className="statistiques-card-value-small">{data[2]?.quantite || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;

