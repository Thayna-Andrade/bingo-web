import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import { LETRAS, criarCartelaVazia } from '../utils/bingoUtils';
import { reconhecerTextoNaImagem } from '../services/ocr';
import { montarCartelaAPartirDoOCR } from '../services/bingoParser';

export default function AddCardPage() {
  const { jogoId } = useParams();
  const navigate = useNavigate();
  const { adicionarCartela, getJogo } = useGames();
  const jogo = getJogo(jogoId);

  const [numeros, setNumeros] = useState(criarCartelaVazia());
  const [salvarOutra, setSalvarOutra] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [previewUrl, setPreviewUrl] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [avisoOcr, setAvisoOcr] = useState('');
  const inputFotoRef = useRef(null);
  const inputGaleriaRef = useRef(null);

  function atualizarCelula(letra, indice, texto) {
    const valor = texto.trim();
    setNumeros((prev) => {
      const coluna = [...prev[letra]];
      coluna[indice] = valor === '' ? null : parseInt(valor, 10) || null;
      return { ...prev, [letra]: coluna };
    });
  }

  async function handleArquivoSelecionado(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setPreviewUrl(URL.createObjectURL(arquivo));
    setAvisoOcr('');
    setErro('');
    setProcessando(true);
    setProgresso(0);

    try {
      const palavras = await reconhecerTextoNaImagem(arquivo, setProgresso);
      const cartelaReconhecida = montarCartelaAPartirDoOCR(palavras);
      setNumeros(cartelaReconhecida);
      setAvisoOcr('Números reconhecidos! Revise com cuidado antes de salvar — o OCR pode errar.');
    } catch (err) {
      setAvisoOcr('Não deu para ler a imagem automaticamente. Digite os números manualmente abaixo.');
    } finally {
      setProcessando(false);
      // Limpa o input para permitir escolher a mesma foto de novo depois, se quiser
      e.target.value = '';
    }
  }

  async function handleSalvar() {
    const totalPreenchido = LETRAS.reduce(
      (soma, letra) => soma + numeros[letra].filter((v) => v !== null).length,
      0
    );
    if (totalPreenchido < 24) {
      setErro(`Faltam números (${totalPreenchido}/24 preenchidos). Confira a grade antes de salvar.`);
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      await adicionarCartela(jogoId, numeros);
      if (salvarOutra) {
        setNumeros(criarCartelaVazia());
        setPreviewUrl(null);
        setAvisoOcr('');
      } else {
        navigate(`/criar-jogo/${jogoId}`);
      }
    } catch (e) {
      setErro('Não foi possível salvar a cartela. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (!jogo) {
    return <div className="centro-loading">Jogo não encontrado.</div>;
  }

  return (
    <div className="page">
      <Link to={`/criar-jogo/${jogoId}`} className="voltar-link">
        ← Voltar para o jogo
      </Link>
      <h1 className="page-titulo">Adicionar cartela</h1>
      <p className="page-subtitulo">
        Envie uma foto da cartela para preencher automaticamente, ou digite os números direto na grade.
      </p>

      {erro && <div className="erro-texto">{erro}</div>}

      <div className="foto-area">
        {previewUrl ? (
          <img src={previewUrl} alt="Prévia da cartela" className="foto-preview" />
        ) : (
          <div className="foto-vazia">Nenhuma imagem selecionada</div>
        )}

        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleArquivoSelecionado}
        />
        <input
          ref={inputGaleriaRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleArquivoSelecionado}
        />

        <div className="linha-botoes">
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno"
            onClick={() => inputFotoRef.current?.click()}
            disabled={processando}
          >
            📷 Tirar/enviar foto
          </button>
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno"
            onClick={() => inputGaleriaRef.current?.click()}
            disabled={processando}
          >
            🖼 Escolher arquivo
          </button>
        </div>

        {processando && (
          <div className="ocr-progresso">
            <div className="ocr-progresso-barra">
              <div
                className="ocr-progresso-preenchido"
                style={{ width: `${Math.round(progresso * 100)}%` }}
              />
            </div>
            <span>Lendo a cartela... {Math.round(progresso * 100)}%</span>
          </div>
        )}

        {avisoOcr && !processando && <div className="ocr-aviso">{avisoOcr}</div>}
      </div>

      <p className="page-subtitulo" style={{ marginTop: 20 }}>
        Confira/edite os números (obrigatório revisar mesmo com foto):
      </p>

      <div className="cartela-grade" style={{ marginBottom: 8 }}>
        {LETRAS.map((letra) => (
          <div key={letra} className="cartela-cabecalho">
            {letra}
          </div>
        ))}

        {[0, 1, 2, 3, 4].map((linha) =>
          LETRAS.map((letra) => {
            const isFree = letra === 'N' && linha === 2;
            return (
              <div key={letra + linha} className="cartela-celula" style={{ background: isFree ? 'var(--gold-light)' : '#fff' }}>
                {isFree ? (
                  '★'
                ) : (
                  <input
                    className="cartela-celula-input"
                    inputMode="numeric"
                    maxLength={2}
                    value={numeros[letra][linha] ?? ''}
                    onChange={(e) => atualizarCelula(letra, linha, e.target.value)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <label className="checkbox-linha">
        <span
          className={`checkbox-caixa ${salvarOutra ? 'marcado' : ''}`}
          onClick={() => setSalvarOutra((v) => !v)}
        >
          {salvarOutra && '✓'}
        </span>
        Adicionar outra cartela em seguida
      </label>

      <button className="botao botao-verde" onClick={handleSalvar} disabled={salvando || processando}>
        {salvando ? 'Salvando...' : 'Salvar cartela'}
      </button>
    </div>
  );
}
