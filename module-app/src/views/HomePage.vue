<template>
  <ion-page>
    <!-- En-tête -->
    <ion-header :translucent="true">
      <ion-toolbar class="header-toolbar">
        <ion-title class="app-title">
          <span class="title-icon">🛣️</span>
          SafeRoads
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- Contenu principal -->
    <ion-content :fullscreen="true" class="map-content" ref="content">
      <!-- Carte Leaflet -->
      <div class="map-container">
        <MapComponent 
          ref="mapComponent"
          :reports="reports"
          @report-clicked="onReportClick"
          @location-updated="onLocationUpdate"
          @map-clicked="onMapClick"
          @map-ready="onMapReady"
        />
      </div>

      <!-- Bouton de signalement flottant -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button class="report-fab" @click="openReportModal">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>

      <!-- Badge de statistiques -->
      <div class="stats-badge" @click="showReportsList">
        <ion-chip class="stats-chip">
          <ion-icon :icon="statsChart" />
          <ion-label>{{ reports.length }} signalements</ion-label>
        </ion-chip>
      </div>

      <!-- Bouton de recentrage -->
      <div class="recenter-button" @click="recenterMap">
        <ion-chip class="recenter-chip">
          <ion-icon :icon="locateOutline" />
          <ion-label>Ma position</ion-label>
        </ion-chip>
      </div>
    </ion-content>

    <!-- Modal de signalement - HORS DU CONTENT -->
    <ReportModal
      :is-open="showReportModal"
      :position="selectedPosition"
      :presenting-element="$refs.content"
      @close="closeReportModal"
      @submit="handleReportSubmit"
    />
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonFab, IonFabButton, IonChip, 
  IonLabel, toastController
} from '@ionic/vue';
import { add, statsChart, locateOutline } from 'ionicons/icons';
import MapComponent from '@/components/MapComponent.vue';
import ReportModal from '@/components/ReportModal.vue';
import { useReportStore } from '@/stores/ReportStore';

const reportStore = useReportStore();

// Références
const mapComponent = ref(null);
const content = ref(null);
const showReportModal = ref(false);
const selectedPosition = ref(null);

// Charger les signalements
const reports = computed(() => reportStore.reports);

onMounted(() => {
  console.log('Home component mounted');
  reportStore.loadReports();
  addAnimationsToHead();
});

// Méthodes
import { useRouter } from 'vue-router';

const router = useRouter();

// Modifiez la méthode openReportModal
const openReportModal = () => {
  console.log('📱 Navigation vers page de signalement');
  router.push('/report');
};

// Modifiez la méthode onMapClick
const onMapClick = (position) => {
  console.log('🗺️ Carte cliquée à:', position);
  // Navigation vers la page de signalement avec la position
  router.push({
    path: '/report',
    query: {
      lat: position.lat,
      lng: position.lng
    }
  });
};


