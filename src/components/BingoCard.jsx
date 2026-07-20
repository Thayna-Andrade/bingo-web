import React from 'react';
import { LETRAS, numeroEstaMarcado, statusCartela } from '../utils/bingoUtils';

export default function BingoCard({ cartela, titulo, modoVitoria }) {
  const status = statusCartela(cartela, modoVitoria);
  const linhas = cartela.numeros[LETRAS[0]].length;

  return (
    <div className={`cartela ${status.temBingo ? 'cartela-bingo' : ''} ${status.quaseLa ? 'cartela-quase-la' : ''}`}>
      {(titulo || cartela.numero) && (
        <p className="cartela-titulo">
          {titulo}
          {titulo && cartela.numero && ' · '}
          {cartela.numero && <span className="cartela-numero-badge">Nº {cartela.numero}</span>}
        </p>
      )}
      {status.cheia && <span className="cartela-selo">🎉 Cartela cheia!</span>}
      {!status.cheia && status.temBingo && (
        <span className="cartela-selo">✔ Linha/coluna completa</span>
      )}
      {!status.temBingo && status.quaseLa && (
        <span className="cartela-selo cartela-selo-alerta">⚠ Falta 1 número!</span>
      )}

      <div className="cartela-grade">
        {LETRAS.map((letra) => (
          <div key={letra} className="cartela-cabecalho">
            {letra}
          </div>
        ))}

        {Array.from({ length: linhas }, (_, linha) =>
          LETRAS.map((letra) => {
            const valor = cartela.numeros[letra][linha];
            const isFree = valor === 'FREE';
            const marcado = isFree || (valor !== null && numeroEstaMarcado(cartela, valor));
            return (
              <div
                key={letra + linha}
                className={`cartela-celula ${marcado ? 'cartela-celula-marcada' : ''}`}
              >
                {isFree ? '★' : valor ?? '-'}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}