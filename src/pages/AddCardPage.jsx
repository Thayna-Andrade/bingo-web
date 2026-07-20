import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGames } from '../context/GamesContext';
import {
  LETRAS,
  criarCartelaVazia,
  FORMATOS_CARTELA,
  LISTA_FORMATOS,
  getFormatoPorId,
  detectarFormato,
} from '../utils/bingoUtils';
import { reconhecerTextoNaImagem } from '../services/ocr';
import { montarCartelaAPartirDoOCR } from '../services/bingoParser';

export default function AddCardPage() {
  const { jogoId, cartelaId } = useParams();
  const navigate = useNavigate();
  const { adicionarCartela, editarCartela, getJogo } = useGames();
  const jogo = getJogo(jogoId);
  const modoEdicao = Boolean(cartelaId);
  const cartelaExistente = modoEdicao ? jogo?.cartelas.find((c) => c.id === cartelaId) : null;

  const [formato, setFormato] = useState(FORMATOS_CARTELA.CINCO_LIVRE);
  const [numeros, setNumeros] = useState(criarCartelaVazia(FORMATOS_CARTELA.CINCO_LIVRE));
  const [numeroCartela, setNumeroCartela] = useState('');
  const [salvarOutra, setSalvarOutra] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [carregouExistente, setCarregouExistente] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [avisoOcr, setAvisoOcr] = useState('');
  const inputFotoRef = useRef(null);
  const inputGaleriaRef = useRef(null);

  // No modo edição, preenche o formulário com os dados já cadastrados dessa cartela
  useEffect(() => {
    if (modoEdicao && cartelaExistente && !carregouExistente) {
      const formatoDetectado = cartelaExistente.formatoId
        ? getFormatoPorId(cartelaExistente.formatoId)
        : detectarFormato(cartelaExistente.numeros);
      setFormato(formatoDetectado);
      setNumeros(cartelaExistente.numeros);
      setNumeroCartela(cartelaExistente.numero || '');
      setCarregouExistente(true);
    }
  }, [modoEdicao, cartelaExistente, carregouExistente]);

  function handleTrocarFormato(novoFormato) {
    if (novoFormato.id === formato.id) return;
    setFormato(novoFormato);
    setNumeros(criarCartelaVazia(novoFormato));
  }

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
      const cartelaReconhecida = montarCartelaAPartirDoOCR(palavras, formato);
      setNumeros(cartelaReconhecida);

      const totalReconhecido = LETRAS.reduce(
        (soma, letra) => soma + cartelaReconhecida[letra].filter((v) => typeof v === 'number').length,
        0
      );
      const esperado = formato.linhas * 5 - (formato.temLivre ? 1 : 0);

      if (totalReconhecido === 0) {
        setAvisoOcr(
          'Não conseguimos identificar nenhum número nessa imagem. Tente uma foto mais nítida, bem enquadrada e com boa luz — ou digite os números manualmente abaixo.'
        );
      } else if (totalReconhecido < esperado) {
        setAvisoOcr(
          `Reconhecemos ${totalReconhecido} de ${esperado} números. Complete e revise o restante na grade abaixo antes de salvar.`
        );
      } else {
        setAvisoOcr('Números reconhecidos! Revise com cuidado antes de salvar — o OCR pode errar.');
      }
    } catch (err) {
      setAvisoOcr('Não deu para ler a imagem automaticamente. Digite os números manualmente abaixo.');
    } finally {
      setProcessando(false);
      e.target.value = '';
    }
  }

  function totalEsperado() {
    return formato.linhas * 5 - (formato.temLivre ? 1 : 0);
  }

  async function handleSalvar() {
    const totalPreenchido = LETRAS.reduce(
      (soma, letra) => soma + numeros[letra].filter((v) => v !== null && v !== 'FREE').length,
      0
    );
    const esperado = totalEsperado();
    if (totalPreenchido < esperado) {
      setErro(`Faltam números (${totalPreenchido}/${esperado} preenchidos). Confira a grade antes de salvar.`);
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      if (modoEdicao) {
        await editarCartela(jogoId, cartelaId, { numero: numeroCartela, formatoId: formato.id, numeros });
        navigate(`/criar-jogo/${jogoId}`);
      } else {
        await adicionarCartela(jogoId, numeros, numeroCartela, formato.id);
        if (salvarOutra) {
          setNumeros(criarCartelaVazia(formato));
          setNumeroCartela('');
          setPreviewUrl(null);
          setAvisoOcr('');
        } else {
          navigate(`/criar-jogo/${jogoId}`);
        }
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
  if (modoEdicao && !cartelaExistente) {
    return <div className="centro-loading">Cartela não encontrada.</div>;
  }

  return (
    <div className="page">
      <Link to={`/criar-jogo/${jogoId}`} className="voltar-link">
        ← Voltar para o jogo
      </Link>
      <h1 className="page-titulo">{modoEdicao ? 'Editar cartela' : 'Adicionar cartela'}</h1>
      <p className="page-subtitulo">
        Envie uma foto da cartela para preencher automaticamente, ou digite os números direto na grade.
      </p>

      {erro && <div className="erro-texto">{erro}</div>}

      <label className="rotulo">Número da cartela (opcional)</label>
      <input
        className="campo"
        style={{ marginBottom: 16 }}
        placeholder='Ex: "1201" (o número impresso na cartela)'
        value={numeroCartela}
        onChange={(e) => setNumeroCartela(e.target.value)}
      />

      <label className="rotulo">Formato da cartela</label>
      <div className="formato-opcoes">
        {LISTA_FORMATOS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`formato-botao ${formato.id === f.id ? 'ativo' : ''}`}
            onClick={() => handleTrocarFormato(f)}
          >
            <span className="formato-titulo">{f.label}</span>
            <span className="formato-desc">{f.detalhe}</span>
          </button>
        ))}
      </div>
      <p className="page-subtitulo" style={{ marginTop: 6 }}>
        Atenção: trocar o formato reinicia a grade de números abaixo.
      </p>

      <div className="foto-area" style={{ marginTop: 16 }}>
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

        {Array.from({ length: formato.linhas }, (_, linha) =>
          LETRAS.map((letra) => {
            const isFree = formato.temLivre && letra === 'N' && linha === Math.floor(formato.linhas / 2);
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

      {!modoEdicao && (
        <label className="checkbox-linha">
          <span
            className={`checkbox-caixa ${salvarOutra ? 'marcado' : ''}`}
            onClick={() => setSalvarOutra((v) => !v)}
          >
            {salvarOutra && '✓'}
          </span>
          Adicionar outra cartela em seguida
        </label>
      )}

      <button className="botao botao-verde" onClick={handleSalvar} disabled={salvando || processando}>
        {salvando ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Salvar cartela'}
      </button>
    </div>
  );
}