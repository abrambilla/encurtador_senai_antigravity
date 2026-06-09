import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Redirect from './components/Redirect';

/**
 * Gerenciador de rotas principal da aplicação.
 * Organiza rotas protegidas por PrivateRoute e rotas públicas.
 */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Área Administrativa Protegida */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Rota Pública de Login/Cadastro */}
          <Route path="/login" element={<Login />} />

          {/* Rota Pública de Redirecionamento de Links (/r/:code) */}
          <Route path="/r/:code" element={<Redirect />} />

          {/* Fallback de qualquer outra rota inválida para a raiz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
