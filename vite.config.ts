import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: '0.0.0.0',
    cors: true,
    allowedHosts: [
      process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS || '.qs.hcllabs.net'
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
