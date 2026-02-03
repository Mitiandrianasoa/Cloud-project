<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <!-- Menu/Profile à gauche -->
        <ion-buttons slot="start">
          <ion-button @click="toggleProfileMenu" class="profile-btn">
            <div class="profile-avatar" v-if="currentUser">
              <img v-if="currentUser.photoURL" :src="currentUser.photoURL" alt="Profile" />
              <ion-icon v-else :icon="personCircleOutline"></ion-icon>
            </div>
            <ion-icon v-else :icon="personCircleOutline" size="large"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>Safe Roads</ion-title>

        <ion-buttons slot="end">
          <ion-button @click="goToReports">
            <ion-icon :icon="listOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Menu Profil Overlay -->
    <div v-if="showProfileMenu" class="profile-overlay" @click="closeProfileMenu">
      <div class="profile-menu" @click.stop>
        <!-- Header du profil -->
        <div class="profile-header">
          <div class="profile-avatar-large">
            <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" alt="Profile" />
            <ion-icon v-else :icon="personCircleOutline"></ion-icon>
          </div>
          <div class="profile-info">
            <h3 class="profile-name">{{ currentUser?.displayName || 'Utilisateur' }}</h3>
            <p class="profile-email">{{ currentUser?.email || 'Non connecté' }}</p>
            <span class="connection-status" :class="{ connected: isConnected, guest: !isConnected }">
              <span class="status-dot"></span>
              {{ isConnected ? 'Connecté' : 'Mode invité' }}
            </span>
          </div>
        </div>

        <!-- Actions du menu -->
        <div class="profile-actions">
          <button v-if="isConnected" class="menu-item" @click="goToProfile">
            <ion-icon :icon="personOutline"></ion-icon>
            <span>Mon profil</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
          </button>

          <button class="menu-item" @click="goToReports">
            <ion-icon :icon="documentTextOutline"></ion-icon>
            <span>Mes signalements</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
          </button>

          <button v-if="isConnected" class="menu-item" @click="goToSettings">
            <ion-icon :icon="settingsOutline"></ion-icon>
            <span>Paramètres</span>
            <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
          </button>

          <div class="menu-divider"></div>

          <button v-if="isConnected" class="menu-item logout" @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
            <span>Se déconnecter</span>
          </button>

          <button v-else class="menu-item login" @click="goToLogin">
            <ion-icon :icon="logInOutline"></ion-icon>
            <span>Se connecter</span>
          </button>
        </div>

        <!-- Footer -->
        <div class="profile-footer">
          <p>Safe Roads v1.0</p>
        </div>
      </div>
    </div>

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
import { ref, onMounted, onUnmounted, computed } from 'vue';
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
  warningOutline,
  personCircleOutline,
  personOutline,
  documentTextOutline,
  settingsOutline,
  logOutOutline,
  logInOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportModal from '../components/ReportModal.vue';
import { auth } from '../firebase/config';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';

const router = useRouter();

// État utilisateur
const currentUser = ref<User | null>(null);
const isConnected = computed(() => currentUser.value !== null);
const showProfileMenu = ref(false);

// Écouter l'état d'authentification
onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
});

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
  showProfileMenu.value = false;
  router.push('/reports');
};

// Toggle menu profil
const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

// Fermer menu profil
const closeProfileMenu = () => {
  showProfileMenu.value = false;
};

// Aller au profil
const goToProfile = () => {
  showProfileMenu.value = false;
  // TODO: Implémenter la page profil
  showToast('Page profil à venir', 'primary');
};

// Aller aux paramètres
const goToSettings = () => {
  showProfileMenu.value = false;
  // TODO: Implémenter la page paramètres
  showToast('Page paramètres à venir', 'primary');
};

// Aller à la connexion
const goToLogin = () => {
  showProfileMenu.value = false;
  router.push('/login');
};

