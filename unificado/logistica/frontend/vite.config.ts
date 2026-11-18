import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],define:{'process.env.NODE_ENV':'"production"'},build:{outDir:'../dist',emptyOutDir:true,lib:{entry:'src/native.tsx',formats:['es'],fileName:()=> 'logistica-native.js'},cssCodeSplit:false,rollupOptions:{output:{assetFileNames:'logistica-native.[ext]'}}}});
