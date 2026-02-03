<template>
  <ion-page>
    <ion-header class="map-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <div class="header-brand">
            <ion-icon :icon="shieldCheckmarkOutline" class="brand-icon"></ion-icon>
            <span class="brand-text">Safe Roads</span>
          </div>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="goToReports" class="header-btn">
            <ion-icon :icon="listOutline"></ion-icon>
          </ion-button>
          <ion-button @click="toggleProfileMenu" class="profile-btn">
            <div class="profile-avatar">
              <ion-icon :icon="personOutline" v-if="!userPhotoURL"></ion-icon>
              <img :src="userPhotoURL" v-else alt="Profile" />
            </div>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Profile Menu Dropdown -->
    <div class="profile-menu" :class="{ 'show': isProfileMenuOpen }">
      <div class="profile-menu-header">
        <div class="profile-avatar-large">
          <ion-icon :icon="personOutline" v-if="!userPhotoURL"></ion-icon>
          <img :src="userPhotoURL" v-else alt="Profile" />
        </div>
        <div class="profile-details">
          <h4 class="profile-name">{{ userName || 'Utilisateur' }}</h4>
          <p class="profile-email">{{ userEmail || 'email@example.com' }}</p>
        </div>
      </div>
      <div class="profile-menu-divider"></div>
      <button class="profile-menu-item" @click="goToSettings">
        <ion-icon :icon="settingsOutline"></ion-icon>
        <span>Paramètres</span>
      </button>
      <button class="profile-menu-item" @click="goToReports">
        <ion-icon :icon="documentTextOutline"></ion-icon>
        <span>Mes signalements</span>
      </button>
      <div class="profile-menu-divider"></div>
      <button class="profile-menu-item logout-btn" @click="handleLogout">
        <ion-icon :icon="logOutOutline"></ion-icon>
        <span>Déconnexion</span>
      </button>
    </div>

    <!-- Profile Menu Backdrop -->
    <div class="profile-backdrop" :class="{ 'show': isProfileMenuOpen }" @click="closeProfileMenu"></div>

    <ion-content :fullscreen="true">
      <div v-if="isPickingLocation" class="selection-banner">
        <div class="banner-content">
          <ion-icon :icon="locateOutline"></ion-icon>
          <span>Touchez la carte pour placer le signalement</span>
        </div>
      </div>

      <div id="map" ref="mapContainer"></div>

      <!-- Confirmation Popup -->
      <div class="confirm-popup" :class="{ 'show': showConfirmPopup }">
        <div class="confirm-popup-content">
          <div class="confirm-icon">
            <ion-icon :icon="locationOutline"></ion-icon>
          </div>
          <h3>Ajouter un signalement ?</h3>
          <p>Voulez-vous signaler un problème à cet emplacement ?</p>
          <div class="confirm-coords">
            <ion-icon :icon="navigateOutline"></ion-icon>
            <span>{{ pendingLocation ? `${pendingLocation.lat.toFixed(5)}, ${pendingLocation.lng.toFixed(5)}` : '' }}</span>
          </div>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="cancelConfirmation">Annuler</button>
            <button class="btn-confirm" @click="confirmLocation">Confirmer</button>
          </div>
        </div>
      </div>

      <!-- Marker Tooltip -->
      <div class="marker-tooltip" :class="{ 'show': showMarkerTooltip }" :style="tooltipPosition">
        <div class="tooltip-header">
          <span class="tooltip-badge" :class="tooltipData.typeClass">{{ tooltipData.type }}</span>
          <span class="tooltip-date">{{ tooltipData.date }}</span>
        </div>
        <h4 class="tooltip-title">{{ tooltipData.title }}</h4>
        <p class="tooltip-description">{{ tooltipData.description }}</p>
        
        <!-- Aperçu des photos -->
        <div v-if="tooltipData.photos && tooltipData.photos.length > 0" class="tooltip-photos">
          <img 
            v-for="(photo, index) in tooltipData.photos.slice(0, 2)" 
            :key="index" 
            :src="photo" 
            :alt="'Photo ' + (index + 1)"
            class="tooltip-photo"
          />
          <div v-if="tooltipData.photos.length > 2" class="tooltip-more-photos">
            +{{ tooltipData.photos.length - 2 }}
          </div>
        </div>
        
        <div class="tooltip-footer">
          <span class="tooltip-status" :class="tooltipData.statusClass">
            <ion-icon :icon="ellipseOutline"></ion-icon>
            {{ tooltipData.status }}
          </span>
          <span v-if="tooltipData.photos && tooltipData.photos.length > 0" class="tooltip-photo-count">
            📷 {{ tooltipData.photos.length }}
          </span>
        </div>
      </div>

      <div class="map-controls">
        <ion-button class="control-button recenter-button" @click="recenterMap">
          <ion-icon slot="icon-only" :icon="locateOutline"></ion-icon>
        </ion-button>

        <ion-button 
          class="control-button report-button" 
          :color="isPickingLocation ? 'danger' : 'primary'"
          @click="toggleLocationPicking"
        >
          <ion-icon slot="start" :icon="isPickingLocation ? closeOutline : addOutline"></ion-icon>
          {{ isPickingLocation ? 'Annuler' : 'Signaler' }}
        </ion-button>
      </div>

      <div class="map-legend glass-card">
        <h4><ion-icon :icon="layersOutline"></ion-icon> Légende</h4>
        <div class="legend-item"><div class="legend-marker urgent"></div><span>Urgence</span></div>
        <div class="legend-item"><div class="legend-marker anomaly"></div><span>Anomalie</span></div>
        <div class="legend-item"><div class="legend-marker info"></div><span>Information</span></div>
      </div>

      <ReportModal
        :is-open="isReportModalOpen"
        :user-location="pickedLocation"
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonContent, IonIcon, toastController, alertController
} from '@ionic/vue';
import {
  listOutline, locateOutline, warningOutline, closeOutline,
  personOutline, logOutOutline, settingsOutline, documentTextOutline,
  shieldCheckmarkOutline, addOutline, layersOutline, locationOutline,
  navigateOutline, ellipseOutline
} from 'ionicons/icons';

// Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Firebase
import { db, auth, storage } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';

// Composants
import ReportModal from '../components/ReportModal.vue';

const router = useRouter();

// --- ÉTAT ---
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const isReportModalOpen = ref(false);
const isPickingLocation = ref(false);
const pickedLocation = ref<{ lat: number; lng: number } | null>(null);
let tempMarker: L.Marker | null = null;

// Profile menu state
const isProfileMenuOpen = ref(false);
const userName = ref(auth.currentUser?.displayName || '');
const userEmail = ref(auth.currentUser?.email || '');
const userPhotoURL = ref(auth.currentUser?.photoURL || '');

// Confirmation popup state
const showConfirmPopup = ref(false);
const pendingLocation = ref<{ lat: number; lng: number } | null>(null);

// Marker tooltip state
const showMarkerTooltip = ref(false);
const tooltipPosition = ref({ top: '0px', left: '0px' });
const tooltipData = ref({
  title: '',
  description: '',
  type: '',
  typeClass: '',
  status: '',
  statusClass: '',
  date: '',
  photos: [] as string[]
});

// On utilise un Map pour suivre les marqueurs Firebase et éviter les doublons
const firebaseMarkers = new Map<string, L.Marker>();

// Profile menu functions
const toggleProfileMenu = () => {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
};

const closeProfileMenu = () => {
  isProfileMenuOpen.value = false;
};

const goToSettings = () => {
  closeProfileMenu();
  // router.push('/settings');
  showToast('Paramètres - À venir', 'tertiary');
};

