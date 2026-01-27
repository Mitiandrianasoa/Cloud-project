<template>
  <ion-page>
    <ion-content :fullscreen="true" class="gradient-bg">
      <div class="login-container">
        <!-- Logo -->
        <div class="header-section fade-in">
          <div class="logo-circle">
            <ion-icon :icon="locationOutline" class="logo-icon"></ion-icon>
          </div>
          <h1 class="app-title">Safe Roads</h1>
          <p class="app-subtitle">Bienvenue ! 🌸</p>
        </div>

        <!-- Formulaire de connexion -->
        <div class="form-card soft-card fade-in">
          <h2 class="form-title">Connexion</h2>
          
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
          </div>

          <!-- Mot de passe -->
          <div class="input-group">
            <label class="input-label">Mot de passe</label>
            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="cute-input"
              :clear-input="true"
            >
              <ion-icon
                slot="end"
                :icon="showPassword ? eyeOffOutline : eyeOutline"
                @click="togglePassword"
                class="password-icon"
              ></ion-icon>
            </ion-input>
          </div>

          <!-- Mot de passe oublié -->
          <div class="forgot-password">
            <a @click="forgotPassword" class="link-text">Mot de passe oublié ?</a>
          </div>

          <!-- Bouton Connexion -->
          <ion-button
            expand="block"
            class="cute-button login-button"
            @click="login"
          >
            <ion-icon slot="start" :icon="logInOutline"></ion-icon>
            Se connecter
          </ion-button>

          <!-- Divider -->
          <div class="divider">
            <span class="divider-text">ou</span>
          </div>

          <!-- Connexion Google -->
          <ion-button
            expand="block"
            fill="outline"
            class="cute-button google-button"
            @click="loginWithGoogle"
          >
            <ion-icon slot="start" :icon="logoGoogle"></ion-icon>
            Continuer avec Google
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  toastController
} from '@ionic/vue';
import {
  locationOutline,
  logInOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle
} from 'ionicons/icons';

const router = useRouter();

// État du formulaire
const email = ref('');
const password = ref('');
const showPassword = ref(false);

// Toggle affichage mot de passe
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Connexion standard
const login = async () => {
  if (!email.value || !password.value) {
    const toast = await toastController.create({
      message: 'Veuillez remplir tous les champs 📝',
      duration: 2000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
    return;
  }

  // TODO: Implémenter la connexion Firebase
  console.log('Connexion avec:', email.value);
  
  // Simulation de connexion réussie
  const toast = await toastController.create({
    message: 'Connexion réussie ! 🎉',
    duration: 2000,
    color: 'success',
    position: 'top'
  });
  await toast.present();
  
  // Redirection vers la carte
  router.push('/map');
};

// Connexion Google
const loginWithGoogle = async () => {
  // TODO: Implémenter la connexion Google Firebase
  console.log('Connexion avec Google');
  
  const toast = await toastController.create({
    message: 'Connexion Google - À implémenter 🔧',
    duration: 2000,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();
};

// Mot de passe oublié
const forgotPassword = async () => {
  // TODO: Implémenter la réinitialisation de mot de passe
  const toast = await toastController.create({
    message: 'Fonctionnalité à venir ! 💌',
    duration: 2000,
    color: 'tertiary',
    position: 'top'
  });
  await toast.present();
};

// Navigation vers inscription
const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 20px;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
  animation-delay: 0.1s;
}

.logo-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFB6C1, #DDA0DD);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.4);
}

.logo-icon {
  font-size: 50px;
  color: white;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #5a5a5a;
  margin: 0;
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 16px;
  color: #999;
  margin-top: 5px;
}

.form-card {
  width: 100%;
  max-width: 400px;
  animation-delay: 0.2s;
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

.forgot-password {
  text-align: right;
  margin-bottom: 25px;
}

.link-text {
  color: var(--ion-color-primary);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.link-text:hover {
  color: var(--ion-color-primary-shade);
  text-decoration: underline;
}

.login-button {
  --background: linear-gradient(90deg, #FFB6C1, #DDA0DD);
  --border-radius: 30px;
  --box-shadow: 0 4px 15px rgba(255, 182, 193, 0.3);
  height: 50px;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 20px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 25px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ffe4e9;
}

.divider-text {
  position: relative;
  background: white;
  padding: 0 15px;
  color: #999;
  font-size: 14px;
}

.google-button {
  --border-color: #ffe4e9;
  --border-width: 2px;
  --border-radius: 30px;
  --color: #5a5a5a;
  height: 50px;
  font-weight: 600;
  margin-bottom: 20px;
}

.signup-link {
  text-align: center;
  margin-top: 20px;
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
  transition: color 0.3s ease;
}

.link-text-bold:hover {
  color: var(--ion-color-secondary-shade);
  text-decoration: underline;
}
</style>