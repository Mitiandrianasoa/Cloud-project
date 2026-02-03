import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOA6ny1IE2VYg8F1ZcBTcZY8eTIqApcdU",
  authDomain: "frierenhoshi.firebaseapp.com",
  projectId: "frierenhoshi",
  storageBucket: "frierenhoshi.firebasestorage.app",
  messagingSenderId: "751176383556",
  appId: "1:751176383556:web:41bf3a484c3bc925615011",
  measurementId: "G-SB7F2BDR68"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


