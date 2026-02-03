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
  gap: 12px;
  margin: 16px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 20px 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-family: 'Poppins', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.urgent-color {
  color: var(--danger);
}

.anomaly-color {
  color: var(--warning);
}

.info-color {
  color: var(--info);
}

.total-color {
  color: var(--primary);
}

.reports-list {
  padding: 0 16px 100px 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.empty-icon {
  font-size: 72px;
  color: var(--gray-300);
  margin-bottom: 20px;
}

.empty-state h3 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.report-card {
  margin-bottom: 16px;
  cursor: pointer;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all var(--transition-base);
}

.report-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.report-card:active {
  transform: scale(0.98);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.report-type-badge {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.report-type-badge.urgent {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.report-type-badge.anomaly {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.report-type-badge.info {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.report-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.report-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  line-height: 1.4;
}

.report-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.813rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.meta-item ion-icon {
  margin-right: 10px;
  font-size: 18px;
  color: var(--text-muted);
}

.report-photos {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.report-photo-thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 2px solid var(--border-light);
  transition: border-color var(--transition-fast);
}

.report-photo-thumb:hover {
  border-color: var(--primary);
}

.photo-more {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}

.report-status {
  border-top: 1px solid var(--border-light);
  padding-top: 14px;
}

.status-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.status-badge.in-progress {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.status-badge.resolved {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.fab-button {
  --background: var(--gradient-primary);
  --box-shadow: var(--shadow-primary);
  transition: all var(--transition-base);
}

.fab-button:hover {
  --box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  transform: scale(1.05);
}
</style>