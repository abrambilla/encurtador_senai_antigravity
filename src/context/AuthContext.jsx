import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  function signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signUpWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  /**
   * Login com Google via popup.
   * O aviso COOP no console é apenas informativo — não impede o login.
   */
  function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  /**
   * Logout da conta.
   */
  function logout() {
    return signOut(auth);
  }

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Spinner animado com CSS inline e keyframes customizados no HTML */}
        <div className="loader-container" style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '2px solid #222',
            borderTop: '2px solid #10B981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{
            fontSize: '0.85rem',
            color: '#888',
            letterSpacing: '0.05em',
            margin: 0
          }}>
            Verificando Autenticação...
          </p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
