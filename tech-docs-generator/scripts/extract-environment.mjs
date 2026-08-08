import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readSourceText } from './filesystem.mjs'
import { classifyEnvBrowserExposure } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const WALK_EXCLUDED_DIR_NAMES = new Set([
  '.git',
  '.next',
  '.vercel',
  'coverage',
  'dist',
  'node_modules',
])

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function walkFiles(rootDir, out = []) {
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const abs = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      if (WALK_EXCLUDED_DIR_NAMES.has(entry.name)) continue
      walkFiles(abs, out)
      continue
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      out.push(abs)
    }
  }
  return out
}

function collectEnvNamesFromExample(examplePath) {
  const lines = readSourceText(examplePath).split('\n')
  const entries = []

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^([A-Z0-9_.-]+)=/)
    if (!match) continue
    entries.push({
      name: match[1],
      sourcePath: path.relative(defaultRepoRoot, examplePath).replace(/\\/g, '/'),
      sourceKind: 'env-example',
      sourcePointer: `line ${index + 1}`,
    })
  }

  return entries
}

function collectUsageMatches(filePath, envNames) {
  if (!statSync(filePath).isFile()) {
    return []
  }

  const text = readSourceText(filePath)
  const relativePath = path.relative(defaultRepoRoot, filePath).replace(/\\/g, '/')
  const usages = []

  for (const envName of envNames) {
    const escapedName = escapeRegex(envName)
    const directRegex = new RegExp(`process\\.env\\.${escapedName}\\b`, 'g')
    const bracketRegex = new RegExp(`process\\.env\\[['"]${escapedName}['"]\\]`, 'g')
    const envRegex = new RegExp(`\\benv\\.${escapedName}\\b`, 'g')

    for (const regex of [directRegex, bracketRegex, envRegex]) {
      const match = regex.exec(text)
      if (!match) continue
      usages.push({
        name: envName,
        sourcePath: relativePath,
        sourceKind: relativePath.includes('/tests/') ? 'env-test' : 'env-reader',
        sourcePointer: `match at index ${match.index}`,
      })
      break
    }
  }

  return usages
}

export function extractEnvironmentRecords({ repoRoot = defaultRepoRoot } = {}) {
  const examplePath = path.join(repoRoot, '.env.example')
  const exampleEntries = collectEnvNamesFromExample(examplePath)
  const envNames = [...new Set(exampleEntries.map((entry) => entry.name))]
  const siteFiles = walkFiles(path.join(repoRoot, 'site'))
  const usages = siteFiles.flatMap((filePath) => collectUsageMatches(filePath, envNames))

  const merged = new Map()
  for (const entry of exampleEntries) {
    const existing = merged.get(entry.name)
    if (!existing) {
      const exposure = classifyEnvBrowserExposure(entry.name)
      merged.set(entry.name, {
        ...entry,
        ...exposure,
        renderSurface: ['markdown', 'renderer'],
        verificationMode: 'source-backed',
        factClassification: 'code-proven',
        usages: usages.filter((usage) => usage.name === entry.name),
      })
      continue
    }

    if (existing.sourcePointer !== entry.sourcePointer) {
      existing.sourcePointer = `${existing.sourcePointer}; ${entry.sourcePointer}`
    }
  }

  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name))
}
