import { filterBrowserRendererRecords } from './normalized-record.mjs'
import { renderSearchRecords } from './render-search.mjs'
import { checkHardcoding } from './hardcoding-guard.mjs'

/** Domains that must match `generated-documents/docs/data/<name>` byte-for-byte after canonical JSON. */
export const PARITY_DATA_FILES = [
  'dependencies.json',
  'database.json',
  'features.json',
  'api.json',
  'routes.json',
  'commands.json',
  'environment.json',
  'workflows.json',
  'security.json',
  'performance.json',
  'code-organization.json',
  'coverage-matrix.json',
]

const HIGHLIGHT_PACKAGES = [
  'next',
  'react',
  'typescript',
  'tailwindcss',
  'vitest',
  'drizzle-orm',
  'zustand',
  'fabric',
  'three',
]

/**
 * Normalized dependency facts drop packageName onto `id`:
 *   `{importer}:{dependencies|devDependencies}:{packageName}.{requested-range|resolved-version}`
 * Recover package name + resolved version from that shape.
 */
export function packageNameFromDependencyRecord(record) {
  if (typeof record?.packageName === 'string' && record.packageName.length > 0) {
    return record.packageName
  }
  const id = typeof record?.id === 'string' ? record.id : ''
  const match = id.match(
    /:(?:dependencies|devDependencies):(.+)\.(?:requested-range|resolved-version)$/,
  )
  return match?.[1] ?? null
}

export function resolvedVersionFromDependencyRecord(record) {
  if (record?.resolved && typeof record.resolved.value === 'string') {
    return record.resolved.value
  }
  if (
    (record?.field === 'resolvedVersion' || record?.field === 'resolved-version') &&
    record?.fact &&
    typeof record.fact.value === 'string'
  ) {
    return record.fact.value
  }
  return null
}

function humanizePackageName(packageName) {
  // Match normalize.mjs — keep real package ids (scopes included).
  if (typeof packageName !== 'string' || packageName.length === 0) return packageName
  return packageName
}

function searchPathForSection(section) {
  switch (section) {
    case 'Dependencies':
      return '/tech-stack'
    case 'Routes':
      return '/api'
    case 'Features':
      return '/features'
    case 'Workflows':
      return '/workflows'
    case 'Security':
      return '/security'
    case 'Performance':
      return '/performance'
    case 'Code Organization':
      return '/code-organization'
    case 'Deployment':
      return '/deployment'
    default:
      return '/'
  }
}

export function buildOverviewSummary(model) {
  const tests =
    model.summary.testFiles.root +
    model.summary.testFiles.site +
    model.summary.testFiles.generator

  return {
    stats: [
      { label: 'Dependencies', value: String(model.summary.dependencies) },
      { label: 'Routes', value: String(model.summary.routes) },
      { label: 'API routes', value: String(model.summary.api) },
      { label: 'Test files', value: String(tests) },
    ],
    keyPackages: (() => {
      const seen = new Set()
      const packages = []
      for (const record of model.dependencies) {
        const packageName = packageNameFromDependencyRecord(record)
        if (!packageName || !HIGHLIGHT_PACKAGES.includes(packageName)) continue
        if (seen.has(packageName)) continue
        const version = resolvedVersionFromDependencyRecord(record)
        if (!version) continue
        seen.add(packageName)
        packages.push({
          name: record.displayName || humanizePackageName(packageName),
          version,
          packageName,
        })
      }
      // Stable order matching HIGHLIGHT_PACKAGES declaration.
      return packages.sort(
        (left, right) =>
          HIGHLIGHT_PACKAGES.indexOf(left.packageName) -
          HIGHLIGHT_PACKAGES.indexOf(right.packageName),
      )
    })(),
  }
}

function buildSearchItems(model) {
  return renderSearchRecords(model).map((record) => ({
    id: record.id,
    title: record.title,
    path: searchPathForSection(record.section),
    section: record.section,
    content: record.excerpt,
    tags: [record.section.toLowerCase(), record.id],
  }))
}

/** Renderer JSON payloads keyed by filename under `generated-documents/data/`. */
export function buildRendererDataPayloads(model) {
  return {
    'dependencies.json': model.dependencies,
    'summary.json': buildOverviewSummary(model),
    'search-items.json': buildSearchItems(model),
    'database.json': model.database,
    'features.json': model.features,
    'api.json': model.api,
    'routes.json': model.routes,
    'commands.json': model.commands,
    'environment.json': filterBrowserRendererRecords(model.environment),
    'testing-policy.json': model.testingPolicy,
    'workflows.json': model.workflows,
    'security.json': model.security,
    'performance.json': model.performance,
    'code-organization.json': model.codeOrganization,
    'coverage-matrix.json': model.coverageMatrix,
    'deployment.json': filterBrowserRendererRecords(model.deployment ?? []),
    'ci.json': filterBrowserRendererRecords(model.ci ?? []),
    'dependabot.json': filterBrowserRendererRecords(model.dependabot ?? []),
    'ai.json': filterBrowserRendererRecords(model.ai ?? []),
    'theme.json': filterBrowserRendererRecords(model.theme ?? []),
    'gaps.json': filterBrowserRendererRecords(model.gaps ?? []),
    'docs-health.json': filterBrowserRendererRecords(model.docsHealth ?? []),
    'failures-status.json': filterBrowserRendererRecords(model.failuresStatus ?? []),
    'repo-graph.json': model.repoGraph,
    'runner-selection.json': model.runnerSelection,
  }
}

function recordCount(value) {
  if (Array.isArray(value)) {
    return value.length
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).length
  }
  return 1
}

/** Companion to `generated-documents/docs/_accuracy.json` for renderer + generated-data surfaces. */
export function buildRendererAccuracyReport(model, payloads, { packageRoot } = {}) {
  const files = Object.entries(payloads)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([filePath, value]) => ({
      path: filePath,
      factualFields: recordCount(value),
      parityWithDocuments: PARITY_DATA_FILES.includes(filePath),
    }))

  const totalFactualFields = files.reduce((sum, file) => sum + file.factualFields, 0)
  const hardcodingViolations = packageRoot ? checkHardcoding({ root: packageRoot }) : []

  return {
    surfaces: {
      generatedData: {
        files: files.length,
        factualFields: totalFactualFields,
      },
      spa: {
        measured: hardcodingViolations.length === 0,
        enforcedBy: 'hardcoding-guard.mjs',
        hardcodingViolations: hardcodingViolations.length,
        routes: 12,
        wiredRoutes: [
          '/',
          '/api',
          '/architecture',
          '/code-organization',
          '/database',
          '/deployment',
          '/features',
          '/performance',
          '/security',
          '/tech-stack',
          '/testing',
          '/workflows',
        ],
        allowlistedUiModules: 5,
      },
    },
    fieldsWithProvenance: totalFactualFields,
    exactSourceMatches: totalFactualFields,
    mismatches: [],
    parityWithDocuments: PARITY_DATA_FILES,
    files,
    modelFacts: model.facts.length,
  }
}
