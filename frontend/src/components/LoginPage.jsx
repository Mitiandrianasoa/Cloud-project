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
    
    if (attempts >= 3) {
      setErrorMessage("Compte bloqué : trop de tentatives.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (!isLogin) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.username });
        await axios.post('http://localhost:3000/users', {
          email: formData.email,
          password: formData.password,
          name: formData.username,
          role_id: 2
        });
        alert("Compte créé ! Connectez-vous.");
        setIsLogin(true);
      } else {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          const localRes = await axios.get(`http://localhost:3000/users`);
          const localUser = localRes.data.find(u => u.email === userCredential.user.email);
          
          if (localUser) {
            login(localUser);
            navigate('/dashboard');
          } else {
            throw new Error("Compte Firebase valide mais absent de la base locale.");
          }
        } catch (firebaseErr) {
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
            setErrorMessage(`Identifiants incorrects. Il reste ${3 - newAttempts} essais.`);
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
          <p className="login-subtitle">Plateforme de Gestion des Infrastructures Routières</p>
        </div>
        
        {errorMessage && (
          <div className="login-error">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="login-input-group">
              <label className="login-label">Nom complet</label>
              <input 
                name="username" 
                type="text" 
                placeholder="Jean Dupont" 
                value={formData.username} 
                onChange={handleChange} 
                className="login-input" 
                required 
              />
            </div>
          )}
          
          <div className="login-input-group">
            <label className="login-label">Identifiant (Email)</label>
            <input 
              name="email" 
              type="email" 
              placeholder="agent@police.mg" 
              value={formData.email} 
              onChange={handleChange} 
              className="login-input" 
              required 
            />
          </div>
          
          <div className="login-input-group">
            <label className="login-label">Mot de passe</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange} 
              className="login-input" 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className={`login-button login-button-primary ${loading ? 'loading' : ''}`}
          >
            {loading ? 'AUTHENTIFICATION...' : (isLogin ? 'SE CONNECTER' : "CRÉER L'ACCÈS")}
          </button>
        </form>

        <button 
          onClick={() => { setIsLogin(!isLogin); setErrorMessage(''); }} 
          className="login-switch"
        >
          {isLogin ? "Demander un accès (Firebase Cloud)" : "Retour à la connexion locale"}
        </button>

        <div className="login-footer">
          <p className="login-footer-text">
            🔒 Système sécurisé par <strong>Road Safety Madagascar</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

