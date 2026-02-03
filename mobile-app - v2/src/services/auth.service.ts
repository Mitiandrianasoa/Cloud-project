// src/services/auth.service.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCOA6ny1IE2VYg8F1ZcBTcZY8eTIqApcdU",
  authDomain: "frierenhoshi.firebaseapp.com",
  projectId: "frierenhoshi",
  storageBucket: "frierenhoshi.firebasestorage.app",
  messagingSenderId: "751176383556",
  appId: "1:751176383556:web:41bf3a484c3bc925615011",
  measurementId: "G-SB7F2BDR68"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurer Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

class AuthService {
  // Méthode de connexion email/mot de passe (comme dans votre première page)
  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // Méthode de connexion Google
  async loginWithGoogle(): Promise<UserCredential> {
    return await signInWithPopup(auth, googleProvider);
  }

  // Inscription
  async register(email: string, password: string): Promise<UserCredential> {
    return await createUserWithEmailAndPassword(auth, email, password);
  }

  // Réinitialisation mot de passe
  async resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(auth, email);
  }

  // Déconnexion
  async logout(): Promise<void> {
    return await signOut(auth);
  }

  // Obtenir l'utilisateur courant
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

// Export singleton
const authService = new AuthService();
export default authService;
export { auth };