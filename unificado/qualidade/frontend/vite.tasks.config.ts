import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins:[react()],base:'/unificado/qualidade/',
  build:{outDir:'../dist-tasks',emptyOutDir:true,rollupOptions:{input:'tasks.html'}}
});
