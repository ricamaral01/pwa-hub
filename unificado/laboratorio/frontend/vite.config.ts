import {visualHead} from './visual-head';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react(),visualHead()], base:'/unificado/laboratorio/postes/', build:{outDir:'../service/server/static/postes', emptyOutDir:true}, server:{proxy:{'/api':'http://127.0.0.1:8088'}}});
