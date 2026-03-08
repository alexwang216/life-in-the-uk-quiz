import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

// Read version from package.json at build time.
// WHY: The GitHub Action bumps package.json version before running `npm run build`,
// so this always picks up the correct version without any manual steps.
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  base: '/life-in-the-uk-quiz/',
  define: {
    // Expose version as a global constant — tree-shaken in production.
    // Access in code via: import.meta.env.VITE_APP_VERSION
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Life in the UK Quiz',
        short_name: 'UK Quiz',
        description: 'Adaptive quiz app for the Life in the UK test',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
