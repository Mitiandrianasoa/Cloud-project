<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Nouveau Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="gradient-bg">
      <div class="report-container">
        <!-- Position sélectionnée -->
        <div class="location-card soft-card fade-in">
          <div class="location-header">
            <ion-icon :icon="locationOutline" class="location-icon"></ion-icon>
            <h3>Position du signalement</h3>
          </div>
          <div class="location-coords">
            <span class="coord-label">Lat:</span>
            <span class="coord-value">{{ selectedLocation?.lat.toFixed(6) || 'N/A' }}</span>
            <span class="coord-label">Lng:</span>
            <span class="coord-value">{{ selectedLocation?.lng.toFixed(6) || 'N/A' }}</span>
          </div>
        </div>

        <!-- Formulaire complet -->
        <div class="form-card soft-card fade-in">
          <h2 class="form-title">Détails du signalement 📝</h2>

          <!-- Type de problème -->
          <div class="form-section">
            <label class="section-label">Type de problème *</label>
            <div class="type-grid">
              <button
                v-for="type in problemTypes"
                :key="type.value"
                class="type-btn"
                :class="{ active: formData.type === type.value, [type.value]: true }"
                @click="formData.type = type.value"
              >
                <span class="type-emoji">{{ type.icon }}</span>
                <span class="type-text">{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- Niveau d'urgence -->
          <div class="form-section">
            <label class="section-label">Niveau d'urgence *</label>
            <div class="urgency-grid">
              <button
                v-for="level in urgencyLevels"
                :key="level.value"
                class="urgency-btn"
                :class="{ active: formData.urgency === level.value }"
                @click="formData.urgency = level.value"
              >
                <div class="urgency-circle" :style="{ background: level.color }">
                  {{ level.value }}
                </div>
                <span class="urgency-text">{{ level.label }}</span>
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="form-section">
            <label class="section-label">Description *</label>
            <ion-textarea
              v-model="formData.description"
              placeholder="Décrivez le problème en détail... (ex: Fuite d'eau importante sur le trottoir)"
              :rows="4"
              class="cute-textarea"
              :counter="true"
              :maxlength="500"
            ></ion-textarea>
          </div>

          <!-- Photos -->
          <div class="form-section">
            <label class="section-label">Photos (optionnel - max 3)</label>
            <div class="photos-grid">
              <div
                v-for="(photo, index) in formData.photos"
                :key="index"
                class="photo-item"
              >
                <img :src="photo" alt="Photo" />
                <button class="remove-btn" @click="removePhoto(index)">
                  <ion-icon :icon="closeCircleOutline"></ion-icon>
                </button>
              </div>
              <button
                v-if="formData.photos.length < 3"
                class="add-photo-btn"
                @click="addPhoto"
              >
                <ion-icon :icon="cameraOutline"></ion-icon>
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          <!-- Contact (optionnel) -->
          <div class="form-section">
            <label class="section-label">Contact (optionnel)</label>
            <ion-input
              v-model="formData.contact"
              type="tel"
              placeholder="Votre numéro de téléphone"
              class="cute-input"
            ></ion-input>
          </div>

          <!-- Messages d'état -->
          <ion-text color="danger" v-if="error" class="error-message">
            {{ error }}
          </ion-text>

          <ion-text color="success" v-if="success" class="success-message">
            {{ success }}
          </ion-text>

          <!-- Boutons d'action -->
          <div class="action-buttons">
            <ion-button
              expand="block"
              fill="outline"
              class="cancel-button"
              @click="goBack"
            >
              Annuler
            </ion-button>
            <ion-button
              expand="block"
              class="submit-button"
              @click="submitReport"
              :disabled="isLoading"
            >
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
              <ion-icon v-else slot="start" :icon="sendOutline"></ion-icon>
              {{ isLoading ? 'Envoi...' : 'Envoyer' }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonTextarea,
  IonInput,
  IonIcon,
  IonText,
  IonSpinner,
  toastController,
  loadingController
} from '@ionic/vue';
import {
  arrowBackOutline,
  locationOutline,
  cameraOutline,
  closeCircleOutline,
  sendOutline
} from 'ionicons/icons';

const router = useRouter();
const route = useRoute();

// Position sélectionnée depuis la carte
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);

// État
const isLoading = ref(false);
const error = ref('');
const success = ref('');

// Types de problèmes
const problemTypes = [
  { value: 'urgent', icon: '🚨', label: 'Urgence' },
  { value: 'anomaly', icon: '⚠️', label: 'Anomalie' },
  { value: 'info', icon: 'ℹ️', label: 'Information' }
];

// Niveaux d'urgence
const urgencyLevels = [
  { value: 1, label: 'Faible', color: '#98D8C8' },
  { value: 2, label: 'Moyen', color: '#FFD8A8' },
  { value: 3, label: 'Élevé', color: '#FFB3BA' }
];

// Données du formulaire
const formData = ref({
  type: '',
  urgency: null as number | null,
  description: '',
  photos: [] as string[],
  contact: ''
});

// Récupérer la position depuis les query params
onMounted(() => {
  const lat = route.query.lat;
  const lng = route.query.lng;
  
  if (lat && lng) {
    selectedLocation.value = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };
  }
});

