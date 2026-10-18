import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/dosagem-concreto/v2/',
  plugins: [react(), VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    manifest: {
      name: 'ConcreTrack Dosagem',
      short_name: 'Dosagem',
      theme_color: '#0A1530',
      background_color: '#EEF1F7',
      display: 'standalone',
      start_url: '/dosagem-concreto/v2/',
      scope: '/dosagem-concreto/v2/',
      icons: [{ src: '/assets/img/logo-concretrack.png', sizes: 'any', type: 'image/png', purpose: 'any' }]
    },
    injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] }
  })],
  build: { outDir: '../dosagem-concreto/v2', emptyOutDir: true },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts', 'tests/golden/**/*.test.ts'] }
});
