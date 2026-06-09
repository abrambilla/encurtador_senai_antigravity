import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLink, incrementClicks } from '../services/linkService';

export default function Redirect() {
  const { code } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'

  useEffect(() => {
    async function processRedirect() {
      try {
        // Busca o link original no Firestore pelo shortCode
        const data = await getLink(code);

        if (data && data.originalUrl) {
          // Incrementa cliques
          await incrementClicks(code);
          
          // Redireciona o navegador para o site de destino
          window.location.replace(data.originalUrl);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Falha no redirecionamento:', err);
        setStatus('error');
      }
    }

    if (code) {
      processRedirect();
    } else {
      setStatus('error');
    }
  }, [code]);

  if (status === 'loading') {
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
      }} className="animate-fade-in">
        <div style={{
          width: '40px',
          height: '40px',
          border: '2px solid #222',
          borderTop: '2px solid #10B981',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }}></div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
          Redirecionando você...
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>
          Conectando ao endereço de destino com segurança
        </p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Tela de 404 Link Não Encontrado Premium
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0A0A0A',
      color: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1.5rem',
      textAlign: 'center'
    }} className="animate-fade-in">
      <div className="card-premium" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '3rem 2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Ícone de erro */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Link Não Encontrado
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
          O link encurtado que você tentou acessar não existe, foi excluído pelo criador ou expirou.
        </p>

        <Link to="/login" className="btn-premium" style={{ width: '100%', padding: '0.85rem' }}>
          Ir para o Início
        </Link>
      </div>
    </div>
  );
}
