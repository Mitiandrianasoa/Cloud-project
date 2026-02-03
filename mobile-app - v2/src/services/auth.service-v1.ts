// src/services/auth.service.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

class AuthService {
  
  // Initialiser Google Auth
  async initGoogleAuth() {
    if (Capacitor.getPlatform() === 'web') {
      GoogleAuth.initialize({
        clientId: 'TON_WEB_CLIENT_ID.apps.googleusercontent.com', // ⚠️ REMPLACE ICI
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }

  // Inscription avec email/password
  async register(email: string, password: string, fullName: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le profil avec le nom
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
      }
      
      return userCredential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Connexion avec email/password
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Connexion avec Google
  async loginWithGoogle(): Promise<UserCredential> {
    try {
      // Initialiser Google Auth
      await this.initGoogleAuth();

      // Obtenir le token Google
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser || !googleUser.authentication) {
        throw new Error('Échec de la connexion Google');
      }

      // Créer les credentials Firebase
      const credential = GoogleAuthProvider.credential(
        googleUser.authentication.idToken,
        googleUser.authentication.accessToken
      );

      // Se connecter avec Firebase
      const result = await signInWithCredential(auth, credential);
      
      return result;
    } catch (error: any) {
      console.error('Erreur Google Sign-In:', error);
      throw this.handleAuthError(error);
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await GoogleAuth.signOut();
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Observer les changements d'authentification
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }

  // Gestion des erreurs
  private handleAuthError(error: any): Error {
    const errorCode = error.code;
    let message = 'Une erreur est survenue';

    switch (errorCode) {
      case 'auth/email-already-in-use':
        message = 'Cet email est déjà utilisé';
        break;
      case 'auth/invalid-email':
        message = 'Email invalide';
        break;
      case 'auth/operation-not-allowed':
        message = 'Opération non autorisée';
        break;
      case 'auth/weak-password':
        message = 'Le mot de passe est trop faible';
        break;
      case 'auth/user-disabled':
        message = 'Ce compte a été désactivé';
        break;
      case 'auth/user-not-found':
        message = 'Aucun compte trouvé avec cet email';
        break;
      case 'auth/wrong-password':
        message = 'Mot de passe incorrect';
        break;
      case 'auth/too-many-requests':
        message = 'Trop de tentatives. Réessayez plus tard';
        break;
      default:
        message = error.message || 'Erreur d\'authentification';
    }

    return new Error(message);
  }
}

export default new AuthService();