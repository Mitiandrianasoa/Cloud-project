import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Charger les utilisateurs depuis l'API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Utilisation de la route avec jointure block_user
      const response = await axios.get('http://localhost:3000/users_with_status');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Impossible de charger les utilisateurs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Action : Débloquer un utilisateur
  const handleUnblock = async (userId) => {
    if (window.confirm("Voulez-vous réactiver l'accès pour cet agent ?")) {
      try {
        await axios.delete(`http://localhost:3000/users/unblock/${userId}`);
        
        // Mise à jour locale de l'état pour éviter un rechargement complet
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_blocked: false } : user
        ));
      } catch (err) {
        alert("Erreur lors du déblocage.");
      }
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement des utilisateurs...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
        <button onClick={fetchUsers} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
          🔄 Actualiser
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Utilisateur</th>
              <th className="px-4 py-3 text-left">Rôle</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 border-t">
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-4">
                  <div className="font-medium">{user.name || 'Sans nom'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role_name === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role_name}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {user.is_blocked ? (
                    <span className="flex items-center text-red-600 text-sm font-bold">
                      <span className="h-2 w-2 bg-red-600 rounded-full mr-2"></span> Bloqué
                    </span>
                  ) : (
                    <span className="flex items-center text-green-600 text-sm font-bold">
                      <span className="h-2 w-2 bg-green-600 rounded-full mr-2"></span> Actif
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  {user.is_blocked ? (
                    <button
                      onClick={() => handleUnblock(user.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition shadow-sm"
                    >
                      Débloquer
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">Aucune action</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;