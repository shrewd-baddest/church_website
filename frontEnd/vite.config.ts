import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
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
    },
  },
})