const handleReportSubmit = async (reportData) => {
  console.log('✅ Nouveau signalement reçu:', reportData);
  
  try {
    // Ajouter le signalement au store
    const newReport = await reportStore.addReport(reportData);
    console.log('📝 Signalement ajouté:', newReport);
    
    // Notification
    await showNotification(`Signalement ajouté: "${reportData.title}"`);
    
    // Supprimer le marqueur temporaire
    removeTemporaryMarker();
    
    showReportModal.value = false;
    
    // Recentrer la carte sur le nouveau signalement
    setTimeout(() => {
      if (mapComponent.value && newReport.position) {
        try {
          const map = mapComponent.value.getMap();
          if (map) {
            map.setView([newReport.position.lat, newReport.position.lng], 15);
            
            // Ajouter le marqueur manuellement
            addMarkerToMap(newReport);
          }
        } catch (error) {
          console.error('Erreur lors du recentrage:', error);
        }
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du signalement:', error);
    showError('Erreur lors de l\'ajout du signalement');
  }
};

const addMarkerToMap = (report) => {
  if (!mapComponent.value || !mapComponent.value.getMap) {
    console.warn('Map component not ready');
    return;
  }
  
  try {
    const map = mapComponent.value.getMap();
    if (!map || typeof L === 'undefined') {
      console.warn('Leaflet not loaded');
      return;
    }
    
    // Créer un marqueur coloré selon le type
    const iconColor = getIconColor(report.type);
    const marker = L.marker([report.position.lat, report.position.lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${iconColor};
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">${getTypeIcon(report.type)}</div>`,
        iconSize: [35, 35],
        iconAnchor: [17.5, 35]
      })
    })
    .addTo(map)
    .bindPopup(`
      <div style="font-family: 'Poppins', sans-serif; padding: 10px; min-width: 250px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 20px;">${getTypeIcon(report.type)}</span>
          <h3 style="margin: 0; color: #333; font-size: 1.1rem;">${report.title}</h3>
        </div>
        <p style="margin: 0 0 10px 0; color: #666; font-size: 0.9rem;">${report.description}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888;">
          <span>${new Date(report.date).toLocaleDateString()}</span>
          <span style="padding: 4px 8px; background: ${getUrgencyColor(report.urgency)}; color: white; border-radius: 12px;">
            Urgence: ${report.urgency}
          </span>
        </div>
      </div>
    `);
    
    console.log('Marqueur ajouté avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du marqueur:', error);
  }
};

const addTemporaryMarker = (position) => {
  if (!mapComponent.value || !mapComponent.value.getMap) return;
  
  const map = mapComponent.value.getMap();
  if (!map || typeof L === 'undefined') return;
  
  // Supprimer l'ancien marqueur temporaire s'il existe
  removeTemporaryMarker();
  
  // Créer un nouveau marqueur temporaire
  window.tempMarker = L.marker([position.lat, position.lng], {
    icon: L.divIcon({
      className: 'temporary-marker',
      html: `<div style="
        background: linear-gradient(135deg, #AA96DA, #A8D8EA);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(170, 150, 218, 0.4);
        animation: pulse 1.5s infinite;
      ">📍</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    }),
    zIndexOffset: 2000
  }).addTo(map)
  .bindPopup('<b>Position sélectionnée</b><br>Remplissez le formulaire de signalement')
  .openPopup();
};

const removeTemporaryMarker = () => {
  if (window.tempMarker && mapComponent.value && mapComponent.value.getMap) {
    const map = mapComponent.value.getMap();
    map.removeLayer(window.tempMarker);
    window.tempMarker = null;
  }
};

const getIconColor = (type) => {
  const colors = {
    danger: '#FF6B6B',
    obstacle: '#4D96FF',
    damage: '#06D6A0',
    other: '#AA96DA'
  };
  return colors[type] || '#666';
};

const getTypeIcon = (type) => {
  const icons = {
    danger: '⚠️',
    obstacle: '🚧',
    damage: '🛠️',
    other: '📝'
  };
  return icons[type] || '📍';
};

const getUrgencyColor = (urgency) => {
  switch(urgency) {
    case 1: return '#06D6A0'; // Vert
    case 2: return '#FF9E6D'; // Orange
    case 3: return '#FF6B6B'; // Rouge
    default: return '#AA96DA'; // Violet
  }
};

const showReportsList = () => {
  if (reports.value.length > 0) {
    const latest = reports.value[0];
    showNotification(`${reports.value.length} signalements\nDernier: "${latest.title}"`);
  } else {
    showNotification('Aucun signalement pour le moment');
  }
};

const recenterMap = async () => {
  if (mapComponent.value && mapComponent.value.recenter) {
    await mapComponent.value.recenter();
    showNotification('Carte recentrée sur votre position');
  }
};

const onReportClick = (report) => {
  console.log('📌 Signalement cliqué:', report);
  showNotification(`Signalement: "${report.title}"\n${report.description.substring(0, 100)}...`);
};

const onLocationUpdate = (location) => {
  console.log('📍 Position mise à jour:', location);
};

const onMapReady = (map) => {
  console.log('🗺️ Carte prête');
  try {
    // Ajouter tous les marqueurs existants avec un délai
    setTimeout(() => {
      reports.value.forEach(report => {
        addMarkerToMap(report);
      });
    }, 1000);
  } catch (error) {
    console.error('Erreur lors de l\'ajout des marqueurs:', error);
  }
};

// Notifications améliorées
const showNotification = async (message, duration = 3000) => {
  try {
    const toast = await toastController.create({
      message: message,
      duration: duration,
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ],
      cssClass: 'custom-toast'
    });
    
    await toast.present();
  } catch (error) {
    console.error('Erreur toast:', error);
    // Fallback si toastController échoue
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #AA96DA, #A8D8EA);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      z-index: 10001;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      max-width: 300px;
      backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
};

const showError = async (message) => {
  const toast = await toastController.create({
    message: message,
    duration: 3000,
    position: 'top',
    color: 'danger',
    buttons: [
      {
        text: 'Fermer',
        role: 'cancel'
      }
    ]
  });
  
  await toast.present();
};

const addAnimationsToHead = () => {
  if (!document.getElementById('modal-animations')) {
    const style = document.createElement('style');
    style.id = 'modal-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-20px);
          opacity: 0;
        }
      }
      @keyframes pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 4px 15px rgba(170, 150, 218, 0.4);
        }
        50% {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(170, 150, 218, 0.6);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 4px 15px rgba(170, 150, 218, 0.4);
        }
      }
      .custom-toast {
        --background: linear-gradient(135deg, #AA96DA, #A8D8EA);
        --color: white;
        --border-radius: 10px;
        --box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        z-index: 10002 !important;
      }
      /* Assurez-vous que le modal est au-dessus de tout */
      .report-modal-horizontal {
        z-index: 10000 !important;
      }
      .modal-wrapper {
        z-index: 10000 !important;
      }
    `;
    document.head.appendChild(style);
  }
};
</script>

<style scoped>
/* En-tête */
.header-toolbar {
  --background: linear-gradient(135deg, #A8D8EA, #AA96DA);
  --color: white;
  padding: 10px 0;
}

.app-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 1.6rem;
}

/* Contenu */
.map-content {
  --background: #FFF9F9;
  --padding-top: 0;
  --padding-bottom: 0;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Bouton FAB de signalement */
.report-fab {
  --background: linear-gradient(135deg, #AA96DA, #A8D8EA);
  --box-shadow: 0 4px 20px rgba(170, 150, 218, 0.4);
  --border-radius: 50%;
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
  margin-right: 20px;
  z-index: 1000;
  transition: all 0.3s ease;
}

.report-fab:active {
  transform: scale(0.95);
}

.report-fab ion-icon {
  font-size: 28px;
  color: white;
}

/* Badge de statistiques */
.stats-badge {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stats-badge:active {
  transform: translateX(-50%) scale(0.95);
}

.stats-chip {
  --background: rgba(255, 255, 255, 0.95);
  --color: #5D5D5D;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(170, 150, 218, 0.3);
  font-size: 0.85rem;
  padding: 8px 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.stats-chip ion-icon {
  margin-right: 8px;
  color: #AA96DA;
}

/* Bouton de recentrage */
.recenter-button {
  position: absolute;
  bottom: 100px;
  left: 20px;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recenter-button:active {
  transform: scale(0.95);
}

.recenter-chip {
  --background: rgba(255, 255, 255, 0.95);
  --color: #5D5D5D;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(170, 150, 218, 0.3);
  font-size: 0.85rem;
  padding: 8px 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.recenter-chip ion-icon {
  margin-right: 8px;
  color: #4D96FF;
}

/* Responsive */
@media (max-width: 768px) {
  .app-title {
    font-size: 1.2rem;
  }
  
  .title-icon {
    font-size: 1.4rem;
  }
  
  .stats-badge {
    top: 70px;
  }
  
  .recenter-button {
    bottom: 90px;
  }
  
  .report-fab {
    width: 55px;
    height: 55px;
    margin-bottom: 15px;
    margin-right: 15px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.1rem;
  }
  
  .stats-chip,
  .recenter-chip {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
  
  .report-fab {
    width: 50px;
    height: 50px;
  }
  
  .report-fab ion-icon {
    font-size: 24px;
  }
}
</style>