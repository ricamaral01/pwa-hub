import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/unificado/producao/ribeirao/',
  build: {
    outDir: '..',
    emptyOutDir: false,
    rollupOptions: { input: resolve(__dirname, 'index.html') },
  },
});
