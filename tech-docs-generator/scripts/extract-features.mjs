import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const require = createRequire(import.meta.url)

function loadTypescript() {
  try {
    return require('typescript')
  } catch {
    try {
      return require(path.join(defaultRepoRoot, 'node_modules', 'typescript'))
    } catch {
      return null
    }
  }
}

const ts = loadTypescript()

function readText(filePath) {
  if (!fs.existsSync(filePath)) return ''
  if (ts?.sys?.readFile) {
    return ts.sys.readFile(filePath, 'utf8') ?? ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function getStringLiteral(node) {
  return ts && ts.isStringLiteralLike(node) ? node.text : undefined
}

function getArrayOfStrings(node) {
  if (!ts || !ts.isArrayLiteralExpression(node)) return undefined
  return node.elements.map((element) => getStringLiteral(element)).filter((value) => value !== undefined)
}

function walkFiles(rootDir, predicate, out = []) {
  if (!fs.existsSync(rootDir)) return out
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const abs = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue
      walkFiles(abs, predicate, out)
    } else if (predicate(entry.name, abs)) {
      out.push(abs)
    }
  }
  return out
}

function countPages(repoRoot, relativeRoots) {
  let count = 0
  const samplePaths = []
  for (const relative of relativeRoots) {
    const absRoot = path.join(repoRoot, relative)
    const pages = walkFiles(absRoot, (name) => name === 'page.tsx')
    count += pages.length
    for (const page of pages.slice(0, 6)) {
      samplePaths.push(path.relative(repoRoot, page).replace(/\\/g, '/'))
    }
  }
  return { count, samplePaths }
}

function pathExists(repoRoot, relative) {
  return fs.existsSync(path.join(repoRoot, relative))
}

/** Drop undefined keys — generated JSON canonicalize rejects undefined. */
function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined))
}

/**
 * Product surfaces proven by app route trees / feature dirs (not hand-curated essays).
 */
const PRODUCT_SURFACES = [
  {
    slug: 'admin',
    title: 'Admin',
    tagline: 'Platform administration',
    tryPath: '/admin',
    roots: ['site/app/admin'],
    featureDirs: ['site/features/admin'],
    apiPrefix: '/api/admin',
  },
  {
    slug: 'planner',
    title: 'Floor Planner',
    tagline: '2D/3D floor planning workspace',
    tryPath: '/ooplanner',
    roots: ['site/app/ooplanner'],
    featureDirs: ['site/features/Planner', 'site/components/Planner', 'site/lib/Planner'],
    apiPrefix: '/api/Planner',
  },
  {
    slug: 'studio',
    title: 'Furniture Studio',
    tagline: 'Furniture authoring workspace',
    tryPath: '/oostudio',
    roots: ['site/app/oostudio'],
    featureDirs: ['site/features/Studio', 'site/components/Studio', 'site/lib/Studio'],
    apiPrefix: '/api/Studio',
  },
  {
    slug: 'site-marketing',
    title: 'Marketing site',
    tagline: 'Public marketing residual',
    tryPath: '/',
    roots: ['site/app/(site)'],
    featureDirs: ['site/features/site'],
    apiPrefix: null,
  },
  {
    slug: 'crm',
    title: 'CRM',
    tagline: 'Customer relationship residual',
    tryPath: '/admin/crm',
    roots: ['site/app/admin/crm', 'site/app/(site)/crm'],
    featureDirs: ['site/features/crm'],
    apiPrefix: '/api/crm',
  },
  {
    slug: 'ops',
    title: 'Ops',
    tagline: 'Operations residual',
    tryPath: '/ops',
    roots: ['site/app/ops', 'site/app/(site)/ops'],
    featureDirs: ['site/features/ops'],
    apiPrefix: '/api/ops',
  },
  {
    slug: 'catalog',
    title: 'Catalog',
    tagline: 'Product / plan-symbol catalog',
    tryPath: '/admin/catalog',
    roots: ['site/app/admin/catalog', 'site/app/admin/planner-catalog', 'site/app/admin/workspace-catalog'],
    featureDirs: ['site/lib/catalog', 'site/inventory'],
    apiPrefix: '/api/admin/catalogs',
  },
]

function extractProductSurfaceRecords(repoRoot) {
  const records = []

  for (const surface of PRODUCT_SURFACES) {
    const existingRoots = surface.roots.filter((root) => pathExists(repoRoot, root))
    const existingFeatures = surface.featureDirs.filter((dir) => pathExists(repoRoot, dir))
    if (existingRoots.length === 0 && existingFeatures.length === 0) continue

    const { count, samplePaths } = countPages(repoRoot, existingRoots)
    const primarySource = existingRoots[0] ?? existingFeatures[0]
    const parts = [
      existingRoots.length ? `routes: ${existingRoots.join(', ')}` : null,
      count > 0 ? `${count} page.tsx` : null,
      existingFeatures.length ? `modules: ${existingFeatures.join(', ')}` : null,
      surface.apiPrefix ? `api prefix ${surface.apiPrefix}` : null,
    ].filter(Boolean)

    records.push(
      compactRecord({
        kind: 'product-surface',
        slug: surface.slug,
        title: surface.title,
        tagline: surface.tagline,
        summary: parts.join(' · '),
        tryPath: surface.tryPath,
        pageCount: count,
        samplePaths,
        sourcePath: primarySource,
        sourceKind: 'product-surface',
        sourcePointer: existingRoots[0] ?? existingFeatures[0],
      }),
    )
  }

  return records
}

/**
 * Auth roles from live withAuth + roles helpers (source-backed, not essays).
 */
function extractAuthRoleRecords(repoRoot) {
  const records = []
  const withAuthPath = 'site/features/shared/api/withAuth.ts'
  const rolesPath = 'site/lib/auth/roles.ts'
  const sessionPath = 'site/lib/auth/session.ts'
  const withAuthAbs = path.join(repoRoot, withAuthPath)
  const rolesAbs = path.join(repoRoot, rolesPath)

  if (fs.existsSync(withAuthAbs)) {
    const text = readText(withAuthAbs)
    const unionMatch = text.match(/export\s+type\s+AuthRole\s*=\s*([^;]+);/)
    const roles = unionMatch
      ? [...unionMatch[1].matchAll(/["'](\w+)["']/g)].map((m) => m[1])
      : []

    for (const role of roles) {
      const desc =
        role === 'admin'
          ? 'Authenticated user with app_metadata.role (or roles[]) admin — elevated product admin'
          : role === 'member'
            ? 'Any authenticated user'
            : role === 'guest'
              ? 'No auth required; user may be null'
              : `withAuth role "${role}"`

      records.push(
        compactRecord({
          kind: 'auth-role',
          slug: `auth-role-${role}`,
          title: `Auth role: ${role}`,
          tagline: 'withAuth AuthRole',
          summary: desc,
          tryPath: role === 'admin' ? '/admin' : undefined,
          sourcePath: withAuthPath,
          sourceKind: 'source-module',
          sourcePointer: 'export type AuthRole',
        }),
      )
    }
  }

  if (fs.existsSync(rolesAbs)) {
    const text = readText(rolesAbs)
    if (text.includes('isAppAdmin') || text.includes('readAppRole')) {
      records.push(
        compactRecord({
          kind: 'auth-helper',
          slug: 'auth-app-admin',
          title: 'App admin resolution',
          tagline: 'JWT app_metadata only',
          summary:
            'readAppRole / isAppAdmin resolve admin from app_metadata.role or app_metadata.roles; user_metadata must not grant admin',
          tryPath: '/admin',
          sourcePath: rolesPath,
          sourceKind: 'source-module',
          sourcePointer: 'isAppAdmin',
        }),
      )
    }
  }

  if (pathExists(repoRoot, sessionPath)) {
    const text = readText(path.join(repoRoot, sessionPath))
    if (text.includes('unauthorized_admin_access') || text.includes('surface === "admin"')) {
      records.push(
        compactRecord({
          kind: 'auth-gate',
          slug: 'auth-admin-session-gate',
          title: 'Admin session gate',
          tagline: 'requireUser surface admin',
          summary: 'session requireUser(surface: "admin") redirects non-owner/admin away from /admin',
          tryPath: '/admin',
          sourcePath: sessionPath,
          sourceKind: 'source-module',
          sourcePointer: 'requireUser admin surface',
        }),
      )
    }
  }

  // Count withAuth role usages across API routes (proof of where roles apply)
  const apiDir = path.join(repoRoot, 'site', 'app', 'api')
  if (fs.existsSync(apiDir)) {
    const roleCounts = new Map()
    const routeFiles = walkFiles(apiDir, (name) => name === 'route.ts')
    for (const filePath of routeFiles) {
      const sourceText = readText(filePath)
      const matches = sourceText.matchAll(/role:\s*["'](admin|member|guest)["']/g)
      for (const match of matches) {
        const role = match[1]
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)
      }
    }
    for (const [role, count] of [...roleCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      records.push(
        compactRecord({
          kind: 'auth-role-usage',
          slug: `auth-role-usage-${role}`,
          title: `withAuth role:"${role}" usages`,
          tagline: 'API route handlers',
          summary: `${count} withAuth({ role: "${role}" }) occurrence(s) under site/app/api`,
          sourcePath: 'site/app/api',
          sourceKind: 'route-file-scan',
          sourcePointer: `role: "${role}"`,
        }),
      )
    }
  }

  return records
}

function parsePlannerFeaturePages(filePath, repoRoot) {
  if (!ts) return []
  const sourceText = readText(filePath)
  if (!sourceText) return []
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const records = []
  const relative = path.relative(repoRoot, filePath).replace(/\\/g, '/')

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'PLANNER_FEATURE_PAGES') continue
      if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) continue

      declaration.initializer.elements.forEach((element, index) => {
        if (!ts.isObjectLiteralExpression(element)) return
        const feature = {
          kind: 'planner-marketing',
          sourcePath: relative,
          sourceKind: 'typed-feature-metadata',
          sourcePointer: `PLANNER_FEATURE_PAGES[${index}]`,
          relatedSlugs: [],
        }

        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue
          const key = property.name.text
          const value = property.initializer

          if (key === 'relatedSlugs') {
            feature.relatedSlugs = getArrayOfStrings(value) ?? []
            continue
          }

          if (key === 'icon' && ts.isIdentifier(value)) {
            feature.icon = value.text
            continue
          }

          const stringValue = getStringLiteral(value)
          if (stringValue !== undefined) {
            feature[key] = stringValue
          }
        }

        if (feature.slug || feature.title) {
          records.push(
            compactRecord({
              ...feature,
              slug: feature.slug ?? `planner-feature-${index}`,
              title: feature.title ?? feature.slug ?? `Planner feature ${index}`,
              tagline: feature.tagline ?? 'Planner marketing feature page',
              summary: feature.summary ?? feature.tagline ?? '',
            }),
          )
        }
      })
    }
  })

  return records
}

function featurePageCandidates(repoRoot) {
  return [
    path.join(repoRoot, 'site', 'features', 'planner', 'landing', 'plannerFeaturePages.ts'),
    path.join(repoRoot, 'site', 'features', 'Planner', 'landing', 'plannerFeaturePages.ts'),
    path.join(repoRoot, 'site', 'features', 'site', 'data', 'plannerFeaturePages.ts'),
  ]
}

export function extractFeatureRecords({ repoRoot = defaultRepoRoot } = {}) {
  const records = [
    ...extractProductSurfaceRecords(repoRoot),
    ...extractAuthRoleRecords(repoRoot),
  ]

  for (const featureFile of featurePageCandidates(repoRoot)) {
    if (fs.existsSync(featureFile)) {
      records.push(...parsePlannerFeaturePages(featureFile, repoRoot))
      break
    }
  }

  return records.sort((left, right) => {
    const kindOrder = (kind) => {
      if (kind === 'product-surface') return 0
      if (kind === 'auth-role' || kind === 'auth-helper' || kind === 'auth-gate' || kind === 'auth-role-usage') return 1
      return 2
    }
    const byKind = kindOrder(left.kind) - kindOrder(right.kind)
    if (byKind !== 0) return byKind
    return String(left.slug).localeCompare(String(right.slug))
  })
}
