// Lógica central do bingo: estrutura da cartela, marcação e verificação de vitória.

export const LETRAS = ['B', 'I', 'N', 'G', 'O'];

// Formatos de cartela suportados. Nem toda cartela é 5x5 com espaço livre no
// meio — algumas não têm o espaço livre, outras têm menos linhas. `linhas`
// é a quantidade de linhas (a quantidade de colunas é sempre 5, uma por
// letra), e `temLivre` diz se a casa central da coluna N é um espaço livre.
export const FORMATOS_CARTELA = {
  CINCO_LIVRE: {
    id: 'cinco_livre',
    linhas: 5,
    temLivre: true,
    label: '5 linhas, com espaço livre no meio',
    detalhe: '24 números + espaço livre',
  },
  CINCO_CHEIA: {
    id: 'cinco_cheia',
    linhas: 5,
    temLivre: false,
    label: '5 linhas, sem espaço livre',
    detalhe: '25 números',
  },
  QUATRO_CHEIA: {
    id: 'quatro_cheia',
    linhas: 4,
    temLivre: false,
    label: '4 linhas, sem espaço livre',
    detalhe: '20 números',
  },
};

export const LISTA_FORMATOS = Object.values(FORMATOS_CARTELA);

export function getFormatoPorId(formatoId) {
  return LISTA_FORMATOS.find((f) => f.id === formatoId) || FORMATOS_CARTELA.CINCO_LIVRE;
}

// Descobre o formato de uma cartela já existente a partir da própria grade
// (útil para cartelas antigas, salvas antes de existir o campo formatoId)
export function detectarFormato(numeros) {
  const linhas = numeros?.B?.length || 5;
  const temLivre = numeros?.N?.includes('FREE') || false;
  const encontrado = LISTA_FORMATOS.find((f) => f.linhas === linhas && f.temLivre === temLivre);
  return encontrado || FORMATOS_CARTELA.CINCO_LIVRE;
}

// Cria uma cartela vazia de acordo com o formato escolhido
export function criarCartelaVazia(formato = FORMATOS_CARTELA.CINCO_LIVRE) {
  const grade = {};
  LETRAS.forEach((letra) => {
    grade[letra] = Array(formato.linhas).fill(null);
  });
  if (formato.temLivre) {
    const linhaCentral = Math.floor(formato.linhas / 2);
    grade.N[linhaCentral] = 'FREE';
  }
  return grade;
}

// Retorna todos os números presentes em uma cartela (exceto o FREE)
export function numerosDaCartela(numeros) {
  const todos = [];
  LETRAS.forEach((letra) => {
    (numeros[letra] || []).forEach((n) => {
      if (n !== null && n !== 'FREE') todos.push(n);
    });
  });
  return todos;
}

// Verifica se um número está marcado nessa cartela
export function numeroEstaMarcado(cartela, numero) {
  return cartela.marcados.includes(numero);
}

// Marca um número em uma cartela específica, se ela tiver esse número.
// Retorna a cartela atualizada (não modifica a original).
export function marcarNumeroNaCartela(cartela, numero) {
  const contemNumero = numerosDaCartela(cartela.numeros).includes(numero);
  if (!contemNumero) return cartela;
  if (cartela.marcados.includes(numero)) return cartela;
  return {
    ...cartela,
    marcados: [...cartela.marcados, numero],
  };
}

// Marca um número em TODAS as cartelas de um jogo de uma vez.
// Esse é o coração do app: resolve o problema da Dona Maria.
export function marcarNumeroNoJogo(jogo, numero) {
  const jaSorteado = jogo.numerosSorteados.includes(numero);
  return {
    ...jogo,
    numerosSorteados: jaSorteado
      ? jogo.numerosSorteados
      : [...jogo.numerosSorteados, numero],
    cartelas: jogo.cartelas.map((c) => marcarNumeroNaCartela(c, numero)),
  };
}

function celulaMarcada(cartela, valor) {
  if (valor === 'FREE') return true;
  if (valor === null) return false;
  return cartela.marcados.includes(valor);
}

function numeroDeLinhas(cartela) {
  return cartela.numeros[LETRAS[0]].length;
}

// Verifica linhas horizontais completas. Retorna array com os índices das linhas completas.
export function linhasCompletas(cartela) {
  const completas = [];
  const linhas = numeroDeLinhas(cartela);
  for (let linha = 0; linha < linhas; linha++) {
    const completa = LETRAS.every((letra) =>
      celulaMarcada(cartela, cartela.numeros[letra][linha])
    );
    if (completa) completas.push(linha);
  }
  return completas;
}

// Verifica colunas completas. Retorna array com as letras das colunas completas.
export function colunasCompletas(cartela) {
  return LETRAS.filter((letra) =>
    cartela.numeros[letra].every((valor) => celulaMarcada(cartela, valor))
  );
}

// Verifica se a cartela está cheia (todas as casas + FREE marcadas)
export function cartelaCheia(cartela) {
  return LETRAS.every((letra) =>
    cartela.numeros[letra].every((valor) => celulaMarcada(cartela, valor))
  );
}

export const MODOS_VITORIA = {
  LINHA: 'linha',
  CHEIA: 'cheia',
};

function casasFaltando(lista, cartela) {
  return lista.filter((valor) => !celulaMarcada(cartela, valor)).length;
}

// Calcula quantas casas faltam para a cartela vencer, de acordo com o modo
// de vitória do jogo. No modo "linha", olha a linha/coluna mais perto de
// fechar; no modo "cheia", olha quantas casas faltam no total.
export function casasFaltandoParaVencer(cartela, modoVitoria = MODOS_VITORIA.LINHA) {
  if (modoVitoria === MODOS_VITORIA.CHEIA) {
    let total = 0;
    LETRAS.forEach((letra) => {
      total += casasFaltando(cartela.numeros[letra], cartela);
    });
    return total;
  }

  const linhas = numeroDeLinhas(cartela);
  let minimo = Infinity;

  for (let linha = 0; linha < linhas; linha++) {
    const valoresLinha = LETRAS.map((letra) => cartela.numeros[letra][linha]);
    minimo = Math.min(minimo, casasFaltando(valoresLinha, cartela));
  }
  LETRAS.forEach((letra) => {
    minimo = Math.min(minimo, casasFaltando(cartela.numeros[letra], cartela));
  });

  return minimo === Infinity ? 0 : minimo;
}

// Resumo do status de uma cartela: usado para destacar "BINGO!" e o aviso de
// "falta 1 número" na tela de marcação. O que conta como vitória depende do
// modo escolhido pra aquele jogo: só linha/coluna completa, ou só cartela
// cheia. `linhas`, `colunas` e `cheia` são sempre calculados (úteis pra
// mostrar o progresso), mas `temBingo` só fica true quando bate com a regra
// escolhida.
export function statusCartela(cartela, modoVitoria = MODOS_VITORIA.LINHA) {
  const linhas = linhasCompletas(cartela);
  const colunas = colunasCompletas(cartela);
  const cheia = cartelaCheia(cartela);
  const temBingo =
    modoVitoria === MODOS_VITORIA.CHEIA ? cheia : cheia || linhas.length > 0 || colunas.length > 0;
  const faltam = temBingo ? 0 : casasFaltandoParaVencer(cartela, modoVitoria);
  return { linhas, colunas, cheia, temBingo, faltam, quaseLa: faltam === 1 };
}