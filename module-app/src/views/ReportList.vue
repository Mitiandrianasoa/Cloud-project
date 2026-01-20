<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/" text="" class="back-btn" />
        </ion-buttons>
        <ion-title class="page-title">
          <span class="title-icon">📋</span>
          Mes Signalements
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFilter" class="filter-btn">
            <ion-icon :icon="options" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="reports-content">
      <!-- Filtres -->
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-header">
          <h3 class="filters-title">Filtres</h3>
          <ion-button @click="applyFilters" class="apply-btn" size="small">
            Appliquer
          </ion-button>
        </div>
        
        <div class="filter-options">
          <ion-segment v-model="filterType" class="type-segment">
            <ion-segment-button value="all">
              <ion-label>Tous</ion-label>
            </ion-segment-button>
            <ion-segment-button value="emergency">
              <ion-label>Urgence</ion-label>
            </ion-segment-button>
            <ion-segment-button value="anomaly">
              <ion-label>Anomalie</ion-label>
            </ion-segment-button>
            <ion-segment-button value="info">
              <ion-label>Info</ion-label>
            </ion-segment-button>
          </ion-segment>
          
          <div class="filter-group">
            <ion-label class="filter-label">Statut</ion-label>
            <div class="status-chips">
              <ion-chip 
                v-for="status in statusOptions" 
                :key="status.value"
                @click="toggleStatus(status.value)"
                class="status-chip"
                :class="{ active: selectedStatus.includes(status.value) }"
              >
                {{ status.label }}
              </ion-chip>
            </div>
          </div>
          
          <div class="filter-group">
            <ion-toggle 
              v-model="showOnlyMine" 
              class="mine-toggle"
            >
              <div class="toggle-label">
                <ion-icon :icon="person" />
                <span>Afficher uniquement les miens</span>
              </div>
            </ion-toggle>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="stats-cards">
        <div class="stat-card total">
          <div class="stat-content">
            <div class="stat-icon">📌</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalReports }}</div>
              <div class="stat-label">Signalements</div>
            </div>
          </div>
        </div>
        
        <div class="stat-card progress">
          <div class="stat-content">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <div class="stat-value">{{ progressPercentage }}%</div>
              <div class="stat-label">Avancement</div>
            </div>
          </div>
        </div>
        
        <div class="stat-card budget">
          <div class="stat-content">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalBudget }}k</div>
              <div class="stat-label">Budget total</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des signalements -->
      <div class="reports-list">
        <div v-if="filteredReports.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">Aucun signalement</h3>
          <p class="empty-text">
            {{ filterType !== 'all' ? 'Aucun signalement ne correspond aux filtres' : 'Commencez par signaler un problème sur la carte !' }}
          </p>
          <ion-button @click="goToHome" fill="solid" class="empty-btn">
            <ion-icon :icon="add" slot="start" />
            Faire un signalement
          </ion-button>
        </div>

        <div v-else>
          <ion-list class="report-items">
            <ion-item-sliding 
              v-for="report in filteredReports" 
              :key="report.id"
              class="report-item"
            >
              <ion-item class="item-content" @click="viewReport(report)">
                <div class="item-icon" :class="report.type">
                  {{ getTypeIcon(report.type) }}
                </div>
                
                <ion-label class="item-details">
                  <h2 class="item-title">{{ report.title || 'Signalement sans titre' }}</h2>
                  <p class="item-description">{{ report.description }}</p>
                  
                  <div class="item-meta">
                    <span class="meta-date">
                      <ion-icon :icon="calendar" />
                      {{ formatDate(report.date) }}
                    </span>
                    <span class="meta-status" :class="report.status">
                      {{ getStatusLabel(report.status) }}
                    </span>
                  </div>
                </ion-label>
                
                <ion-badge 
                  class="urgency-badge"
                  :class="`level-${report.urgency}`"
                >
                  Urgence {{ report.urgency }}/3
                </ion-badge>
              </ion-item>
              
              <ion-item-options side="end">
                <ion-item-option 
                  @click="editReport(report)" 
                  color="primary"
                  class="edit-option"
                >
                  <ion-icon slot="icon-only" :icon="create" />
                </ion-item-option>
                <ion-item-option 
                  @click="deleteReport(report)" 
                  color="warning"
                  class="delete-option"
                >
                  <ion-icon slot="icon-only" :icon="trash" />
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </div>
      </div>

      <!-- Bouton synchronisation -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button 
          @click="syncReports" 
          class="sync-fab"
          :class="{ syncing: isSyncing }"
        >
          <ion-icon :icon="isSyncing ? sync : cloudUpload" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonBackButton, IonButtons, IonList,
  IonItem, IonLabel, IonItemSliding, IonItemOptions,
  IonItemOption, IonBadge, IonSegment, IonSegmentButton,
  IonChip, IonToggle
} from '@ionic/vue';
import {
  options, person, calendar, create, trash,
  add, cloudUpload, sync
} from 'ionicons/icons';

