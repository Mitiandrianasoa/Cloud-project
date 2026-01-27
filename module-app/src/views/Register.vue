<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Inscription</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="gradient-bg">
      <div class="register-container">
        <!-- Photo de profil -->
        <div class="profile-section fade-in">
          <div class="profile-picture-wrapper" @click="takePicture">
            <div v-if="!profilePicture" class="profile-placeholder">
              <ion-icon :icon="cameraOutline" class="camera-icon"></ion-icon>
              <p class="camera-text">Ajouter une photo</p>
            </div>
            <img v-else :src="profilePicture" class="profile-image" alt="Profile" />
            <div class="camera-badge">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Formulaire d'inscription -->
        <div class="form-card soft-card fade-in">
          <h2 class="form-title">Créer un compte 🌟</h2>

          <!-- Nom complet -->
          <div class="input-group">
            <label class="input-label">Nom complet</label>
            <ion-input
              v-model="fullName"
              type="text"
              placeholder="Jean Dupont"
              class="cute-input"
              :clear-input="true"
            ></ion-input>
            <p v-if="errors.fullName" class="error-text">{{ errors.fullName }}</p>
          </div>

          <!-- Email -->
          <div class="input-group">
            <label class="input-label">Email</label>
            <ion-input
              v-model="email"
              type="email"
              placeholder="jean.dupont@exemple.com"
              class="cute-input"
              :clear-input="true"
              @ionBlur="validateEmail"
            ></ion-input>
            <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
          </div>

          <!-- Téléphone -->
          <div class="input-group">
            <label class="input-label">Téléphone (optionnel)</label>
            <ion-input
              v-model="phone"
              type="tel"
              placeholder="+261 XX XX XXX XX"
              class="cute-input"
              :clear-input="true"
            ></ion-input>
          </div>

          <!-- Mot de passe -->
          <div class="input-group">
            <label class="input-label">Mot de passe</label>
            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Min. 6 caractères"
              class="cute-input"
              @ionBlur="validatePassword"
            >
              <ion-icon
                slot="end"
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                @click="togglePassword"
                class="password-icon"
              ></ion-icon>
            </ion-input>
            <div class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :style="{ width: passwordStrength + '%' }"
                  :class="passwordStrengthClass"
                ></div>
              </div>
              <p class="strength-text">{{ passwordStrengthText }}</p>
            </div>
            <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
          </div>

          <!-- Confirmation mot de passe -->
          <div class="input-group">
            <label class="input-label">Confirmer le mot de passe</label>
            <ion-input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Répéter le mot de passe"
              class="cute-input"
              @ionBlur="validateConfirmPassword"
            >
              <ion-icon
                slot="end"
                :icon="showConfirmPassword ? eyeOffOutline : eyeOutline"
                @click="toggleConfirmPassword"
                class="password-icon"
              ></ion-icon>
            </ion-input>
            <p v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</p>
          </div>

          <!-- Conditions d'utilisation -->
          <div class="checkbox-group">
            <ion-checkbox v-model="acceptTerms"></ion-checkbox>
            <label class="checkbox-label">
              J'accepte les
              <a @click="showTerms" class="link-text">conditions d'utilisation</a>
            </label>
          </div>
          <p v-if="errors.terms" class="error-text">{{ errors.terms }}</p>

          <!-- Bouton Inscription -->
          <ion-button
            expand="block"
            class="cute-button register-button"
            @click="register"
          >
            <ion-icon slot="start" :icon="personAddOutline"></ion-icon>
            Créer mon compte
          </ion-button>

          <!-- Lien vers connexion -->
          <div class="login-link">
            <p>Déjà un compte ?</p>
            <a @click="goToLogin" class="link-text-bold">Se connecter</a>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonCheckbox,
  toastController,
  alertController
} from '@ionic/vue';
import {
  arrowBackOutline,
  cameraOutline,
  eyeOutline,
  eyeOffOutline,
  personAddOutline
} from 'ionicons/icons';

const router = useRouter();

// État du formulaire
const fullName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const profilePicture = ref('');
const acceptTerms = ref(false);

const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Erreurs de validation
const errors = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: ''
});

// Toggle mot de passe
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// Force du mot de passe
const passwordStrength = computed(() => {
  const pass = password.value;
  let strength = 0;
  
  if (pass.length >= 6) strength += 25;
  if (pass.length >= 8) strength += 25;
  if (/[A-Z]/.test(pass)) strength += 25;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength += 25;
  
  return strength;
});

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value <= 25) return 'weak';
  if (passwordStrength.value <= 50) return 'medium';
  if (passwordStrength.value <= 75) return 'good';
  return 'strong';
});

const passwordStrengthText = computed(() => {
  if (password.value.length === 0) return '';
  if (passwordStrength.value <= 25) return 'Faible';
  if (passwordStrength.value <= 50) return 'Moyen';
  if (passwordStrength.value <= 75) return 'Bon';
  return 'Fort';
});