// Ajouter une photo
const addPhoto = async () => {
  // TODO: Implémenter Capacitor Camera
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

// Validation du formulaire
const validateForm = (): boolean => {
  error.value = '';
  
  if (!formData.value.type) {
    error.value = 'Veuillez sélectionner un type de problème';
    return false;
  }
  if (!formData.value.urgency) {
    error.value = 'Veuillez sélectionner un niveau d\'urgence';
    return false;
  }
  if (!formData.value.description.trim()) {
    error.value = 'Veuillez ajouter une description';
    return false;
  }
  if (!selectedLocation.value) {
    error.value = 'Position non disponible';
    return false;
  }
  
  return true;
};

// Soumettre le signalement
const submitReport = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  error.value = '';

  try {
    const loading = await loadingController.create({
      message: 'Envoi du signalement...',
      spinner: 'crescent'
    });
    await loading.present();

    // Préparer les données
    const reportData = {
      ...formData.value,
      location: selectedLocation.value,
      date: new Date(),
      status: 'pending'
    };

    // TODO: Envoyer à Firebase
    console.log('Signalement à envoyer:', reportData);

    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1500));

    await loading.dismiss();
    
    success.value = 'Signalement envoyé avec succès ! 🎉';
    
    const toast = await toastController.create({
      message: 'Signalement enregistré ! 📝',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    // Redirection vers la carte après 1.5s
    setTimeout(() => {
      router.push('/map');
    }, 1500);

  } catch (err: any) {
    error.value = 'Erreur lors de l\'envoi du signalement';
    console.error(err);
    
    try {
      await loadingController.dismiss();
    } catch (e) {}
  } finally {
    isLoading.value = false;
  }
};

// Navigation
const goBack = () => {
  router.push('/map');
};
</script>

<style scoped>
.report-container {
  padding: 16px;
  padding-bottom: 40px;
}

/* Location Card */
.location-card {
  margin-bottom: 20px;
  animation-delay: 0.1s;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.location-icon {
  font-size: 28px;
  color: var(--ion-color-primary);
}

.location-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #5a5a5a;
}

.location-coords {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 12px;
}

.coord-label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.coord-value {
  font-size: 14px;
  color: #5a5a5a;
  font-family: monospace;
  margin-right: 16px;
}

/* Form Card */
.form-card {
  animation-delay: 0.2s;
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  color: #5a5a5a;
  margin-bottom: 24px;
  text-align: center;
}

.form-section {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #5a5a5a;
  margin-bottom: 12px;
}

/* Type Grid */
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.type-btn {
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

.type-btn:active {
  transform: scale(0.95);
}

.type-btn.active {
  border-color: transparent;
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.type-btn.active.urgent {
  background: linear-gradient(135deg, #FFB3BA, #FF8A9A);
  color: white;
}

.type-btn.active.anomaly {
  background: linear-gradient(135deg, #FFD8A8, #FFBE7A);
  color: white;
}

.type-btn.active.info {
  background: linear-gradient(135deg, #B0E0E6, #87CEEB);
  color: white;
}

.type-emoji {
  font-size: 32px;
}

.type-text {
  font-size: 12px;
  font-weight: 600;
}

/* Urgency Grid */
.urgency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.urgency-btn {
  background: white;
  border: 2px solid #ffe4e9;
  border-radius: 16px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.urgency-btn:active {
  transform: scale(0.95);
}

.urgency-btn.active {
  border-color: var(--ion-color-primary);
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.urgency-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.urgency-text {
  font-size: 12px;
  color: #5a5a5a;
  font-weight: 600;
}

/* Textarea */
.cute-textarea {
  --background: white;
  --border-radius: 16px;
  --padding-start: 16px;
  --padding-top: 16px;
  border: 2px solid #ffe4e9;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.cute-textarea:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.1);
}

/* Input */
.cute-input {
  --background: white;
  --border-radius: 16px;
  --padding-start: 16px;
  --padding-end: 16px;
  border: 2px solid #ffe4e9;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.cute-input:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.1);
}

/* Photos Grid */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #ffe4e9;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.remove-btn:active {
  transform: scale(0.9);
}

.remove-btn ion-icon {
  font-size: 22px;
  color: #FFB3BA;
}

.add-photo-btn {
  aspect-ratio: 1;
  border-radius: 16px;
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

.add-photo-btn:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #FFE4E9, #FFD8E4);
}

.add-photo-btn ion-icon {
  font-size: 36px;
  color: #FFB6C1;
}

.add-photo-btn span {
  font-size: 12px;
  color: #FFB6C1;
  font-weight: 600;
}

/* Messages */
.error-message,
.success-message {
  display: block;
  margin: 16px 0;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  font-size: 14px;
}

ion-text[color="danger"] {
  background-color: #FFEBEE;
  border: 1px solid #FFCDD2;
}

ion-text[color="success"] {
  background-color: #E8F5E9;
  border: 1px solid #C8E6C9;
}

/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button {
  --border-radius: 25px;
  --border-color: #FFB6C1;
  --color: #FFB6C1;
  height: 50px;
  font-weight: 600;
}

.submit-button {
  --background: linear-gradient(90deg, #DDA0DD, #FFB6C1);
  --border-radius: 25px;
  --box-shadow: 0 4px 15px rgba(221, 160, 221, 0.3);
  height: 50px;
  font-weight: 600;
}

.submit-button:disabled {
  opacity: 0.6;
}

/* Background */
.gradient-bg {
  background: linear-gradient(135deg, #FFF0F5 0%, #F8F0FF 100%);
  min-height: 100vh;
}

/* Soft Card */
.soft-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(255, 182, 193, 0.15);
}

/* Fade In Animation */
.fade-in {
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 400px) {
  .type-grid,
  .urgency-grid,
  .photos-grid {
    gap: 8px;
  }
  
  .type-btn,
  .urgency-btn {
    padding: 12px 6px;
  }
  
  .type-emoji {
    font-size: 28px;
  }
  
  .urgency-circle {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
