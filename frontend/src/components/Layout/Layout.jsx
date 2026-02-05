// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../styles/components.css';

const Layout = ({ children, user, onLogout, currentView, setView }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        currentView={currentView} // Vue actuelle (map ou stats)
        setView={setView}         // Fonction pour changer la vue
      />
      <div className={`main-content ${!sidebarOpen ? 'shifted' : ''}`}>
        <Navbar user={user} onLogout={onLogout} sidebarOpen={sidebarOpen} />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;