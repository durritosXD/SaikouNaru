import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'strokes/*.gif'],
      manifest: {
        name: 'SaikouNaru - Japanese SRS Learning',
        short_name: 'SaikouNaru',
        description: 'SaikouNaru (最高成) - Become Great. Highly customizable Japanese Kanji, Vocab & Grammar Spaced Repetition app.',
        theme_color: '#0B0F19',
        background_color: '#0B0F19',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,gif,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 // 6 MB limit for large pre-bundled decks
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  optimizeDeps: {
    exclude: ['sql.js']
  }
});
