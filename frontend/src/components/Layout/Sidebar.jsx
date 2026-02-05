// src/components/Layout/Sidebar.jsx
import React from 'react';
import { Home, BarChart2, Users, Settings, ChevronLeft } from 'lucide-react';
import { useAuth } from '../AuthContext'; // On récupère le rôle ici

const Sidebar = ({ isOpen, toggleSidebar, currentView, setView }) => {
  const { user } = useAuth();

  // On définit les items avec une propriété 'minRole'
  const menuItems = [
    { id: 'map', icon: Home, label: 'Accueil / Carte', minRole: 1 },
    { id: 'stats', icon: BarChart2, label: 'Statistiques Manager', minRole: 3 },
    { id: 'users', icon: Users, label: 'Utilisateurs', minRole: 3 },
    { id: 'settings', icon: Settings, label: 'Paramètres', minRole: 1 },
  ];

  // On filtre la liste pour ne garder que ce que l'utilisateur a le droit de voir
  const visibleItems = menuItems.filter(item => 
    !user || Number(user.role_id) >= item.minRole
  );

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">My Map</h2>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <ChevronLeft style={{ 
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', 
            transition: 'transform 0.3s' 
          }} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
            style={buttonStyle}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const buttonStyle = { 
  width: '100%', 
  border: 'none', 
  background: 'none', 
  textAlign: 'left', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px' 
};

export default Sidebar;