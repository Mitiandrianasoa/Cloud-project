<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-gradient-bg">
      <div class="login-container">
        <!-- Logo / Branding -->
        <div class="branding-section fade-in">
          <div class="logo-container">
            <div class="logo-circle">
              <ion-icon :icon="shieldCheckmarkOutline" class="logo-icon"></ion-icon>
            </div>
            <div class="logo-glow"></div>
          </div>
          <h1 class="app-name">Safe Roads</h1>
          <p class="app-tagline">Signaler. Protéger. Améliorer.</p>
        </div>

        <!-- Formulaire de connexion -->
        <div class="form-card fade-in-up">
          <h2 class="form-title">Bienvenue</h2>
          <p class="form-subtitle">Connectez-vous pour continuer</p>

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

          <!-- Mot de passe -->
          <div class="input-group-modern">
            <label class="input-label-modern">Mot de passe</label>
            <div class="input-wrapper">
              <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="modern-input input-with-icon"
                @ionBlur="validatePassword"
              ></ion-input>
              <ion-icon
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                @click="togglePassword"
                class="password-toggle-icon"
              ></ion-icon>
            </div>
            <p v-if="errors.password" class="error-text">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              {{ errors.password }}
            </p>
          </div>

          <!-- Options -->
          <div class="options-group">
            <div class="checkbox-wrapper">
              <ion-checkbox v-model="rememberMe" class="modern-checkbox"></ion-checkbox>
              <label class="checkbox-label">Se souvenir de moi</label>
            </div>
            <a @click="forgotPassword" class="forgot-link">Mot de passe oublié ?</a>
          </div>

          <!-- Option rester déconnecté -->
          <div class="stay-logged-out-wrapper">
            <ion-checkbox v-model="stayLoggedOut" class="modern-checkbox"></ion-checkbox>
            <div class="stay-logged-out-info">
              <label class="checkbox-label">Rester déconnecté</label>
              <span class="checkbox-hint">Ne pas enregistrer la session sur cet appareil</span>
            </div>
          </div>

          <!-- Messages d'état -->
          <div v-if="error" class="message-box error-box fade-in">
            <ion-icon :icon="closeCircleOutline"></ion-icon>
            <span>{{ error }}</span>
          </div>

          <div v-if="success" class="message-box success-box fade-in">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            <span>{{ success }}</span>
          </div>

          <!-- Bouton Connexion -->
          <ion-button
            expand="block"
            class="login-btn"
            @click="login"
            :disabled="isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent" class="btn-spinner"></ion-spinner>
            <ion-icon v-else slot="start" :icon="logInOutline"></ion-icon>
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </ion-button>

          <!-- Lien vers inscription -->
          <div class="signup-section">
            <p>Pas encore de compte ?</p>
            <a @click="goToRegister" class="signup-link">Créer un compte</a>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer fade-in">
          <p>© 2026 Safe Roads - Tous droits réservés</p>
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
  locationOutline,
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  mailOutline,
  lockClosedOutline,
  alertCircleOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
  personOutline
} from 'ionicons/icons';

// Importez les mêmes fonctions Firebase
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';

const router = useRouter();

// État du formulaire - Même structure que Register
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const stayLoggedOut = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');
const success = ref('');

// Erreurs de validation - Même structure
const errors = ref({
  email: '',
  password: ''
});

// Toggle affichage mot de passe - Même fonction
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Validation - Même logique
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
  } else {
    errors.value.password = '';
  }
};

const validateForm = () => {
  let isValid = true;
  error.value = '';
  success.value = '';

  validateEmail();
  if (errors.value.email) isValid = false;

  validatePassword();
  if (errors.value.password) isValid = false;

  return isValid;
};

// Fonction de connexion - Même pattern que Register
const login = async () => {
  // Réinitialiser les messages
  error.value = '';
  success.value = '';
  
  // Validation du formulaire
  if (!validateForm()) {
    error.value = 'Veuillez corriger les erreurs dans le formulaire';
    return;
  }

  isLoading.value = true;

  try {
    // Afficher le loading
    const loading = await loadingController.create({
      message: 'Connexion en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    // Set persistence based on user choice
    if (stayLoggedOut.value) {
      await setPersistence(auth, browserSessionPersistence);
    } else if (rememberMe.value) {
      await setPersistence(auth, browserLocalPersistence);
    } else {
      await setPersistence(auth, browserSessionPersistence);
    }

    // Connexion avec Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const user = userCredential.user;

    await loading.dismiss();

    // Redirection après connexion réussie
    success.value = 'Connexion réussie ! Redirection...';
    
    // Redirection vers la page d'accueil ou dashboard
    setTimeout(() => {
      router.push('/map');
    }, 1500);

  } catch (err: any) {
    isLoading.value = false;
    
    // Gestion des erreurs Firebase
    let errorMessage = 'Erreur lors de la connexion';
    
    switch (err.code) {
      case 'auth/invalid-email':
        errorMessage = 'Email invalide';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Ce compte a été désactivé';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Aucun compte trouvé avec cet email';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Mot de passe incorrect';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Trop de tentatives. Réessayez plus tard';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Erreur réseau. Vérifiez votre connexion';
        break;
      default:
        errorMessage = err.message || 'Erreur lors de la connexion';
    }
    
    error.value = errorMessage;
    
    try {
      await loadingController.dismiss();
    } catch (e) {
      // Ignorer si le loading n'existe pas
    }
  }
};

// Mot de passe oublié
const forgotPassword = async () => {
  if (!email.value) {
    error.value = 'Veuillez entrer votre email d\'abord';
    return;
  }

  const alert = await alertController.create({
    header: 'Réinitialisation du mot de passe',
    message: `Un email de réinitialisation sera envoyé à : ${email.value}`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Envoyer',
        handler: async () => {
          try {
            await sendPasswordResetEmail(auth, email.value);
            success.value = 'Email de réinitialisation envoyé ! Vérifiez votre boîte mail.';
          } catch (err: any) {
            error.value = 'Erreur lors de l\'envoi de l\'email';
          }
        }
      }
    ]
  });
  await alert.present();
};

