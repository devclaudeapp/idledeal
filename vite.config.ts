import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base relative pour pouvoir être servi depuis GitHub Pages (/<repo>/)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Idle Deal — Empire du crime',
        short_name: 'Idle Deal',
        description: 'Idle/tycoon criminel : deal, racket, braquages, blanchiment.',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})