const router = useRouter();

// Données
const reports = ref([
  {
    id: 1,
    type: 'emergency',
    title: 'Nid de poule dangereux',
    description: 'Grand trou sur la chaussée principale',
    date: '2024-01-15',
    status: 'new',
    urgency: 3,
    mine: true
  },
  // Ajoute plus de données ici
]);

const showFilters = ref(false);
const filterType = ref('all');
const selectedStatus = ref(['new', 'in-progress']);
const showOnlyMine = ref(false);
const isSyncing = ref(false);

const statusOptions = [
  { value: 'new', label: 'Nouveau' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolu' }
];

// Computed
const totalReports = computed(() => reports.value.length);
const progressPercentage = computed(() => {
  const resolved = reports.value.filter(r => r.status === 'resolved').length;
  return Math.round((resolved / reports.value.length) * 100) || 0;
});
const totalBudget = computed(() => {
  return Math.round(reports.value.length * 15 / 1000);
});

const filteredReports = computed(() => {
  return reports.value.filter(report => {
    // Filtre par type
    if (filterType.value !== 'all' && report.type !== filterType.value) {
      return false;
    }
    
    // Filtre par statut
    if (selectedStatus.value.length > 0 && !selectedStatus.value.includes(report.status)) {
      return false;
    }
    
    // Filtre "uniquement les miens"
    if (showOnlyMine.value && !report.mine) {
      return false;
    }
    
    return true;
  });
});

// Méthodes
const toggleFilter = () => {
  showFilters.value = !showFilters.value;
};

const applyFilters = () => {
  showFilters.value = false;
};

const toggleStatus = (status) => {
  const index = selectedStatus.value.indexOf(status);
  if (index > -1) {
    selectedStatus.value.splice(index, 1);
  } else {
    selectedStatus.value.push(status);
  }
};

const getTypeIcon = (type) => {
  const icons = {
    emergency: '🚨',
    anomaly: '🚧',
    info: 'ℹ️'
  };
  return icons[type] || '📌';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusLabel = (status) => {
  const labels = {
    new: 'Nouveau',
    'in-progress': 'En cours',
    resolved: 'Résolu'
  };
  return labels[status] || status;
};

const viewReport = (report) => {
  console.log('Voir signalement:', report);
  // Navigation vers détail
};

const editReport = (report) => {
  console.log('Éditer signalement:', report);
};

const deleteReport = (report) => {
  const index = reports.value.findIndex(r => r.id === report.id);
  if (index > -1) {
    reports.value.splice(index, 1);
  }
};

const syncReports = async () => {
  isSyncing.value = true;
  // Simulation de synchronisation
  setTimeout(() => {
    isSyncing.value = false;
    console.log('Synchronisation terminée');
  }, 2000);
};

const goToHome = () => {
  router.push('/');
};
</script>

<style scoped>
/* En-tête */
.header-toolbar {
  --background: linear-gradient(135deg, var(--primary), var(--secondary));
  --color: white;
}

.page-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 1.5rem;
}

.back-btn {
  --color: white;
  --icon-font-size: 24px;
}

.filter-btn {
  --background: rgba(255, 255, 255, 0.2);
  --border-radius: 50%;
}

/* Filtres */
.filters-panel {
  background: white;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  padding: 16px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.apply-btn {
  --background: var(--secondary);
  --border-radius: 10px;
  font-weight: 500;
}

.type-segment {
  --background: var(--light);
  margin-bottom: 20px;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-label {
  display: block;
  margin-bottom: 10px;
  font-family: 'Poppins', sans-serif;
  color: var(--text);
  font-weight: 500;
}

.status-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-chip {
  --background: var(--light);
  --color: var(--text);
  transition: all 0.3s ease;
}

.status-chip.active {
  --background: var(--accent);
  --color: white;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Poppins', sans-serif;
  color: var(--text);
}

.mine-toggle {
  --background: var(--light);
  --background-checked: var(--accent);
  --handle-background-checked: white;
}

/* Statistiques */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  padding: 0 16px;
  margin-bottom: 25px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(170, 150, 218, 0.1);
}

.stat-card.total {
  border-top: 4px solid var(--primary);
}

.stat-card.progress {
  border-top: 4px solid var(--success);
}

.stat-card.budget {
  border-top: 4px solid var(--secondary);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 2rem;
  background: var(--light);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  color: var(--text);
  line-height: 1;
}

.stat-label {
  font-family: 'Poppins', sans-serif;
  color: var(--dark);
  font-size: 0.9rem;
  margin-top: 5px;
}

/* Liste */
.reports-content {
  --background: var(--light);
}

.reports-list {
  padding: 0 16px 100px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}

.empty-text {
  font-family: 'Poppins', sans-serif;
  color: var(--dark);
  line-height: 1.5;
  margin-bottom: 30px;
}

.empty-btn {
  --background: linear-gradient(135deg, var(--secondary), var(--primary));
  --border-radius: 12px;
  font-weight: 500;
}

/* Items de liste */
.report-items {
  background: transparent;
}

.report-item {
  margin-bottom: 15px;
  --background: transparent;
}

.item-content {
  --background: white;
  --border-radius: 16px;
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 16px;
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(170, 150, 218, 0.1);
}

.item-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  flex-shrink: 0;
}

.item-icon.emergency {
  background: rgba(255, 170, 165, 0.2);
}

.item-icon.anomaly {
  background: rgba(168, 216, 234, 0.2);
}

.item-icon.info {
  background: rgba(170, 150, 218, 0.2);
}

.item-details {
  flex: 1;
}

.item-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 5px;
  font-size: 1rem;
}

