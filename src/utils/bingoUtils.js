// Lógica central do bingo: estrutura da cartela, marcação e verificação de vitória.

export const LETRAS = ['B', 'I', 'N', 'G', 'O'];

// Cria uma cartela vazia (grade 5x5, coluna N tem espaço livre no meio)
export function criarCartelaVazia() {
  return {
    B: [null, null, null, null, null],
    I: [null, null, null, null, null],
    N: [null, null, 'FREE', null, null],
    G: [null, null, null, null, null],
    O: [null, null, null, null, null],
  };
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

// Verifica linhas horizontais completas. Retorna array com os índices das linhas completas (0-4).
export function linhasCompletas(cartela) {
  const completas = [];
  for (let linha = 0; linha < 5; linha++) {
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

// Verifica se a cartela está cheia (todas as 24 casas + FREE marcadas)
export function cartelaCheia(cartela) {
  return LETRAS.every((letra) =>
    cartela.numeros[letra].every((valor) => celulaMarcada(cartela, valor))
  );
}

export const MODOS_VITORIA = {
  LINHA: 'linha',
  CHEIA: 'cheia',
};

// Resumo do status de uma cartela: usado para destacar "BINGO!" na tela de
// marcação. O que conta como vitória depende do modo escolhido pra aquele
// jogo: só linha/coluna completa, ou só cartela cheia. `linhas`, `colunas`
// e `cheia` são sempre calculados (úteis pra mostrar o progresso), mas
// `temBingo` só fica true quando bate com a regra escolhida.
export function statusCartela(cartela, modoVitoria = MODOS_VITORIA.LINHA) {
  const linhas = linhasCompletas(cartela);
  const colunas = colunasCompletas(cartela);
  const cheia = cartelaCheia(cartela);
  const temBingo =
    modoVitoria === MODOS_VITORIA.CHEIA ? cheia : cheia || linhas.length > 0 || colunas.length > 0;
  return { linhas, colunas, cheia, temBingo };
}