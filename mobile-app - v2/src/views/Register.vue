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

          <!-- Messages d'état -->
          <ion-text color="danger" v-if="error">
            {{ error }}
          </ion-text>

          <ion-text color="success" v-if="success">
            {{ success }}
          </ion-text>

          <!-- Bouton Inscription -->
          <ion-button
            expand="block"
            class="cute-button register-button"
            @click="register"
            :disabled="isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent" class="button-spinner"></ion-spinner>
            <ion-icon v-else slot="start" :icon="personAddOutline"></ion-icon>
            {{ isLoading ? 'Inscription en cours...' : 'Créer mon compte' }}
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
  IonText,
  IonSpinner,
  alertController,
  loadingController
} from '@ionic/vue';
import {
  arrowBackOutline,
  cameraOutline,
  eyeOutline,
  eyeOffOutline,
  personAddOutline
} from 'ionicons/icons';

// Importez les fonctions Firebase de votre première page
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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
const isLoading = ref(false);
const error = ref('');
const success = ref('');

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
  error.value = '';
  success.value = '';

  if (!fullName.value.trim()) {
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
  const alert = await alertController.create({
    header: 'Photo de profil',
    message: 'Fonctionnalité caméra à implémenter 📸',
    buttons: ['OK']
  });
  await alert.present();
};

// FONCTION D'INSCRIPTION - Même que votre première page
const register = async () => {
  // Réinitialiser les messages
  error.value = '';
  success.value = '';
  
  // Validation du formulaire
  if (!validateForm()) {
    error.value = 'Veuillez corriger les erreurs dans le formulaire';
    return;
  }

  // Vérification des mots de passe
  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas";
    return;
  }

  isLoading.value = true;

  try {
    // Afficher le loading
    const loading = await loadingController.create({
      message: 'Création du compte...',
      spinner: 'crescent'
    });
    await loading.present();

    // 1. Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const user = userCredential.user;

    // 2. Créer le document utilisateur dans Firestore
    await setDoc(doc(db, "users", user.uid), {
      fullName: fullName.value,
      email: user.email,
      phone: phone.value || '',
      profilePicture: profilePicture.value || '',
      createdAt: new Date().toISOString(),
      emailVerified: false,
      role: 'user'
    });

    // 3. Envoyer l'email de vérification
    await sendEmailVerification(user);

    await loading.dismiss();

    // 4. Afficher le message de succès
    success.value = "Compte créé avec succès ! Un email de vérification a été envoyé à votre adresse. Vérifiez votre boîte mail avant de vous connecter.";

    // Optionnel : Redirection après un délai
    setTimeout(() => {
      router.push('/login');
    }, 3000);

  } catch (err: any) {
    isLoading.value = false;
    
    // Gestion des erreurs Firebase
    let errorMessage = 'Erreur lors de l\'inscription';
    
    switch (err.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Cet email est déjà utilisé';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email invalide';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'L\'inscription par email est désactivée';
        break;
      case 'auth/weak-password':
        errorMessage = 'Mot de passe trop faible (minimum 6 caractères)';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Erreur réseau. Vérifiez votre connexion';
        break;
      default:
        errorMessage = err.message || 'Erreur lors de l\'inscription';
    }
    
    error.value = errorMessage;
    
    // Dismiss le loading s'il existe encore
    try {
      await loadingController.dismiss();
    } catch (e) {
      // Ignorer si le loading n'existe pas
    }
  }
};

// Afficher les conditions
const showTerms = async () => {
  const alert = await alertController.create({
    header: 'Conditions d\'utilisation',
    message: 'En créant un compte, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.',
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
  padding: 24px;
  padding-bottom: 40px;
  max-width: 480px;
  margin: 0 auto;
}

.profile-section {
  text-align: center;
  margin: 24px 0 32px;
  animation-delay: 0.1s;
}

.profile-picture-wrapper {
  width: 110px;
  height: 110px;
  margin: 0 auto;
  position: relative;
  cursor: pointer;
}

.profile-placeholder {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--gradient-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px dashed rgba(255, 255, 255, 0.5);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-primary);
}

.profile-placeholder:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
}

.camera-icon {
  font-size: 36px;
  color: white;
  margin-bottom: 4px;
}

.camera-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 4px solid var(--surface);
  box-shadow: var(--shadow-lg);
}

.camera-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--surface);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base);
}

.camera-badge:hover {
  transform: scale(1.1);
}

.camera-badge ion-icon {
  color: white;
  font-size: 16px;
}

.form-card {
  animation-delay: 0.2s;
  max-width: 500px;
  margin: 0 auto;
  background: var(--surface);
  border-radius: var(--radius-2xl);
  padding: 32px 28px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
}

.form-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 28px;
  text-align: center;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-left: 4px;
}

.cute-input {
  --background: var(--gray-50);
  --border-radius: var(--radius-lg);
  --padding-start: 18px;
  --padding-end: 18px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  font-size: 0.938rem;
}

.cute-input:focus-within {
  border-color: var(--primary);
  --background: var(--surface);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.password-icon {
  cursor: pointer;
  color: var(--text-muted);
  font-size: 22px;
  margin-right: 12px;
  transition: color var(--transition-fast);
}

.password-icon:hover {
  color: var(--primary);
}

.password-strength {
  margin-top: 12px;
}

.strength-bar {
  height: 5px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all var(--transition-base);
  border-radius: var(--radius-full);
}

.strength-fill.weak {
  background: var(--danger);
}

.strength-fill.medium {
  background: var(--warning);
}

.strength-fill.good {
  background: var(--info);
}

.strength-fill.strong {
  background: var(--success);
}

.strength-text {
  font-size: 0.75rem;
  margin-top: 6px;
  color: var(--text-muted);
  font-weight: 500;
}

.error-text {
  color: var(--danger);
  font-size: 0.813rem;
  margin-top: 6px;
  padding-left: 4px;
  font-weight: 500;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin: 24px 0;
  gap: 12px;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.link-text {
  color: var(--primary);
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.link-text:hover {
  color: var(--primary-dark);
}

/* Messages d'état */
ion-text[color="danger"],
ion-text[color="success"] {
  display: block;
  margin: 16px 0;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
}

ion-text[color="danger"] {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

ion-text[color="success"] {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.register-button {
  --background: var(--gradient-primary);
  --border-radius: var(--radius-xl);
  --box-shadow: var(--shadow-primary);
  height: 52px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 24px;
  margin-bottom: 16px;
  transition: all var(--transition-base);
}

.register-button:hover:not(:disabled) {
  --box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-spinner {
  color: white;
  width: 22px;
  height: 22px;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.login-link p {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.link-text-bold {
  color: var(--primary);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.link-text-bold:hover {
  color: var(--primary-dark);
}

/* Animation de fond */
.gradient-bg {
  background: var(--gradient-surface);
  min-height: 100vh;
}

/* Responsive */
@media (max-width: 480px) {
  .register-container {
    padding: 16px;
    padding-bottom: 32px;
  }
  
  .profile-picture-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .form-card {
    padding: 24px 20px;
    border-radius: var(--radius-xl);
  }
  
  .form-title {
    font-size: 1.375rem;
  }
  
  .register-button {
    height: 50px;
  }
}
</style>