import { createWorker } from 'tesseract.js';

// Roda o reconhecimento de texto direto no navegador da pessoa (WebAssembly),
// sem precisar de servidor nem de chave de API — importante porque o site é
// hospedado como arquivo estático no GitHub Pages, sem backend próprio.
//
// onProgress(0 a 1) é chamado durante o processo, para mostrar uma barra de
// progresso (o primeiro uso baixa ~2-4MB do modelo de idioma, então pode
// demorar um pouco na primeira vez).
export async function reconhecerTextoNaImagem(arquivoOuUrl, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  try {
    const { data } = await worker.recognize(arquivoOuUrl);
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
