import { LETRAS, criarCartelaVazia } from '../utils/bingoUtils';

// Recebe as palavras detectadas pelo Tesseract (cada uma com .text e .bbox
// = {x0, y0, x1, y1}) e tenta remontar a grade 5x5 da cartela.
//
// Estratégia (heurística — por isso a tela seguinte sempre permite revisar e
// corrigir manualmente antes de salvar, já que OCR nunca é 100% perfeito):
// 1. Fica só com palavras que são números de 1 a 75 (ignora cabeçalho
//    "B I N G O", bordas, logos etc).
// 2. Calcula o centro (x, y) de cada número.
// 3. Agrupa os números em 5 colunas pela posição X (esquerda -> direita = B,I,N,G,O).
// 4. Dentro de cada coluna, ordena pela posição Y (cima -> baixo) e preenche
//    as 5 linhas. A coluna N recebe o espaço central como "FREE".
export function montarCartelaAPartirDoOCR(palavras) {
  const numeros = palavras
    .map((p) => {
      const texto = (p.text || '').trim();
      const valor = parseInt(texto, 10);
      if (Number.isNaN(valor) || valor < 1 || valor > 75) return null;
      // Só aceita se o texto reconhecido for só dígitos (evita "B1" etc. sendo lido como 1)
      if (!/^\d+$/.test(texto)) return null;
      const bbox = p.bbox;
      if (!bbox) return null;
      const x = (bbox.x0 + bbox.x1) / 2;
      const y = (bbox.y0 + bbox.y1) / 2;
      return { valor, x, y };
    })
    .filter(Boolean);

  const cartela = criarCartelaVazia();
  if (numeros.length === 0) return cartela;

  // Divide em 5 colunas por posição X usando quantis (mais robusto que
  // dividir a largura em faixas fixas, pois a foto pode estar levemente torta)
  const ordenadosPorX = [...numeros].sort((a, b) => a.x - b.x);
  const tamanhoColuna = Math.ceil(ordenadosPorX.length / 5);
  const colunas = [[], [], [], [], []];
  ordenadosPorX.forEach((item, i) => {
    const indiceColuna = Math.min(4, Math.floor(i / tamanhoColuna));
    colunas[indiceColuna].push(item);
  });

  colunas.forEach((coluna, indiceColuna) => {
    const letra = LETRAS[indiceColuna];
    const ordenadaPorY = [...coluna].sort((a, b) => a.y - b.y);
    if (letra === 'N') {
      // Coluna N tem espaço livre no meio (linha 2, índice 2) -> só 4 números
      const valores = ordenadaPorY.map((n) => n.valor);
      const linhas = [valores[0], valores[1], 'FREE', valores[2], valores[3]];
      cartela.N = linhas.map((v) => (v === undefined ? null : v));
    } else {
      const valores = ordenadaPorY.slice(0, 5).map((n) => n.valor);
      cartela[letra] = [0, 1, 2, 3, 4].map((i) => (valores[i] !== undefined ? valores[i] : null));
    }
  });

  return cartela;
}
