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
    <ion-content :fullscreen="true" class="map-content">
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

      <!-- Modal de signalement HORIZONTAL -->
      <ReportModal
        :is-open="showReportModal"
        :position="selectedPosition"
        :presenting-element="$refs.content"
        @close="closeReportModal"
        @submit="handleReportSubmit"
      />

      <!-- Badge de statistiques -->
      <div class="stats-badge" @click="showReportsList">
        <ion-chip class="stats-chip">
          <ion-icon :icon="statsChart" />
          <ion-label>{{ reports.length }} signalements</ion-label>
        </ion-chip>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonFab, IonFabButton, IonChip, 
  IonLabel
} from '@ionic/vue';
import { add, statsChart } from 'ionicons/icons';
import MapComponent from '@/components/MapComponent.vue';
import ReportModal from '@/components/ReportModal.vue';
import { useReportStore } from '@/stores/ReportStore';

const reportStore = useReportStore();

// Références
const mapComponent = ref(null);
const showReportModal = ref(false);
const selectedPosition = ref(null);
const content = ref(null);

// Charger les signalements
const reports = computed(() => reportStore.reports);

onMounted(() => {
  console.log('Home component mounted');
  reportStore.loadReports();
});

// Méthodes
const openReportModal = () => {
  console.log('📱 Ouvrir modal horizontal de signalement');
  selectedPosition.value = null;
  showReportModal.value = true;
};

const onMapClick = (position) => {
  console.log('🗺️ Carte cliquée à:', position);
  selectedPosition.value = position;
  showReportModal.value = true;
};

const closeReportModal = () => {
  console.log('❌ Fermeture modal');
  showReportModal.value = false;
  selectedPosition.value = null;
};

const handleReportSubmit = async (reportData) => {
  console.log('✅ Nouveau signalement reçu:', reportData);
  
  // Ajouter le signalement au store
  const newReport = reportStore.addReport(reportData);
  console.log('📝 Signalement ajouté:', newReport);
  
  // Notification
  showNotification(`Signalement ajouté: "${reportData.title}"`);
  
  // Recentrer la carte si nécessaire
  if (mapComponent.value && mapComponent.value.getMap) {
    const map = mapComponent.value.getMap();
    if (map && newReport.position) {
      // Ajouter un marqueur sur la carte
      addMarkerToMap(map, newReport);
    }
  }
  
  showReportModal.value = false;
};

const addMarkerToMap = (map, report) => {
  if (typeof L === 'undefined') return;
  
  // Créer un marqueur coloré selon le type
  const iconColor = getIconColor(report.type);
  const marker = L.marker([report.position.lat, report.position.lng], {
    icon: L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: ${iconColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${getTypeIcon(report.type)}</div>`,
      iconSize: [30, 30]
    })
  })
  .addTo(map)
  .bindPopup(`<b>${report.title}</b><br>${report.description}<br><small>${new Date(report.date).toLocaleDateString()}</small>`);
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

const showReportsList = () => {
  alert(`Vous avez ${reports.value.length} signalements.\nDernier: ${reports.value[0]?.title || 'Aucun'}`);
};

const showNotification = (message) => {
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
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

// Définir les animations CSS
onMounted(() => {
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
      .report-modal-horizontal {
        animation: slideIn 0.3s ease;
      }
      .report-modal-horizontal.closing {
        animation: slideOut 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }
});
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
}

.stats-chip ion-icon {
  margin-right: 8px;
  color: #AA96DA;
}
</style>