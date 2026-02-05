import React, { useMemo } from 'react';
import { MapPin, Maximize, Activity, DollarSign } from 'lucide-react';

const GlobalSummaryCards = ({ issues }) => {
  const summary = useMemo(() => {
    const totalPoints = issues.length;
    
    // Calcul de la surface totale (en m² par exemple)
    const totalSurface = issues.reduce((acc, curr) => acc + (Number(curr.surface) || 0), 0);
    
    // Calcul du budget total estimé
    const totalBudget = issues.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);
    
    // Calcul de l'avancement global
    const totalProgress = issues.reduce((acc, curr) => {
      if (curr.status === 'EN_COURS') return acc + 50;
      if (curr.status === 'RESOLU' || curr.status === 'TERMINÉ') return acc + 100;
      return acc;
    }, 0);

    const avgProgress = totalPoints > 0 ? Math.round(totalProgress / totalPoints) : 0;

    return { totalPoints, totalSurface, totalBudget, avgProgress };
  }, [issues]);

  return (
    <div style={containerStyle}>
      <Card icon={<MapPin color="#3b82f6"/>} label="Nb de points" value={summary.totalPoints} />
      <Card icon={<Maximize color="#10b981"/>} label="Total Surface" value={`${summary.totalSurface} m²`} />
      <Card icon={<Activity color="#f59e0b"/>} label="Avancement global" value={`${summary.avgProgress}%`} />
      <Card icon={<DollarSign color="#ef4444"/>} label="Total Budget" value={`${summary.totalBudget.toLocaleString()} Ar`} />
    </div>
  );
};

// Petit composant interne pour chaque carte
const Card = ({ icon, label, value }) => (
  <div style={cardStyle}>
    <div style={iconCircle}>{icon}</div>
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{value}</div>
    </div>
  </div>
);

const containerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' };
const cardStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#fff', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' };
const iconCircle = { width: '40px', height: '40px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default GlobalSummaryCards;