<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
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
      <FilterSection :filters="filters" @update:filters="updateFilters" />

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

      <div class="reports-list">
        <div v-if="filteredReports.length === 0" class="empty-state">
          <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
          <h3>Aucun signalement</h3>
          <p>Les données Firebase apparaîtront ici dès qu'elles seront reçues.</p>
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
              <span>Importance: {{ report.urgency === 3 ? 'Haute' : 'Normale' }}</span>
            </div>
            <div class="meta-item" v-if="report.photos && report.photos.length > 0">
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>{{ report.photos.length }} photo(s)</span>
            </div>
          </div>

          <!-- Aperçu des photos -->
          <div v-if="report.photos && report.photos.length > 0" class="photos-preview">
            <img 
              v-for="(photo, index) in report.photos.slice(0, 3)" 
              :key="index" 
              :src="photo" 
              :alt="'Photo ' + (index + 1)"
              class="photo-thumb"
              @click.stop="openPhoto(photo)"
            />
            <div v-if="report.photos.length > 3" class="more-photos">
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

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="goToMap" class="fab-button">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle,
  IonContent, IonIcon, IonFab, IonFabButton, toastController
} from '@ionic/vue';
import {
  arrowBackOutline, syncOutline, documentTextOutline, locationOutline,
  timeOutline, alertCircleOutline, addOutline, cameraOutline, imagesOutline
} from 'ionicons/icons';

// Firebase
import { db, auth } from '@/firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Composants
import FilterSection from '../components/FilterSection.vue';

const router = useRouter();
const reports = ref<any[]>([]);

// Filtres
const filters = ref({
  type: 'all',
  status: 'all',
  dateRange: 'all',
  myReportsOnly: false
});

// ID de l'utilisateur connecté
const currentUserId = ref(auth.currentUser?.uid || '');

// --- RÉCUPÉRATION DES DONNÉES ---
const fetchReportsFromFirebase = () => {
  const q = query(collection(db, "road_issues"), orderBy("created_at", "desc"));

  // Écoute en temps réel
  onSnapshot(q, (querySnapshot) => {
    const tempReports: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Adaptation du format Firestore -> Interface UI
      tempReports.push({
        id: doc.id,
        // On déduit le type CSS à partir du titre enregistré
        type: data.title?.toLowerCase().includes('urgent') ? 'urgent' : 
              data.title?.toLowerCase().includes('info') ? 'info' : 'anomaly',
        description: data.description,
        location: {
          lat: data.latitude,
          lng: data.longitude,
          address: `Point GPS: ${data.latitude?.toFixed(4)}, ${data.longitude?.toFixed(4)}`
        },
        date: data.created_at ? new Date(data.created_at) : new Date(),
        urgency: data.niveau_danger === 'ELEVÉ' ? 3 : (data.urgency || 1),
        // Mapping complet des statuts Firebase -> UI
        status: mapFirebaseStatus(data.status),
        photos: data.photos || [],
        photos_count: data.photos_count || 0,
        user_id: data.user_id || '',
        user_email: data.user_email || ''
      });
    });
    reports.value = tempReports;
  });
};

onMounted(() => {
  fetchReportsFromFirebase();
});

// --- CALCULS & FILTRES ---
const stats = computed(() => {
  return {
    urgent: reports.value.filter(r => r.type === 'urgent').length,
    anomaly: reports.value.filter(r => r.type === 'anomaly').length,
    info: reports.value.filter(r => r.type === 'info').length,
    total: reports.value.length
  };
});

const filteredReports = computed(() => {
  let result = [...reports.value];

  // Filtre "Mes signalements uniquement"
  if (filters.value.myReportsOnly && currentUserId.value) {
    result = result.filter(r => r.user_id === currentUserId.value);
  }

  if (filters.value.type !== 'all') {
    result = result.filter(r => r.type === filters.value.type);
  }

  if (filters.value.status !== 'all') {
    result = result.filter(r => r.status === filters.value.status);
  }

  if (filters.value.dateRange !== 'all') {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;
    result = result.filter(r => {
      const diff = now.getTime() - r.date.getTime();
      if (filters.value.dateRange === 'today') return diff < dayInMs;
      if (filters.value.dateRange === 'week') return diff < 7 * dayInMs;
      return true;
    });
  }
  return result;
});

// --- ACTIONS ---
const updateFilters = (newFilters: any) => {
  filters.value = { ...newFilters };
};

const syncReports = async () => {
  const toast = await toastController.create({
    message: 'Synchronisation Cloud OK ✅',
    duration: 1500,
    color: 'success',
    position: 'top'
  });
  await toast.present();
};

const viewReportDetails = (report: any) => {
  console.log('Détails:', report);
};

// --- HELPERS FORMATTAGE ---

// Mapping des statuts Firebase -> UI
const mapFirebaseStatus = (firebaseStatus: string): string => {
  const statusMap: Record<string, string> = {
    'NOUVEAU': 'pending',
    'EN_ATTENTE': 'pending',
    'EN_COURS': 'in-progress',
    'IN_PROGRESS': 'in-progress',
    'RESOLU': 'resolved',
    'RESOLVED': 'resolved',
    'REJETE': 'rejected',
    'REJECTED': 'rejected'
  };
  return statusMap[firebaseStatus?.toUpperCase()] || 'pending';
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getTypeBadge = (type: string) => {
  const badges: any = { urgent: '🚨 Urgence', anomaly: '⚠️ Anomalie', info: 'ℹ️ Info' };
  return badges[type] || 'Signalement';
};

const getStatusLabel = (status: string) => {
  const labels: any = { 
    pending: '⏳ En attente', 
    'in-progress': '🔄 En cours', 
    resolved: '✅ Résolu',
    rejected: '❌ Rejeté'
  };
  return labels[status] || status;
};

// Ouvrir une photo en plein écran
const openPhoto = async (photoUrl: string) => {
  window.open(photoUrl, '_blank');
};

const goBack = () => router.push('/map');
const goToMap = () => router.push('/map');
</script>

<style scoped>
/* Conservez vos styles originaux ici, ils sont parfaits */
.stats-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px; }
.stat-item { text-align: center; }
.stat-number { font-size: 24px; font-weight: 700; }
.stat-label { font-size: 10px; color: #999; text-transform: uppercase; }
.urgent-color { color: #eb445a; }
.anomaly-color { color: #ffc409; }
.info-color { color: #3dc2ff; }
.total-color { color: #5260ff; }

.reports-list { padding: 0 15px 100px 15px; }
.report-card { margin-bottom: 15px; padding: 15px; border-radius: 16px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.report-type-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
.report-type-badge.urgent { background: #ffe5e9; color: #eb445a; }
.report-type-badge.anomaly { background: #fff4d1; color: #b58d00; }
.report-type-badge.info { background: #e1f5fe; color: #0288d1; }
.report-title { font-size: 15px; margin: 10px 0; color: #333; }
.report-meta { font-size: 12px; color: #777; }
.meta-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.status-badge { font-size: 11px; font-weight: bold; margin-top: 10px; display: inline-block; padding: 4px 8px; border-radius: 8px; background: #f4f5f8; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.in-progress { background: #cce5ff; color: #004085; }
.status-badge.resolved { background: #d4edda; color: #155724; }
.status-badge.rejected { background: #f8d7da; color: #721c24; }
.fab-button { --background: var(--ion-color-primary); }

/* Photos preview */
.photos-preview {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.photo-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #eee;
  transition: transform 0.2s, border-color 0.2s;
}

.photo-thumb:hover {
  transform: scale(1.05);
  border-color: var(--ion-color-primary);
}

.more-photos {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
</style>