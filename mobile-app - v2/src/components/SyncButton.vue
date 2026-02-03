<template>
  <div class="sync-button-container">
    <button
      class="sync-button"
      :class="{ syncing: isSyncing }"
      @click="handleSync"
      :disabled="isSyncing"
    >
      <ion-icon
        :icon="isSyncing ? hourglassOutline : syncOutline"
        :class="{ spinning: isSyncing }"
      ></ion-icon>
      <span class="sync-text">
        {{ isSyncing ? 'Synchronisation...' : 'Synchroniser' }}
      </span>
    </button>
    
    <div v-if="lastSyncTime" class="last-sync">
      Dernière sync: {{ formatSyncTime(lastSyncTime) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonIcon, toastController } from '@ionic/vue';
import { syncOutline, hourglassOutline } from 'ionicons/icons';

interface Props {
  onSync?: () => Promise<void>;
}

const props = defineProps<Props>();

const isSyncing = ref(false);
const lastSyncTime = ref<Date | null>(null);

// Gérer la synchronisation
const handleSync = async () => {
  if (isSyncing.value) return;

  isSyncing.value = true;

  try {
    // Si une fonction de sync est fournie, l'utiliser
    if (props.onSync) {
      await props.onSync();
    } else {
      // Sinon, simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    lastSyncTime.value = new Date();

    const toast = await toastController.create({
      message: 'Synchronisation réussie ! ✅',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  } catch (error) {
    const toast = await toastController.create({
      message: 'Erreur de synchronisation ❌',
      duration: 2000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  } finally {
    isSyncing.value = false;
  }
};

// Formater le temps de la dernière sync
const formatSyncTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'à l\'instant';
  if (diffMins < 60) return `il y a ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.sync-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sync-button {
  background: linear-gradient(90deg, #B0E0E6, #98D8C8);
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(176, 224, 230, 0.3);
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.sync-button:not(:disabled):active {
  transform: scale(0.95);
}

.sync-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sync-button.syncing {
  background: linear-gradient(90deg, #DDA0DD, #FFB6C1);
}

.sync-button ion-icon {
  font-size: 20px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.last-sync {
  font-size: 11px;
  color: #999;
  text-align: center;
}
</style>