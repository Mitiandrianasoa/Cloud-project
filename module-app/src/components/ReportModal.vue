<template>
  <ion-modal 
    :is-open="isOpen" 
    @didDismiss="closeModal"
    class="report-modal-horizontal"
    :presenting-element="presentingElement"
  >
    <ion-header>
      <ion-toolbar class="modal-header">
        <ion-title class="modal-title">
          <span class="modal-icon">🚨</span>
          Nouveau Signalement
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal" class="close-btn">
            <ion-icon :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content-horizontal">
      <div class="form-container-horizontal">
        <!-- Formulaire en ligne -->
        <form @submit.prevent="submitForm" class="report-form-horizontal">
          <!-- Première ligne : Type + Urgence -->
          <div class="form-row">
            <!-- Type de problème -->
            <div class="form-column">
              <ion-label class="section-label">Type de problème</ion-label>
              <div class="type-buttons-horizontal">
                <ion-segment v-model="formData.type" scrollable class="type-segment">
                  <ion-segment-button value="danger">
                    <div class="segment-content">
                      <div class="segment-icon">⚠️</div>
                      <div class="segment-label">Danger</div>
                    </div>
                  </ion-segment-button>
                  <ion-segment-button value="obstacle">
                    <div class="segment-content">
                      <div class="segment-icon">🚧</div>
                      <div class="segment-label">Obstacle</div>
                    </div>
                  </ion-segment-button>
                  <ion-segment-button value="damage">
                    <div class="segment-content">
                      <div class="segment-icon">🛠️</div>
                      <div class="segment-label">Dégât</div>
                    </div>
                  </ion-segment-button>
                  <ion-segment-button value="other">
                    <div class="segment-content">
                      <div class="segment-icon">📝</div>
                      <div class="segment-label">Autre</div>
                    </div>
                  </ion-segment-button>
                </ion-segment>
              </div>
            </div>

            <!-- Niveau d'urgence -->
            <div class="form-column">
              <ion-label class="section-label">Niveau d'urgence</ion-label>
              <div class="urgency-buttons-horizontal">
                <div class="urgency-grid">
                  <button 
                    v-for="level in urgencyLevels"
                    :key="level.value"
                    @click="selectUrgency(level.value)"
                    type="button"
                    class="urgency-btn-horizontal"
                    :class="{ 
                      active: formData.urgency === level.value,
                      [`level-${level.value}`]: true 
                    }"
                  >
                    <span class="urgency-icon">{{ level.icon }}</span>
                    <span class="urgency-text">{{ level.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Deuxième ligne : Titre -->
          <div class="form-row">
            <div class="form-column-full">
              <ion-label class="section-label">Titre du signalement</ion-label>
              <ion-input
                v-model="formData.title"
                placeholder="Ex: Nid de poule dangereux sur la route principale"
                class="custom-input-horizontal"
                required
                fill="solid"
              ></ion-input>
            </div>
          </div>

          <!-- Troisième ligne : Description -->
          <div class="form-row">
            <div class="form-column-full">
              <ion-label class="section-label">Description détaillée</ion-label>
              <ion-textarea
                v-model="formData.description"
                placeholder="Décrivez le problème en détail (localisation précise, taille, dangerosité...)"
                rows="3"
                class="custom-textarea-horizontal"
                :counter="true"
                maxlength="500"
                required
                fill="solid"
              ></ion-textarea>
            </div>
          </div>

          <!-- Quatrième ligne : Position -->
          <div class="form-row">
            <div class="form-column-full">
              <ion-label class="section-label">Position</ion-label>
              <div class="position-card">
                <div class="position-header">
                  <ion-icon :icon="locationOutline" class="position-icon-large" />
                  <div class="position-info">
                    <div class="position-title">
                      {{ positionText }}
                    </div>
                    <div class="position-coords" v-if="position && position.lat">
                      {{ position.lat.toFixed(6) }}, {{ position.lng.toFixed(6) }}
                    </div>
                  </div>
                </div>
                <div class="position-hint">
                  <ion-icon :icon="informationCircleOutline" />
                  <span>Cliquez sur la carte pour changer la position</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div class="form-actions-horizontal">
            <ion-button 
              @click="closeModal" 
              fill="outline" 
              class="cancel-btn-horizontal"
              type="button"
            >
              Annuler
            </ion-button>
            <ion-button 
              type="submit" 
              class="submit-btn-horizontal"
              :disabled="!isFormValid"
            >
              <ion-icon :icon="checkmarkOutline" slot="start" />
              Publier le signalement
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonLabel, IonInput, IonTextarea,
  IonSegment, IonSegmentButton, IonButtons
} from '@ionic/vue';
import { 
  closeOutline, locationOutline, informationCircleOutline,
  checkmarkOutline 
} from 'ionicons/icons';

const emit = defineEmits(['close', 'submit']);

const props = defineProps({
  isOpen: Boolean,
  position: Object,
  presentingElement: {
    type: Object,
    default: null
  }
});

// Types de problèmes
const problemTypes = [
  { value: 'danger', label: 'Danger', icon: '⚠️' },
  { value: 'obstacle', label: 'Obstacle', icon: '🚧' },
  { value: 'damage', label: 'Dégât', icon: '🛠️' },
  { value: 'other', label: 'Autre', icon: '📝' }
];

// Niveaux d'urgence
const urgencyLevels = [
  { value: 1, label: 'Faible', icon: '🟢' },
  { value: 2, label: 'Moyen', icon: '🟡' },
  { value: 3, label: 'Élevé', icon: '🔴' }
];

// Données du formulaire
const formData = reactive({
  type: 'danger',
  title: '',
  description: '',
  urgency: 2,
  position: null
});

// Position calculée (avec valeur par défaut)
const position = computed(() => {
  return props.position || { lat: -18.8792, lng: 47.5079 }; // Antananarivo par défaut
});

// Texte de position
const positionText = computed(() => {
  if (!position.value || !position.value.lat) {
    return "Cliquez sur la carte pour sélectionner une position";
  }
  return "Position sélectionnée sur la carte";
});

// Validation du formulaire
const isFormValid = computed(() => {
  return formData.title.trim().length > 2 && 
         formData.description.trim().length > 5;
});

// Initialiser la position
watch(() => props.position, (newPosition) => {
  if (newPosition) {
    formData.position = newPosition;
  }
}, { immediate: true });

// Méthodes
const closeModal = () => {
  console.log('Fermeture modal');
  resetForm();
  emit('close');
};

const selectUrgency = (level) => {
  console.log('Urgence sélectionnée:', level);
  formData.urgency = level;
};

const submitForm = () => {
  console.log('Tentative d\'envoi du formulaire');
  
  if (!isFormValid.value) {
    console.log('Formulaire non valide');
    return;
  }
  
  // Préparer le signalement
  const report = {
    id: 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: formData.type,
    title: formData.title.trim(),
    description: formData.description.trim(),
    urgency: formData.urgency,
    position: formData.position || position.value,
    date: new Date().toISOString(),
    status: 'new',
    userId: 'user_' + Math.random().toString(36).substr(2, 9)
  };
  
  console.log('Signalement préparé:', report);
  emit('submit', report);
  resetForm();
};

const resetForm = () => {
  formData.type = 'danger';
  formData.title = '';
  formData.description = '';
  formData.urgency = 2;
  formData.position = position.value;
};
</script>

<style scoped>
/* Modal horizontal centré */
.report-modal-horizontal {
  --width: 90%;
  --max-width: 800px;
  --height: auto;
  --max-height: 90vh;
  --border-radius: 20px;
  --box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  --background: #FFF9F9;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* En-tête modal */
.modal-header {
  --background: linear-gradient(135deg, #A8D8EA, #AA96DA);
  --color: white;
  border-radius: 20px 20px 0 0;
  padding: 10px 0;
}

.modal-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icon {
  font-size: 1.4rem;
}

.close-btn {
  --background: rgba(255, 255, 255, 0.2);
  --border-radius: 50%;
  --padding-start: 8px;
  --padding-end: 8px;
  backdrop-filter: blur(10px);
}

/* Contenu modal */
.modal-content-horizontal {
  --background: #FFF9F9;
  --padding-top: 0;
  --padding-bottom: 20px;
}

.form-container-horizontal {
  padding: 20px;
  max-width: 100%;
}

.report-form-horizontal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Layout des lignes */
.form-row {
  display: flex;
  gap: 24px;
  width: 100%;
}

.form-column {
  flex: 1;
  min-width: 0;
}

.form-column-full {
  flex: 1 0 100%;
}

/* Labels */
.section-label {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: #5D5D5D;
  font-size: 1rem;
  margin-bottom: 12px;
}

/* Type de problème */
.type-buttons-horizontal {
  background: white;
  border-radius: 12px;
  padding: 8px;
  border: 2px solid rgba(170, 150, 218, 0.2);
}

.type-segment {
  --background: transparent;
}

.type-segment::part(indicator) {
  background: linear-gradient(135deg, #AA96DA, #A8D8EA);
  border-radius: 10px;
}

.segment-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
}

.segment-icon {
  font-size: 20px;
}

.segment-label {
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Urgence */
.urgency-buttons-horizontal {
  background: white;
  border-radius: 12px;
  padding: 8px;
  border: 2px solid rgba(170, 150, 218, 0.2);
}

.urgency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.urgency-btn-horizontal {
  background: #FFF9F9;
  border: 2px solid rgba(170, 150, 218, 0.3);
  border-radius: 10px;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-family: 'Poppins', sans-serif;
  min-height: 80px;
  justify-content: center;
}

.urgency-btn-horizontal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.urgency-btn-horizontal.active.level-1 {
  background: rgba(181, 234, 215, 0.3);
  border-color: #B5EAD7;
  color: #06D6A0;
}

.urgency-btn-horizontal.active.level-2 {
  background: rgba(255, 213, 182, 0.3);
  border-color: #FFD3B6;
  color: #FF9E6D;
}

.urgency-btn-horizontal.active.level-3 {
  background: rgba(255, 170, 165, 0.3);
  border-color: #FFAAA5;
  color: #FF6B6B;
}

.urgency-icon {
  font-size: 24px;
}

.urgency-text {
  font-size: 0.85rem;
  font-weight: 500;
}

/* Inputs */
.custom-input-horizontal, .custom-textarea-horizontal {
  --background: white;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  font-family: 'Poppins', sans-serif;
  border: 2px solid rgba(170, 150, 218, 0.2);
  margin-top: 0;
}

.custom-input-horizontal::part(native) {
  font-size: 1rem;
}

.custom-textarea-horizontal::part(native) {
  min-height: 100px;
  font-size: 0.95rem;
}

/* Position */
.position-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid rgba(168, 216, 234, 0.3);
  margin-top: 0;
}

.position-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.position-icon-large {
  font-size: 32px;
  color: #A8D8EA;
  background: rgba(168, 216, 234, 0.2);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.position-info {
  flex: 1;
  min-width: 0;
}

.position-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: #5D5D5D;
  margin-bottom: 6px;
  font-size: 1rem;
  word-wrap: break-word;
}

.position-coords {
  font-family: 'Poppins', sans-serif;
  color: #6C757D;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  background: rgba(168, 216, 234, 0.1);
  padding: 6px 10px;
  border-radius: 8px;
  display: inline-block;
}

.position-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 213, 182, 0.1);
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  color: #FF9E6D;
  border: 1px solid rgba(255, 213, 182, 0.3);
}

.position-hint ion-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* Actions */
.form-actions-horizontal {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  padding-top: 24px;
  border-top: 1px solid rgba(170, 150, 218, 0.2);
}

.cancel-btn-horizontal {
  flex: 1;
  --color: #6C757D;
  --border-color: rgba(170, 150, 218, 0.3);
  --border-radius: 12px;
  font-weight: 500;
  height: 48px;
  font-size: 1rem;
}

.submit-btn-horizontal {
  flex: 2;
  --background: linear-gradient(135deg, #AA96DA, #A8D8EA);
  --border-radius: 12px;
  --padding-start: 24px;
  --padding-end: 24px;
  font-weight: 600;
  height: 48px;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(170, 150, 218, 0.3);
  transition: all 0.2s ease;
}

.submit-btn-horizontal:disabled {
  --background: #E0E0E0;
  --color: #9E9E9E;
  box-shadow: none;
  opacity: 0.5;
}

.submit-btn-horizontal:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(170, 150, 218, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .report-modal-horizontal {
    --width: 95%;
    --max-width: 95%;
    --max-height: 85vh;
  }
  
  .form-row {
    flex-direction: column;
    gap: 20px;
  }
  
  .urgency-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions-horizontal {
    flex-direction: column;
  }
  
  .cancel-btn-horizontal,
  .submit-btn-horizontal {
    width: 100%;
  }
}
</style>