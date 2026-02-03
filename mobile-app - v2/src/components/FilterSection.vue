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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Filters {
  type: string;
  status: string;
  dateRange: string;
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
    localFilters.value.dateRange !== 'all'
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
    dateRange: 'all'
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
  margin: 16px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.filter-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.reset-button {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.813rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.reset-button:hover {
  background: rgba(99, 102, 241, 0.1);
}

.reset-button:active {
  background: rgba(99, 102, 241, 0.15);
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-label {
  font-size: 0.813rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding-left: 4px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-chip {
  background: var(--gray-50);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-full);
  padding: 8px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: 0.813rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-chip:hover {
  border-color: var(--border-default);
  background: var(--surface);
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  background: var(--gradient-primary);
  border-color: transparent;
  color: white;
  box-shadow: var(--shadow-primary);
}

.chip-icon {
  font-size: 1rem;
}

.chip-label {
  white-space: nowrap;
}
</style>