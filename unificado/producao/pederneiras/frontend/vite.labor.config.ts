import {defineConfig} from 'vite';import {resolve} from 'node:path';
export default defineConfig({root:resolve(__dirname,'pwa-labor'),base:'/unificado/producao/pederneiras/mao-de-obra/app/',
  build:{outDir:resolve(__dirname,'../mao-de-obra/app'),emptyOutDir:false,rollupOptions:{input:resolve(__dirname,'pwa-labor/index.html')}}});
