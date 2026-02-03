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
        :clicked-location="clickedLocation"
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
  toastController,
  alertController
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
const clickedLocation = ref<{ lat: number; lng: number } | null>(null);
const isReportModalOpen = ref(false);
const markers: L.Marker[] = [];
let clickMarker: L.Marker | null = null;

// Données de test pour les signalements
const testReports = [
  { 
    lat: -18.9150, 
    lng: 47.5360, 
    type: 'urgent', 
    description: 'Fuite d\'eau importante',
    photo: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&h=200&fit=crop',
    date: '02/02/2026 14:30'
  },
  { 
    lat: -18.9100, 
    lng: 47.5300, 
    type: 'anomaly', 
    description: 'Nid de poule dangereux',
    photo: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&h=200&fit=crop',
    date: '01/02/2026 10:15'
  },
  { 
    lat: -18.9200, 
    lng: 47.5400, 
    type: 'info', 
    description: 'Travaux en cours',
    photo: '',
    date: '31/01/2026 09:00'
  }
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

  // Ajouter le gestionnaire de clic sur la carte
  map.on('click', handleMapClick);

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

// Gérer le clic sur la carte
const handleMapClick = async (e: L.LeafletMouseEvent) => {
  const { lat, lng } = e.latlng;
  
  // Supprimer l'ancien marqueur temporaire s'il existe
  if (clickMarker && map) {
    map.removeLayer(clickMarker);
  }
  
  // Créer un marqueur temporaire à la position cliquée
  const tempIcon = L.divIcon({
    className: 'temp-marker',
    html: '<div class="temp-pin"></div>',
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
  
  clickMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(map!);
  
  // Afficher la confirmation
  await confirmAddReport(lat, lng);
};

// Confirmer l'ajout d'un signalement
const confirmAddReport = async (lat: number, lng: number) => {
  const alert = await alertController.create({
    header: 'Nouveau signalement 📍',
    message: `Voulez-vous ajouter un signalement à cette position ?`,
    cssClass: 'cute-alert',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
        handler: () => {
          // Supprimer le marqueur temporaire
          if (clickMarker && map) {
            map.removeLayer(clickMarker);
            clickMarker = null;
          }
        }
      },
      {
        text: 'Ajouter',
        handler: () => {
          // Supprimer le marqueur temporaire
          if (clickMarker && map) {
            map.removeLayer(clickMarker);
            clickMarker = null;
          }
          // Stocker la position cliquée et ouvrir le modal
          clickedLocation.value = { lat, lng };
          isReportModalOpen.value = true;
        }
      }
    ]
  });
  await alert.present();
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

    // Créer le contenu du popup avec photo
    const popupContent = createPopupContent(report);

    const marker = L.marker([report.lat, report.lng], { icon: customIcon })
      .addTo(map!)
      .bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-popup'
      });

    // Ouvrir le popup au survol
    marker.on('mouseover', function() {
      this.openPopup();
    });

    markers.push(marker);
  });
};

// Créer le contenu du popup
const createPopupContent = (report: any): string => {
  const photoHtml = report.photo 
    ? `<div class="popup-photo"><img src="${report.photo}" alt="Photo du signalement" /></div>`
    : '';
  
  return `
    <div class="marker-popup">
      ${photoHtml}
      <div class="popup-content">
        <div class="popup-badge ${report.type}">${getTypeLabel(report.type)}</div>
        <p class="popup-description">${report.description}</p>
        <div class="popup-date">📅 ${report.date}</div>
      </div>
    </div>
  `;
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
  clickedLocation.value = null; // Réinitialiser la position cliquée
  isReportModalOpen.value = true;
};

// Fermer le modal de signalement
const closeReportModal = () => {
  isReportModalOpen.value = false;
  clickedLocation.value = null; // Réinitialiser la position cliquée
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
      iconAnchor: [15, 42],
      popupAnchor: [0, -42]
    });

    // Créer le contenu du popup avec photo
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const popupContent = createPopupContent({
      ...reportData,
      date: dateStr
    });

    const marker = L.marker([reportData.location.lat, reportData.location.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-popup'
      });

    // Ouvrir le popup au survol
    marker.on('mouseover', function() {
      this.openPopup();
    });

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

/* Styles du popup personnalisé */
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.custom-popup .leaflet-popup-content {
  margin: 0;
  min-width: 200px;
}

.custom-popup .leaflet-popup-tip {
  background: white;
}

.marker-popup {
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.popup-photo {
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: #f0f0f0;
}

.popup-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.popup-content {
  padding: 12px 14px;
}

.popup-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
}

.popup-badge.urgent {
  background: #FFB3BA;
  color: white;
}

.popup-badge.anomaly {
  background: #FFD8A8;
  color: #5a5a5a;
}

.popup-badge.info {
  background: #B0E0E6;
  color: #5a5a5a;
}

.popup-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #5a5a5a;
  line-height: 1.4;
}

.popup-date {
  font-size: 11px;
  color: #999;
}

/* Marqueur temporaire pour le clic */
.temp-marker {
  background: transparent;
  border: none;
}

.temp-pin {
  width: 30px;
  height: 42px;
  border-radius: 50% 50% 50% 0;
  position: relative;
  transform: rotate(-45deg);
  background: linear-gradient(135deg, #DDA0DD, #FFB6C1);
  box-shadow: 0 4px 15px rgba(221, 160, 221, 0.5);
  animation: bounce 0.5s ease;
}

.temp-pin::after {
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

@keyframes bounce {
  0%, 100% {
    transform: rotate(-45deg) translateY(0);
  }
  50% {
    transform: rotate(-45deg) translateY(-10px);
  }
}

/* Style pour l'alerte de confirmation */
.cute-alert {
  --background: #FFF5F7;
  --border-radius: 20px;
}

.cute-alert .alert-head {
  text-align: center;
}

.cute-alert .alert-title {
  font-size: 20px;
  font-weight: 600;
  color: #5a5a5a;
}

.cute-alert .alert-message {
  text-align: center;
  color: #777;
}

.cute-alert .alert-button {
  border-radius: 15px !important;
  font-weight: 600;
}

/* Fix pour les icônes Leaflet manquantes */
.leaflet-default-icon-path {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
</style>