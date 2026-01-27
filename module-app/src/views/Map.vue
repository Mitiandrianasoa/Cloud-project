<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Safe Roads</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToReports">
            <ion-icon :icon="listOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Carte Leaflet -->
      <div id="map" ref="mapContainer"></div>

      <!-- Boutons flottants -->
      <div class="map-controls">
        <!-- Bouton recentrage -->
        <ion-button
          class="control-button recenter-button"
          @click="recenterMap"
        >
          <ion-icon slot="icon-only" :icon="locateOutline"></ion-icon>
        </ion-button>

        <!-- Bouton signaler un problème -->
        <ion-button
          class="control-button report-button"
          @click="openReportModal"
        >
          <ion-icon slot="start" :icon="warningOutline"></ion-icon>
          Signaler
        </ion-button>
      </div>

      <!-- Légende -->
      <div class="map-legend soft-card">
        <h4>Légende</h4>
        <div class="legend-item">
          <div class="legend-marker urgent"></div>
          <span>Urgence</span>
        </div>
        <div class="legend-item">
          <div class="legend-marker anomaly"></div>
          <span>Anomalie</span>
        </div>
        <div class="legend-item">
          <div class="legend-marker info"></div>
          <span>Information</span>
        </div>
      </div>

      <!-- Modal de signalement -->
      <ReportModal
        :is-open="isReportModalOpen"
        :user-location="userLocation"
        @close="closeReportModal"
        @submit="handleReportSubmit"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  toastController
} from '@ionic/vue';
import {
  listOutline,
  locateOutline,
  warningOutline
} from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportModal from '../components/ReportModal.vue';

const router = useRouter();

// État
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let userMarker: L.Marker | null = null;
const userLocation = ref<{ lat: number; lng: number } | null>(null);
const isReportModalOpen = ref(false);
const markers: L.Marker[] = [];

// Données de test pour les signalements
const testReports = [
  { lat: -18.9150, lng: 47.5360, type: 'urgent', description: 'Fuite d\'eau importante' },
  { lat: -18.9100, lng: 47.5300, type: 'anomaly', description: 'Nid de poule' },
  { lat: -18.9200, lng: 47.5400, type: 'info', description: 'Travaux en cours' }
];

// Initialiser la carte
const initMap = () => {
  if (!mapContainer.value) return;

  // Créer la carte
  map = L.map(mapContainer.value).setView([-18.9150, 47.5360], 13);

  // Ajouter les tuiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Ajouter les marqueurs de test
  addTestMarkers();

  // Obtenir la position de l'utilisateur
  getUserLocation();
};

// Obtenir la position de l'utilisateur
const getUserLocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userLocation.value = { lat: latitude, lng: longitude };
        
        // Créer un marqueur pour l'utilisateur
        if (map) {
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-dot"></div>',
            iconSize: [20, 20]
          });

          userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
          map.setView([latitude, longitude], 15);
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        showToast('Impossible d\'obtenir votre position 📍', 'warning');
      }
    );
  }
};

// Recentrer la carte
const recenterMap = () => {
  if (map && userLocation.value) {
    map.setView([userLocation.value.lat, userLocation.value.lng], 15);
    showToast('Carte recentrée 🎯', 'tertiary');
  } else {
    showToast('Position non disponible 📍', 'warning');
  }
};

// Ajouter les marqueurs de test
const addTestMarkers = () => {
  if (!map) return;

  testReports.forEach(report => {
    const markerColor = getMarkerColor(report.type);
    
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin ${report.type}"></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -42]
    });

    const marker = L.marker([report.lat, report.lng], { icon: customIcon })
      .addTo(map!)
      .bindPopup(`
        <div class="marker-popup">
          <h4>${getTypeLabel(report.type)}</h4>
          <p>${report.description}</p>
        </div>
      `);

    markers.push(marker);
  });
};

// Obtenir la couleur du marqueur
const getMarkerColor = (type: string): string => {
  switch (type) {
    case 'urgent': return '#FFB3BA';
    case 'anomaly': return '#FFD8A8';
    case 'info': return '#B0E0E6';
    default: return '#999';
  }
};

// Obtenir le label du type
const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'urgent': return '🚨 Urgence';
    case 'anomaly': return '⚠️ Anomalie';
    case 'info': return 'ℹ️ Information';
    default: return 'Signalement';
  }
};

// Ouvrir le modal de signalement
const openReportModal = () => {
  isReportModalOpen.value = true;
};

// Fermer le modal de signalement
const closeReportModal = () => {
  isReportModalOpen.value = false;
};

// Gérer la soumission d'un signalement
const handleReportSubmit = async (reportData: any) => {
  console.log('Nouveau signalement:', reportData);
  
  // TODO: Envoyer à Firebase
  
  // Ajouter un marqueur temporaire
  if (map && reportData.location) {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin ${reportData.type}"></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    const marker = L.marker([reportData.location.lat, reportData.location.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div class="marker-popup">
          <h4>${getTypeLabel(reportData.type)}</h4>
          <p>${reportData.description}</p>
        </div>
      `);

    markers.push(marker);
  }

  showToast('Signalement enregistré ! 📝', 'success');
  closeReportModal();
};

// Aller vers la liste des signalements
const goToReports = () => {
  router.push('/reports');
};

// Afficher un toast
const showToast = async (message: string, color: string) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'top'
  });
  await toast.present();
};

// Cycle de vie
onMounted(() => {
  setTimeout(() => initMap(), 100);
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
  z-index: 0;
}

.map-controls {
  position: absolute;
  bottom: 30px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-button {
  --border-radius: 25px;
  --box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  height: 50px;
  font-weight: 600;
}

.recenter-button {
  --background: white;
  --color: var(--ion-color-primary);
  width: 50px;
  align-self: flex-end;
}

.report-button {
  --background: linear-gradient(90deg, #FFB6C1, #DDA0DD);
  --color: white;
  padding: 0 20px;
}

.map-legend {
  position: absolute;
  top: 80px;
  left: 20px;
  z-index: 1000;
  background: white;
  padding: 15px;
  min-width: 150px;
}

.map-legend h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #5a5a5a;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #5a5a5a;
}

.legend-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.legend-marker.urgent {
  background: #FFB3BA;
}

.legend-marker.anomaly {
  background: #FFD8A8;
}

.legend-marker.info {
  background: #B0E0E6;
}
</style>

<style>
/* Styles globaux pour les marqueurs Leaflet */
.user-location-marker {
  background: transparent;
  border: none;
}

.user-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4A90E2;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
  }
}

.custom-marker {
  background: transparent;
  border: none;
}

.marker-pin {
  width: 30px;
  height: 42px;
  border-radius: 50% 50% 50% 0;
  position: relative;
  transform: rotate(-45deg);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.marker-pin::after {
  content: '';
  width: 18px;
  height: 18px;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
}

.marker-pin.urgent {
  background: #FFB3BA;
}

.marker-pin.anomaly {
  background: #FFD8A8;
}

.marker-pin.info {
  background: #B0E0E6;
}

.marker-popup {
  padding: 10px;
}

.marker-popup h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #5a5a5a;
}

.marker-popup p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

/* Fix pour les icônes Leaflet manquantes */
.leaflet-default-icon-path {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
</style>