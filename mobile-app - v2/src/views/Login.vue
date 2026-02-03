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
  logInOutline
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
}

/* Section logo - Même style que profile-section */
.profile-section {
  text-align: center;
  margin: 20px 0 30px;
  animation-delay: 0.1s;
}

.logo-circle {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE4E9, #FFB6C1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #FFB6C1;
  transition: all 0.3s ease;
}

.logo-circle:hover {
  transform: scale(1.05);
  border-color: #DDA0DD;
}

.logo-icon {
  font-size: 50px;
  color: white;
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

.error-text {
  color: #FFB3BA;
  font-size: 12px;
  margin-top: 5px;
  padding-left: 5px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #5a5a5a;
}

.forgot-link {
  font-size: 14px;
  color: var(--ion-color-primary);
  text-decoration: none;
  cursor: pointer;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Messages d'état - Même style que Register */
ion-text[color="danger"],
ion-text[color="success"] {
  display: block;
  margin: 15px 0;
  padding: 10px;
  border-radius: 8px;
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

.login-button {
  --background: linear-gradient(90deg, #DDA0DD, #B0E0E6);
  --border-radius: 30px;
  --box-shadow: 0 4px 15px rgba(221, 160, 221, 0.3);
  height: 50px;
  font-weight: 600;
  font-size: 16px;
  margin-top: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-spinner {
  color: white;
  width: 20px;
  height: 20px;
}

.signup-link {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.signup-link p {
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

/* Animation de fond - Même que Register */
.gradient-bg {
  background: linear-gradient(135deg, #FFF0F5 0%, #F8F0FF 100%);
  min-height: 100vh;
}

/* Responsive - Même que Register */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
    padding-bottom: 30px;
  }
  
  .logo-circle {
    width: 100px;
    height: 100px;
  }
  
  .logo-icon {
    font-size: 40px;
  }
  
  .form-card {
    padding: 20px;
  }
  
  .form-title {
    font-size: 22px;
  }
  
  .login-button {
    height: 48px;
    font-size: 15px;
  }
  
  .checkbox-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

/* Animation de fond subtile */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-bg {
  animation: gradientShift 15s ease infinite;
  background-size: 200% 200%;
}
</style>