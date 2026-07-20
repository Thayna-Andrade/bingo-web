import React from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../context/GamesContext';

export default function SelectGameToPlayPage() {
  const { jogos } = useGames();
  const emAndamento = jogos.filter((j) => j.status === 'em_andamento');

  return (
    <div className="page">
      <Link to="/" className="voltar-link">
        ← Voltar
      </Link>
      <h1 className="page-titulo">Escolha o jogo para marcar</h1>

      {emAndamento.length === 0 ? (
        <p className="vazio">Nenhum jogo em andamento. Crie um jogo primeiro na tela inicial.</p>
      ) : (
        emAndamento.map((j) => (
          <Link key={j.id} to={`/marcar/${j.id}`} className="lista-item">
            <div>
              <div className="lista-item-titulo">{j.nome}</div>
              <div className="lista-item-sub">{j.cartelas.length} cartela(s)</div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
