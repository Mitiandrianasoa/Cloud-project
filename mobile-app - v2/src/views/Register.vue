<template>
  <ion-page>
    <ion-content :fullscreen="true" class="register-gradient-bg">
      <div class="register-container">
        <!-- Header avec retour -->
        <div class="register-header">
          <ion-button fill="clear" class="back-btn" @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </div>

        <!-- Photo de profil -->
        <div class="profile-section fade-in">
          <div class="profile-picture-wrapper" @click="takePicture">
            <div v-if="!profilePicture" class="profile-placeholder">
              <ion-icon :icon="cameraOutline" class="camera-icon"></ion-icon>
              <p class="camera-text">Ajouter</p>
            </div>
            <img v-else :src="profilePicture" class="profile-image" alt="Profile" />
            <div class="camera-badge">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Formulaire d'inscription -->
        <div class="form-card fade-in-up">
          <h2 class="form-title">Créer un compte</h2>
          <p class="form-subtitle">Rejoignez la communauté SafeRoads 🌟</p>

          <!-- Nom complet -->
          <div class="input-group-modern">
            <label class="input-label-modern">Nom complet</label>
            <div class="input-wrapper">
              <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="fullName"
                type="text"
                placeholder="Jean Dupont"
                class="modern-input input-with-icon"
                :clear-input="true"
              ></ion-input>
            </div>
            <p v-if="errors.fullName" class="error-text">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              {{ errors.fullName }}
            </p>
          </div>

          <!-- Email -->
          <div class="input-group-modern">
            <label class="input-label-modern">Email</label>
            <div class="input-wrapper">
              <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                class="modern-input input-with-icon"
                :clear-input="true"
                @ionBlur="validateEmail"
              ></ion-input>
            </div>
            <p v-if="errors.email" class="error-text">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              {{ errors.email }}
            </p>
          </div>

          <!-- Téléphone -->
          <div class="input-group-modern">
            <label class="input-label-modern">Téléphone <span class="optional-tag">(optionnel)</span></label>
            <div class="input-wrapper">
              <ion-icon :icon="callOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="phone"
                type="tel"
                placeholder="+261 XX XX XXX XX"
                class="modern-input input-with-icon"
                :clear-input="true"
              ></ion-input>
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="input-group-modern">
            <label class="input-label-modern">Mot de passe</label>
            <div class="input-wrapper">
              <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Min. 6 caractères"
                class="modern-input input-with-icon"
                @ionBlur="validatePassword"
              ></ion-input>
              <ion-icon
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                @click="togglePassword"
                class="password-toggle-icon"
              ></ion-icon>
            </div>
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
            <p v-if="errors.password" class="error-text">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              {{ errors.password }}
            </p>
          </div>

          <!-- Confirmation mot de passe -->
          <div class="input-group-modern">
            <label class="input-label-modern">Confirmer le mot de passe</label>
            <div class="input-wrapper">
              <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Répéter le mot de passe"
                class="modern-input input-with-icon"
                @ionBlur="validateConfirmPassword"
              ></ion-input>
              <ion-icon
                :icon="showConfirmPassword ? eyeOffOutline : eyeOutline"
                @click="toggleConfirmPassword"
                class="password-toggle-icon"
              ></ion-icon>
            </div>
            <p v-if="errors.confirmPassword" class="error-text">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              {{ errors.confirmPassword }}
            </p>
          </div>

          <!-- Conditions d'utilisation -->
          <div class="terms-wrapper">
            <ion-checkbox v-model="acceptTerms" class="modern-checkbox"></ion-checkbox>
            <label class="terms-label">
              J'accepte les
              <a @click="showTerms" class="terms-link">conditions d'utilisation</a>
            </label>
          </div>
          <p v-if="errors.terms" class="error-text terms-error">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            {{ errors.terms }}
          </p>

          <!-- Messages d'état -->
          <div v-if="error" class="message-box error-box fade-in">
            <ion-icon :icon="closeCircleOutline"></ion-icon>
            <span>{{ error }}</span>
          </div>

          <div v-if="success" class="message-box success-box fade-in">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            <span>{{ success }}</span>
          </div>

          <!-- Bouton Inscription -->
          <ion-button
            expand="block"
            class="register-btn"
            @click="register"
            :disabled="isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent" class="btn-spinner"></ion-spinner>
            <ion-icon v-else slot="start" :icon="personAddOutline"></ion-icon>
            {{ isLoading ? 'Inscription en cours...' : 'Créer mon compte' }}
          </ion-button>

          <!-- Lien vers connexion -->
          <div class="login-section">
            <p>Déjà un compte ?</p>
            <a @click="goToLogin" class="login-link">Se connecter</a>
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
  IonButton,
  IonContent,
  IonInput,
  IonIcon,
  IonCheckbox,
  IonSpinner,
  alertController,
  loadingController
} from '@ionic/vue';
import {
  arrowBackOutline,
  cameraOutline,
  eyeOutline,
  eyeOffOutline,
  personAddOutline,
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  alertCircleOutline,
  closeCircleOutline,
  checkmarkCircleOutline
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
/* Background Gradient */
.register-gradient-bg {
  --background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.register-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 40px;
}

/* Header */
.register-header {
  margin-bottom: 8px;
}

.back-btn {
  --color: #64748b;
  --padding-start: 0;
  --padding-end: 0;
  margin: 0;
}

.back-btn ion-icon {
  font-size: 24px;
}

/* Profile Section */
.profile-section {
  text-align: center;
  margin-bottom: 24px;
}

.profile-picture-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  position: relative;
  cursor: pointer;
}