// Validation
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    errors.value.email = 'Email requis';
  } else if (!emailRegex.test(email.value)) {
    errors.value.email = 'Email invalide';
  } else {
    errors.value.email = '';
  }
};

const validatePassword = () => {
  if (!password.value) {
    errors.value.password = 'Mot de passe requis';
  } else if (password.value.length < 6) {
    errors.value.password = 'Minimum 6 caractères';
  } else {
    errors.value.password = '';
  }
};

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Confirmation requise';
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Les mots de passe ne correspondent pas';
  } else {
    errors.value.confirmPassword = '';
  }
};

const validateForm = () => {
  let isValid = true;

  if (!fullName.value) {
    errors.value.fullName = 'Nom complet requis';
    isValid = false;
  } else {
    errors.value.fullName = '';
  }

  validateEmail();
  if (errors.value.email) isValid = false;

  validatePassword();
  if (errors.value.password) isValid = false;

  validateConfirmPassword();
  if (errors.value.confirmPassword) isValid = false;

  if (!acceptTerms.value) {
    errors.value.terms = 'Veuillez accepter les conditions';
    isValid = false;
  } else {
    errors.value.terms = '';
  }

  return isValid;
};

// Prendre une photo
const takePicture = async () => {
  // TODO: Implémenter Capacitor Camera
  console.log('Prendre une photo');
  
  const toast = await toastController.create({
    message: 'Fonctionnalité caméra à implémenter 📸',
    duration: 2000,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();
};

// Inscription
const register = async () => {
  if (!validateForm()) {
    const toast = await toastController.create({
      message: 'Veuillez corriger les erreurs 📝',
      duration: 2000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
    return;
  }

  // TODO: Implémenter l'inscription Firebase
  console.log('Inscription:', {
    fullName: fullName.value,
    email: email.value,
    phone: phone.value,
    profilePicture: profilePicture.value
  });

  const toast = await toastController.create({
    message: 'Compte créé avec succès ! 🎉',
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  await toast.present();

  router.push('/map');
};

// Afficher les conditions
const showTerms = async () => {
  const alert = await alertController.create({
    header: 'Conditions d\'utilisation',
    message: 'Ici seront affichées les conditions d\'utilisation de l\'application.',
    buttons: ['OK']
  });
  await alert.present();
};

// Navigation
const goBack = () => {
  router.back();
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  padding: 20px;
  padding-bottom: 40px;
}

.profile-section {
  text-align: center;
  margin: 20px 0 30px;
  animation-delay: 0.1s;
}

.profile-picture-wrapper {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  position: relative;
  cursor: pointer;
}

.profile-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE4E9, #FFB6C1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px dashed #FFB6C1;
  transition: all 0.3s ease;
}

.profile-placeholder:hover {
  transform: scale(1.05);
  border-color: #DDA0DD;
}

.camera-icon {
  font-size: 40px;
  color: white;
  margin-bottom: 5px;
}

.camera-text {
  font-size: 12px;
  color: white;
  margin: 0;
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #FFB6C1;
}

.camera-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFB6C1, #DDA0DD);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.camera-badge ion-icon {
  color: white;
  font-size: 18px;
}

.form-card {
  animation-delay: 0.2s;
  max-width: 500px;
  margin: 0 auto;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #5a5a5a;
  margin-bottom: 25px;
  text-align: center;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #5a5a5a;
  margin-bottom: 8px;
  padding-left: 5px;
}

.cute-input {
  --background: #ffffff;
  --border-radius: 15px;
  --padding-start: 20px;
  --padding-end: 20px;
  border: 2px solid #ffe4e9;
  transition: all 0.3s ease;
}

.cute-input:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.1);
}

.password-icon {
  cursor: pointer;
  color: #999;
  font-size: 20px;
  margin-right: 10px;
}

.password-strength {
  margin-top: 10px;
}

.strength-bar {
  height: 4px;
  background: #ffe4e9;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #FFB3BA;
}

.strength-fill.medium {
  background: #FFD8A8;
}

.strength-fill.good {
  background: #B0E0E6;
}

.strength-fill.strong {
  background: #98D8C8;
}

.strength-text {
  font-size: 12px;
  margin-top: 5px;
  color: #999;
}

.error-text {
  color: #FFB3BA;
  font-size: 12px;
  margin-top: 5px;
  padding-left: 5px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.checkbox-label {
  font-size: 14px;
  color: #5a5a5a;
  margin-left: 10px;
}

.link-text {
  color: var(--ion-color-primary);
  text-decoration: none;
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.register-button {
  --background: linear-gradient(90deg, #DDA0DD, #B0E0E6);
  --border-radius: 30px;
  --box-shadow: 0 4px 15px rgba(221, 160, 221, 0.3);
  height: 50px;
  font-weight: 600;
  font-size: 16px;
  margin-top: 20px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link p {
  color: #999;
  font-size: 14px;
  margin-bottom: 5px;
}

.link-text-bold {
  color: var(--ion-color-secondary);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.link-text-bold:hover {
  text-decoration: underline;
}
</style>