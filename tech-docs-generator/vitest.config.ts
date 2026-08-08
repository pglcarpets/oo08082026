import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import { createViteConfig } from './vite.config.ts'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const repoRoot = path.resolve(packageRoot, '..')
const viteMode = process.env.NODE_ENV === 'production' ? 'production' : 'test'

export default mergeConfig(
  createViteConfig(viteMode),
  defineConfig({
    resolve: {
      // `mermaid` and `highlight.js` are declared only in this package's own
      // package.json (not hoisted to the workspace root). Test files live outside
      // this package under tests/tech-docs-generator/, so Vite must pin both to
      // the same resolved path the components use under src/.
      alias: {
        mermaid: path.resolve(packageRoot, 'node_modules/mermaid'),
        'highlight.js': path.resolve(packageRoot, 'node_modules/highlight.js'),
      },
    },
    test: {
      // forks is safer than threads on Windows for V8 coverage file merging.
      // Vitest 4 removed `poolOptions`; the former `forks.singleFork: false`
      // is now the default (one fork per file). isolate:true recycles module
      // state per file so mocks stay file-local and ts-morph ASTs do not
      // accumulate. Cross-file model cost is paid once via disk cache in
      // tests/tech-docs-generator/helpers/shared-repo-model.mjs.
      pool: 'forks',
      isolate: true,
      fileParallelism: false,
      // One fork only — ts-morph suites are heavy; no per-process heap cap.
      maxWorkers: 1,
      environment: 'happy-dom',
      // buildGeneratorModel({ repoRoot }) does a full repo scan and has been
      // observed taking 30-50s+ under load, past vitest's 30s default —
      // matches plans/README.md R1 note on this lane's timeout risk.
      testTimeout: 120_000,
      hookTimeout: 120_000,
      // Tests live under monorepo tests/tech-docs-generator/ (not package-local tests/)
      include: ['../tests/tech-docs-generator/**/*.test.{ts,tsx}'],
      globalSetup: ['../tests/tech-docs-generator/global-setup.mjs'],
      setupFiles: ['../tests/setup.ts', '../tests/tech-docs-generator/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        // Ambient types / empty barrels contribute 0% and dilute the gate.
        exclude: ['src/types/**', 'src/vite-env.d.ts', 'src/data/domainTypes.ts'],
        reportsDirectory: path.resolve(repoRoot, 'results', 'tooling', 'tech-docs', 'coverage'),
      },
    },
  }),
)
