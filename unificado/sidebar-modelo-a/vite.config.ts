import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: '../shell/modelo-a',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      formats: ['es'],
      fileName: () => 'menu.js',
    },
    rollupOptions: { output: { assetFileNames: () => 'menu.css' } },
  },
});
