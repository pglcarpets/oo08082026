import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { humanizePackageName } from './normalize.mjs'
import { SOURCE_PACKAGE_DIR } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const dependencySections = ['dependencies', 'devDependencies']

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function trimPeerSuffix(version) {
  if (typeof version !== 'string') return version
  const match = version.match(/^[^(]+/)
  return match ? match[0] : version
}

function countIndent(line) {
  const match = line.match(/^(\s*)/)
  return match ? match[1].length : 0
}

function unquote(text) {
  return text.replace(/^['"]|['"]$/g, '')
}

function parseLockfileImporters(lockfileText) {
  const importers = new Map()
  const lines = lockfileText.split(/\r?\n/)
  let inImporters = false
  let currentImporter = null
  let currentSection = null
  let currentPackage = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const indent = countIndent(line)
    if (trimmed === 'importers:') {
      inImporters = true
      continue
    }

    if (!inImporters) continue

    if (indent === 2 && trimmed.endsWith(':')) {
      currentImporter = unquote(trimmed.slice(0, -1))
      currentSection = null
      currentPackage = null
      if (!importers.has(currentImporter)) {
        importers.set(currentImporter, new Map())
      }
      continue
    }

    if (currentImporter && indent === 4 && trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1)
      currentPackage = null
      if (!importers.get(currentImporter).has(currentSection)) {
        importers.get(currentImporter).set(currentSection, new Map())
      }
      continue
    }

    if (currentImporter && currentSection && indent === 6 && trimmed.endsWith(':')) {
      currentPackage = unquote(trimmed.slice(0, -1))
      const sectionMap = importers.get(currentImporter).get(currentSection)
      if (!sectionMap.has(currentPackage)) {
        sectionMap.set(currentPackage, {})
      }
      continue
    }

    if (currentImporter && currentSection && currentPackage && indent === 8) {
      const specifierMatch = trimmed.match(/^specifier:\s*(.+)$/)
      if (specifierMatch) {
        importers.get(currentImporter).get(currentSection).get(currentPackage).specifier = specifierMatch[1]
        continue
      }

      const versionMatch = trimmed.match(/^version:\s*(.+)$/)
      if (versionMatch) {
        importers.get(currentImporter).get(currentSection).get(currentPackage).version = versionMatch[1]
      }
    }
  }

  return importers
}

function packageJsonPathForImporter(repoRoot, importer) {
  return importer === '.' ? path.join(repoRoot, 'package.json') : path.join(repoRoot, importer, 'package.json')
}

function lockfilePointer(importer, section, packageName, field) {
  return `importers.${importer}.${section}.${packageName}.${field}`
}

export function extractDependencyRecords({
  repoRoot = defaultRepoRoot,
  // Product deps live on root package.json; site/ is app dir only (no package.json).
  importerNames = ['.', SOURCE_PACKAGE_DIR, 'tech-docs-generator'],
} = {}) {
  const lockfilePath = path.join(repoRoot, 'pnpm-lock.yaml')
  const lockfileImporters = parseLockfileImporters(readFileSync(lockfilePath, 'utf8'))
  const records = []

  for (const importer of importerNames) {
    const manifestPath = packageJsonPathForImporter(repoRoot, importer)
    if (!existsSync(manifestPath)) continue
    const manifest = readJson(manifestPath)
    const lockImporter = lockfileImporters.get(importer)

    for (const section of dependencySections) {
      const dependencies = manifest[section] ?? {}
      const lockSection = lockImporter?.get(section) ?? new Map()

      for (const [packageName, requestedRange] of Object.entries(dependencies)) {
        const lockEntry = lockSection.get(packageName)
        if (!lockEntry?.version) {
          throw new Error(`Missing lockfile version for ${importer}:${section}:${packageName}`)
        }

        const importerPath = path.relative(repoRoot, manifestPath).replace(/\\/g, '/')
        const displayName = humanizePackageName(packageName)
        const resolvedVersion = trimPeerSuffix(lockEntry.version)
        records.push({
          id: `${importer}:${section}:${packageName}`,
          importer,
          section,
          packageName,
          displayName,
          requested: {
            value: requestedRange,
            sourcePath: importerPath,
            sourceKind: 'package-manifest',
            sourcePointer: `${section}.${packageName}`,
          },
          resolved: {
            value: resolvedVersion,
            sourcePath: 'pnpm-lock.yaml',
            sourceKind: 'lockfile',
            sourcePointer: lockfilePointer(importer, section, packageName, 'version'),
          },
        })
      }
    }
  }

  return records.sort((left, right) => {
    if (left.importer !== right.importer) return left.importer.localeCompare(right.importer)
    if (left.section !== right.section) return left.section.localeCompare(right.section)
    return left.packageName.localeCompare(right.packageName)
  })
}
