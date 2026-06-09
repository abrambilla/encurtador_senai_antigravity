import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que protege rotas que exigem autenticação.
 * Redireciona o usuário para a página de login se não estiver autenticado.
 */
export default function PrivateRoute({ children }) {
  const { user } = useAuth();

  return user ? children : <Navigate to="/login" replace />;
}
