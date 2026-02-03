<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal" class="report-modal">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closeModal" class="close-btn">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Nouveau signalement</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="submitReport" :strong="true" class="submit-btn">
            <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
            Envoyer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-gradient-bg">
      <div class="modal-content">
        <!-- Type de problème -->
        <div class="form-section fade-in-section">
          <div class="section-header">
            <div class="section-icon type-icon">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
            </div>
            <h3 class="section-title">Type de problème</h3>
          </div>
          <div class="type-buttons">
            <button
              v-for="type in problemTypes"
              :key="type.value"
              class="type-button"
              :class="{ active: formData.type === type.value, [type.value]: true }"
              @click="selectType(type.value)"
            >
              <span class="type-icon-emoji">{{ type.icon }}</span>
              <span class="type-label">{{ type.label }}</span>
              <div class="type-check" v-if="formData.type === type.value">
                <ion-icon :icon="checkmarkOutline"></ion-icon>
              </div>
            </button>
          </div>
        </div>

        <!-- Niveau d'urgence -->
        <div class="form-section fade-in-section">
          <div class="section-header">
            <div class="section-icon urgency-icon">
              <ion-icon :icon="flashOutline"></ion-icon>
            </div>
            <h3 class="section-title">Niveau d'urgence</h3>
          </div>
          <div class="urgency-levels">
            <button
              v-for="level in urgencyLevels"
              :key="level.value"
              class="urgency-button"
              :class="{ active: formData.urgency === level.value }"
              @click="selectUrgency(level.value)"
            >
              <div class="urgency-number" :style="{ background: level.gradient }">
                {{ level.value }}
              </div>
              <span class="urgency-label">{{ level.label }}</span>
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="form-section fade-in-section">
          <div class="section-header">
            <div class="section-icon desc-icon">
              <ion-icon :icon="createOutline"></ion-icon>
            </div>
            <h3 class="section-title">Description</h3>
          </div>
          <div class="textarea-wrapper">
            <ion-textarea
              v-model="formData.description"
              placeholder="Décrivez le problème en détail... (ex: Nid de poule profond, virage dangereux, signalisation manquante...)"
              :rows="4"
              class="modern-textarea"
              :counter="true"
              :maxlength="500"
            ></ion-textarea>
          </div>
        </div>

        <!-- Photos -->
        <div class="form-section fade-in-section">
          <div class="section-header">
            <div class="section-icon photo-icon">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
            <h3 class="section-title">Photos <span class="optional-tag">(optionnel)</span></h3>
          </div>
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
              @click="showPhotoOptions"
            >
              <div class="add-photo-icon">
                <ion-icon :icon="cameraOutline"></ion-icon>
              </div>
              <span>Ajouter une photo</span>
              <span class="photo-count">{{ formData.photos.length }}/3</span>
            </button>
          </div>
        </div>

        <!-- Position -->
        <div class="form-section fade-in-section">
          <div class="section-header">
            <div class="section-icon location-icon">
              <ion-icon :icon="locationOutline"></ion-icon>
            </div>
            <h3 class="section-title">Position</h3>
          </div>
          <div class="location-options">
            <button
              class="location-button"
              :class="{ active: formData.useCurrentLocation }"
              @click="useCurrentLocation"
            >
              <ion-icon :icon="locateOutline"></ion-icon>
              <span>Position sélectionnée</span>
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
            <div class="location-pin">
              <ion-icon :icon="locationOutline"></ion-icon>
            </div>
            <div class="location-info">
              <span class="location-label">Coordonnées</span>
              <span class="location-coords">{{ formatLocation(formData.location) }}</span>
            </div>
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
  toastController,
  actionSheetController
} from '@ionic/vue';
import {
  closeCircleOutline,
  cameraOutline,
  locateOutline,
  navigateOutline,
  locationOutline,
  closeOutline,
  checkmarkOutline,
  alertCircleOutline,
  flashOutline,
  createOutline,
  imageOutline
} from 'ionicons/icons';

// Capacitor Camera
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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

