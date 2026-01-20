<template>
  <ion-page>
    <!-- En-tête -->
    <ion-header :translucent="true">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="arrowBack" />
          </ion-button>
        </ion-buttons>
        <ion-title class="app-title">
          <span class="title-icon">📝</span>
          Nouveau Signalement
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveDraft" v-if="!isSubmitting">
            <ion-icon slot="icon-only" :icon="saveOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Contenu principal - Layout gauche/droite -->
    <ion-content :fullscreen="true" class="report-content">
      <div class="report-container">
        <!-- Colonne gauche : Formulaire -->
        <div class="form-column">
          <form @submit.prevent="submitForm" class="report-form">
            <!-- Type de problème -->
            <div class="form-section">
              <ion-label class="section-label">
                <ion-icon :icon="warningOutline" />
                Type de problème
              </ion-label>
              <div class="type-buttons">
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
            <div class="form-section">
              <ion-label class="section-label">
                <ion-icon :icon="alertCircleOutline" />
                Niveau d'urgence
              </ion-label>
              <div class="urgency-buttons">
                <div class="urgency-grid">
                  <button 
                    v-for="level in urgencyLevels"
                    :key="level.value"
                    @click="selectUrgency(level.value)"
                    type="button"
                    class="urgency-btn"
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

            <!-- Titre -->
            <div class="form-section">
              <ion-label class="section-label">
                <ion-icon :icon="createOutline" />
                Titre du signalement
              </ion-label>
              <ion-input
                v-model="formData.title"
                placeholder="Ex: Nid de poule dangereux sur la route principale"
                class="custom-input"
                required
                fill="solid"
                @ionInput="validateForm"
              ></ion-input>
              <div class="input-hint" v-if="formData.title.length < 3">
                Minimum 3 caractères requis
              </div>
            </div>

            <!-- Description -->
            <div class="form-section">
              <ion-label class="section-label">
                <ion-icon :icon="documentTextOutline" />
                Description détaillée
              </ion-label>
              <ion-textarea
                v-model="formData.description"
                placeholder="Décrivez le problème en détail (localisation précise, taille, dangerosité...)"
                rows="4"
                class="custom-textarea"
                :counter="true"
                maxlength="500"
                required
                fill="solid"
                @ionInput="validateForm"
              ></ion-textarea>
              <div class="input-hint" v-if="formData.description.length < 10">
                Veuillez fournir une description plus détaillée
              </div>
            </div>

            <!-- Position sélectionnée -->
            <div class="form-section">
              <ion-label class="section-label">
                <ion-icon :icon="locationOutline" />
                Position sélectionnée
              </ion-label>
              <div class="position-card" :class="{ 'has-position': formData.position }">
                <div class="position-header">
                  <ion-icon :icon="locationOutline" class="position-icon-large" />
                  <div class="position-info">
                    <div class="position-title">
                      {{ positionText }}
                    </div>
                    <div class="position-coords" v-if="formData.position && formData.position.lat">
                      {{ formData.position.lat.toFixed(6) }}, {{ formData.position.lng.toFixed(6) }}
                    </div>
                  </div>
                </div>
                <div class="position-hint">
                  <ion-icon :icon="informationCircleOutline" />
                  <span>Cliquez sur la carte à droite pour sélectionner la position</span>
                </div>
              </div>
            </div>

            <!-- Boutons d'action -->
            <div class="form-actions">
              <ion-button 
                @click="goBack" 
                fill="outline" 
                class="cancel-btn"
                type="button"
                :disabled="isSubmitting"
              >
                Annuler
              </ion-button>
              <ion-button 
                type="submit" 
                class="submit-btn"
                :disabled="!isFormValid || isSubmitting"
                :class="{ 'disabled': !isFormValid || isSubmitting }"
              >
                <ion-icon :icon="checkmarkOutline" slot="start" />
                {{ isSubmitting ? 'Publication en cours...' : 'Publier le signalement' }}
              </ion-button>
            </div>
          </form>
        </div>

        <!-- Colonne droite : Carte -->
        <div class="map-column">
          <div class="map-container">
            <ReportMap 
              ref="reportMap"
              :selected-position="formData.position"
              @position-selected="updatePosition"
            />
          </div>
          <div class="map-instructions">
            <ion-icon :icon="navigateOutline" />
            <span>Cliquez sur la carte pour sélectionner l'emplacement du problème</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonLabel, IonInput, IonTextarea,
  IonSegment, IonSegmentButton, IonButtons, toastController
} from '@ionic/vue';
import { 
  arrowBack, saveOutline, warningOutline, alertCircleOutline,
  createOutline, documentTextOutline, locationOutline,
  informationCircleOutline, checkmarkOutline, navigateOutline
} from 'ionicons/icons';
import ReportMap from '@/components/ReportMap.vue';
import { useReportStore } from '@/stores/ReportStore';

