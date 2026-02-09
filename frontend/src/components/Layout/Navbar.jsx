// src/components/Layout/Navbar.jsx
import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import '../../styles/layout.css';

const Navbar = ({ user, onLogout, sidebarOpen }) => {
  return (
    <header className={`navbar ${sidebarOpen ? '' : 'shifted'}`}>
      <h1 className="navbar-title">
        Bonjour {user?.name || 'Utilisateur'} ! 
      </h1>
      <div className="navbar-user">
        <div className="notification" title="Notifications">
          <Bell size={22} color="#475569" />
        </div>
        <button
          onClick={onLogout}
          className="logout-btn"
        >
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Navbar;