const handleLogout = async () => {
  closeProfileMenu();
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Déconnexion',
        role: 'destructive',
        handler: async () => {
          try {
            await signOut(auth);
            router.push('/login');
          } catch (error) {
            showToast('Erreur lors de la déconnexion', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

// --- LOGIQUE CARTE ---
const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value).setView([-18.9150, 47.5360], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // CHARGEMENT DES POINTS EXISTANTS
  loadMarkersFromFirebase();

  map.on('click', (e: L.LeafletMouseEvent) => {
    // Toujours afficher la popup de confirmation quand on clique sur la carte
    pendingLocation.value = { lat: e.latlng.lat, lng: e.latlng.lng };
    showConfirmPopup.value = true;
  });
};

const cancelConfirmation = () => {
  showConfirmPopup.value = false;
  pendingLocation.value = null;
};

const confirmLocation = () => {
  if (pendingLocation.value) {
    handleLocationSelected(pendingLocation.value.lat, pendingLocation.value.lng);
  }
  showConfirmPopup.value = false;
  pendingLocation.value = null;
};

const loadMarkersFromFirebase = () => {
  if (!map) return;

  const q = query(collection(db, "road_issues"));

  // Écoute en temps réel des documents dans Firebase
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const id = change.doc.id;

      if (change.type === "added" || change.type === "modified") {
        // Supprimer l'ancien marqueur si c'est une modification
        if (firebaseMarkers.has(id)) {
          map?.removeLayer(firebaseMarkers.get(id)!);
        }

        // Déterminer la classe CSS selon le type
        const typeClass = data.title?.toLowerCase().includes('urgent') ? 'urgent' : 
                          data.title?.toLowerCase().includes('info') ? 'info' : 'anomaly';

        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="marker-pin ${typeClass}"><div class="marker-pulse"></div></div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });

        const marker = L.marker([data.latitude, data.longitude], { icon: customIcon })
          .addTo(map!);

        // Store marker data for tooltip
        (marker as any).reportData = {
          title: data.title || 'Signalement',
          description: data.description || 'Aucune description',
          type: typeClass === 'urgent' ? 'Urgence' : typeClass === 'info' ? 'Information' : 'Anomalie',
          typeClass: typeClass,
          status: data.status || 'NOUVEAU',
          statusClass: (data.status || 'NOUVEAU').toLowerCase().replace(' ', '-'),
          date: data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : 'Date inconnue',
          photos: data.photos || []
        };

        // Mouse events for tooltip
        marker.on('mouseover', (e: L.LeafletMouseEvent) => {
          const reportData = (marker as any).reportData;
          tooltipData.value = reportData;
          
          const containerPoint = map!.latLngToContainerPoint(e.latlng);
          tooltipPosition.value = {
            top: `${containerPoint.y - 10}px`,
            left: `${containerPoint.x + 20}px`
          };
          showMarkerTooltip.value = true;
        });

        marker.on('mouseout', () => {
          showMarkerTooltip.value = false;
        });

        marker.on('click', () => {
          const reportData = (marker as any).reportData;
          tooltipData.value = reportData;
          showMarkerTooltip.value = true;
          setTimeout(() => {
            showMarkerTooltip.value = false;
          }, 3000);
        });

        firebaseMarkers.set(id, marker);
      }

      if (change.type === "removed") {
        if (firebaseMarkers.has(id)) {
          map?.removeLayer(firebaseMarkers.get(id)!);
          firebaseMarkers.delete(id);
        }
      }
    });
  });
};

const toggleLocationPicking = () => {
  isPickingLocation.value = !isPickingLocation.value;
  if (isPickingLocation.value) {
    showToast('Mode sélection activé : Touchez la carte 📍', 'primary');
  }
};

const handleLocationSelected = (lat: number, lng: number) => {
  pickedLocation.value = { lat, lng };
  if (map) {
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng]).addTo(map);
  }
  isPickingLocation.value = false;
  isReportModalOpen.value = true;
};

const closeReportModal = () => {
  isReportModalOpen.value = false;
  if (tempMarker && map) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
};

