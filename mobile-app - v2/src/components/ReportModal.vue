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
        <!-- Position sélectionnée (si cliquée sur la carte) -->
        <div v-if="clickedLocation" class="location-card">
          <div class="location-header">
            <ion-icon :icon="locationOutline" class="location-card-icon"></ion-icon>
            <div class="location-info">
              <span class="location-label">Position sélectionnée</span>
              <span class="location-coords">{{ formatLocation(clickedLocation) }}</span>
            </div>
          </div>
        </div>

        <!-- Type de problème -->
        <div class="form-section">
          <h3 class="section-title">Type de problème *</h3>
          <div class="type-buttons">
            <button
              v-for="type in problemTypes"
              :key="type.value"
              class="type-button"
              :class="{ active: formData.type === type.value, [type.value]: true }"
              @click="selectType(type.value)"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <span class="type-label">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- Niveau d'urgence -->
        <div class="form-section">
          <h3 class="section-title">Niveau d'urgence *</h3>
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
        <div class="form-section">
          <h3 class="section-title">Description *</h3>
          <ion-textarea
            v-model="formData.description"
            placeholder="Décrivez le problème en détail... (ex: Fuite d'eau sur le trottoir)"
            :rows="4"
            class="cute-textarea"
            :counter="true"
            :maxlength="500"
          ></ion-textarea>
        </div>

        <!-- Photo -->
        <div class="form-section">
          <h3 class="section-title">Photo (optionnel)</h3>
          <div class="photos-container">
            <div
              v-if="formData.photo"
              class="photo-preview"
            >
              <img :src="formData.photo" alt="Photo" />
              <button class="remove-photo" @click="removePhoto">
                <ion-icon :icon="closeCircleOutline"></ion-icon>
              </button>
            </div>
            <button
              v-else
              class="add-photo-button"
              @click="takePhoto"
            >
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>Prendre une photo</span>
            </button>
          </div>
        </div>

        <!-- Interface Webcam (pour navigateur) -->
        <div v-if="showWebcam" class="webcam-overlay">
          <div class="webcam-container">
            <div class="webcam-header">
              <h3>Prendre une photo</h3>
              <button class="webcam-close" @click="closeWebcam">
                <ion-icon :icon="closeCircleOutline"></ion-icon>
              </button>
            </div>
            <video ref="videoRef" autoplay playsinline class="webcam-video"></video>
            <canvas ref="canvasRef" style="display: none;"></canvas>
            <div class="webcam-controls">
              <button class="capture-btn" @click="captureFromWebcam">
                <ion-icon :icon="cameraOutline"></ion-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Position (si pas de position cliquée) -->
        <div class="form-section" v-if="!clickedLocation">
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
              <span>Sur la carte</span>
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
  toastController,
  actionSheetController
} from '@ionic/vue';
import {
  closeCircleOutline,
  cameraOutline,
  locateOutline,
  navigateOutline,
  locationOutline,
  imageOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface Props {
  isOpen: boolean;
  userLocation: { lat: number; lng: number } | null;
  clickedLocation?: { lat: number; lng: number } | null;
}

const props = withDefaults(defineProps<Props>(), {
  clickedLocation: null
});
const emit = defineEmits(['close', 'submit']);

// Refs pour la webcam
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showWebcam = ref(false);
let mediaStream: MediaStream | null = null;

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
  photo: '' as string,
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

// Prendre une photo avec la caméra
const takePhoto = async () => {
  try {
    // Détecter si on est sur mobile ou navigateur
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Afficher un ActionSheet pour choisir la source
    const actionSheet = await actionSheetController.create({
      header: 'Ajouter une photo',
      buttons: [
        {
          text: 'Prendre une photo',
          icon: cameraOutline,
          handler: () => {
            if (isMobile) {
              // Sur mobile, utiliser Capacitor Camera
              capturePhoto(CameraSource.Camera);
            } else {
              // Sur navigateur, utiliser la webcam
              openWebcam();
            }
          }
        },
        {
          text: 'Choisir de la galerie',
          icon: imageOutline,
          handler: () => {
            capturePhoto(CameraSource.Photos);
          }
        },
        {
          text: 'Annuler',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  } catch (error) {
    console.error('Erreur ActionSheet:', error);
  }
};

// Ouvrir la webcam (pour navigateur)
const openWebcam = async () => {
  try {
    showWebcam.value = true;
    
    // Attendre que le DOM soit mis à jour
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (videoRef.value) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Caméra arrière sur mobile
          width: { ideal: 800 },
          height: { ideal: 800 }
        },
        audio: false
      });
      videoRef.value.srcObject = mediaStream;
    }
  } catch (error: any) {
    console.error('Erreur webcam:', error);
    showWebcam.value = false;
    
    const toast = await toastController.create({
      message: 'Impossible d\'accéder à la caméra. Vérifiez les permissions. 📷',
      duration: 3000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
  }
};

// Fermer la webcam
const closeWebcam = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  showWebcam.value = false;
};

// Capturer depuis la webcam
const captureFromWebcam = async () => {
  if (videoRef.value && canvasRef.value) {
    const video = videoRef.value;
    const canvas = canvasRef.value;
    
    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      // Convertir en base64
      formData.value.photo = canvas.toDataURL('image/jpeg', 0.8);
      
      const toast = await toastController.create({
        message: 'Photo capturée ! 📸',
        duration: 1500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }
  }
  
  closeWebcam();
};

// Capturer la photo depuis la source choisie
const capturePhoto = async (source: CameraSource) => {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source,
      width: 800,
      height: 800,
      // Important: désactiver l'input file pour utiliser la vraie caméra sur le web
      webUseInput: source === CameraSource.Photos,
      promptLabelHeader: 'Photo',
      promptLabelPhoto: 'Prendre une photo',
      promptLabelPicture: 'Choisir de la galerie',
      promptLabelCancel: 'Annuler'
    });

    if (image.base64String) {
      // Convertir en data URL pour l'affichage
      formData.value.photo = `data:image/${image.format};base64,${image.base64String}`;
      
      const toast = await toastController.create({
        message: 'Photo ajoutée ! 📸',
        duration: 1500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    }
  } catch (error: any) {
    console.error('Erreur caméra:', error);
    
    // Ne pas afficher d'erreur si l'utilisateur a annulé
    if (error.message !== 'User cancelled photos app') {
      const toast = await toastController.create({
        message: 'Impossible d\'accéder à la caméra 📷',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    }
  }
};

// Retirer la photo
const removePhoto = () => {
  formData.value.photo = '';
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
    photo: '',
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
  if (isOpen) {
    // Priorité à la position cliquée, sinon position de l'utilisateur
    if (props.clickedLocation) {
      formData.value.location = { ...props.clickedLocation };
      formData.value.useCurrentLocation = false;
    } else if (props.userLocation) {
      formData.value.location = { ...props.userLocation };
      formData.value.useCurrentLocation = true;
    }
  }
});
</script>

<style scoped>
.modal-content {
  padding: 20px;
  padding-bottom: 40px;
}

/* Location Card */
.location-card {
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  border: 2px solid #A5D6A7;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-card-icon {
  font-size: 32px;
  color: #4CAF50;
}

.location-info {
  display: flex;
  flex-direction: column;
}

.location-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.location-coords {
  font-size: 14px;
  color: #2E7D32;
  font-weight: 600;
  font-family: monospace;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #5a5a5a;
  margin-bottom: 12px;
}

.type-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.type-button {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 16px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-button:active {
  transform: scale(0.95);
}

.type-button.active {
  border-color: transparent;
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.type-button.active.urgent {
  background: linear-gradient(135deg, #FFB3BA, #FF8A9A);
  color: white;
}

.type-button.active.anomaly {
  background: linear-gradient(135deg, #FFD8A8, #FFBE7A);
  color: white;
}

.type-button.active.info {
  background: linear-gradient(135deg, #B0E0E6, #87CEEB);
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.urgency-button {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 16px;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.urgency-button:active {
  transform: scale(0.95);
}

.urgency-button.active {
  border-color: var(--ion-color-primary);
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.urgency-number {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.urgency-label {
  font-size: 12px;
  color: #5a5a5a;
  font-weight: 600;
}

.cute-textarea {
  --background: white;
  --border-radius: 16px;
  --padding-start: 16px;
  --padding-top: 14px;
  border: 2px solid #ffe4e9;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.cute-textarea:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.1);
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
  border-radius: 14px;
  border: 2px dashed #FFB6C1;
  background: linear-gradient(135deg, #FFF5F7, #FFF0F5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-photo-button:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #FFE4E9, #FFD8E4);
}

.add-photo-button ion-icon {
  font-size: 32px;
  color: #FFB6C1;
}

.add-photo-button span {
  font-size: 11px;
  color: #FFB6C1;
  font-weight: 600;
}

.location-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.location-button {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 14px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-button:active {
  transform: scale(0.95);
}

.location-button.active {
  border-color: transparent;
  background: linear-gradient(135deg, #B0E0E6, #98D8C8);
  color: white;
  box-shadow: 0 4px 12px rgba(152, 216, 200, 0.3);
}

.location-button ion-icon {
  font-size: 26px;
}

.location-button span {
  font-size: 11px;
  font-weight: 600;
}

.location-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f8f9fa;
  border: 2px solid #ffe4e9;
  border-radius: 12px;
  font-size: 13px;
  color: #5a5a5a;
  font-family: monospace;
}

.location-preview ion-icon {
  font-size: 20px;
  color: var(--ion-color-primary);
}

/* Responsive */
@media (max-width: 380px) {
  .type-buttons,
  .urgency-levels {
    gap: 8px;
  }
  
  .type-button,
  .urgency-button {
    padding: 12px 6px;
  }
  
  .type-icon {
    font-size: 28px;
  }
  
  .urgency-number {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
}

/* Webcam Overlay */
.webcam-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.webcam-container {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.webcam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #FFB6C1, #DDA0DD);
}

.webcam-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.webcam-close {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.webcam-close:hover {
  background: rgba(255, 255, 255, 0.5);
}

.webcam-close ion-icon {
  font-size: 24px;
  color: white;
}

.webcam-video {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  display: block;
  background: #000;
}

.webcam-controls {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: #f8f9fa;
}

.capture-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFB6C1, #FF8A9A);
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(255, 138, 154, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.capture-btn:hover {
  transform: scale(1.05);
}

.capture-btn:active {
  transform: scale(0.95);
}

.capture-btn ion-icon {
  font-size: 32px;
  color: white;
}
</style>