.profile-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
}

.profile-placeholder:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);
}

.camera-icon {
  font-size: 32px;
  color: white;
  margin-bottom: 2px;
}

.camera-text {
  font-size: 11px;
  color: white;
  margin: 0;
  font-weight: 600;
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.camera-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.camera-badge ion-icon {
  color: white;
  font-size: 14px;
}

/* Form Card */
.form-card {
  background: white;
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
  text-align: center;
}

.form-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 28px 0;
  text-align: center;
}

/* Input Group Modern */
.input-group-modern {
  margin-bottom: 20px;
}

.input-label-modern {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  padding-left: 4px;
}

.optional-tag {
  color: #94a3b8;
  font-weight: 400;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 20px;
  z-index: 10;
  pointer-events: none;
}

.modern-input {
  --background: #f8fafc;
  --border-radius: 14px;
  --padding-start: 48px;
  --padding-end: 48px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.modern-input:focus-within {
  border-color: var(--ion-color-primary, #6366f1);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  --background: white;
}

.input-with-icon {
  --padding-start: 48px;
}

.password-toggle-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #94a3b8;
  font-size: 22px;
  z-index: 10;
  transition: color 0.2s ease;
}

.password-toggle-icon:hover {
  color: #64748b;
}

/* Password Strength */
.password-strength {
  margin-top: 10px;
}

.strength-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #ef4444;
}

.strength-fill.medium {
  background: #f59e0b;
}

.strength-fill.good {
  background: #06b6d4;
}

.strength-fill.strong {
  background: #10b981;
}

.strength-text {
  font-size: 12px;
  margin-top: 6px;
  color: #64748b;
  font-weight: 500;
}

/* Error Text */
.error-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
  padding-left: 4px;
}

.error-text ion-icon {
  font-size: 14px;
}

.terms-error {
  margin-top: 4px;
  margin-bottom: 16px;
}

/* Terms Wrapper */
.terms-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 8px;
}

.modern-checkbox {
  --size: 20px;
  --border-radius: 6px;
  --border-color: #e2e8f0;
  --border-color-checked: var(--ion-color-primary, #6366f1);
  --checkbox-background-checked: var(--ion-color-primary, #6366f1);
}

.terms-label {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.terms-link {
  color: var(--ion-color-primary, #6366f1);
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
}

.terms-link:hover {
  text-decoration: underline;
}

/* Message Boxes */
.message-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.message-box ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.success-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

/* Register Button */
.register-btn {
  --background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  --border-radius: 14px;
  --box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
  height: 54px;
  font-weight: 700;
  font-size: 16px;
  margin-top: 16px;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  --box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  color: white;
  width: 22px;
  height: 22px;
  margin-right: 8px;
}

/* Login Section */
.login-section {
  text-align: center;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.login-section p {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.login-link {
  color: var(--ion-color-primary, #6366f1);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: var(--ion-color-secondary, #8b5cf6);
}

/* Animations */
.fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: 0.1s;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

/* Responsive */
@media (max-width: 480px) {
  .register-container {
    padding: 16px 16px 30px;
  }
  
  .profile-picture-wrapper {
    width: 90px;
    height: 90px;
  }
  
  .form-card {
    padding: 24px 20px;
    border-radius: 20px;
  }
  
  .form-title {
    font-size: 22px;
  }
  
  .register-btn {
    height: 50px;
    font-size: 15px;
  }
}
</style>