.item-description {
  font-family: 'Poppins', sans-serif;
  color: var(--dark);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.meta-date {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--dark);
}

.meta-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.75rem;
}

.meta-status.new {
  background: rgba(255, 170, 165, 0.2);
  color: #FF6B6B;
}

.meta-status.in-progress {
  background: rgba(168, 216, 234, 0.2);
  color: #4D96FF;
}

.meta-status.resolved {
  background: rgba(181, 234, 215, 0.2);
  color: #06D6A0;
}

.urgency-badge {
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 10px;
  padding: 4px 8px;
  margin-left: 10px;
}

.urgency-badge.level-1 {
  --background: rgba(181, 234, 215, 0.2);
  --color: #06D6A0;
}

.urgency-badge.level-2 {
  --background: rgba(255, 213, 182, 0.2);
  --color: #FF9E6D;
}

.urgency-badge.level-3 {
  --background: rgba(255, 170, 165, 0.2);
  --color: #FF6B6B;
}

/* Options swipe */
.edit-option {
  --background: rgba(168, 216, 234, 0.2);
  --color: var(--primary);
  width: 60px;
}

.delete-option {
  --background: rgba(255, 170, 165, 0.2);
  --color: var(--warning);
  width: 60px;
}

/* Bouton synchronisation */
.sync-fab {
  --background: linear-gradient(135deg, var(--secondary), var(--primary));
  --box-shadow: 0 4px 20px rgba(170, 150, 218, 0.4);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.sync-fab.syncing {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>