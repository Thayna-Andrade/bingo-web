import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' faz os caminhos dos arquivos gerados serem relativos, o que
// funciona automaticamente no GitHub Pages (não importa o nome do
// repositório, não precisa configurar nada extra).
export default defineConfig({
  plugins: [react()],
  base: './',
});
