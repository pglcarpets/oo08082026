import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateAll } from './generate-all.mjs'
import { validateGeneratedDocs } from './check.mjs'
import { checkHardcoding } from './hardcoding-guard.mjs'
import { auditTests } from './fake-test-audit.mjs'
import { evaluateCoverage, loadCoverageSummary } from './check-coverage.mjs'
import { checkThemeAlignment } from './check-theme-alignment.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const packageRoot = path.resolve(scriptDir, '..')

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  })
  if (result.status !== 0) {
    throw new Error(`${args.join(' ')} failed with exit ${result.status ?? 'unknown'}`)
  }
}

/**
 * Single-pass gate:
 * 1. wipe + generate docs/data once (generate-all contract)
 * 2. validate surfaces (no second wipe)
 * 3. source guards
 * 4. tsc only (data already fresh)
 * 5. vite site build + publish manifest (CI artifact)
 * 6. vitest with coverage once
 */
export async function runDocsGate({ root = repoRoot } = {}) {
  console.log('docs:gate - generate')
  await generateAll({ repoRoot: root })

  console.log('docs:gate - validate')
  await validateGeneratedDocs({ repoRoot: root })

  console.log('docs:gate - hardcoding guard')
  const hardcoding = checkHardcoding({ root: packageRoot })
  if (hardcoding.length > 0) {
    throw new Error(
      `Hardcoding guard failed (${hardcoding.length}): ${hardcoding
        .map((item) => `${item.file}:${item.line}`)
        .join(', ')}`,
    )
  }

  console.log('docs:gate - fake-test audit')
  const fakeTests = auditTests({ root: packageRoot })
  if (fakeTests.length > 0) {
    throw new Error(`Fake-test audit failed (${fakeTests.length})`)
  }

  console.log('docs:gate - theme alignment')
  const themeViolations = checkThemeAlignment({ root: packageRoot })
  if (themeViolations.length > 0) {
    throw new Error(
      `Theme alignment failed (${themeViolations.length}): ${themeViolations
        .map((item) => `${item.file}: ${item.reason}`)
        .join('; ')}`,
    )
  }

  console.log('docs:gate - typecheck')
  runNode(
    [path.join(repoRoot, 'node_modules', 'typescript', 'lib', 'tsc.js'), '--noEmit'],
    packageRoot,
  )

  console.log('docs:gate - build site')
  runNode([path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], packageRoot)
  runNode([path.join(packageRoot, 'scripts', 'publish-all.mjs'), '--surfaces=site'], packageRoot)

  console.log('docs:gate - coverage')
  runNode(
    [path.join(repoRoot, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--coverage'],
    packageRoot,
  )
  const { summary, pageSummaries } = loadCoverageSummary({ root })
  const coverage = evaluateCoverage(summary, pageSummaries)
  for (const warning of coverage.warnings) {
    console.warn(`COVERAGE WARN: ${warning}`)
  }
  if (coverage.failures.length > 0) {
    throw new Error(`Coverage failed: ${coverage.failures.join('; ')}`)
  }

  console.log('docs:gate - passed')
  return true
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  runDocsGate().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
