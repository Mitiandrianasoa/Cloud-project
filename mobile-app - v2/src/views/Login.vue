<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-gradient-bg">
      <div class="login-container">
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

        <div class="form-card fade-in-up">
          <h2 class="form-title">Bienvenue</h2>
          <p class="form-subtitle">Connectez-vous pour continuer</p>

          <div class="input-group-modern">
            <label class="input-label-modern">Email</label>
            <div class="input-wrapper">
              <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="email"
                type="email"
                placeholder="test@email.com"
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

          <div class="input-group-modern">
            <label class="input-label-modern">Mot de passe</label>
            <div class="input-wrapper">
              <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
              <ion-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="test123"
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

          <div class="options-group">
            <div class="checkbox-wrapper">
              <ion-checkbox v-model="rememberMe" class="modern-checkbox"></ion-checkbox>
              <label class="checkbox-label">Se souvenir de moi</label>
            </div>
            <a @click="forgotPassword" class="forgot-link">Mot de passe oublié ?</a>
          </div>

          <div class="stay-logged-out-wrapper">
            <ion-checkbox v-model="stayLoggedOut" class="modern-checkbox"></ion-checkbox>
            <div class="stay-logged-out-info">
              <label class="checkbox-label">Rester déconnecté</label>
              <span class="checkbox-hint">Ne pas enregistrer la session sur cet appareil</span>
            </div>
          </div>

          <div v-if="error" class="message-box error-box fade-in">
            <ion-icon :icon="closeCircleOutline"></ion-icon>
            <span>{{ error }}</span>
          </div>

          <div v-if="success" class="message-box success-box fade-in">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            <span>{{ success }}</span>
          </div>

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

          <div class="signup-section">
            <p>Pas encore de compte ?</p>
            <a @click="goToRegister" class="signup-link">Créer un compte</a>
          </div>
        </div>

        <div class="login-footer fade-in">
          <p>© 2026 Safe Roads - Tous droits réservés</p>
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
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  mailOutline,
  lockClosedOutline,
  alertCircleOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

// Firebase imports
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";

const router = useRouter();

// État du formulaire
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const stayLoggedOut = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');
const success = ref('');

// Sécurité
const attempts = ref(0);
const maxAttempts = 3;

const errors = ref({
  email: '',
  password: ''
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

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

const login = async () => {
  error.value = '';
  success.value = '';
  
  if (!validateForm()) {
    error.value = 'Veuillez corriger les erreurs dans le formulaire';
    return;
  }

  const userEmailKey = email.value.toLowerCase().replace(/\./g, '_');

  // 1. Vérification préalable du blocage
  try {
    const blockRef = doc(db, "blacklisted_users", userEmailKey);
    const blockSnap = await getDoc(blockRef);

    if (blockSnap.exists() && blockSnap.data().is_blocked) {
      error.value = "🚫 Compte suspendu pour des raisons de sécurité.";
      return;
    }
  } catch (err) {
    console.warn("Vérification cloud ignorée (mode hors-ligne)");
  }

  if (attempts.value >= maxAttempts) {
    error.value = "Trop de tentatives. Ce compte est verrouillé.";
    return;
  }

  // --- DÉBUT DU CHARGEMENT ---
  isLoading.value = true;
  const loading = await loadingController.create({
    message: 'Authentification...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    if (stayLoggedOut.value) {
      await setPersistence(auth, browserSessionPersistence);
    } else {
      await setPersistence(auth, rememberMe.value ? browserLocalPersistence : browserSessionPersistence);
    }

    await signInWithEmailAndPassword(auth, email.value, password.value);

    // SUCCÈS
    attempts.value = 0;
    success.value = 'Connexion réussie ! Redirection...';
    
    await loading.dismiss();
    isLoading.value = false; // <--- FIX : On arrête le spinner ici aussi

    setTimeout(() => {
      router.push('/map');
    }, 1500);

  } catch (err: any) {
    await loading.dismiss();
    isLoading.value = false; // <--- FIX : On arrête le spinner en cas d'erreur
    attempts.value++;

    if (attempts.value >= maxAttempts) {
      try {
        await setDoc(doc(db, "blacklisted_users", userEmailKey), {
          email: email.value,
          reason: "Sécurité : 3 échecs consécutifs (Application Mobile)",
          blocked_at: new Date().toISOString(),
          is_blocked: true
        });
        error.value = "⚠️ Compte bloqué après 3 tentatives infructueuses.";
      } catch (dbErr) {
        error.value = "Accès refusé suite à plusieurs erreurs.";
      }
    } else {
      let msg = "Identifiants incorrects.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = `Email ou mot de passe incorrect (${attempts.value}/${maxAttempts})`;
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Trop de tentatives. Réessayez plus tard.";
      }
      error.value = msg;
    }
  }
};

const forgotPassword = async () => {
  if (!email.value) {
    error.value = 'Veuillez entrer votre email d\'abord';
    return;
  }

  const alert = await alertController.create({
    header: 'Réinitialisation',
    message: `Envoyer un lien à : ${email.value} ?`,
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Envoyer',
        handler: async () => {
          try {
            await sendPasswordResetEmail(auth, email.value);
            success.value = 'Email envoyé !';
          } catch (err: any) {
            error.value = 'Erreur lors de l\'envoi';
          }
        }
      }
    ]
  });
  await alert.present();
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
/* Les styles restent identiques à votre version originale */
.login-gradient-bg {
  --background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdfa 100%);
  min-height: 100vh;
}

.login-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 24px;
}

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
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
  z-index: 2;
  position: relative;
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
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  opacity: 0.2;
  filter: blur(20px);
  z-index: 1;
}

.app-name {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.app-tagline {
  font-size: 14px;
  color: #64748b;
}

.form-card {
  background: white;
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
}

.form-title { font-size: 26px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 8px;}
.form-subtitle { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 28px;}

.input-group-modern { margin-bottom: 22px; }
.input-label-modern { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.input-wrapper { position: relative; }
.input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; z-index: 10; }

.modern-input {
  --background: #f8fafc;
  --border-radius: 14px;
  --padding-start: 48px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
}

.password-toggle-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #94a3b8; z-index: 10; font-size: 22px; }

.options-group { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
.checkbox-wrapper { display: flex; align-items: center; gap: 8px; }
.checkbox-label { font-size: 14px; color: #475569; }
.forgot-link { font-size: 14px; color: #6366f1; font-weight: 600; cursor: pointer; }

.stay-logged-out-wrapper {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin-bottom: 24px;
}

.checkbox-hint { font-size: 11px; color: #dc2626; display: block; }

.message-box { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; }
.error-box { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.success-box { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

.login-btn {
  --background: linear-gradient(135deg, #6366f1, #8b5cf6);
  --border-radius: 14px;
  height: 54px;
  font-weight: 700;
}

.signup-section { text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
.signup-link { color: #6366f1; font-weight: 700; cursor: pointer; }

.login-footer { text-align: center; margin-top: auto; padding: 20px 0; color: #94a3b8; font-size: 12px; }

.fade-in { animation: fadeIn 0.5s ease-in; }
.fade-in-up { animation: fadeInUp 0.5s ease-out; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>