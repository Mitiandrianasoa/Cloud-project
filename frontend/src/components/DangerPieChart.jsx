import React, { useMemo } from 'react';

const DangerPieChart = ({ issues }) => {
  const stats = useMemo(() => {
    const total = issues.length;
    if (total === 0) return null;

    const counts = {
      ELEVE: issues.filter(i => i.niveau_danger?.toUpperCase() === 'ELEVÉ' || i.niveau_danger?.toUpperCase() === 'ELEVÉ').length,
      MOYEN: issues.filter(i => i.niveau_danger?.toUpperCase() === 'MOYEN').length,
      FAIBLE: issues.filter(i => i.niveau_danger?.toUpperCase() === 'FAIBLE').length,
    };

    // Calcul des pourcentages pour l'affichage
    return {
      eleve: { pct: Math.round((counts.ELEVE / total) * 100), val: counts.ELEVE },
      moyen: { pct: Math.round((counts.MOYEN / total) * 100), val: counts.MOYEN },
      faible: { pct: Math.round((counts.FAIBLE / total) * 100), val: counts.FAIBLE },
      total
    };
  }, [issues]);

  if (!stats) return null;

  // Calcul simple pour le cercle SVG (Stroke-dasharray)
  const radius = 15.9155;
  const circ = 2 * Math.PI * radius; // Environ 100
  const offsetEleve = 100 - stats.eleve.pct;
  const offsetMoyen = 100 - (stats.eleve.pct + stats.moyen.pct);

  return (
    <div style={cardStyle}>
      <h4>📊 Répartition par Danger</h4>
      <div style={contentStyle}>
        {/* Graphique Cercle SVG */}
        <div style={chartWrapper}>
          <svg viewBox="0 0 42 42" width="120" height="120">
            {/* Faible (Fond/Base) */}
            <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#dbeafe" strokeWidth="6" />
            {/* Moyen */}
            <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="6" 
              strokeDasharray={`${stats.moyen.pct} ${100 - stats.moyen.pct}`} 
              strokeDashoffset={offsetMoyen} />
            {/* Elevé */}
            <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#ef4444" strokeWidth="6" 
              strokeDasharray={`${stats.eleve.pct} ${100 - stats.eleve.pct}`} 
              strokeDashoffset="0" />
          </svg>
          <div style={totalOverlay}>
            <strong>{stats.total}</strong>
            <small>Total</small>
          </div>
        </div>

        {/* Légende */}
        <div style={legendStyle}>
          <LegendItem color="#ef4444" label="Élevé" pct={stats.eleve.pct} count={stats.eleve.val} />
          <LegendItem color="#f59e0b" label="Moyen" pct={stats.moyen.pct} count={stats.moyen.val} />
          <LegendItem color="#3b82f6" label="Faible" pct={stats.faible.pct} count={stats.faible.val} />
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, pct, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
    <div style={{ width: '12px', height: '12px', backgroundColor: color, borderRadius: '2px', marginRight: '8px' }} />
    <span style={{ flex: 1 }}>{label}</span>
    <span style={{ fontWeight: 'bold' }}>{pct}%</span>
    <span style={{ color: '#999', marginLeft: '5px' }}>({count})</span>
  </div>
);

// --- STYLES ---
const cardStyle = { flex: 1, padding: '15px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const contentStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: '10px' };
const chartWrapper = { position: 'relative', display: 'inline-block' };
const totalOverlay = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' };
const legendStyle = { display: 'flex', flexDirection: 'column', marginLeft: '20px' };

export default DangerPieChart;