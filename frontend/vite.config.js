import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  // Vitest: `npm test`. Tests sit next to the code they cover (*.test.js / *.test.jsx).
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
