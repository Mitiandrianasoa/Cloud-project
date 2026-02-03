// src/components/Dashboard/StatsCards.jsx
import React from 'react';
import '../../styles/components.css';

const StatsCards = ({ stats }) => {
  return (
    <div className="stats-grid">
      {stats.map((stat, i) => (
        <div key={i} className="stat-card">
          <h3>{stat.title}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
            <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

