// src/config/firebase.config.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ REMPLACE CES VALEURS PAR TES VRAIES VALEURS FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCOA6ny1IE2VYg8F1ZcBTcZY8eTIqApcdU",
  authDomain: "frierenhoshi.firebaseapp.com",
  projectId: "frierenhoshi",
  storageBucket: "frierenhoshi.appspot.com",
  messagingSenderId: "751176383556",
  appId: "1:751176383556:web:41bf3a484c3bc925615011",
  measurementId: "G-SB7F2BDR68"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;