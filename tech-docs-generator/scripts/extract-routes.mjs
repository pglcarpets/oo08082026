import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
function walkFiles(rootDir, predicate, out = []) {
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const abs = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(abs, predicate, out)
    } else if (predicate(entry.name)) {
      out.push(abs)
    }
  }
  return out
}

function stripRouteGroup(segment) {
  return /^\(.*\)$/.test(segment) ? null : segment
}

function resolveDefaultExportAlias(filePath, sourceText) {
  const match = sourceText.match(/^\s*export\s+\{\s*default\s*\}\s+from\s+['"](.+)['"]\s*;?\s*$/m)
  if (!match) return null

  const specifier = match[1]
  const candidates = specifier.startsWith('.')
    ? [
        path.resolve(path.dirname(filePath), specifier),
        path.resolve(path.dirname(filePath), `${specifier}.tsx`),
        path.resolve(path.dirname(filePath), `${specifier}.ts`),
        path.resolve(path.dirname(filePath), `${specifier}.jsx`),
        path.resolve(path.dirname(filePath), `${specifier}.js`),
      ]
    : [path.resolve(path.dirname(filePath), specifier)]

  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile()
    } catch {
      return false
    }
  }) ?? null
}

export function deriveRoutePath(filePath, repoRoot = defaultRepoRoot) {
  const relativePath = path.relative(path.join(repoRoot, 'site', 'app'), filePath).replace(/\\/g, '/')
  const segments = relativePath.split('/')
  const routeSegments = segments
    .filter((segment) => segment !== 'page.tsx')
    .map(stripRouteGroup)
    .filter(Boolean)

  return `/${routeSegments.join('/')}`.replace(/\/+$/, '') || '/'
}

function collectContractPointers(contractValue, pointer = 'route-contract') {
  const matches = new Map()

  function visit(value, currentPointer) {
    if (typeof value === 'string') {
      if (value.startsWith('/')) {
        const list = matches.get(value) ?? []
        list.push(currentPointer)
        matches.set(value, list)
      }
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${currentPointer}[${index}]`))
      return
    }

    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        visit(child, `${currentPointer}.${key}`)
      }
    }
  }

  visit(contractValue, pointer)
  return matches
}

export function extractRouteRecords({ repoRoot = defaultRepoRoot } = {}) {
  const appDir = path.join(repoRoot, 'site', 'app')
  const contractPath = path.join(repoRoot, 'site', 'platform', 'route-contract.json')
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
  const contractPointers = collectContractPointers(contract, 'site/platform/route-contract.json')
  const pageFiles = walkFiles(appDir, (name) => name === 'page.tsx')
  const aliasPathsByTarget = new Map()
  const canonicalPageFiles = []

  for (const filePath of pageFiles) {
    const sourceText = readFileSync(filePath, 'utf8')
    const aliasTarget = resolveDefaultExportAlias(filePath, sourceText)
    if (aliasTarget) {
      const aliases = aliasPathsByTarget.get(aliasTarget) ?? []
      aliases.push(path.relative(repoRoot, filePath).replace(/\\/g, '/'))
      aliasPathsByTarget.set(aliasTarget, aliases)
      continue
    }

    canonicalPageFiles.push(filePath)
  }

  return canonicalPageFiles
    .map((filePath) => {
      const routePath = deriveRoutePath(filePath, repoRoot)
      const pointerMatches = contractPointers.get(routePath) ?? []
      return {
        id: routePath,
        path: routePath,
        sourcePath: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
        sourceKind: 'page-file',
        sourcePointer: 'default export',
        contractPointers: pointerMatches,
        aliasPaths: aliasPathsByTarget.get(filePath) ?? [],
      }
    })
    .sort((left, right) => left.path.localeCompare(right.path) || left.sourcePath.localeCompare(right.sourcePath))
}

export function collectRouteContractMatches({ repoRoot = defaultRepoRoot } = {}) {
  const contractPath = path.join(repoRoot, 'site', 'platform', 'route-contract.json')
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
  return collectContractPointers(contract, 'site/platform/route-contract.json')
}
