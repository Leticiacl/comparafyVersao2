// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // 🔧 ajuda a reduzir o bundle e silencia warning exagerado enquanto ajustamos
  build: {
    chunkSizeWarningLimit: 1600, // 1.6 MiB
    rollupOptions: {
      output: {
        // separa libs pesadas em chunks próprios
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          heroicons: ['@heroicons/react'],
          charts: ['recharts'],
        },
      },
    },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Comparafy',
        short_name: 'Comparafy',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#facc15',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      // ✅ corrige o erro de “Assets exceeding the limit”
      workbox: {
        // aumenta o limite padrão (2 MiB) para suportar seu bundle atual
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB
        // (opcional) se quiser excluir JS grandes do precache, descomente:
        // globPatterns: ['**/*.{html,css,ico,png,svg,webp}'],
      },
    }),
  ],
});
