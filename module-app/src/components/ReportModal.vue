<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closeModal">Annuler</ion-button>
        </ion-buttons>
        <ion-title>Signaler un problème</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="submitReport" :strong="true">
            Envoyer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="gradient-bg">
      <div class="modal-content">
        <!-- Type de problème -->
        <div class="form-section">
          <h3 class="section-title">Type de problème</h3>
          <div class="type-buttons">
            <button
              v-for="type in problemTypes"
              :key="type.value"
              class="type-button"
              :class="{ active: formData.type === type.value }"
              @click="selectType(type.value)"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <span class="type-label">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- Niveau d'urgence -->
        <div class="form-section" v-if="formData.type">
          <h3 class="section-title">Niveau d'urgence</h3>
          <div class="urgency-levels">
            <button
              v-for="level in urgencyLevels"
              :key="level.value"
              class="urgency-button"
              :class="{ active: formData.urgency === level.value }"
              @click="selectUrgency(level.value)"
            >
              <div class="urgency-number" :style="{ background: level.color }">
                {{ level.value }}
              </div>
              <span class="urgency-label">{{ level.label }}</span>
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="form-section" v-if="formData.urgency">
          <h3 class="section-title">Description</h3>
          <ion-textarea
            v-model="formData.description"
            placeholder="Décrivez le problème en détail..."
            :rows="4"
            class="cute-textarea"
            :counter="true"
            :maxlength="500"
          ></ion-textarea>
        </div>

        <!-- Photos -->
        <div class="form-section" v-if="formData.description">
          <h3 class="section-title">Photos (max 3)</h3>
          <div class="photos-container">
            <div
              v-for="(photo, index) in formData.photos"
              :key="index"
              class="photo-preview"
            >
              <img :src="photo" alt="Photo" />
              <button class="remove-photo" @click="removePhoto(index)">
                <ion-icon :icon="closeCircleOutline"></ion-icon>
              </button>
            </div>
            <button
              v-if="formData.photos.length < 3"
              class="add-photo-button"
              @click="addPhoto"
            >
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        <!-- Position -->
        <div class="form-section" v-if="formData.description">
          <h3 class="section-title">Position</h3>
          <div class="location-options">
            <button
              class="location-button"
              :class="{ active: formData.useCurrentLocation }"
              @click="useCurrentLocation"
            >
              <ion-icon :icon="locateOutline"></ion-icon>
              <span>Position actuelle</span>
            </button>
            <button
              class="location-button"
              :class="{ active: !formData.useCurrentLocation }"
              @click="selectManualLocation"
            >
              <ion-icon :icon="navigateOutline"></ion-icon>
              <span>Choisir sur la carte</span>
            </button>
          </div>
          <div v-if="formData.location" class="location-preview">
            <ion-icon :icon="locationOutline"></ion-icon>
            <span>{{ formatLocation(formData.location) }}</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonTextarea,
  IonIcon,
  toastController
} from '@ionic/vue';
import {
  closeCircleOutline,
  cameraOutline,
  locateOutline,
  navigateOutline,
  locationOutline
} from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  userLocation: { lat: number; lng: number } | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'submit']);

// Types de problèmes
const problemTypes = [
  { value: 'urgent', icon: '🚨', label: 'Urgence' },
  { value: 'anomaly', icon: '⚠️', label: 'Anomalie' },
  { value: 'info', icon: 'ℹ️', label: 'Information' }
];

// Niveaux d'urgence
const urgencyLevels = [
  { value: 1, label: 'Faible', color: '#B0E0E6' },
  { value: 2, label: 'Moyen', color: '#FFD8A8' },
  { value: 3, label: 'Élevé', color: '#FFB3BA' }
];

// Données du formulaire
const formData = ref({
  type: '',
  urgency: null as number | null,
  description: '',
  photos: [] as string[],
  location: null as { lat: number; lng: number } | null,
  useCurrentLocation: true
});

// Sélectionner le type
const selectType = (type: string) => {
  formData.value.type = type;
};

// Sélectionner l'urgence
const selectUrgency = (level: number) => {
  formData.value.urgency = level;
};

