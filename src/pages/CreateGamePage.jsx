import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGames } from '../context/GamesContext';

export default function CreateGamePage() {
  const { criarJogo, getJogo } = useGames();
  const navigate = useNavigate();
  const { jogoId: jogoIdDaUrl } = useParams();
  const [nomeJogo, setNomeJogo] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleCriarJogo(e) {
    e.preventDefault();
    if (!nomeJogo.trim()) {
      setErro('Dê um nome para o jogo (ex: "Bingo da Igreja - 14/07").');
      return;
    }
    setErro('');
    setCriando(true);
    try {
      const novoId = await criarJogo(nomeJogo);
      navigate(`/criar-jogo/${novoId}`, { replace: true });
    } catch (e) {
      setErro('Não foi possível criar o jogo. Confira sua conexão e tente de novo.');
    } finally {
      setCriando(false);
    }
  }

  const jogoAtual = jogoIdDaUrl ? getJogo(jogoIdDaUrl) : null;

  if (!jogoIdDaUrl) {
    return (
      <div className="page">
        <Link to="/" className="voltar-link">
          ← Voltar
        </Link>
        <h1 className="page-titulo">Criar jogo</h1>
        <p className="page-subtitulo">Dê um nome para identificar esse jogo depois.</p>

        <form onSubmit={handleCriarJogo}>
          {erro && <div className="erro-texto">{erro}</div>}
          <label className="rotulo">Nome do jogo</label>
          <input
            className="campo"
            placeholder='Ex: "Bingo da Igreja - 14/07"'
            value={nomeJogo}
            onChange={(e) => setNomeJogo(e.target.value)}
          />
          <button className="botao botao-navy" type="submit" disabled={criando}>
            {criando ? 'Criando...' : 'Criar jogo e adicionar cartelas'}
          </button>
        </form>
      </div>
    );
  }

  if (!jogoAtual) {
    return <div className="centro-loading">Carregando...</div>;
  }

  return (
    <div className="page">
      <h1 className="page-titulo">{jogoAtual.nome}</h1>
      <p className="page-subtitulo">{jogoAtual.cartelas.length} cartela(s) cadastrada(s)</p>

      {jogoAtual.cartelas.length === 0 ? (
        <p className="vazio">Nenhuma cartela ainda. Adicione a primeira abaixo!</p>
      ) : (
        jogoAtual.cartelas.map((c, i) => (
          <div key={c.id} className="lista-item">
            <span className="lista-item-titulo">
              Cartela #{i + 1}
              {c.numero && <span className="cartela-numero-badge" style={{ marginLeft: 8 }}>Nº {c.numero}</span>}
            </span>
          </div>
        ))
      )}

      <div style={{ marginTop: 20 }}>
        <Link to={`/adicionar-cartela/${jogoAtual.id}`} className="botao botao-navy" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
          ➕ Adicionar cartela
        </Link>
        <button className="botao botao-fantasma" onClick={() => navigate('/')}>
          Concluir por enquanto
        </button>
      </div>
    </div>
  );
}