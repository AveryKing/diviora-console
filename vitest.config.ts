import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        inline: [/copilotkit/],
      },
    },
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
