import {defineConfig} from 'vite';import {resolve} from 'node:path';
export default defineConfig({root:resolve(__dirname,'pwa-production'),base:'/unificado/producao/ribeirao/app/',
  build:{outDir:resolve(__dirname,'../app'),emptyOutDir:false,rollupOptions:{input:resolve(__dirname,'pwa-production/index.html')}}});