const router = useRouter();
const route = useRoute();
const reportStore = useReportStore();

// Références
const reportMap = ref(null);

// Données du formulaire
const formData = reactive({
  type: 'danger',
  title: '',
  description: '',
  urgency: 2,
  position: null
});

// États
const isSubmitting = ref(false);
const isFormValid = ref(false);

// Types d'urgence
const urgencyLevels = [
  { value: 1, label: 'Faible', icon: '🟢' },
  { value: 2, label: 'Moyen', icon: '🟡' },
  { value: 3, label: 'Élevé', icon: '🔴' }
];

// Texte de position
const positionText = computed(() => {
  if (!formData.position || !formData.position.lat) {
    return "Cliquez sur la carte pour sélectionner une position";
  }
  return "Position sélectionnée sur la carte";
});

onMounted(() => {
  console.log('ReportPage mounted');
  // Charger un brouillon si existant
  loadDraft();
  // Si on vient d'un clic sur la carte, utiliser cette position
  if (route.query.lat && route.query.lng) {
    formData.position = {
      lat: parseFloat(route.query.lat),
      lng: parseFloat(route.query.lng)
    };
  }
});

// Méthodes
const goBack = () => {
  if (hasUnsavedChanges()) {
    if (confirm('Vous avez des modifications non sauvegardées. Quitter sans sauvegarder ?')) {
      router.back();
    }
  } else {
    router.back();
  }
};

const hasUnsavedChanges = () => {
  return formData.title.trim().length > 0 || 
         formData.description.trim().length > 0 ||
         formData.position !== null;
};

const saveDraft = () => {
  try {
    localStorage.setItem('report_draft', JSON.stringify(formData));
    showNotification('Brouillon sauvegardé');
    console.log('Brouillon sauvegardé:', formData);
  } catch (error) {
    console.error('Erreur sauvegarde brouillon:', error);
  }
};

const loadDraft = () => {
  try {
    const draft = localStorage.getItem('report_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      Object.assign(formData, parsed);
      console.log('Brouillon chargé:', formData);
    }
  } catch (error) {
    console.error('Erreur chargement brouillon:', error);
  }
};

const clearDraft = () => {
  localStorage.removeItem('report_draft');
};

const updatePosition = (position) => {
  console.log('Position mise à jour:', position);
  formData.position = position;
  validateForm();
  
  // Sauvegarder automatiquement en brouillon
  saveDraft();
};

const selectUrgency = (level) => {
  console.log('Urgence sélectionnée:', level);
  formData.urgency = level;
  validateForm();
  saveDraft();
};

const validateForm = () => {
  isFormValid.value = formData.title.trim().length >= 3 && 
                      formData.description.trim().length >= 10 &&
                      formData.position !== null;
  return isFormValid.value;
};

