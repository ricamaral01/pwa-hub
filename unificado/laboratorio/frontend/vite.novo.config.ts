import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({plugins:[react()],base:'/unificado/laboratorio/novo/postes/',build:{outDir:'../service/server/static/novo/postes',emptyOutDir:true,rollupOptions:{input:'novo.html'}},server:{proxy:{'/api':'http://127.0.0.1:8088'}}});
