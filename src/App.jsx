import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GamesProvider } from './context/GamesContext';
import Topbar from './components/Topbar';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CreateGamePage from './pages/CreateGamePage';
import AddCardPage from './pages/AddCardPage';
import SelectGameToPlayPage from './pages/SelectGameToPlayPage';
import PlayGamePage from './pages/PlayGamePage';
import GameHistoryPage from './pages/GameHistoryPage';
import GameDetailPage from './pages/GameDetailPage';

function AreaLogada() {
  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/criar-jogo" element={<CreateGamePage />} />
        <Route path="/criar-jogo/:jogoId" element={<CreateGamePage />} />
        <Route path="/adicionar-cartela/:jogoId" element={<AddCardPage />} />
        <Route path="/marcar" element={<SelectGameToPlayPage />} />
        <Route path="/marcar/:jogoId" element={<PlayGamePage />} />
        <Route path="/historico" element={<GameHistoryPage />} />
        <Route path="/jogo/:jogoId" element={<GameDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function Raiz() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="centro-loading">Carregando...</div>;
  }

  if (!usuario) {
    return <LoginPage />;
  }

  return (
    <GamesProvider>
      <AreaLogada />
    </GamesProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="app-shell">
          <Raiz />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
