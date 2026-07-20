import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import BingoCard from '../components/BingoCard';
import { statusCartela } from '../utils/bingoUtils';

const FAIXAS = [
  { letra: 'B', min: 1, max: 15 },
  { letra: 'I', min: 16, max: 30 },
  { letra: 'N', min: 31, max: 45 },
  { letra: 'G', min: 46, max: 60 },
  { letra: 'O', min: 61, max: 75 },
];

export default function PlayGamePage() {
  const { jogoId } = useParams();
  const navigate = useNavigate();
  const { getJogo, marcarNumero, desfazerUltimoNumero, finalizarJogo } = useGames();
  const jogo = getJogo(jogoId);
  const [letraSelecionada, setLetraSelecionada] = useState('B');
  const [buscaCartela, setBuscaCartela] = useState('');

  const cartelasComBingo = useMemo(() => {
    if (!jogo) return [];
    return jogo.cartelas
      .map((c, i) => ({ cartela: c, indice: i + 1, status: statusCartela(c) }))
      .filter((r) => r.status.temBingo);
  }, [jogo]);

  const cartelasComIndice = useMemo(
    () => jogo?.cartelas.map((c, i) => ({ cartela: c, indice: i + 1 })) || [],
    [jogo]
  );

  const cartelasFiltradas = useMemo(() => {
    const termo = buscaCartela.trim().toLowerCase();
    if (!termo) return cartelasComIndice;
    return cartelasComIndice.filter(({ cartela: c }) =>
      (c.numero || '').toLowerCase().includes(termo)
    );
  }, [cartelasComIndice, buscaCartela]);

  if (!jogo) {
    return <div className="centro-loading">Jogo não encontrado.</div>;
  }

  function handleFinalizar() {
    if (!window.confirm('Finalizar jogo? Ele será movido para o histórico com o resultado atual.')) {
      return;
    }
    finalizarJogo(jogoId).then(() => navigate('/'));
  }

  const faixaAtual = FAIXAS.find((f) => f.letra === letraSelecionada);
  const numerosDaFaixa = [];
  for (let n = faixaAtual.min; n <= faixaAtual.max; n++) numerosDaFaixa.push(n);

  return (
    <div className="page">
      <h1 className="page-titulo">{jogo.nome}</h1>
      <p className="page-subtitulo">
        {jogo.numerosSorteados.length} número(s) chamado(s) · {jogo.cartelas.length} cartela(s)
      </p>

      {cartelasComBingo.length > 0 && (
        <div className="aviso-bingo">
          🎉 BINGO! Cartela(s){' '}
          {cartelasComBingo
            .map((r) => (r.cartela.numero ? `Nº ${r.cartela.numero}` : `#${r.indice}`))
            .join(', ')}
        </div>
      )}

      <div className="bola-letras">
        {FAIXAS.map((f) => (
          <button
            key={f.letra}
            className={`bola-letra-botao ${letraSelecionada === f.letra ? 'ativa' : ''}`}
            onClick={() => setLetraSelecionada(f.letra)}
          >
            {f.letra}
          </button>
        ))}
      </div>

      <div className="grade-bolas">
        {numerosDaFaixa.map((n) => {
          const jaSorteado = jogo.numerosSorteados.includes(n);
          return (
            <button
              key={n}
              className="bola"
              disabled={jaSorteado}
              onClick={() => marcarNumero(jogoId, n)}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="linha-botoes" style={{ marginBottom: 24 }}>
        <button className="botao botao-fantasma" onClick={() => desfazerUltimoNumero(jogoId)}>
          ↩ Desfazer último
        </button>
        <button className="botao botao-vermelho" onClick={handleFinalizar}>
          Finalizar jogo
        </button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--navy)' }}>
        Cartelas ({jogo.cartelas.length})
      </h2>

      <input
        className="campo busca-cartela"
        placeholder="🔍 Buscar cartela pelo número..."
        value={buscaCartela}
        onChange={(e) => setBuscaCartela(e.target.value)}
      />

      {cartelasFiltradas.length === 0 && (
        <p className="page-subtitulo">Nenhuma cartela encontrada com esse número.</p>
      )}

      {cartelasFiltradas.map(({ cartela: c, indice }) => (
        <BingoCard key={c.id} cartela={c} titulo={`Cartela #${indice}`} />
      ))}
    </div>
  );
}