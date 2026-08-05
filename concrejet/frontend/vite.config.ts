import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

const httpsEnabled = process.env.VITE_HTTPS_ENABLED === 'true';
const httpsCertPath = process.env.VITE_HTTPS_CERT_PATH;
const httpsKeyPath = process.env.VITE_HTTPS_KEY_PATH;
const httpsPort = Number(process.env.VITE_HTTPS_PORT ?? 5174);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // não atualiza automaticamente durante apontamento
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'ConcreTrack Injeção',
        short_name: 'ConcreTrack',
        description: 'Sistema industrial de apontamento de produção por injeção plástica',
        theme_color: '#1F242C',
        background_color: '#1F242C',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // NetworkFirst para API — não serve dados velhos como novos
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 min
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Nunca cachear endpoints de autenticação
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: httpsEnabled ? httpsPort : 5173,
    strictPort: httpsEnabled,
    https:
      httpsEnabled && httpsCertPath && httpsKeyPath
        ? {
            cert: fs.readFileSync(httpsCertPath),
            key: fs.readFileSync(httpsKeyPath),
          }
        : undefined,
    hmr: httpsEnabled
      ? {
          protocol: 'wss',
          port: httpsPort,
        }
      : undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
