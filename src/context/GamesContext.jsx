import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { criarCartelaVazia, marcarNumeroNoJogo, statusCartela, MODOS_VITORIA, FORMATOS_CARTELA } from '../utils/bingoUtils';
import { useAuth } from './AuthContext';

const GamesContext = createContext(null);

function novoId() {
  return crypto.randomUUID();
}

export function GamesProvider({ children }) {
  const { usuario } = useAuth();
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) {
      setJogos([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const q = query(collection(db, 'jogos'), where('userId', '==', usuario.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
        setJogos(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error('Erro ao carregar jogos:', erro);
        setCarregando(false);
      }
    );
    return unsubscribe;
  }, [usuario]);

  async function criarJogo(nome, modoVitoria = MODOS_VITORIA.LINHA) {
    const docRef = await addDoc(collection(db, 'jogos'), {
      userId: usuario.uid,
      nome: nome.trim() || 'Jogo sem nome',
      criadoEm: new Date().toISOString(),
      status: 'em_andamento',
      modoVitoria,
      numerosSorteados: [],
      cartelas: [],
    });
    return docRef.id;
  }

  async function adicionarCartela(jogoId, numeros, numeroIdentificacao = '', formatoId = FORMATOS_CARTELA.CINCO_LIVRE.id) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    const cartela = {
      id: novoId(),
      numero: numeroIdentificacao.trim() || null,
      formatoId,
      numeros: numeros || criarCartelaVazia(),
      marcados: [],
    };
    await updateDoc(doc(db, 'jogos', jogoId), { cartelas: [...jogo.cartelas, cartela] });
  }

  async function removerCartela(jogoId, cartelaId) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    await updateDoc(doc(db, 'jogos', jogoId), {
      cartelas: jogo.cartelas.filter((c) => c.id !== cartelaId),
    });
  }

  // Edição completa: número de identificação, formato e todos os números da
  // grade. Marcações já feitas são preservadas (só descarta marcações de
  // números que deixaram de existir na cartela, caso o formato mude).
  async function editarCartela(jogoId, cartelaId, { numero, formatoId, numeros }) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    await updateDoc(doc(db, 'jogos', jogoId), {
      cartelas: jogo.cartelas.map((c) => {
        if (c.id !== cartelaId) return c;
        const numerosValidos = new Set();
        Object.values(numeros).forEach((coluna) =>
          coluna.forEach((v) => {
            if (typeof v === 'number') numerosValidos.add(v);
          })
        );
        return {
          ...c,
          numero: (numero || '').trim() || null,
          formatoId,
          numeros,
          marcados: c.marcados.filter((n) => numerosValidos.has(n)),
        };
      }),
    });
  }

  async function marcarNumero(jogoId, numero) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    const atualizado = marcarNumeroNoJogo(jogo, numero);
    await updateDoc(doc(db, 'jogos', jogoId), {
      numerosSorteados: atualizado.numerosSorteados,
      cartelas: atualizado.cartelas,
    });
  }

  async function desfazerUltimoNumero(jogoId) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo || jogo.numerosSorteados.length === 0) return;
    const ultimo = jogo.numerosSorteados[jogo.numerosSorteados.length - 1];
    await updateDoc(doc(db, 'jogos', jogoId), {
      numerosSorteados: jogo.numerosSorteados.slice(0, -1),
      cartelas: jogo.cartelas.map((c) => ({
        ...c,
        marcados: c.marcados.filter((n) => n !== ultimo),
      })),
    });
  }

  async function finalizarJogo(jogoId) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    const vencedoras = jogo.cartelas
      .map((c, index) => ({ cartela: c, index, status: statusCartela(c, jogo.modoVitoria) }))
      .filter((r) => r.status.temBingo)
      .map((r) => ({
        cartelaId: r.cartela.id,
        indice: r.index + 1,
        numero: r.cartela.numero || null,
        status: r.status,
      }));
    await updateDoc(doc(db, 'jogos', jogoId), {
      status: 'finalizado',
      finalizadoEm: new Date().toISOString(),
      vencedoras,
    });
  }

  async function excluirJogo(jogoId) {
    await deleteDoc(doc(db, 'jogos', jogoId));
  }

  // Cria um novo jogo reaproveitando as cartelas de um jogo já existente —
  // útil quando o mesmo conjunto de cartelas físicas é usado em mais de um
  // bingo. As cartelas são copiadas (com números e formato), mas cada uma
  // ganha um id novo e começa desmarcada; o jogo novo começa "em andamento",
  // sem nenhum número sorteado ainda.
  async function duplicarJogo(jogoId, novoNome) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    const docRef = await addDoc(collection(db, 'jogos'), {
      userId: usuario.uid,
      nome: (novoNome || `${jogo.nome} (cópia)`).trim() || `${jogo.nome} (cópia)`,
      criadoEm: new Date().toISOString(),
      status: 'em_andamento',
      modoVitoria: jogo.modoVitoria || MODOS_VITORIA.LINHA,
      numerosSorteados: [],
      cartelas: jogo.cartelas.map((c) => ({
        ...c,
        id: novoId(),
        marcados: [],
      })),
    });
    return docRef.id;
  }

  // Edita nome e/ou modo de vitória de um jogo já criado (útil logo depois
  // de duplicar, ou a qualquer momento antes de finalizar o jogo)
  async function editarJogo(jogoId, { nome, modoVitoria }) {
    const dados = {};
    if (nome !== undefined) dados.nome = nome.trim() || 'Jogo sem nome';
    if (modoVitoria !== undefined) dados.modoVitoria = modoVitoria;
    await updateDoc(doc(db, 'jogos', jogoId), dados);
  }

  function getJogo(jogoId) {
    return jogos.find((j) => j.id === jogoId) || null;
  }

  return (
    <GamesContext.Provider
      value={{
        jogos,
        carregando,
        criarJogo,
        adicionarCartela,
        removerCartela,
        editarCartela,
        marcarNumero,
        desfazerUltimoNumero,
        finalizarJogo,
        excluirJogo,
        duplicarJogo,
        editarJogo,
        getJogo,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error('useGames precisa estar dentro de um GamesProvider');
  return ctx;
}