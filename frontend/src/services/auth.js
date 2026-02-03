import axios from 'axios';

// Utiliser 127.0.0.1 évite les bugs de résolution DNS sur certains systèmes
const API_URL = "http://127.0.0.1:3000";

const authService = {
  register: async (username, email, password) => {
    try {
      // Attention : ta route backend s'appelle /users, pas /register
      const response = await axios.post(`${API_URL}/users`, { 
        name: username, // Ton backend attend "name"
        email, 
        password,
        role_id: 1 // Ajout par défaut pour éviter l'erreur 500
      });
      return response.data;
    } catch (error) {
      console.error("Erreur Register:", error.response?.data);
      throw error.response?.data || "Erreur d'inscription";
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { 
        email, 
        password 
      });

      // Stockage si succès
      if (response.data.user) {
        // Note: Si ton serveur ne renvoie pas encore de token, 
        // on stocke au moins l'utilisateur pour le test "CC"
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }

      return response.data;
    } catch (error) {
      console.error("Erreur Login:", error.response?.data);
      throw error.response?.data || "Identifiants incorrects";
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;