// Niveaux d'urgence avec gradients
const urgencyLevels = [
  { value: 1, label: 'Faible', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  { value: 2, label: 'Moyen', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { value: 3, label: 'Élevé', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' }
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

// Photo options avec action sheet
const showPhotoOptions = async () => {
  const actionSheet = await actionSheetController.create({
    header: 'Ajouter une photo',
    buttons: [
      {
        text: 'Prendre une photo',
        icon: cameraOutline,
        handler: () => {
          takePhoto(CameraSource.Camera);
        }
      },
      {
        text: 'Choisir depuis la galerie',
        icon: imageOutline,
        handler: () => {
          takePhoto(CameraSource.Photos);
        }
      },
      {
        text: 'Annuler',
        role: 'cancel'
      }
    ]
  });
  await actionSheet.present();
};

// Prendre/sélectionner une photo avec Capacitor Camera
const takePhoto = async (source: CameraSource) => {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source,
      width: 800,
      height: 800
    });

    if (photo.dataUrl) {
      formData.value.photos.push(photo.dataUrl);
      const toast = await toastController.create({
        message: 'Photo ajoutée avec succès 📸',
        duration: 1500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }
  } catch (error: any) {
    // User cancelled ou permission denied
    if (error.message !== 'User cancelled photos app') {
      console.error('Camera error:', error);
      // Fallback avec placeholder pour dev/web
      const placeholderPhoto = `https://via.placeholder.com/400x400/6366f1/ffffff?text=Photo+${formData.value.photos.length + 1}`;
      formData.value.photos.push(placeholderPhoto);
      
      const toast = await toastController.create({
        message: 'Photo ajoutée (mode simulation) 📸',
        duration: 1500,
        color: 'tertiary',
        position: 'top'
      });
      await toast.present();
    }
  }
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
/* Modal Styles */
.report-modal {
  --border-radius: 24px 24px 0 0;
}

.report-modal ion-toolbar {
  --background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  --color: white;
  --min-height: 60px;
}

.report-modal ion-title {
  font-weight: 700;
  font-size: 17px;
}

.close-btn {
  --color: white;
  font-size: 24px;
}

.submit-btn {
  --color: white;
  font-weight: 600;
  font-size: 14px;
}

.modal-gradient-bg {
  --background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #f0fdfa 100%);
}

.modal-content {
  padding: 20px;
  padding-bottom: 40px;
}

.form-section {
  margin-bottom: 28px;
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}

.form-section:nth-child(1) { animation-delay: 0.1s; }
.form-section:nth-child(2) { animation-delay: 0.15s; }
.form-section:nth-child(3) { animation-delay: 0.2s; }
.form-section:nth-child(4) { animation-delay: 0.25s; }
.form-section:nth-child(5) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.section-icon.type-icon {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  color: #ef4444;
}

.section-icon.urgency-icon {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  color: #f59e0b;
}

.section-icon.desc-icon {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05));
  color: #6366f1;
}

.section-icon.photo-icon {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));
  color: #8b5cf6;
}

.section-icon.location-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  color: #10b981;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.optional-tag {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

/* Type Buttons */
.type-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.type-button {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.type-button:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.type-button.active {
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.type-button.active.urgent {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border-color: #ef4444;
}

.type-button.active.anomaly {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  border-color: #f59e0b;
}

.type-button.active.info {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
  border-color: #06b6d4;
}

.type-icon-emoji {
  font-size: 36px;
  line-height: 1;
}

.type-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.type-button.active .type-label {
  color: #1e293b;
}

.type-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.type-check ion-icon {
  font-size: 14px;
  color: white;
}

/* Urgency Buttons */
.urgency-levels {
  display: flex;
  gap: 12px;
}

.urgency-button {
  flex: 1;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.urgency-button:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.urgency-button.active {
  border-color: var(--ion-color-primary, #6366f1);
  transform: scale(1.03);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
}

.urgency-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.urgency-button.active .urgency-number {
  transform: scale(1.1);
}

.urgency-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.urgency-button.active .urgency-label {
  color: #1e293b;
}

/* Textarea */
.textarea-wrapper {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.textarea-wrapper:focus-within {
  border-color: var(--ion-color-primary, #6366f1);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.modern-textarea {
  --background: transparent;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-size: 15px;
  line-height: 1.6;
}

.modern-textarea::part(native) {
  background: transparent;
}

/* Photos Container */
.photos-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.remove-photo:hover {
  transform: scale(1.1);
  background: white;
}

.remove-photo ion-icon {
  font-size: 22px;
  color: #ef4444;
}

.add-photo-button {
  aspect-ratio: 1;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-photo-button:hover {
  border-color: var(--ion-color-primary, #6366f1);
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  transform: scale(1.02);
}

.add-photo-button:active {
  transform: scale(0.98);
}

.add-photo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-photo-icon ion-icon {
  font-size: 22px;
  color: white;
}

.add-photo-button span {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.photo-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* Location Options */
.location-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.location-button {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-button:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.location-button.active {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.location-button ion-icon {
  font-size: 28px;
  color: #64748b;
}

.location-button.active ion-icon {
  color: #10b981;
}

.location-button span {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-align: center;
}

.location-button.active span {
  color: #1e293b;
}

.location-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
}

.location-pin {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-pin ion-icon {
  font-size: 22px;
  color: #10b981;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.location-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.location-coords {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}

/* Responsive */
@media (max-width: 380px) {
  .type-buttons {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .type-button {
    flex-direction: row;
    padding: 14px 16px;
    justify-content: flex-start;
  }
  
  .type-icon-emoji {
    font-size: 28px;
  }
  
  .urgency-levels {
    flex-direction: column;
    gap: 10px;
  }
  
  .urgency-button {
    flex-direction: row;
    justify-content: flex-start;
    padding: 14px 16px;
    gap: 14px;
  }
  
  .urgency-number {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .photos-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>