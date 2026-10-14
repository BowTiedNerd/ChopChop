import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    testTimeout: 30000,
    // externalFigures.test renames a real SVG; parallel files raced on it
    fileParallelism: false,
    globals: true,
    environment: 'jsdom',
  },
})
