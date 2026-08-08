import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { comparePaths, normalizeSourceText } from './filesystem.mjs'
import { normalizeRepositoryInput } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function sourceHash(repoRoot, relativePath) {
  try {
    const content = normalizeSourceText(readFileSync(path.join(repoRoot, relativePath), 'utf8'))
    return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`
  } catch {
    return 'missing'
  }
}

function walkFiles(repoRoot, relativeRoot, predicate, out = []) {
  const absRoot = path.join(repoRoot, relativeRoot)
  if (!existsSync(absRoot)) return out

  for (const entry of readdirSync(absRoot, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeRoot.replace(/\\/g, '/'), entry.name)
    if (!normalizeRepositoryInput(repoRoot, relativePath)) continue

    if (entry.isDirectory()) {
      walkFiles(repoRoot, relativePath, predicate, out)
    } else if (predicate(relativePath)) {
      out.push(relativePath.replace(/\\/g, '/'))
    }
  }

  return out
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`)
}

function matchesAnyPattern(relativePath, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(relativePath))
}

function extractQuotedArray(source, key) {
  const match = source.match(new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`, 's'))
  if (!match) return []
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((entry) => entry[1])
}

function readConfigText(repoRoot, relativePath) {
  try {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8')
  } catch {
    return ''
  }
}

function collectRunnerDefinitions(repoRoot) {
  const runners = []

  // Product vitest config lives under monorepo tests/
  const siteVitestConfig = 'tests/vitest.config.ts'
  if (existsSync(path.join(repoRoot, siteVitestConfig))) {
    const sourceText = readConfigText(repoRoot, siteVitestConfig)
    runners.push({
      id: 'site:vitest',
      kind: 'vitest',
      label: 'site Vitest',
      sourcePath: siteVitestConfig,
      sourcePointer: 'test.include',
      sourceHash: sourceHash(repoRoot, siteVitestConfig),
      include: extractQuotedArray(sourceText, 'include').length
        ? extractQuotedArray(sourceText, 'include')
        : ['**/*.test.ts', '**/*.test.tsx'],
      exclude: extractQuotedArray(sourceText, 'exclude'),
      root: 'site',
    })
  }

  const generatorVitestConfig = 'tech-docs-generator/vitest.config.ts'
  if (existsSync(path.join(repoRoot, generatorVitestConfig))) {
    const sourceText = readConfigText(repoRoot, generatorVitestConfig)
    runners.push({
      id: 'tech-docs-generator:vitest',
      kind: 'vitest',
      label: 'tech-docs-generator Vitest',
      sourcePath: generatorVitestConfig,
      sourcePointer: 'test.include',
      sourceHash: sourceHash(repoRoot, generatorVitestConfig),
      include: extractQuotedArray(sourceText, 'include').length
        ? extractQuotedArray(sourceText, 'include')
        : ['tests/**/*.test.{ts,tsx}'],
      exclude: extractQuotedArray(sourceText, 'exclude'),
      root: 'tech-docs-generator',
    })
  }

  const playwrightConfig = 'config/build/playwright.config.ts'
  if (existsSync(path.join(repoRoot, playwrightConfig))) {
    const sourceText = readConfigText(repoRoot, playwrightConfig)
    const testDirMatch = sourceText.match(/testDir:\s*['"]([^'"]+)['"]/)
    const testMatch = extractQuotedArray(sourceText, 'testMatch')
    const testIgnore = extractQuotedArray(sourceText, 'testIgnore')
    runners.push({
      id: 'site:playwright',
      kind: 'playwright',
      label: 'site Playwright',
      sourcePath: playwrightConfig,
      sourcePointer: 'testDir',
      sourceHash: sourceHash(repoRoot, playwrightConfig),
      testDir: testDirMatch?.[1] ?? 'tests/e2e',
      testMatch: testMatch.length ? testMatch : ['**/*.spec.ts'],
      testIgnore,
      root: 'tests',
    })
  }

  return runners
}

export function extractRunnerSelection({ repoRoot = defaultRepoRoot } = {}) {
  const runners = collectRunnerDefinitions(repoRoot)
  const selections = []
  const gaps = []

  // All tests under monorepo tests/ (product + tech-docs-generator)
  const testFiles = [
    ...walkFiles(repoRoot, 'tests', (relativePath) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(relativePath)),
  ].sort((left, right) => comparePaths(left, right))

  for (const testFile of testFiles) {
    const root = testFile.startsWith('tests/tech-docs-generator/')
      ? 'tech-docs-generator'
      : testFile.startsWith('tests/')
        ? 'site'
        : 'site'
    const matchingRunners = runners.filter((runner) => {
      if (runner.kind === 'vitest' && runner.root === root) {
        const relativeToRoot =
          root === 'tech-docs-generator'
            ? testFile.replace(/^tests\/tech-docs-generator\//, '')
            : testFile.replace(/^tests\//, '')
        if (runner.exclude?.length && matchesAnyPattern(relativeToRoot, runner.exclude)) return false
        return matchesAnyPattern(relativeToRoot, runner.include)
      }

      if (runner.kind === 'playwright' && (root === 'site' || runner.root === 'tests')) {
        const relativeToSite = testFile.startsWith('tests/')
          ? testFile.slice('tests/'.length)
          : testFile
        const testDir = runner.testDir?.replace(/^site\//, '') ?? 'tests/e2e'
        if (!relativeToSite.startsWith(`${testDir}/`) && relativeToSite !== testDir) return false
        const fileName = path.basename(relativeToSite)
        if (runner.testIgnore?.length && matchesAnyPattern(fileName, runner.testIgnore)) return false
        return matchesAnyPattern(fileName, runner.testMatch)
      }

      return false
    })

    if (matchingRunners.length === 0) {
      gaps.push({
        testFile,
        relation: 'not-selected',
        sourcePath: testFile,
        sourcePointer: testFile,
        sourceHash: sourceHash(repoRoot, testFile),
      })
      continue
    }

    for (const runner of matchingRunners) {
      selections.push({
        testFile,
        runnerId: runner.id,
        relation: 'selected-by-runner',
        sourcePath: runner.sourcePath,
        sourcePointer: runner.sourcePointer,
        sourceHash: sourceHash(repoRoot, runner.sourcePath),
      })
    }
  }

  selections.sort((left, right) => comparePaths(`${left.testFile}:${left.runnerId}`, `${right.testFile}:${right.runnerId}`))
  gaps.sort((left, right) => comparePaths(left.testFile, right.testFile))

  return { runners, selections, gaps }
}