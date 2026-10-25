import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/unificado/laboratorio/dosagem/native/',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [react()],
  build: {
    outDir: 'dist-native',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: 'src/native.tsx', name: 'ConcreTrackDosagemNative', formats: ['es'], fileName: () => 'dosagem-native.js', cssFileName: 'dosagem-native' },
  },
});
