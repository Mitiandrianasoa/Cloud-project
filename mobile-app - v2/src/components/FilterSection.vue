<template>
  <div class="filter-section soft-card">
    <div class="filter-header">
      <h3 class="filter-title">Filtres</h3>
      <button
        v-if="hasActiveFilters"
        class="reset-button"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </div>

    <div class="filters-container">
      <!-- Filtre par type -->
      <div class="filter-group">
        <label class="filter-label">Type</label>
        <div class="filter-chips">
          <button
            v-for="type in typeOptions"
            :key="type.value"
            class="filter-chip"
            :class="{ active: localFilters.type === type.value }"
            @click="updateFilter('type', type.value)"
          >
            <span class="chip-icon">{{ type.icon }}</span>
            <span class="chip-label">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <!-- Filtre par statut -->
      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <div class="filter-chips">
          <button
            v-for="status in statusOptions"
            :key="status.value"
            class="filter-chip"
            :class="{ active: localFilters.status === status.value }"
            @click="updateFilter('status', status.value)"
          >
            <span class="chip-label">{{ status.label }}</span>
          </button>
        </div>
      </div>

      <!-- Filtre par période -->
      <div class="filter-group">
        <label class="filter-label">Période</label>
        <div class="filter-chips">
          <button
            v-for="period in periodOptions"
            :key="period.value"
            class="filter-chip"
            :class="{ active: localFilters.dateRange === period.value }"
            @click="updateFilter('dateRange', period.value)"
          >
            <span class="chip-label">{{ period.label }}</span>
          </button>
        </div>
      </div>

      <!-- Filtre Mes signalements -->
      <div class="filter-group">
        <label class="filter-label">Propriétaire</label>
        <div class="filter-chips">
          <button
            class="filter-chip"
            :class="{ active: !localFilters.myReportsOnly }"
            @click="updateFilter('myReportsOnly', false)"
          >
            <span class="chip-icon">🌍</span>
            <span class="chip-label">Tous</span>
          </button>
          <button
            class="filter-chip my-reports"
            :class="{ active: localFilters.myReportsOnly }"
            @click="updateFilter('myReportsOnly', true)"
          >
            <span class="chip-icon">👤</span>
            <span class="chip-label">Mes signalements</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Filters {
  type: string;
  status: string;
  dateRange: string;
  myReportsOnly: boolean;
}

interface Props {
  filters: Filters;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:filters']);

// État local des filtres
const localFilters = ref<Filters>({ ...props.filters });

// Options de filtres
const typeOptions = [
  { value: 'all', icon: '🔍', label: 'Tous' },
  { value: 'urgent', icon: '🚨', label: 'Urgence' },
  { value: 'anomaly', icon: '⚠️', label: 'Anomalie' },
  { value: 'info', icon: 'ℹ️', label: 'Info' }
];

const statusOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolu' }
];

const periodOptions = [
  { value: 'all', label: 'Toujours' },
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' }
];

// Vérifier si des filtres sont actifs
const hasActiveFilters = computed(() => {
  return (
    localFilters.value.type !== 'all' ||
    localFilters.value.status !== 'all' ||
    localFilters.value.dateRange !== 'all' ||
    localFilters.value.myReportsOnly === true
  );
});

// Mettre à jour un filtre
const updateFilter = (key: keyof Filters, value: string) => {
  localFilters.value[key] = value;
  emitFilters();
};

// Réinitialiser les filtres
const resetFilters = () => {
  localFilters.value = {
    type: 'all',
    status: 'all',
    dateRange: 'all',
    myReportsOnly: false
  };
  emitFilters();
};

// Émettre les filtres mis à jour
const emitFilters = () => {
  emit('update:filters', { ...localFilters.value });
};

// Synchroniser avec les props
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);
</script>

<style scoped>
.filter-section {
  margin: 15px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #5a5a5a;
  margin: 0;
}

.reset-button {
  background: none;
  border: none;
  color: var(--ion-color-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.reset-button:active {
  background: #ffe4e9;
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #5a5a5a;
  padding-left: 5px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
  color: #5a5a5a;
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  background: linear-gradient(90deg, #FFB6C1, #DDA0DD);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
}

.chip-icon {
  font-size: 16px;
}

.chip-label {
  white-space: nowrap;
}

/* Style spécial pour "Mes signalements" */
.filter-chip.my-reports.active {
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}
</style>