import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'server.test.js'],
    coverage: {
      provider: 'v8',
      all: true,
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.*',
        'src/testing/**',
        'src/main.jsx',
        'src/sw.js',
      ],
    },
  },
})
