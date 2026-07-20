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
import { criarCartelaVazia, marcarNumeroNoJogo, statusCartela } from '../utils/bingoUtils';
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

  async function criarJogo(nome) {
    const docRef = await addDoc(collection(db, 'jogos'), {
      userId: usuario.uid,
      nome: nome.trim() || 'Jogo sem nome',
      criadoEm: new Date().toISOString(),
      status: 'em_andamento',
      numerosSorteados: [],
      cartelas: [],
    });
    return docRef.id;
  }

  async function adicionarCartela(jogoId, numeros, numeroIdentificacao = '') {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    const cartela = {
      id: novoId(),
      numero: numeroIdentificacao.trim() || null,
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

  async function editarNumeroCartela(jogoId, cartelaId, numeroIdentificacao) {
    const jogo = jogos.find((j) => j.id === jogoId);
    if (!jogo) return;
    await updateDoc(doc(db, 'jogos', jogoId), {
      cartelas: jogo.cartelas.map((c) =>
        c.id === cartelaId ? { ...c, numero: numeroIdentificacao.trim() || null } : c
      ),
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
      .map((c, index) => ({ cartela: c, index, status: statusCartela(c) }))
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
        editarNumeroCartela,
        marcarNumero,
        desfazerUltimoNumero,
        finalizarJogo,
        excluirJogo,
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