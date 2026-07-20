import React from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../context/GamesContext';

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function GameHistoryPage() {
  const { jogos } = useGames();

  return (
    <div className="page">
      <Link to="/" className="voltar-link">
        ← Voltar
      </Link>
      <h1 className="page-titulo">Jogos cadastrados</h1>

      {jogos.length === 0 ? (
        <p className="vazio">Você ainda não cadastrou nenhum jogo.</p>
      ) : (
        jogos.map((j) => (
          <Link key={j.id} to={`/jogo/${j.id}`} className="lista-item">
            <div>
              <div className="lista-item-titulo">{j.nome}</div>
              <div className="lista-item-sub">
                {formatarData(j.criadoEm)} · {j.cartelas.length} cartela(s)
              </div>
            </div>
            <span className={`badge ${j.status === 'finalizado' ? 'badge-finalizado' : 'badge-andamento'}`}>
              {j.status === 'finalizado' ? 'Finalizado' : 'Em andamento'}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
