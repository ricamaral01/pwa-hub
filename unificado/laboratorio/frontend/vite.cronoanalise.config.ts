import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: '/unificado/laboratorio/cronoanalise/',
  build: {
    outDir: '../service/server/static/cronoanalise', emptyOutDir: true,
    rollupOptions: {input: resolve(__dirname, 'cronoanalise.html')}
  },
  server: {proxy: {'/unificado/laboratorio/api': {target: 'http://127.0.0.1:8088',
    rewrite: path => path.replace(/^\/unificado\/laboratorio/, '')}}}
});
