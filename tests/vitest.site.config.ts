import { defineConfig } from 'vitest/config';
import path from 'path';

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_DEFAULT_EXCLUDE,
  VITEST_COVERAGE_DIRS,
  VITEST_REPORT_PATHS,
  VITEST_REPO_ROOT,
  VITEST_SETUP_FILE,
  VITEST_CONSOLE_REPORTER,
  VITEST_TEST_INCLUDE,
  VITEST_WORKSPACE_ROOT,
} from './vitest.shared.ts';

export default defineConfig({
  root: VITEST_REPO_ROOT,
  cacheDir: VITEST_CACHE_DIR,
  server: {
    fs: { allow: [VITEST_WORKSPACE_ROOT] },
  },
  resolve: {
    alias: {
      // Planner / Studio category aliases. These must precede the bare "@"
      // entry below, which would otherwise swallow "@planner/*" and "@studio/*".
      '@planner/components': path.resolve(VITEST_REPO_ROOT, 'components/Planner'),
      '@planner/lib': path.resolve(VITEST_REPO_ROOT, 'lib/Planner'),
      '@planner/hooks': path.resolve(VITEST_REPO_ROOT, 'hooks/Planner'),
      '@planner/store': path.resolve(VITEST_REPO_ROOT, 'store/Planner'),
      '@planner/server': path.resolve(VITEST_REPO_ROOT, 'server/Planner'),
      '@studio/components': path.resolve(VITEST_REPO_ROOT, 'components/Studio'),
      '@studio/lib': path.resolve(VITEST_REPO_ROOT, 'lib/Studio'),
      '@studio/hooks': path.resolve(VITEST_REPO_ROOT, 'hooks/Studio'),
      '@studio/store': path.resolve(VITEST_REPO_ROOT, 'store/Studio'),
      '@studio/server': path.resolve(VITEST_REPO_ROOT, 'server/Studio'),
      '@/types': path.resolve(VITEST_REPO_ROOT, 'platform/types'),
      '@/app': path.resolve(VITEST_REPO_ROOT, 'app'),
      '@/components': path.resolve(VITEST_REPO_ROOT, 'components'),
      '@/data': path.resolve(VITEST_REPO_ROOT, 'data'),
      '@/features': path.resolve(VITEST_REPO_ROOT, 'features'),
      '@/lib': path.resolve(VITEST_REPO_ROOT, 'lib'),
      '@/scripts': path.resolve(VITEST_WORKSPACE_ROOT, 'scripts'),
      '@/tests': path.resolve(VITEST_WORKSPACE_ROOT, 'tests'),
      '@focss': path.resolve(VITEST_WORKSPACE_ROOT, 'site/focss'),
      '@': VITEST_REPO_ROOT,
    },
  },
  test: {
    // Coverage-only profile (`test:coverage:site`). forks + isolate recycles each
    // worker after its file finishes (graceful stop) instead of mass terminate at
    // merge — parallel coverage writers caused .tmp ENOENT on Windows.
    pool: 'forks',
    isolate: true,
    fileParallelism: false,
    maxWorkers: 1,
    globals: true,
    environment: 'happy-dom',
    setupFiles: [VITEST_SETUP_FILE],
    reporters: [
      'default',
      'json',
      [VITEST_CONSOLE_REPORTER, { outputFile: VITEST_REPORT_PATHS.site.console }],
    ],
    outputFile: {
      json: VITEST_REPORT_PATHS.site.json,
    },
    include: [...VITEST_TEST_INCLUDE],
    exclude: [...VITEST_DEFAULT_EXCLUDE],
    coverage: {
      provider: 'v8',
      reportsDirectory: VITEST_COVERAGE_DIRS.site,
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS],
      // `coverage.all` was removed in Vitest 4 — every file matching
      // `include` is instrumented by default. The option was silently ignored
      // here and type-errored under `typecheck:tests`.
      // Site-logic scope (see plans/SITE-COVERAGE.md).
      include: [
        'features/site/data/**/*.{ts,tsx}',
        'lib/catalog/**/*.{ts,tsx}',
        'lib/configurator/**/*.ts',
        'lib/catalog/site/**/*.{ts,tsx}',
        'features/site/assistant/**/*.{ts,tsx}',
        'features/ops/**/*.{ts,tsx}',
        'features/site/advisor/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.mock.{ts,tsx}',
        '**/node_modules/**',
        '**/archive/**',
        '**/.next/**',
        '**/.cursor/**',
        '**/.vscode/**',
        '**/.git/**',
        '**/.github/**',
        '**/.playwright-cli/**',
        '**/*.md',
        '**/*.log',
        '**/*.txt',
        '**/*.csv',
        '**/*.svg',
        '**/public/**',
        '**/results/**',
        '**/scripts/**',
        '**/tests/**',
        '**/Plans/**',
        '**/docs/**',
        '**/Agents/**',
        '**/generated-documents/**',
        '**/dist/**',
        '**/build/**',
      ],
      // User quality bar: 95% floor on scoped site include.
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