const handleReportSubmit = async (reportData: any) => {
  try {
    // Utiliser l'ID de l'utilisateur connecté
    const currentUserId = auth.currentUser?.uid || 'anonymous';
    const currentUserEmail = auth.currentUser?.email || 'unknown';
    const reportId = crypto.randomUUID();
    
    // Upload des photos vers Firebase Storage
    const photoUrls: string[] = [];
    if (reportData.photos && reportData.photos.length > 0) {
      showToast('Upload des photos en cours... 📤', 'tertiary');
      
      for (let i = 0; i < reportData.photos.length; i++) {
        const photo = reportData.photos[i];
        try {
          // Créer une référence unique pour chaque photo
          const photoRef = storageRef(storage, `reports/${currentUserId}/${reportId}/photo_${i}_${Date.now()}.jpg`);
          
          // Upload de la photo (format base64 dataUrl)
          if (photo.startsWith('data:')) {
            await uploadString(photoRef, photo, 'data_url');
            const downloadUrl = await getDownloadURL(photoRef);
            photoUrls.push(downloadUrl);
            console.log(`Photo ${i + 1} uploadée:`, downloadUrl);
          }
        } catch (uploadError) {
          console.error(`Erreur upload photo ${i + 1}:`, uploadError);
        }
      }
    }
    
    const finalData = {
      title: reportData.type === 'urgent' ? '🚨 Signalement Urgent' : '⚠️ Anomalie Route',
      description: reportData.description,
      latitude: pickedLocation.value?.lat || 0,
      longitude: pickedLocation.value?.lng || 0,
      niveau_danger: reportData.type === 'urgent' ? 'ELEVÉ' : 'NORMAL',
      urgency: reportData.urgency || 1,
      status: "EN_ATTENTE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_at: serverTimestamp(),
      user_id: currentUserId,
      user_email: currentUserEmail,
      photos: photoUrls,
      photos_count: photoUrls.length,
      id: reportId
    };

    await addDoc(collection(db, "road_issues"), finalData);
    
    const message = photoUrls.length > 0 
      ? `Signalement envoyé avec ${photoUrls.length} photo(s) ! 🚀` 
      : 'Signalement envoyé ! 🚀';
    showToast(message, 'success');
    closeReportModal();
  } catch (error) {
    console.error("Erreur Firebase:", error);
    showToast('Erreur lors de la sauvegarde ❌', 'danger');
  }
};

const recenterMap = () => { if (map) map.setView([-18.9150, 47.5360], 15); };

const showToast = async (message: string, color: string) => {
  const toast = await toastController.create({ message, duration: 2500, color, position: 'top' });
  await toast.present();
};

const goToReports = () => router.push('/reports');

onMounted(() => setTimeout(() => initMap(), 100));
onUnmounted(() => { if (map) map.remove(); });
</script>
<style scoped>
#map { width: 100%; height: 100%; z-index: 0; }

/* Header Styles */
.map-header ion-toolbar {
  --padding-start: 8px;
  --padding-end: 8px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
}

.brand-icon {
  font-size: 24px;
  color: white;
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
}

.header-btn {
  --color: white;
  --padding-start: 8px;
  --padding-end: 8px;
}

.profile-btn {
  --padding-start: 4px;
  --padding-end: 4px;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  transition: all 0.3s ease;
}

.profile-avatar:hover {
  border-color: white;
  transform: scale(1.05);
}

.profile-avatar ion-icon {
  font-size: 20px;
  color: white;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Profile Menu Dropdown */
.profile-menu {
  position: fixed;
  top: 60px;
  right: 16px;
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.profile-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

.profile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.profile-backdrop.show {
  opacity: 1;
  visibility: visible;
}

.profile-menu-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
}

.profile-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

.profile-avatar-large ion-icon {
  font-size: 28px;
  color: white;
}

.profile-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details {
  flex: 1;
}

.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 2px 0;
}

.profile-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.profile-menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.profile-menu-item:hover {
  background: #f8fafc;
}

.profile-menu-item ion-icon {
  font-size: 20px;
  color: #64748b;
}

.profile-menu-item.logout-btn {
  color: #ef4444;
}

