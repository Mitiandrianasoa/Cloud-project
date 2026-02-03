<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="gradient-bg">
      <div class="login-container">
        <!-- Photo de profil (optionnel) -->
        <div class="profile-section fade-in">
          <div class="logo-circle">
            <ion-icon :icon="locationOutline" class="logo-icon"></ion-icon>
          </div>
        </div>

        <!-- Formulaire de connexion -->
        <div class="form-card soft-card fade-in">
          <h2 class="form-title">Connexion 🌸</h2>

          <!-- Email -->
          <div class="input-group">
            <label class="input-label">Email</label>
            <ion-input
              v-model="email"
              type="email"
              placeholder="ton-email@exemple.com"
              class="cute-input"
              :clear-input="true"
            ></ion-input>
            <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
          </div>

          <!-- Mot de passe -->
          <div class="input-group">
            <label class="input-label">Mot de passe</label>
            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="cute-input"
            >
              <ion-icon
                slot="end"
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                @click="togglePassword"
                class="password-icon"
              ></ion-icon>
            </ion-input>
            <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
          </div>

          <!-- Options -->
          <div class="checkbox-group">
            <ion-checkbox v-model="rememberMe"></ion-checkbox>
            <label class="checkbox-label">
              Se souvenir de moi
            </label>
            <a @click="forgotPassword" class="forgot-link">
              Mot de passe oublié ?
            </a>
          </div>

          <!-- Messages d'état -->
          <ion-text color="danger" v-if="error">
            {{ error }}
          </ion-text>

          <ion-text color="success" v-if="success">
            {{ success }}
          </ion-text>

          <!-- Bouton Connexion -->
          <ion-button
            expand="block"
            class="cute-button login-button"
            @click="login"
            :disabled="isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent" class="button-spinner"></ion-spinner>
            <ion-icon v-else slot="start" :icon="logInOutline"></ion-icon>
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </ion-button>

          <!-- Bouton Rester déconnecté -->
          <ion-button
            expand="block"
            fill="outline"
            class="guest-button"
            @click="continueAsGuest"
          >
            <ion-icon slot="start" :icon="mapOutline"></ion-icon>
            Continuer sans compte
          </ion-button>

          <!-- Lien vers inscription -->
          <div class="signup-link">
            <p>Pas encore de compte ?</p>
            <a @click="goToRegister" class="link-text-bold">Créer un compte</a>
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
  locationOutline,
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  mapOutline
} from 'ionicons/icons';

// Importez les mêmes fonctions Firebase
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const router = useRouter();

// État du formulaire - Même structure que Register
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
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

    // Connexion avec Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    const user = userCredential.user;

    // Optionnel: Vérifier si l'email est vérifié
    // if (!user.emailVerified) {
    //   await loading.dismiss();
    //   error.value = 'Veuillez vérifier votre email avant de vous connecter.';
    //   // Option: Déconnexion de l'utilisateur
    //   // await auth.signOut();
    //   return;
    // }
    await loading.dismiss();

    // Redirection après connexion réussie
    success.value = 'Connexion réussie ! Redirection...';
    
    // Redirection vers la page d'accueil ou dashboard
    setTimeout(() => {
      router.push('/map'); // ou '/home' selon votre configuration
    }, 1500);

  } catch (err: any) {
    isLoading.value = false;
    
    // Gestion des erreurs Firebase - Même pattern que Register
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
    
    // Dismiss le loading s'il existe encore
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

// Continuer sans compte (mode invité)
const continueAsGuest = () => {
  router.push('/map');
};

// Navigation
const goBack = () => {
  router.back();
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
/* EXACTEMENT LES MÊMES STYLES QUE LA PAGE REGISTER */

.login-container {
  padding: 20px;
  padding-bottom: 40px;
  max-width: 440px;
  margin: 0 auto;
}

/* Section logo */
.profile-section {
  text-align: center;
  margin: 24px 0 32px;
}

.logo-circle {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  border-radius: var(--radius-full);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-primary);
  transition: all var(--transition-base);
}

.logo-circle:hover {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
}

.logo-icon {
  font-size: 44px;
  color: white;
}

.form-card {
  background: var(--surface);
  border-radius: var(--radius-2xl);
  padding: 32px 28px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(99, 102, 241, 0.08);
}

.form-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 28px;
  text-align: center;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
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
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  --background: var(--surface);
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

.error-text {
  color: var(--danger);
  font-size: 0.813rem;
  margin-top: 6px;
  font-weight: 500;
}

.checkbox-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.forgot-link {
  font-size: 0.875rem;
  color: var(--primary);
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.forgot-link:hover {
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

.login-button {
  --background: var(--gradient-primary);
  --border-radius: var(--radius-xl);
  --box-shadow: var(--shadow-primary);
  height: 52px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 24px;
  margin-bottom: 12px;
  transition: all var(--transition-base);
}

.login-button:hover:not(:disabled) {
  --box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.guest-button {
  --border-radius: var(--radius-xl);
  --border-color: var(--border-default);
  --color: var(--text-secondary);
  --border-width: 2px;
  height: 52px;
  font-weight: 600;
  font-size: 0.938rem;
  margin-bottom: 16px;
  transition: all var(--transition-base);
}

.guest-button:hover {
  --border-color: var(--primary);
  --color: var(--primary);
  --background: rgba(99, 102, 241, 0.05);
}

.button-spinner {
  color: white;
  width: 22px;
  height: 22px;
}

.signup-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.signup-link p {
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

/* Fond gradient */
.gradient-bg {
  background: var(--gradient-surface);
  min-height: 100vh;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
    padding-bottom: 32px;
  }
  
  .logo-circle {
    width: 88px;
    height: 88px;
  }
  
  .logo-icon {
    font-size: 38px;
  }
  
  .form-card {
    padding: 24px 20px;
    border-radius: var(--radius-xl);
  }
  
  .form-title {
    font-size: 1.375rem;
  }
  
  .login-button,
  .guest-button {
    height: 50px;
  }
  
  .checkbox-group {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>