import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createLink, deleteLink, subscribeUserLinks } from '../services/linkService';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [firestoreError, setFirestoreError] = useState('');

  // Sincroniza links do usuário em tempo real
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserLinks(
      user.uid,
      (data) => {
        setFirestoreError('');
        setLinks(data);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
          setFirestoreError(
            'Sem conexão com o banco de dados. Verifique se o Firestore Database foi criado no Firebase Console e se você está conectado à internet.'
          );
        } else {
          setFirestoreError('Erro ao carregar os links. Tente recarregar a página.');
        }
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Validação simples de URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function handleShorten(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    let longUrl = urlInput.trim();
    if (!longUrl) return;

    // Adiciona protocolo se o usuário digitar sem http/https
    if (!/^https?:\/\//i.test(longUrl)) {
      longUrl = `https://${longUrl}`;
    }

    if (!isValidUrl(longUrl)) {
      setError('Por favor, insira uma URL válida.');
      return;
    }

    // Prevenção de loop: Não permite encurtar URLs do próprio encurtador
    const currentOrigin = window.location.origin;
    if (longUrl.toLowerCase().startsWith(currentOrigin.toLowerCase())) {
      setError('Não é permitido encurtar links deste próprio domínio.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const newLink = await createLink(longUrl, user.uid);
      setSuccess(`Link encurtado criado com sucesso: ${newLink.shortCode}`);
      setUrlInput('');
      // Limpa mensagem de sucesso após 4 segundos
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        setError('Sem conexão com o Firebase. Verifique se o Firestore Database foi criado no Firebase Console.');
      } else {
        setError('Erro ao criar o link encurtado. Tente novamente.');
      }
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function handleDelete(shortCode) {
    if (window.confirm('Tem certeza que deseja excluir este link encurtado?')) {
      try {
        await deleteLink(shortCode);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir o link.');
      }
    }
  }

  function handleCopy(shortCode) {
    const shortUrl = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(shortUrl)
      .then(() => {
        setCopiedCode(shortCode);
        setTimeout(() => setCopiedCode(''), 2000);
      })
      .catch((err) => {
        console.error('Falha ao copiar:', err);
      });
  }

  function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="app-container animate-fade-in" style={{ backgroundColor: '#0A0A0A' }}>

      {/* Banner de aviso de conectividade com o Firestore */}
      {firestoreError && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
          color: '#FCD34D',
          fontSize: '0.82rem',
          padding: '0.65rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          lineHeight: '1.4'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {firestoreError}
        </div>
      )}
      
      {/* Header Premium */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            Encurta Link Senai
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="btn-premium btn-danger"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 500 }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        
        {/* Painel de Encurtamento */}
        <section className="card-premium animate-fade-in" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Encurtador de Link
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Cole sua URL longa abaixo para criar um link curto inteligente O(1) instantaneamente.
          </p>

          <form onSubmit={handleShorten} style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                className="input-premium"
                placeholder="Insira a URL longa aqui (ex: google.com)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={loadingSubmit}
              />
            </div>
            <button
              type="submit"
              className="btn-premium"
              style={{ minWidth: '130px' }}
              disabled={loadingSubmit || !urlInput.trim()}
            >
              {loadingSubmit ? 'Gerando...' : 'Encurtar'}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '1rem',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--border-radius)'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              marginTop: '1rem',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--border-radius)'
            }}>
              {success}
            </div>
          )}
        </section>

        {/* Lista de Links */}
        <section className="card-premium animate-fade-in" style={{ flex: 1, padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Seus Links Encurtados
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Lista atualizada em tempo real com estatísticas de acessos aos seus links.
          </p>

          {links.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--border-radius)'
            }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Nenhum link encurtado criado ainda.</p>
              <p style={{ fontSize: '0.8rem' }}>Cole uma URL longa acima para começar.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>URL Original</th>
                    <th>Link Encurtado</th>
                    <th style={{ textAlign: 'center' }}>Cliques</th>
                    <th>Criado Em</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const shortUrl = `${window.location.origin}/r/${link.shortCode}`;
                    return (
                      <tr key={link.id}>
                        <td style={{
                          maxWidth: '280px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={link.originalUrl}>
                          {link.originalUrl}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {shortUrl}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent)' }}>
                          {link.clicks || 0}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {formatDate(link.createdAt)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {/* Copiar */}
                            <button
                              onClick={() => handleCopy(link.shortCode)}
                              className="btn-premium btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '28px', minWidth: '70px' }}
                              title="Copiar link curto"
                            >
                              {copiedCode === link.shortCode ? (
                                <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Copiado
                                </span>
                              ) : (
                                'Copiar'
                              )}
                            </button>
                            
                            {/* Excluir */}
                            <button
                              onClick={() => handleDelete(link.shortCode)}
                              className="btn-premium btn-danger"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '28px' }}
                              title="Excluir link"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
