// src/components/Dashboard/RecentTransactions.jsx
import React from 'react';

const RecentTransactions = ({ transactions }) => {
  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
      <h3 style={{ padding: '25px', borderBottom: '1px solid #e2e8f0', fontSize: '1.3rem' }}>
        Dernières transactions
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: '16px 25px', color: '#475569' }}>Client</th>
            <th style={{ textAlign: 'left', padding: '16px 25px', color: '#475569' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '16px 25px', color: '#475569' }}>Montant</th>
            <th style={{ textAlign: 'left', padding: '16px 25px', color: '#475569' }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '16px 25px' }}>{t.client}</td>
              <td style={{ padding: '16px 25px' }}>{t.date}</td>
              <td style={{ padding: '16px 25px', fontWeight: 'bold' }}>{t.montant}</td>
              <td style={{ padding: '16px 25px' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  backgroundColor: t.statut === 'Payé' ? '#dcfce7' : t.statut === 'En attente' ? '#fef3c7' : '#fee2e2',
                  color: t.statut === 'Payé' ? '#166534' : t.statut === 'En attente' ? '#92400e' : '#991b1b'
                }}>
                  {t.statut}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentTransactions;