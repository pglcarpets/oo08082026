import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

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

export function deriveApiPath(filePath, repoRoot = defaultRepoRoot) {
  const relativePath = path.relative(path.join(repoRoot, 'site', 'app', 'api'), filePath).replace(/\\/g, '/')
  const segments = relativePath.split('/')
  const routeSegments = segments
    .filter((segment) => segment !== 'route.ts')
    .map(stripRouteGroup)
    .filter(Boolean)

  return `/api/${routeSegments.join('/')}`.replace(/\/+$/, '') || '/api'
}

/**
 * Best-effort auth role for a method export that uses withAuth({ role: "..." }).
 * Scans the export binding and nearby withAuth options object.
 */
function extractWithAuthRole(sourceText, method) {
  const exportPattern = new RegExp(
    `export\\s+const\\s+${method}\\s*=\\s*withAuth\\s*\\([\\s\\S]{0,1200}?\\{[\\s\\S]{0,800}?\\brole:\\s*['"](admin|member|guest)['"]`,
  )
  const match = sourceText.match(exportPattern)
  if (match) return match[1]

  // async function METHOD style is rare with withAuth; still allow role near METHOD export
  const loose = new RegExp(
    `export\\s+(?:async\\s+)?(?:function|const)\\s+${method}\\b[\\s\\S]{0,900}?\\brole:\\s*['"](admin|member|guest)['"]`,
  )
  const looseMatch = sourceText.match(loose)
  return looseMatch?.[1] ?? null
}

export function extractApiRecords({ repoRoot = defaultRepoRoot } = {}) {
  const apiDir = path.join(repoRoot, 'site', 'app', 'api')
  const routeFiles = walkFiles(apiDir, (name) => name === 'route.ts')

  return routeFiles.flatMap((filePath) => {
    const sourceText = readFileSync(filePath, 'utf8')
    const methods = HTTP_METHODS.filter((method) => new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${method}\\b`).test(sourceText))
    const routePath = deriveApiPath(filePath, repoRoot)
    const relative = path.relative(repoRoot, filePath).replace(/\\/g, '/')

    return methods.map((method) => {
      const authRole = extractWithAuthRole(sourceText, method)
      const record = {
        id: `${routePath}:${method}`,
        path: routePath,
        method,
        sourcePath: relative,
        sourceKind: 'route-file',
        sourcePointer: authRole ? `export ${method} withAuth role:${authRole}` : `export ${method}`,
      }
      if (authRole) record.authRole = authRole
      return record
    })
  }).sort((left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method))
}
