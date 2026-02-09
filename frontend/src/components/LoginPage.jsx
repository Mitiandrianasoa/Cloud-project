import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import '../styles/login.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const userEmailKey = formData.email.replace(/\./g, '_');

    // --- 1. VÉRIFICATION DU SEUIL DE TENTATIVES LOCALES ---
    if (attempts >= 3) {
      setErrorMessage("Compte bloqué : trop de tentatives.");
      setLoading(false);
      try {
        await axios.post('http://localhost:3000/users/block', { email: formData.email, reason: "3 échecs consécutifs" });
        await setDoc(doc(db, "blacklisted_users", userEmailKey), {
          email: formData.email,
          reason: "Sécurité : Trop d'échecs (Admin Web)",
          blocked_at: new Date().toISOString(),
          is_blocked: true
        });
      } catch (err) { console.error("Erreur synchro blocage:", err); }
      return;
    }

    try {
      if (!isLogin) {
        // --- 2. INSCRIPTION (Nécessite internet) ---
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.username });
        const res = await axios.post('http://localhost:3000/users', {
          id: userCredential.user.uid,
          email: formData.email,
          password: formData.password,
          name: formData.username,
          role_id: 2,
          provider: 'FIREBASE'
        });
        login(res.data);
        navigate('/dashboard');
      } else {
        // --- 3. LOGIQUE CONNEXION HYBRIDE ---
        
        // A. Check Cloud Blacklist (Silencieux si pas de réseau)
        try {
          const cloudBlockDoc = await getDoc(doc(db, "blacklisted_users", userEmailKey));
          if (cloudBlockDoc.exists() && cloudBlockDoc.data().is_blocked) {
            setErrorMessage("Ce compte est banni sur le Cloud.");
            setLoading(false);
            return;
          }
        } catch (cloudErr) {
          console.warn("Cloud injoignable (Hors-ligne), vérification ignorée.");
        }

        // B. Tentative Authentification
        try {
          // Essai Cloud
          const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          const localRes = await axios.get(`http://localhost:3000/users/${userCredential.user.uid}`);
          login(localRes.data);
          setAttempts(0);
          navigate('/dashboard');
        } catch (authErr) {
          // C. FALLBACK LOCAL (Si mot de passe cloud échoue ou si pas d'internet)
          console.log("Tentative de connexion locale (PostgreSQL)...");
          try {
            const localResponse = await axios.post('http://localhost:3000/login', {
              email: formData.email,
              password: formData.password,
            });
            login(localResponse.data.user);
            setAttempts(0);
            navigate('/dashboard');
          } catch (localErr) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (localErr.response?.status === 403) {
              setErrorMessage("Ce compte est banni localement.");
            } else {
              setErrorMessage(`Identifiants incorrects (Tentative ${newAttempts}/3)`);
            }
          }
        }
      }
    } catch (globalError) {
      setErrorMessage("Erreur : " + globalError.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">ROAD SAFETY</h2>
          <p className="login-subtitle">Gestion des Infrastructures</p>
        </div>
        
        {errorMessage && <div className="login-error">⚠️ {errorMessage}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="login-input-group">
              <label className="login-label">Nom complet</label>
              <input name="username" type="text" placeholder="Nom" value={formData.username} onChange={handleChange} className="login-input" required />
            </div>
          )}
          
          <div className="login-input-group">
            <label className="login-label">Email</label>
            <input name="email" type="email" placeholder="manager@local.app" value={formData.email} onChange={handleChange} className="login-input" required />
          </div>
          
          <div className="login-input-group">
            <label className="login-label">Mot de passe</label>
            <input name="password" type="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} className="login-input" required />
          </div>
          
          <button type="submit" disabled={loading} className="login-button login-button-primary">
            {loading ? 'CHARGEMENT...' : (isLogin ? 'SE CONNECTER' : "CRÉER L'ACCÈS")}
          </button>
        </form>

        <button onClick={() => { setIsLogin(!isLogin); setErrorMessage(''); }} className="login-switch">
          {isLogin ? "Nouveau ? Créer un compte Cloud" : "Déjà inscrit ? Connexion"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;