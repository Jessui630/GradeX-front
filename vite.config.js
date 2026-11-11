import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'script',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
      manifest: {
        name: 'GradeX',
        short_name: 'GradeX',
        description: 'Evaluación profesional de originalidad de productos',
        theme_color: '#5b2ca0',
        background_color: '#f7f4fc',
        display: 'standalone',
        lang: 'es',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5048',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:5048',
        changeOrigin: true,
      },
    },
  },
})
