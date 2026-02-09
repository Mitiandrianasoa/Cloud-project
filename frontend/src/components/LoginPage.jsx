import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
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

    // --- 1. VÉRIFICATION DU SEUIL DE TENTATIVES ---
    if (attempts >= 3) {
      const msg = "Compte bloqué localement : trop de tentatives.";
      setErrorMessage(msg);
      setLoading(false);
      try {
        await axios.post('http://localhost:3000/users/block', { 
          email: formData.email, 
          reason: "3 échecs consécutifs sur l'interface" 
        });
      } catch (err) { console.error("Erreur log blocage:", err); }
      return;
    }

    try {
      if (!isLogin) {
        // --- 2. LOGIQUE INSCRIPTION (FIREBASE + DB LOCALE) ---
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.username });
        
        const res = await axios.post('http://localhost:3000/users', {
          id: userCredential.user.uid,
          email: formData.email,
          name: formData.username,
          role_id: 2, // USER par défaut
          provider: 'FIREBASE'
        });
        
        login(res.data);
        navigate('/dashboard');

      } else {
        // --- 3. LOGIQUE CONNEXION ---
        try {
          // A. Authentification Firebase
          const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          const uid = userCredential.user.uid;

          // B. Récupération immédiate du rôle en base locale (Route user/:id)
          const localRes = await axios.get(`http://localhost:3000/users/${uid}`);
          
          login(localRes.data); 
          setAttempts(0);
          navigate('/dashboard');

        } catch (firebaseOrDbErr) {
          // C. FALLBACK : Si Firebase échoue OU si l'utilisateur n'est pas encore en DB locale
          console.log("Échec Firebase/DB locale, tentative Login classique...");
          
          try {
            const localResponse = await axios.post('http://localhost:3000/login', {
              email: formData.email,
              password: formData.password,
            });

            login(localResponse.data.user);
            setAttempts(0);
            navigate('/dashboard');

          } catch (localErr) {
            // D. ÉCHEC FINAL : Gestion de l'erreur et du compteur
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            if (localErr.response && localErr.response.status === 403) {
              setErrorMessage("Ce compte est banni ou bloqué en base de données.");
            } else {
              setErrorMessage(`Identifiants incorrects. Tentative ${newAttempts}/3.`);
            }
          }
        }
      }
    } catch (globalError) {
      setErrorMessage("Erreur système : " + globalError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">ROAD SAFETY</h2>
          <p className="login-subtitle">Gestion des Infrastructures Routières</p>
        </div>
        
        {errorMessage && (
          <div className="login-error" style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="login-input-group">
              <label className="login-label">Nom complet</label>
              <input name="username" type="text" placeholder="Nom" value={formData.username} onChange={handleChange} className="login-input" required />
            </div>
          )}
          
          <div className="login-input-group">
            <label className="login-label">Email</label>
            <input name="email" type="email" placeholder="agent@police.mg" value={formData.email} onChange={handleChange} className="login-input" required />
          </div>
          
          <div className="login-input-group">
            <label className="login-label">Mot de passe</label>
            <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="login-input" required />
          </div>
          
          <button type="submit" disabled={loading} className="login-button login-button-primary">
            {loading ? 'CHARGEMENT...' : (isLogin ? 'SE CONNECTER' : "CRÉER L'ACCÈS")}
          </button>
        </form>

        <button onClick={() => { setIsLogin(!isLogin); setErrorMessage(''); }} className="login-switch">
          {isLogin ? "Nouveau ? Créer un compte Cloud" : "Déjà inscrit ? Connexion"}
        </button>

        <div className="login-footer">
          <p className="login-footer-text">🔒 Sécurisé par Road Safety Madagascar</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;