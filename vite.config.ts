import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Test PWA',
        short_name: 'Test PWA',
        description: 'Aplicativo React + Vite instalável no Android e iOS.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        theme_color: '#863bff',
        background_color: '#ffffff',
        categories: ['utilities'],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: [
          '**/splash/**',
          '**/push-sw.js',
          '**/sw.js',
          '**/workbox-*.js',
        ],
        importScripts: ['push-sw.js'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: true,
      },
    }),
  ],
  server: {
    proxy: {
      '/api/push': 'http://localhost:8787',
    },
  },
  preview: {
    proxy: {
      '/api/push': 'http://localhost:8787',
    },
  },
})