const submitForm = async () => {
  console.log('Soumission du formulaire');
  
  if (!validateForm()) {
    showNotification('Veuillez remplir tous les champs requis', 'danger');
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Préparer le signalement
    const report = {
      id: 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim(),
      urgency: formData.urgency,
      position: formData.position,
      date: new Date().toISOString(),
      status: 'new',
      userId: 'user_' + Math.random().toString(36).substr(2, 9),
      votes: 0,
      comments: [],
      photos: []
    };
    
    console.log('Signalement préparé:', report);
    
    // Sauvegarder dans le store
    await reportStore.addReport(report);
    
    // Sauvegarder dans un fichier JSON (simulé)
    await saveToFile(report);
    
    // Nettoyer le brouillon
    clearDraft();
    
    // Notification
    await showNotification('Signalement publié avec succès !', 'success');
    
    // Retour à l'accueil après un délai
    setTimeout(() => {
      router.push('/home');
    }, 1500);
    
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    showNotification('Erreur lors de la publication du signalement', 'danger');
  } finally {
    isSubmitting.value = false;
  }
};

// Fonction pour sauvegarder dans un fichier
const saveToFile = async (report) => {
  try {
    // Récupérer tous les signalements existants
    let allReports = [];
    const stored = localStorage.getItem('safeRoads_reports_file');
    if (stored) {
      allReports = JSON.parse(stored);
    }
    
    // Ajouter le nouveau signalement
    allReports.push(report);
    
    // Sauvegarder dans localStorage (simulation de fichier)
    localStorage.setItem('safeRoads_reports_file', JSON.stringify(allReports));
    
    // Pour un vrai fichier, on utiliserait l'API File System
    // Mais pour le web, localStorage est la meilleure option
    
    console.log('Signalement sauvegardé dans le fichier');
    
  } catch (error) {
    console.error('Erreur sauvegarde fichier:', error);
    throw error;
  }
};

const showNotification = async (message, color = 'primary') => {
  try {
    const toast = await toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ],
      cssClass: 'custom-toast'
    });
    
    await toast.present();
  } catch (error) {
    console.error('Erreur toast:', error);
  }
};
</script>

<style scoped>
/* En-tête */
.header-toolbar {
  --background: linear-gradient(135deg, #A8D8EA, #AA96DA);
  --color: white;
  padding: 10px 0;
}

.app-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 1.4rem;
}

/* Contenu principal */
.report-content {
  --background: #FFF9F9;
  --padding-top: 0;
  --padding-bottom: 0;
}

.report-container {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 56px);
}

/* Colonne formulaire */
.form-column {
  flex: 1;
  min-width: 0;
  padding: 20px;
  overflow-y: auto;
  background: white;
  border-right: 1px solid rgba(170, 150, 218, 0.2);
}

/* Colonne carte */
.map-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 400px;
}

.map-instructions {
  padding: 15px 20px;
  background: rgba(168, 216, 234, 0.1);
  border-top: 1px solid rgba(170, 150, 218, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  color: #5D5D5D;
}

.map-instructions ion-icon {
  color: #A8D8EA;
  font-size: 20px;
}

/* Formulaire */
.report-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
  max-width: 600px;
  margin: 0 auto;
}

.form-section {
  animation: fadeInUp 0.4s ease-out;
  animation-fill-mode: both;
}

.form-section:nth-child(1) { animation-delay: 0.1s; }
.form-section:nth-child(2) { animation-delay: 0.2s; }
.form-section:nth-child(3) { animation-delay: 0.3s; }
.form-section:nth-child(4) { animation-delay: 0.4s; }
.form-section:nth-child(5) { animation-delay: 0.5s; }

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

.section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: #5D5D5D;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.section-label ion-icon {
  color: #AA96DA;
}

/* Type de problème */
.type-buttons {
  background: #FFF9F9;
  border-radius: 12px;
  padding: 10px;
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
  gap: 8px;
  padding: 10px 5px;
}

.segment-icon {
  font-size: 22px;
}

.segment-label {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
}

