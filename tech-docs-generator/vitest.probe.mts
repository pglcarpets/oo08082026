import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const repoRoot = path.resolve(packageRoot, '..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      mermaid: path.resolve(packageRoot, 'node_modules/mermaid'),
      'highlight.js': path.resolve(packageRoot, 'node_modules/highlight.js'),
    },
  },
  test: {
    pool: 'forks',
    isolate: true,
    maxWorkers: 1,
    fileParallelism: false,
    environment: 'happy-dom',
    include: ['../tests/tech-docs-generator/**/*.test.{ts,tsx}'],
    setupFiles: ['../tests/setup.ts', '../tests/tech-docs-generator/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/types/**', 'src/vite-env.d.ts', 'src/data/domainTypes.ts'],
      reportsDirectory: path.resolve(repoRoot, 'results', 'tooling', 'tech-docs', 'coverage'),
    },
  },
})
