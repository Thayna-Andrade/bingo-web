import { createWorker, PSM } from 'tesseract.js';

// Desenha a imagem (qualquer formato: jpeg, png, webp...) num canvas com
// fundo BRANCO sólido por baixo, antes de mandar pro OCR. Isso resolve um
// problema comum com PNG/WEBP: quando a imagem tem transparência, o motor
// de OCR pode "ver" o fundo transparente como preto ou com contraste ruim,
// e simplesmente não encontrar nenhum texto. Desenhando num canvas opaco,
// toda imagem passa a ser tratada de forma consistente, independente do
// formato original. De quebra, também aumenta imagens pequenas — números
// muito pequenos são mais difíceis de ler pelo OCR.
async function prepararImagemParaOCR(arquivo) {
  const bitmap = await createImageBitmap(arquivo);

  const ESCALA_MINIMA = 1400; // largura mínima "confortável" pro OCR
  const fatorEscala = bitmap.width < ESCALA_MINIMA ? ESCALA_MINIMA / bitmap.width : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * fatorEscala);
  canvas.height = Math.round(bitmap.height * fatorEscala);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return canvas;
}

// Roda o reconhecimento de texto direto no navegador da pessoa (WebAssembly),
// sem precisar de servidor nem de chave de API — importante porque o site é
// hospedado como arquivo estático no GitHub Pages, sem backend próprio.
//
// onProgress(0 a 1) é chamado durante o processo, para mostrar uma barra de
// progresso (o primeiro uso baixa ~2-4MB do modelo de idioma, então pode
// demorar um pouco na primeira vez).
export async function reconhecerTextoNaImagem(arquivo, onProgress) {
  const canvas = await prepararImagemParaOCR(arquivo);

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  try {
    // Números de cartela ficam espalhados em células, sem formar parágrafos
    // de texto corrido — SPARSE_TEXT é o modo do Tesseract feito pra achar
    // texto espalhado assim, em vez de assumir um bloco de texto contínuo.
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: '0123456789',
    });

    const { data } = await worker.recognize(canvas);
    // Tesseract retorna a estrutura em blocks > paragraphs > lines > words.
    // Achatamos tudo em uma lista simples de palavras com posição (bbox).
    const palavras = [];
    (data.blocks || []).forEach((bloco) => {
      (bloco.paragraphs || []).forEach((paragrafo) => {
        (paragrafo.lines || []).forEach((linha) => {
          (linha.words || []).forEach((palavra) => {
            palavras.push(palavra);
          });
        });
      });
    });
    // Fallback: em algumas versões, data.words já vem pronto no nível raiz
    return palavras.length > 0 ? palavras : data.words || [];
  } finally {
    await worker.terminate();
  }
}