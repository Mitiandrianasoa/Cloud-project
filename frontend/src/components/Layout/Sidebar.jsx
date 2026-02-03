// src/components/Layout/Sidebar.jsx
import React from 'react';
import { Home, TrendingUp, Users, ShoppingCart, Settings, LogOut, ChevronLeft } from 'lucide-react';
import '../../styles/layout.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { icon: Home, label: 'Accueil', active: true },
    { icon: TrendingUp, label: 'Statistiques' },
    { icon: Users, label: 'Clients' },
    { icon: ShoppingCart, label: 'Commandes' },
    { icon: Settings, label: 'Paramètres' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">My Map</h2>
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft style={{ 
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', 
            transition: 'transform 0.3s' 
          }} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, i) => (
          <a
            key={i}
            href="#"
            className={`sidebar-item ${item.active ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