// Déconnexion
const handleLogout = async () => {
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Voulez-vous vraiment vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Déconnecter',
        role: 'destructive',
        handler: async () => {
          try {
            await signOut(auth);
            showProfileMenu.value = false;
            showToast('Déconnexion réussie', 'success');
          } catch (error) {
            showToast('Erreur lors de la déconnexion', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
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
/* Profile Button dans le header */
.profile-btn {
  --padding-start: 4px;
  --padding-end: 4px;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar ion-icon {
  font-size: 32px;
  color: var(--primary);
}

/* Overlay du menu profil */
.profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Menu profil */
.profile-menu {
  position: absolute;
  top: 60px;
  left: 16px;
  width: calc(100% - 32px);
  max-width: 320px;
  background: var(--surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header du profil */
.profile-header {
  background: var(--gradient-primary);
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-large ion-icon {
  font-size: 56px;
  color: white;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.813rem;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.connection-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  animation: pulse-dot 2s infinite;
}

.connection-status.guest .status-dot {
  background: #F59E0B;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Actions du menu */
.profile-actions {
  padding: 12px 8px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.938rem;
  color: var(--text-primary);
  font-family: inherit;
}

.menu-item:hover {
  background: var(--gray-100);
}

.menu-item:active {
  transform: scale(0.98);
}

.menu-item ion-icon {
  font-size: 22px;
  color: var(--text-secondary);
}

.menu-item span {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.menu-item .chevron {
  font-size: 18px;
  color: var(--text-muted);
}

.menu-item.logout {
  color: var(--danger);
}

.menu-item.logout ion-icon {
  color: var(--danger);
}

.menu-item.login {
  color: var(--primary);
}

.menu-item.login ion-icon {
  color: var(--primary);
}

.menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 8px 16px;
}

/* Footer du menu */
.profile-footer {
  padding: 12px 20px;
  background: var(--gray-50);
  border-top: 1px solid var(--border-light);
}

.profile-footer p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

/* Carte */
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
  gap: 12px;
}

.control-button {
  --border-radius: var(--radius-xl);
  --box-shadow: var(--shadow-lg);
  height: 52px;
  font-weight: 600;
  transition: all var(--transition-base);
}

.control-button:hover {
  transform: translateY(-2px);
  --box-shadow: var(--shadow-xl);
}

.recenter-button {
  --background: var(--surface);
  --color: var(--primary);
  width: 52px;
  align-self: flex-end;
  border: 2px solid var(--border-light);
}

.recenter-button:hover {
  --background: var(--gray-50);
  border-color: var(--primary);
}

.report-button {
  --background: var(--gradient-primary);
  --color: white;
  padding: 0 24px;
  --box-shadow: var(--shadow-primary);
}

.report-button:hover {
  --box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.map-legend {
  position: absolute;
  top: 80px;
  left: 20px;
  z-index: 1000;
  background: var(--surface);
  padding: 16px 20px;
  min-width: 160px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
}

.map-legend h4 {
  margin: 0 0 14px 0;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.813rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-marker {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  margin-right: 12px;
  box-shadow: var(--shadow-sm);
}

.legend-marker.urgent {
  background: var(--danger);
}

.legend-marker.anomaly {
  background: var(--warning);
}

.legend-marker.info {
  background: var(--info);
}
</style>

<style>
/* Styles globaux pour les marqueurs Leaflet */
.user-location-marker {
  background: transparent;
  border: none;
}

.user-dot {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: var(--primary);
  border: 3px solid white;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
  }
  50% {
    box-shadow: 0 0 24px rgba(99, 102, 241, 0.8);
  }
  100% {
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
  }
}

.custom-marker {
  background: transparent;
  border: none;
}

.marker-pin {
  width: 32px;
  height: 44px;
  border-radius: 50% 50% 50% 0;
  position: relative;
  transform: rotate(-45deg);
  box-shadow: var(--shadow-md);
}

.marker-pin::after {
  content: '';
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
}

.marker-pin.urgent {
  background: var(--danger);
}

.marker-pin.anomaly {
  background: var(--warning);
}

.marker-pin.info {
  background: var(--info);
}

/* Styles du popup personnalisé */
.custom-popup .leaflet-popup-content-wrapper {
  border-radius: var(--radius-xl);
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
}

.custom-popup .leaflet-popup-content {
  margin: 0;
  min-width: 220px;
}

.custom-popup .leaflet-popup-tip {
  background: white;
}

.marker-popup {
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.popup-photo {
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: var(--gray-100);
}

.popup-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.popup-content {
  padding: 14px 16px;
}

.popup-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: 0.688rem;
  font-weight: 600;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.popup-badge.urgent {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.popup-badge.anomaly {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.popup-badge.info {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.popup-description {
  margin: 0 0 10px 0;
  font-size: 0.875rem;
  color: var(--text-primary);
  line-height: 1.5;
  font-weight: 500;
}

.popup-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Marqueur temporaire pour le clic */
.temp-marker {
  background: transparent;
  border: none;
}

.temp-pin {
  width: 32px;
  height: 44px;
  border-radius: 50% 50% 50% 0;
  position: relative;
  transform: rotate(-45deg);
  background: var(--gradient-primary);
  box-shadow: var(--shadow-primary);
  animation: bounce 0.5s ease;
}

.temp-pin::after {
  content: '';
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
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
  --background: var(--surface);
  --border-radius: var(--radius-2xl);
}

.cute-alert .alert-head {
  text-align: center;
}

.cute-alert .alert-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.cute-alert .alert-message {
  text-align: center;
  color: var(--text-secondary);
}

.cute-alert .alert-button {
  border-radius: var(--radius-lg) !important;
  font-weight: 600;
}

/* Fix pour les icônes Leaflet manquantes */
.leaflet-default-icon-path {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
</style>