/* Urgence */
.urgency-buttons {
  background: #FFF9F9;
  border-radius: 12px;
  padding: 10px;
  border: 2px solid rgba(170, 150, 218, 0.2);
}

.urgency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.urgency-btn {
  background: white;
  border: 2px solid rgba(170, 150, 218, 0.3);
  border-radius: 10px;
  padding: 15px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
}

.urgency-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.urgency-btn.active.level-1 {
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.1), rgba(181, 234, 215, 0.3));
  border-color: #06D6A0;
  color: #06D6A0;
  box-shadow: 0 4px 12px rgba(6, 214, 160, 0.2);
}

.urgency-btn.active.level-2 {
  background: linear-gradient(135deg, rgba(255, 158, 109, 0.1), rgba(255, 213, 182, 0.3));
  border-color: #FF9E6D;
  color: #FF9E6D;
  box-shadow: 0 4px 12px rgba(255, 158, 109, 0.2);
}

.urgency-btn.active.level-3 {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 170, 165, 0.3));
  border-color: #FF6B6B;
  color: #FF6B6B;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.urgency-icon {
  font-size: 26px;
}

.urgency-text {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Inputs */
.custom-input, .custom-textarea {
  --background: #FFF9F9;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  font-family: 'Poppins', sans-serif;
  border: 2px solid rgba(170, 150, 218, 0.2);
  margin-top: 0;
  transition: all 0.3s ease;
}

.custom-input::part(native) {
  font-size: 1rem;
}

.custom-textarea::part(native) {
  min-height: 120px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.custom-input:focus-within,
.custom-textarea:focus-within {
  border-color: #AA96DA;
  box-shadow: 0 4px 12px rgba(170, 150, 218, 0.15);
}

.input-hint {
  font-size: 0.85rem;
  color: #FF6B6B;
  margin-top: 8px;
  font-family: 'Poppins', sans-serif;
  padding-left: 5px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Position */
.position-card {
  background: #FFF9F9;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid rgba(168, 216, 234, 0.3);
  transition: all 0.3s ease;
}

.position-card.has-position {
  border-color: #A8D8EA;
  background: linear-gradient(135deg, rgba(168, 216, 234, 0.05), rgba(170, 150, 218, 0.05));
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
  transition: all 0.3s ease;
}

.position-card.has-position .position-icon-large {
  background: linear-gradient(135deg, #A8D8EA, #AA96DA);
  color: white;
  transform: scale(1.05);
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
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  padding-top: 25px;
  border-top: 1px solid rgba(170, 150, 218, 0.2);
  animation: fadeInUp 0.6s ease-out;
  animation-delay: 0.6s;
  animation-fill-mode: both;
}

.cancel-btn {
  flex: 1;
  --color: #6C757D;
  --border-color: rgba(170, 150, 218, 0.3);
  --border-radius: 12px;
  font-weight: 500;
  height: 50px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  --border-color: rgba(170, 150, 218, 0.6);
  --color: #5D5D5D;
  transform: translateY(-2px);
}

.submit-btn {
  flex: 2;
  --background: linear-gradient(135deg, #AA96DA, #A8D8EA);
  --border-radius: 12px;
  --padding-start: 24px;
  --padding-end: 24px;
  font-weight: 600;
  height: 50px;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(170, 150, 218, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(170, 150, 218, 0.4);
  --background: linear-gradient(135deg, #9d86d7, #97cae3);
}

.submit-btn.disabled {
  --background: #E0E0E0;
  --color: #9E9E9E;
  box-shadow: none;
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 992px) {
  .report-container {
    flex-direction: column;
  }
  
  .form-column {
    border-right: none;
    border-bottom: 1px solid rgba(170, 150, 218, 0.2);
  }
  
  .map-container {
    min-height: 300px;
  }
  
  .urgency-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .form-column {
    padding: 15px;
  }
  
  .urgency-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .submit-btn {
    width: 100%;
    flex: none;
  }
  
  .section-label {
    font-size: 1rem;
  }
}
</style>