import React, { useMemo } from 'react';

const ProgressStats = ({ issues }) => {
  const stats = useMemo(() => {
    if (!issues.length) return null;

    let totalProgress = 0;
    let resolvedCount = 0;
    let totalProcessingTime = 0; // en jours

    issues.forEach(issue => {
      // 1. Calcul de l'avancement théorique
      const status = issue.status?.toUpperCase();
      if (status === 'EN_COURS') totalProgress += 50;
      if (status === 'RESOLU' || status === 'TERMINÉ') {
        totalProgress += 100;
        resolvedCount++;

        // 2. Calcul du délai (si les dates existent)
        if (issue.resolved_at && issue.created_at) {
          const start = new Date(issue.created_at);
          const end = new Date(issue.resolved_at);
          const diffInDays = (end - start) / (1000 * 60 * 60 * 24);
          totalProcessingTime += diffInDays;
        }
      }
    });

    return {
      avgProgress: Math.round(totalProgress / issues.length),
      avgTime: resolvedCount > 0 ? (totalProcessingTime / resolvedCount).toFixed(1) : 0,
      total: issues.length,
      resolved: resolvedCount
    };
  }, [issues]);

  if (!stats) return null;

  return (
    <div style={statsContainer}>
      <div style={cardStyle}>
        <h4>Avancement Global</h4>
        <div style={progressBg}>
          <div style={{ ...progressFill, width: `${stats.avgProgress}%` }}>
            {stats.avgProgress}%
          </div>
        </div>
        <p style={{ fontSize: '12px', marginTop: '5px' }}>
          Basé sur {stats.total} signalements
        </p>
      </div>

      <div style={cardStyle}>
        <h4>Performance</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
          {stats.avgTime} jours
        </div>
        <p style={{ fontSize: '12px' }}>Délai moyen de traitement</p>
      </div>

      <div style={cardStyle}>
        <h4>État des Travaux</h4>
        <p>✅ {stats.resolved} terminés</p>
        <p>⏳ {stats.total - stats.resolved} en attente/cours</p>
      </div>
    </div>
  );
};

// --- STYLES ---
const statsContainer = { display: 'flex', gap: '20px', marginBottom: '20px' };
const cardStyle = { flex: 1, padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const progressBg = { width: '100%', backgroundColor: '#e5e7eb', borderRadius: '10px', height: '20px', overflow: 'hidden' };
const progressFill = { height: '100%', backgroundColor: '#10b981', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.5s ease' };

export default ProgressStats;