import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import { MODOS_VITORIA } from '../utils/bingoUtils';
import BingoCard from '../components/BingoCard';

export default function GameDetailPage() {
  const { jogoId } = useParams();
  const { getJogo } = useGames();
  const jogo = getJogo(jogoId);

  if (!jogo) {
    return <div className="centro-loading">Jogo não encontrado.</div>;
  }

  return (
    <div className="page">
      <Link to="/historico" className="voltar-link">
        ← Voltar ao histórico
      </Link>
      <h1 className="page-titulo">{jogo.nome}</h1>
      <p className="page-subtitulo">
        Status: {jogo.status === 'finalizado' ? 'Finalizado' : 'Em andamento'} ·{' '}
        {jogo.numerosSorteados.length} número(s) chamado(s) ·{' '}
        {jogo.modoVitoria === MODOS_VITORIA.CHEIA ? 'ganha na cartela cheia' : 'ganha por linha/coluna'}
      </p>

      {jogo.status === 'finalizado' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="cartela-titulo" style={{ marginBottom: 8 }}>
            Resultado
          </p>
          {jogo.vencedoras && jogo.vencedoras.length > 0 ? (
            jogo.vencedoras.map((v) => (
              <p key={v.cartelaId} style={{ margin: '2px 0' }}>
                🏆 Cartela #{v.indice}
                {v.numero && ` · Nº ${v.numero}`} — {v.status.cheia ? 'cartela cheia' : 'linha/coluna completa'}
              </p>
            ))
          ) : (
            <p>Nenhuma cartela completou bingo.</p>
          )}
        </div>
      )}

      {jogo.status === 'em_andamento' && (
        <Link
          to={`/marcar/${jogo.id}`}
          className="botao botao-navy"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 16 }}
        >
          Continuar marcando este jogo
        </Link>
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--navy)' }}>
        Cartelas ({jogo.cartelas.length})
      </h2>
      {jogo.cartelas.map((c, i) => (
        <BingoCard key={c.id} cartela={c} titulo={`Cartela #${i + 1}`} modoVitoria={jogo.modoVitoria} />
      ))}
    </div>
  );
}