.profile-menu-item.logout-btn ion-icon {
  color: #ef4444;
}

/* --- AJOUT POUR LES MARQUEURS --- */
:deep(.custom-marker) {
  background: transparent;
  border: none;
}

:deep(.marker-pin) {
  width: 28px;
  height: 28px;
  border-radius: 50% 50% 50% 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -14px 0 0 -14px;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transition: all 0.3s ease;
}

:deep(.marker-pin:hover) {
  transform: rotate(-45deg) scale(1.1);
}

:deep(.marker-pulse) {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  animation: pulse-marker 2s infinite;
  background: inherit;
  opacity: 0.3;
}

@keyframes pulse-marker {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

:deep(.marker-pin.urgent) { 
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

:deep(.marker-pin.anomaly) { 
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

:deep(.marker-pin.info) { 
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

/* --- FIN AJOUT --- */

/* Confirmation Popup */
.confirm-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  z-index: 2001;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.confirm-popup.show {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}

.confirm-popup-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 320px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.confirm-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.confirm-icon ion-icon {
  font-size: 36px;
  color: white;
}

.confirm-popup-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.confirm-popup-content p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.confirm-coords {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 24px;
}

.confirm-coords ion-icon {
  font-size: 18px;
  color: var(--ion-color-primary);
}

.confirm-coords span {
  font-size: 13px;
  color: #64748b;
  font-family: monospace;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: white;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Marker Tooltip */
.marker-tooltip {
  position: absolute;
  background: white;
  border-radius: 14px;
  padding: 16px;
  min-width: 220px;
  max-width: 280px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1500;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.marker-tooltip.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tooltip-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.tooltip-badge.urgent {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.tooltip-badge.anomaly {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.tooltip-badge.info {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
}

.tooltip-date {
  font-size: 11px;
  color: #94a3b8;
}

.tooltip-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.tooltip-description {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Photos dans le tooltip */
.tooltip-photos {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.tooltip-photo {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.tooltip-more-photos {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.tooltip-footer {
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tooltip-photo-count {
  font-size: 12px;
  color: #64748b;
}

.tooltip-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.tooltip-status ion-icon {
  font-size: 8px;
}

.tooltip-status.nouveau {
  color: #06b6d4;
}

.tooltip-status.en-cours {
  color: #f59e0b;
}

.tooltip-status.resolu {
  color: #10b981;
}

.selection-banner {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.banner-content {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  color: white;
  padding: 14px 24px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
  font-weight: 500;
  font-size: 14px;
}

.banner-content ion-icon {
  font-size: 20px;
  animation: pulse 1.5s infinite;
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
  --border-radius: 14px;
  --box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  height: 52px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.control-button:hover {
  transform: translateY(-2px);
  --box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.recenter-button {
  --background: white;
  --color: var(--ion-color-primary);
  width: 52px;
}

.report-button {
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
}

.map-legend {
  position: absolute;
  top: 100px;
  left: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeInLeft 0.5s ease;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.map-legend h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.map-legend h4 ion-icon {
  font-size: 16px;
  color: var(--ion-color-primary);
}

.legend-item { 
  display: flex; 
  align-items: center; 
  margin-bottom: 8px; 
  font-size: 12px;
  color: #64748b;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-marker { 
  width: 14px; 
  height: 14px; 
  border-radius: 50%; 
  margin-right: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.legend-marker.urgent { background: linear-gradient(135deg, #ef4444, #dc2626); }
.legend-marker.anomaly { background: linear-gradient(135deg, #f59e0b, #d97706); }
.legend-marker.info { background: linear-gradient(135deg, #06b6d4, #0891b2); }

/* Responsive */
@media (max-width: 480px) {
  .profile-menu {
    right: 8px;
    width: calc(100% - 16px);
    max-width: 320px;
  }
  
  .map-legend {
    top: auto;
    bottom: 100px;
    left: 16px;
  }
  
  .confirm-popup-content {
    width: calc(100% - 40px);
    max-width: 320px;
  }
}
</style>