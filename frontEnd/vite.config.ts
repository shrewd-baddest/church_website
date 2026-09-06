import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production' && !env.VITE_SERVER_URI) {
    throw new Error(
      'VITE_SERVER_URI must be set for production builds. Add VITE_SERVER_URI (https://church-website-q8z9.onrender.com/api/v1) to the Vercel environment variables, then rebuild.'
    )
  }
  return {
    plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon-48x48.png', 'favicon-96x96.png', 'favicon-144x144.png', 'icon-192x192.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'CSA Kirinyaga - Catholic Students Association',
        short_name: 'CSA KYU',
        description: 'Faith, fellowship and service at Kirinyaga University. Join jumuiyas, devotions, events, projects and give feedback.',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'social', 'religion'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: '/images/church.jpg',
            sizes: '1280x720',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'CSA Kirinyaga on desktop'
          },
          {
            src: '/images/mass.webp',
            sizes: '720x1280',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'CSA Kirinyaga on mobile'
          }
        ],
        related_applications: [],
        prefer_related_applications: false
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/church-website-q8z9\.onrender\.com\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    }),
  ],
  optimizeDeps: {
    include: ['react/jsx-runtime', 'framer-motion'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/localFileUploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/hub-view': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/css': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/styles': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/dist': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/components': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/community-view': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/authentication': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/questions': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