// Ajouter une photo
const addPhoto = async () => {
  // TODO: Implémenter Capacitor Camera
  console.log('Ajouter une photo');
  
  // Simulation avec placeholder
  const placeholderPhoto = `https://via.placeholder.com/300/FFB6C1/ffffff?text=Photo+${formData.value.photos.length + 1}`;
  formData.value.photos.push(placeholderPhoto);
  
  const toast = await toastController.create({
    message: 'Photo ajoutée (simulation) 📸',
    duration: 1500,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();
};

// Retirer une photo
const removePhoto = (index: number) => {
  formData.value.photos.splice(index, 1);
};

// Utiliser la position actuelle
const useCurrentLocation = () => {
  formData.value.useCurrentLocation = true;
  if (props.userLocation) {
    formData.value.location = { ...props.userLocation };
  }
};

// Sélectionner manuellement
const selectManualLocation = async () => {
  formData.value.useCurrentLocation = false;
  
  // TODO: Permettre de sélectionner sur la carte
  const toast = await toastController.create({
    message: 'Sélection manuelle - À implémenter 🗺️',
    duration: 2000,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();
};

// Formater la position
const formatLocation = (location: { lat: number; lng: number }): string => {
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
};

// Soumettre le signalement
const submitReport = async () => {
  // Validation
  if (!formData.value.type) {
    showError('Veuillez sélectionner un type de problème');
    return;
  }
  if (!formData.value.urgency) {
    showError('Veuillez sélectionner un niveau d\'urgence');
    return;
  }
  if (!formData.value.description) {
    showError('Veuillez ajouter une description');
    return;
  }
  if (!formData.value.location && formData.value.useCurrentLocation) {
    formData.value.location = props.userLocation;
  }
  if (!formData.value.location) {
    showError('Position non disponible');
    return;
  }

  // Émettre l'événement
  emit('submit', { ...formData.value });
  
  // Réinitialiser le formulaire
  resetForm();
};

// Afficher une erreur
const showError = async (message: string) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color: 'warning',
    position: 'top'
  });
  await toast.present();
};

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    type: '',
    urgency: null,
    description: '',
    photos: [],
    location: null,
    useCurrentLocation: true
  };
};

// Fermer le modal
const closeModal = () => {
  resetForm();
  emit('close');
};

// Initialiser la position quand le modal s'ouvre
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.userLocation) {
    formData.value.location = { ...props.userLocation };
  }
});
</script>

<style scoped>
.modal-content {
  padding: 20px;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #5a5a5a;
  margin-bottom: 15px;
}

.type-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.type-button {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 15px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-button.active {
  border-color: var(--ion-color-primary);
  background: linear-gradient(135deg, #FFB6C1, #DDA0DD);
  color: white;
}

.type-icon {
  font-size: 32px;
}

.type-label {
  font-size: 13px;
  font-weight: 600;
}

.urgency-levels {
  display: flex;
  gap: 12px;
}

.urgency-button {
  flex: 1;
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 15px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.urgency-button.active {
  border-color: var(--ion-color-primary);
  transform: scale(1.05);
}

.urgency-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.urgency-label {
  font-size: 12px;
  color: #5a5a5a;
  font-weight: 600;
}

.cute-textarea {
  --background: white;
  --border-radius: 15px;
  --padding-start: 15px;
  --padding-top: 15px;
  border: 2px solid #ffe4e9;
  transition: all 0.3s ease;
}

.cute-textarea:focus-within {
  border-color: var(--ion-color-primary);
}

.photos-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #ffe4e9;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.remove-photo ion-icon {
  font-size: 20px;
  color: #FFB3BA;
}

.add-photo-button {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px dashed #FFB6C1;
  background: #FFF5F7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-photo-button:active {
  transform: scale(0.95);
}

.add-photo-button ion-icon {
  font-size: 32px;
  color: #FFB6C1;
}

.add-photo-button span {
  font-size: 12px;
  color: #FFB6C1;
  font-weight: 600;
}

.location-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 15px;
}

.location-button {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 15px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-button.active {
  border-color: var(--ion-color-primary);
  background: linear-gradient(135deg, #B0E0E6, #98D8C8);
  color: white;
}

.location-button ion-icon {
  font-size: 28px;
}

.location-button span {
  font-size: 12px;
  font-weight: 600;
}

.location-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 12px;
  font-size: 13px;
  color: #5a5a5a;
}

.location-preview ion-icon {
  font-size: 20px;
  color: var(--ion-color-primary);
}
</style>