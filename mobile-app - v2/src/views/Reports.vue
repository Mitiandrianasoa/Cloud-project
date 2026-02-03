<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Liste Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="syncReports">
            <ion-icon :icon="syncOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="gradient-bg">
      <!-- Section de filtres -->
      <FilterSection
        :filters="filters"
        @update:filters="updateFilters"
      />

      <!-- Statistiques -->
      <div class="stats-container soft-card">
        <div class="stat-item">
          <div class="stat-number urgent-color">{{ stats.urgent }}</div>
          <div class="stat-label">Urgences</div>
        </div>
        <div class="stat-item">
          <div class="stat-number anomaly-color">{{ stats.anomaly }}</div>
          <div class="stat-label">Anomalies</div>
        </div>
        <div class="stat-item">
          <div class="stat-number info-color">{{ stats.info }}</div>
          <div class="stat-label">Infos</div>
        </div>
        <div class="stat-item">
          <div class="stat-number total-color">{{ stats.total }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      <!-- Liste des signalements -->
      <div class="reports-list">
        <div v-if="filteredReports.length === 0" class="empty-state">
          <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
          <h3>Aucun signalement</h3>
          <p>Les signalements que vous créez apparaîtront ici</p>
        </div>

        <div
          v-for="report in filteredReports"
          :key="report.id"
          class="report-card soft-card"
          @click="viewReportDetails(report)"
        >
          <div class="report-header">
            <div class="report-type-badge" :class="report.type">
              {{ getTypeBadge(report.type) }}
            </div>
            <div class="report-date">{{ formatDate(report.date) }}</div>
          </div>

          <h3 class="report-title">{{ report.description }}</h3>

          <div class="report-meta">
            <div class="meta-item">
              <ion-icon :icon="locationOutline"></ion-icon>
              <span>{{ report.location.address }}</span>
            </div>
            <div class="meta-item">
              <ion-icon :icon="timeOutline"></ion-icon>
              <span>{{ formatTime(report.date) }}</span>
            </div>
            <div class="meta-item" v-if="report.urgency">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              <span>Niveau {{ report.urgency }}/3</span>
            </div>
          </div>

          <div v-if="report.photos && report.photos.length > 0" class="report-photos">
            <img
              v-for="(photo, index) in report.photos.slice(0, 3)"
              :key="index"
              :src="photo"
              :alt="`Photo ${index + 1}`"
              class="report-photo-thumb"
            />
            <div v-if="report.photos.length > 3" class="photo-more">
              +{{ report.photos.length - 3 }}
            </div>
          </div>

          <div class="report-status">
            <div class="status-badge" :class="report.status">
              {{ getStatusLabel(report.status) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Bouton flottant pour créer un signalement -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="goToMap" class="fab-button">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonFab,
  IonFabButton,
  toastController,
  modalController
} from '@ionic/vue';
import {
  arrowBackOutline,
  syncOutline,
  documentTextOutline,
  locationOutline,
  timeOutline,
  alertCircleOutline,
  addOutline
} from 'ionicons/icons';
import FilterSection from '../components/FilterSection.vue';

const router = useRouter();

// Filtres
const filters = ref({
  type: 'all',
  status: 'all',
  dateRange: 'all'
});

// Données de test
const reports = ref([
  {
    id: 1,
    type: 'urgent',
    description: 'Fuite d\'eau importante sur Avenue de l\'Indépendance',
    location: {
      lat: -18.9150,
      lng: 47.5360,
      address: 'Avenue de l\'Indépendance, Antananarivo'
    },
    date: new Date('2026-01-25T14:30:00'),
    urgency: 3,
    status: 'pending',
    photos: [
      'https://via.placeholder.com/150/FFB3BA/ffffff?text=Photo+1',
      'https://via.placeholder.com/150/FFB3BA/ffffff?text=Photo+2'
    ]
  },
  {
    id: 2,
    type: 'anomaly',
    description: 'Nid de poule dangereux sur la route',
    location: {
      lat: -18.9100,
      lng: 47.5300,
      address: 'Route d\'Ambohimanarina'
    },
    date: new Date('2026-01-24T10:15:00'),
    urgency: 2,
    status: 'in-progress',
    photos: [
      'https://via.placeholder.com/150/FFD8A8/ffffff?text=Photo+1'
    ]
  },
  {
    id: 3,
    type: 'info',
    description: 'Travaux de réfection en cours',
    location: {
      lat: -18.9200,
      lng: 47.5400,
      address: 'Boulevard Ranavalona III'
    },
    date: new Date('2026-01-23T16:45:00'),
    urgency: 1,
    status: 'resolved',
    photos: []
  },
  {
    id: 4,
    type: 'urgent',
    description: 'Arbre tombé bloquant la circulation',
    location: {
      lat: -18.9180,
      lng: 47.5380,
      address: 'Rue Rainitovo'
    },
    date: new Date('2026-01-26T08:00:00'),
    urgency: 3,
    status: 'pending',
    photos: [
      'https://via.placeholder.com/150/FFB3BA/ffffff?text=Photo+1',
      'https://via.placeholder.com/150/FFB3BA/ffffff?text=Photo+2',
      'https://via.placeholder.com/150/FFB3BA/ffffff?text=Photo+3',
      'https://via.placeholder.com/150/FFB3BA/ffffff?text=Photo+4'
    ]
  }
]);

// Statistiques calculées
const stats = computed(() => {
  return {
    urgent: reports.value.filter(r => r.type === 'urgent').length,
    anomaly: reports.value.filter(r => r.type === 'anomaly').length,
    info: reports.value.filter(r => r.type === 'info').length,
    total: reports.value.length
  };
});

// Signalements filtrés
const filteredReports = computed(() => {
  let result = [...reports.value];

  // Filtre par type
  if (filters.value.type !== 'all') {
    result = result.filter(r => r.type === filters.value.type);
  }

  // Filtre par statut
  if (filters.value.status !== 'all') {
    result = result.filter(r => r.status === filters.value.status);
  }

  // Filtre par date
  if (filters.value.dateRange !== 'all') {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    result = result.filter(r => {
      const diff = now.getTime() - r.date.getTime();
      
      switch (filters.value.dateRange) {
        case 'today':
          return diff < dayInMs;
        case 'week':
          return diff < 7 * dayInMs;
        case 'month':
          return diff < 30 * dayInMs;
        default:
          return true;
      }
    });
  }

  // Trier par date (plus récent en premier)
  result.sort((a, b) => b.date.getTime() - a.date.getTime());

  return result;
});

// Mettre à jour les filtres
const updateFilters = (newFilters: any) => {
  filters.value = { ...newFilters };
};

// Synchroniser les signalements
const syncReports = async () => {
  // TODO: Synchroniser avec Firebase
  const toast = await toastController.create({
    message: 'Synchronisation en cours... 🔄',
    duration: 2000,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();

  setTimeout(async () => {
    const successToast = await toastController.create({
      message: 'Signalements synchronisés ! ✅',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await successToast.present();
  }, 1500);
};

// Voir les détails d'un signalement
const viewReportDetails = async (report: any) => {
  // TODO: Ouvrir une modal ou une nouvelle page avec les détails
  console.log('Détails du signalement:', report);
  
  const toast = await toastController.create({
    message: 'Détails du signalement - À implémenter 🔍',
    duration: 2000,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();
};

// Formater la date
const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  return date.toLocaleDateString('fr-FR', options);
};

// Formater l'heure
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Obtenir le badge de type
const getTypeBadge = (type: string): string => {
  switch (type) {
    case 'urgent': return '🚨 Urgence';
    case 'anomaly': return '⚠️ Anomalie';
    case 'info': return 'ℹ️ Info';
    default: return 'Signalement';
  }
};

// Obtenir le label du statut
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'in-progress': return 'En cours';
    case 'resolved': return 'Résolu';
    default: return status;
  }
};

// Navigation
const goBack = () => {
  router.push('/map');
};

const goToMap = () => {
  router.push('/map');
};
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 15px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.urgent-color {
  color: #FFB3BA;
}

.anomaly-color {
  color: #FFD8A8;
}

.info-color {
  color: #B0E0E6;
}

.total-color {
  color: #DDA0DD;
}

.reports-list {
  padding: 0 15px 100px 15px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 80px;
  color: #ffe4e9;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  color: #5a5a5a;
  margin-bottom: 10px;
}

.empty-state p {
  color: #999;
  font-size: 14px;
}

.report-card {
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.report-card:active {
  transform: scale(0.98);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.report-type-badge {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.report-type-badge.urgent {
  background: #FFB3BA;
  color: white;
}

.report-type-badge.anomaly {
  background: #FFD8A8;
  color: #5a5a5a;
}

.report-type-badge.info {
  background: #B0E0E6;
  color: #5a5a5a;
}

.report-date {
  font-size: 12px;
  color: #999;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #5a5a5a;
  margin-bottom: 12px;
  line-height: 1.4;
}

.report-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #999;
}

.meta-item ion-icon {
  margin-right: 8px;
  font-size: 16px;
}

.report-photos {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.report-photo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #ffe4e9;
}

.photo-more {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: #ffe4e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #FFB6C1;
}

.report-status {
  border-top: 1px solid #ffe4e9;
  padding-top: 12px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pending {
  background: #FFF5E6;
  color: #FFD8A8;
}

.status-badge.in-progress {
  background: #E6F7FF;
  color: #B0E0E6;
}

.status-badge.resolved {
  background: #E6F9F5;
  color: #98D8C8;
}

.fab-button {
  --background: linear-gradient(135deg, #FFB6C1, #DDA0DD);
  --box-shadow: 0 4px 15px rgba(255, 182, 193, 0.4);
}
</style>