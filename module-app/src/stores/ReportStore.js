import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useReportStore = defineStore('reports', () => {
  // État
  const reports = ref([]);
  
  // Getters
  const totalReports = computed(() => reports.value.length);
  const emergencyReports = computed(() => 
    reports.value.filter(r => r.type === 'danger').length
  );
  const activeReports = computed(() => 
    reports.value.filter(r => r.status === 'new' || r.status === 'in-progress').length
  );

  // Nouveau : Récupérer les derniers signalements
  const recentReports = computed(() => 
    reports.value.slice(0, 5) // 5 derniers signalements
  );

  // Actions
  const loadReports = () => {
    try {
      const stored = localStorage.getItem('safeRoads_reports');
      reports.value = stored ? JSON.parse(stored) : [];
      console.log(`${reports.value.length} signalements chargés`);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      reports.value = [];
    }
  };

  // NOUVEAU : Charger les signalements initiaux pour démo
  const loadInitialReports = () => {
    try {
      // Vérifier d'abord s'il y a des données dans localStorage
      const stored = localStorage.getItem('safeRoads_reports');
      
      if (stored && JSON.parse(stored).length > 0) {
        reports.value = JSON.parse(stored);
        console.log(`${reports.value.length} signalements chargés depuis localStorage`);
      } else {
        // Charger les données de démo
        reports.value = [
          {
            id: 'report_' + Date.now() + '_1',
            type: 'danger',
            title: 'Nid de poule profond sur RN2',
            description: 'Nid de poule dangereux à la sortie de Camp-Lère, plusieurs véhicules déjà endommagés. Profondeur environ 20cm, largeur 50cm.',
            urgency: 3,
            position: { lat: -18.8792, lng: 47.5079 },
            date: new Date('2024-01-20T08:30:00').toISOString(),
            status: 'new',
            userId: 'user_demo_1',
            votes: 5,
            comments: [
              { id: 'c1', userId: 'user2', text: 'Je confirme, très dangereux !', date: '2024-01-20T09:00:00' }
            ],
            photos: []
          },
          {
            id: 'report_' + Date.now() + '_2',
            type: 'obstacle',
            title: 'Arbre tombé sur route',
            description: 'Grand arbre tombé suite aux intempéries près de Fiadanana, circulation complètement bloquée. Urgent de dégager.',
            urgency: 2,
            position: { lat: -18.9012, lng: 47.5214 },
            date: new Date('2024-01-19T14:15:00').toISOString(),
            status: 'in-progress',
            userId: 'user_demo_2',
            votes: 3,
            comments: [
              { id: 'c2', userId: 'user3', text: 'La mairie est prévenue', date: '2024-01-19T15:30:00' }
            ],
            photos: []
          },
          {
            id: 'report_' + Date.now() + '_3',
            type: 'damage',
            title: 'Panneau de signalisation cassé',
            description: 'Panneau stop cassé et penché sur Lalana P, risque de chute. À remplacer rapidement.',
            urgency: 1,
            position: { lat: -18.8895, lng: 47.5123 },
            date: new Date('2024-01-18T10:45:00').toISOString(),
            status: 'new',
            userId: 'user_demo_3',
            votes: 2,
            comments: [],
            photos: []
          },
          {
            id: 'report_' + Date.now() + '_4',
            type: 'other',
            title: 'Éclairage public défectueux',
            description: 'Lampadaire hors service sur toute la rue Soanierana, quartier très sombre la nuit.',
            urgency: 2,
            position: { lat: -18.8950, lng: 47.5180 },
            date: new Date('2024-01-17T19:20:00').toISOString(),
            status: 'new',
            userId: 'user_demo_4',
            votes: 7,
            comments: [
              { id: 'c3', userId: 'user5', text: 'Ça fait 2 semaines que ça ne marche plus', date: '2024-01-17T20:00:00' }
            ],
            photos: []
          },
          {
            id: 'report_' + Date.now() + '_5',
            type: 'danger',
            title: 'Glissade dangereuse Taraifaritra',
            description: 'Tracé de glissade sur la route principale après la pluie, plusieurs motos ont déjà chuté.',
            urgency: 3,
            position: { lat: -18.8740, lng: 47.5035 },
            date: new Date('2024-01-16T11:10:00').toISOString(),
            status: 'resolved',
            userId: 'user_demo_5',
            votes: 12,
            comments: [
              { id: 'c4', userId: 'user6', text: 'Réparé ce matin par les services municipaux', date: '2024-01-20T09:30:00' }
            ],
            photos: []
          }
        ];
        
        // Sauvegarder les données de démo dans localStorage
        saveReports();
        console.log(`${reports.value.length} signalements de démo chargés`);
      }
    } catch (error) {
      console.error('Erreur de chargement initial:', error);
      reports.value = [];
    }
  };

  const saveReports = () => {
    try {
      localStorage.setItem('safeRoads_reports', JSON.stringify(reports.value));
      console.log('Signalements sauvegardés:', reports.value.length);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };

  const addReport = async (reportData) => {
    try {
      const newReport = {
        id: 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...reportData,
        date: new Date().toISOString(),
        status: 'new',
        votes: 0,
        comments: [],
        photos: [],
        userId: 'user_' + Math.random().toString(36).substr(2, 9)
      };

      reports.value.unshift(newReport); // Ajouter au début
      saveReports();
      
      console.log('✅ Signalement ajouté:', newReport);

      // Notification navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Signalement ajouté !', {
          body: `"${reportData.title}" a été enregistré`,
          icon: '/favicon.ico'
        });
      }

      // Notification toast
      showToastNotification(`Signalement "${reportData.title}" ajouté !`);

      return newReport;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du signalement:', error);
      throw error;
    }
  };

  const updateReport = (id, updates) => {
    try {
      const index = reports.value.findIndex(r => r.id === id);
      if (index !== -1) {
        reports.value[index] = { ...reports.value[index], ...updates };
        saveReports();
        console.log('📝 Signalement mis à jour:', id);
        
        // Notification
        showToastNotification('Signalement mis à jour');
        return reports.value[index];
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  };

  const deleteReport = (id) => {
    try {
      const index = reports.value.findIndex(r => r.id === id);
      if (index !== -1) {
        const deleted = reports.value.splice(index, 1)[0];
        saveReports();
        console.log('🗑️ Signalement supprimé:', id);
        
        // Notification
        showToastNotification('Signalement supprimé');
        return deleted;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  };

  const getReportById = (id) => {
    return reports.value.find(r => r.id === id);
  };

  const getUserReports = (userId) => {
    return reports.value.filter(r => r.userId === userId);
  };

  const filterByType = (type) => {
    return reports.value.filter(r => r.type === type);
  };

  const filterByStatus = (status) => {
    return reports.value.filter(r => r.status === status);
  };

  const filterByUrgency = (urgencyLevel) => {
    return reports.value.filter(r => r.urgency === urgencyLevel);
  };

  // NOUVEAU : Filtrer par localisation (rayon en km)
  const filterByLocation = (centerLat, centerLng, radiusKm = 5) => {
    return reports.value.filter(report => {
      if (!report.position || !report.position.lat) return false;
      
      const R = 6371; // Rayon de la Terre en km
      const dLat = (report.position.lat - centerLat) * Math.PI / 180;
      const dLng = (report.position.lng - centerLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(centerLat * Math.PI / 180) * 
        Math.cos(report.position.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= radiusKm;
    });
  };

  // NOUVEAU : Recherche dans les signalements
  const searchReports = (query) => {
    if (!query.trim()) return reports.value;
    
    const searchTerm = query.toLowerCase();
    return reports.value.filter(report => 
      report.title.toLowerCase().includes(searchTerm) ||
      report.description.toLowerCase().includes(searchTerm) ||
      report.type.toLowerCase().includes(searchTerm)
    );
  };

  // NOUVEAU : Statistiques détaillées
  const getStats = () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyReports = reports.value.filter(r => 
      new Date(r.date) >= lastWeek
    ).length;
    
    const byType = {
      danger: filterByType('danger').length,
      obstacle: filterByType('obstacle').length,
      damage: filterByType('damage').length,
      other: filterByType('other').length
    };
    
    const byStatus = {
      new: filterByStatus('new').length,
      'in-progress': filterByStatus('in-progress').length,
      resolved: filterByStatus('resolved').length
    };
    
    const byUrgency = {
      low: filterByUrgency(1).length,
      medium: filterByUrgency(2).length,
      high: filterByUrgency(3).length
    };
    
    return {
      total: totalReports.value,
      weekly: weeklyReports,
      active: activeReports.value,
      byType,
      byStatus,
      byUrgency
    };
  };

  // NOUVEAU : Fonction de notification toast
  const showToastNotification = (message) => {
    // Créer un élément toast
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #AA96DA, #A8D8EA);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  // NOUVEAU : Demander la permission de notification
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permission notification:', permission);
      });
    }
  };

  // Charger au démarrage
  loadInitialReports();
  
  // Demander la permission des notifications
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      requestNotificationPermission();
    }, 2000);
  }

  return {
    // State
    reports,
    
    // Getters
    totalReports,
    emergencyReports,
    activeReports,
    recentReports,
    
    // Actions
    loadReports,
    loadInitialReports,
    saveReports,
    addReport,
    updateReport,
    deleteReport,
    getReportById,
    getUserReports,
    filterByType,
    filterByStatus,
    filterByUrgency,
    filterByLocation,
    searchReports,
    getStats,
    requestNotificationPermission,
    showToastNotification
  };
});