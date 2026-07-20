import { LETRAS, criarCartelaVazia } from '../utils/bingoUtils';

// Recebe as palavras detectadas pelo Tesseract (cada uma com .text e .bbox
// = {x0, y0, x1, y1}) e tenta remontar a grade 5x5 da cartela.
//
// Estratégia (heurística — por isso a tela seguinte sempre permite revisar e
// corrigir manualmente antes de salvar, já que OCR nunca é 100% perfeito):
// 1. Fica só com palavras que são números de 1 a 75 (ignora cabeçalho
//    "B I N G O", bordas, logos etc).
// 2. Calcula o centro (x, y) de cada número.
// 3. Calcula a posição de CADA número de forma proporcional dentro da área
//    onde os números aparecem (não por contagem/ordem). Isso é importante:
//    se algum número não for lido pelo OCR (comum quando fica perto de um
//    desenho, ou é um número "sozinho" tipo 1-9), ele simplesmente fica em
//    branco na posição certa, em vez de embaralhar os números vizinhos.
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
      const confianca = p.confidence ?? 0;
      return { valor, x, y, confianca };
    })
    .filter(Boolean);

  const cartela = criarCartelaVazia();
  if (numeros.length === 0) return cartela;

  const xs = numeros.map((n) => n.x);
  const ys = numeros.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Evita divisão por zero se, por algum motivo, todos os números caíssem
  // exatamente na mesma linha/coluna detectada
  const larguraColuna = (maxX - minX) / 5 || 1;
  const alturaLinha = (maxY - minY) / 5 || 1;

  function indiceNaFaixa(valor, minimo, tamanhoFaixa) {
    const indice = Math.floor((valor - minimo) / tamanhoFaixa);
    return Math.max(0, Math.min(4, indice));
  }

  numeros.forEach((n) => {
    const coluna = indiceNaFaixa(n.x, minX, larguraColuna);
    const linha = indiceNaFaixa(n.y, minY, alturaLinha);
    const letra = LETRAS[coluna];

    // Se duas leituras caírem na mesma célula (raro, mas pode acontecer),
    // fica com a de maior confiança do OCR
    const atual = cartela[letra][linha];
    if (atual === null || atual === undefined) {
      cartela[letra][linha] = n.valor;
    } else if (typeof atual === 'number') {
      const existente = numeros.find(
        (x2) => x2.valor === atual && LETRAS[indiceNaFaixa(x2.x, minX, larguraColuna)] === letra
      );
      if (existente && n.confianca > existente.confianca) {
        cartela[letra][linha] = n.valor;
      }
    }
  });

  // O centro da coluna N é sempre o espaço livre, independente do que o OCR leu ali
  cartela.N[2] = 'FREE';

  return cartela;
}