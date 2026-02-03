import React from 'react';
import { useAuth } from './AuthContext';

const HasRole = ({ minRoleId, children }) => {
  const { user } = useAuth();

  // On compare les IDs numériques
  // Si l'utilisateur a un role_id inférieur au minimum requis, on n'affiche rien
  if (!user || user.role_id < minRoleId) {
    return null;
  }

  return <>{children}</>;
};

// <HasRole minRoleId={3}> <BoutonManager /> </HasRole>