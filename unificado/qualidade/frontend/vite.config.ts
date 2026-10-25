import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/unificado/qualidade/',
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy: { '/unificado/qualidade/api': { target: 'http://127.0.0.1:13066', rewrite: path => path.replace('/unificado/qualidade', '') } } }
});
