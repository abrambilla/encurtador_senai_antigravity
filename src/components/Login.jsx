import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'E-mail com formato inválido.';
      case 'auth/user-disabled':
        return 'Este usuário foi desabilitado.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este endereço de e-mail já está cadastrado.';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'Conexão com Google cancelada pelo usuário.';
      case 'auth/configuration-not-found':
        return 'Erro: O serviço de Autenticação (Authentication) não está habilitado no Firebase Console para este projeto. Por favor, ative a opção de login com E-mail/Senha nas configurações.';
      default:
        return 'Ocorreu um erro no processamento. Tente novamente.';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegisterMode && password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      if (isRegisterMode) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      // Ignora cancelamento intencional do popup pelo usuário
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(getErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      padding: '1.5rem'
    }} className="animate-fade-in">
      
      {/* Logo da Marca */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          color: '#FFFFFF'
        }}>
          ENCURTA LINK
        </span>
      </div>

      {/* Card de Login */}
      <div className="card-premium" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: '#FFFFFF',
          textAlign: 'center'
        }}>
          {isRegisterMode ? 'Criar uma nova conta' : 'Entrar na sua conta'}
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: '#888888',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {isRegisterMode ? 'Registre-se para encurtar seus links' : 'Acesse o painel do Encurta Link Senai'}
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--border-radius)',
            marginBottom: '1.5rem',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#888888',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              className="input-premium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#888888',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className="input-premium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {isRegisterMode && (
            <div>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#888888',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className="input-premium"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-premium"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : isRegisterMode ? 'Registrar Conta' : 'Entrar'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.5rem 0',
          color: '#333333'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ou continuar com</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {/* Botão Google */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="btn-premium btn-secondary"
          style={{ width: '100%', padding: '0.85rem' }}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.25rem' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        {/* Alternar modo Login/Registro */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#888888'
        }}>
          {isRegisterMode ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontWeight: 500,
              padding: 0,
              fontFamily: 'inherit',
              textDecoration: 'underline'
            }}
          >
            {isRegisterMode ? 'Acessar Conta' : 'Criar uma conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
