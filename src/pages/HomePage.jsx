import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GamesContext';

export default function HomePage() {
  const { usuario } = useAuth();
  const { jogos } = useGames();
  const jogosEmAndamento = jogos.filter((j) => j.status === 'em_andamento');

  return (
    <div className="page">
      <h1 className="page-titulo">Olá, {usuario?.displayName || usuario?.email} 👋</h1>
      <p className="page-subtitulo">O que vamos fazer hoje?</p>

      <Link to="/criar-jogo" className="card nav-card nav-card-primario">
        <span className="nav-card-emoji">➕</span>
        <p className="nav-card-titulo">Criar novo jogo</p>
        <p className="nav-card-desc">Cadastre um jogo e adicione as cartelas</p>
      </Link>

      <Link to="/marcar" className="card nav-card">
        <span className="nav-card-emoji">✅</span>
        <p className="nav-card-titulo">Marcar jogo</p>
        <p className="nav-card-desc">
          {jogosEmAndamento.length > 0
            ? `${jogosEmAndamento.length} jogo(s) em andamento`
            : 'Marque as peças sorteadas em todas as cartelas de uma vez'}
        </p>
      </Link>

      <Link to="/historico" className="card nav-card">
        <span className="nav-card-emoji">📜</span>
        <p className="nav-card-titulo">Jogos antigos</p>
        <p className="nav-card-desc">Veja os jogos já cadastrados e seus resultados</p>
      </Link>
    </div>
  );
}