// Navigation
const goBack = () => {
  router.back();
};

const goToRegister = () => {
  router.push('/register');
};

// Continuer sans compte - redirige directement vers la carte
const continueAsGuest = () => {
  router.push('/map');
};
</script>

<style scoped>
/* Modern Professional Login Styles */

.login-gradient-bg {
  --background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdfa 100%);
  min-height: 100vh;
}

.login-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 24px;
  padding-bottom: 40px;
}

/* Branding Section */
.branding-section {
  text-align: center;
  padding: 40px 0 32px;
}

.logo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.logo-circle {
  width: 100px;
  height: 100px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
  position: relative;
  z-index: 2;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-circle:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 25px 50px rgba(99, 102, 241, 0.4);
}

.logo-icon {
  font-size: 48px;
  color: white;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 32px;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  opacity: 0.2;
  filter: blur(20px);
  z-index: 1;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
}

.app-name {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.app-tagline {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
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
  margin-bottom: 22px;
}

.input-label-modern {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  padding-left: 4px;
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

/* Options Group */
.options-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modern-checkbox {
  --size: 20px;
  --border-radius: 6px;
  --border-color: #e2e8f0;
  --border-color-checked: var(--ion-color-primary, #6366f1);
  --checkbox-background-checked: var(--ion-color-primary, #6366f1);
}

.checkbox-label {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
}

.forgot-link {
  font-size: 14px;
  color: var(--ion-color-primary, #6366f1);
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.forgot-link:hover {
  color: var(--ion-color-secondary, #8b5cf6);
}

/* Stay Logged Out */
.stay-logged-out-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin-bottom: 24px;
}

.stay-logged-out-info {
  flex: 1;
}

.stay-logged-out-info .checkbox-label {
  display: block;
  color: #991b1b;
  margin-bottom: 2px;
}

.checkbox-hint {
  font-size: 12px;
  color: #dc2626;
  line-height: 1.4;
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

/* Login Button */
.login-btn {
  --background: linear-gradient(135deg, var(--ion-color-primary, #6366f1), var(--ion-color-secondary, #8b5cf6));
  --border-radius: 14px;
  --box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
  height: 54px;
  font-weight: 700;
  font-size: 16px;
  margin-top: 8px;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  --box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  color: white;
  width: 22px;
  height: 22px;
  margin-right: 8px;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 28px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.divider span {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
}

/* Guest Button */
.guest-btn {
  --background: transparent;
  --background-hover: rgba(99, 102, 241, 0.05);
  --border-color: #e2e8f0;
  --border-width: 2px;
  --border-radius: 14px;
  --color: #64748b;
  --box-shadow: none;
  height: 52px;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.guest-btn:hover {
  --border-color: var(--ion-color-primary, #6366f1);
  --color: var(--ion-color-primary, #6366f1);
}

.guest-btn ion-icon {
  font-size: 20px;
}

/* Social Buttons */
.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e2e8f0;
  background: white;
  color: #1e293b;
}

.social-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.social-icon {
  width: 22px;
  height: 22px;
}

/* Signup Section */
.signup-section {
  text-align: center;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.signup-section p {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.signup-link {
  color: var(--ion-color-primary, #6366f1);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: var(--ion-color-secondary, #8b5cf6);
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: auto;
  padding-top: 32px;
}

.login-footer p {
  color: #94a3b8;
  font-size: 12px;
  margin: 0;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: 0.2s;
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
  .login-container {
    padding: 20px 16px;
  }
  
  .branding-section {
    padding: 32px 0 24px;
  }
  
  .logo-circle {
    width: 80px;
    height: 80px;
    border-radius: 22px;
  }
  
  .logo-icon {
    font-size: 38px;
  }
  
  .app-name {
    font-size: 26px;
  }
  
  .form-card {
    padding: 24px 20px;
    border-radius: 20px;
  }
  
  .form-title {
    font-size: 22px;
  }
  
  .options-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .login-btn {
    height: 50px;
    font-size: 15px;
  }
}
</style>