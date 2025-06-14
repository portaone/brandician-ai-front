import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8501,
    host: true
  },
  preview: {
    port: 8501,
    // Allow all hosts in production
    host: true
  }
})