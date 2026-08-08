import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractApiRecords } from './extract-api.mjs'
import { extractAiRecords } from './extract-ai.mjs'
import { extractCiRecords } from './extract-ci.mjs'
import { extractCommandRecords } from './extract-commands.mjs'
import { extractDatabaseRecords } from './extract-database.mjs'
import { extractDependabotRecords } from './extract-dependabot.mjs'
import { extractDeploymentRecords } from './extract-deployment.mjs'
import { extractDocsHealthRecords } from './extract-docs-health.mjs'
import {
  EXCLUDED_REPOSITORY_ROOTS,
  GENERATED_ROOT_DIR,
  SOURCE_PACKAGE_DIR,
  normalizeRepositoryInput,
} from './output-contract.mjs'
import { extractDependencyRecords } from './extract-dependencies.mjs'
import { extractEnvironmentRecords } from './extract-environment.mjs'
import { extractFailuresStatusRecords } from './extract-failures-status.mjs'
import { extractFeatureRecords } from './extract-features.mjs'
import { extractRepoGraph } from './extract-repo-graph.mjs'
import { extractRunnerSelection } from './extract-runner-selection.mjs'
import { extractRouteRecords } from './extract-routes.mjs'
import { extractThemeRecords } from './extract-theme.mjs'
import { buildGapRecords } from './build-gaps.mjs'
import {
  extractCodeOrganizationRecords,
  extractPerformanceRecords,
  extractSecurityRecords,
  extractWorkflowRecords,
} from './extract-route-domains.mjs'
import { collectRouteContractMatches } from './extract-routes.mjs'
import { normalizeSourceText, comparePaths } from './filesystem.mjs'
import { normalizeDependencyRecords } from './normalize.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const COVERAGE_CONTRACT_PATH = 'plans/README.md'
const COVERAGE_REQUIRED_DOMAINS = [
  'workspace',
  'next-app',
  'api',
  'route-contracts',
  'deployment',
  'github-actions',
  'dependabot',
  'environment',
  'database',
  'supabase',
  'r2-assets',
  'planner',
  'admin',
  'ai-openrouter',
  'testing',
  'css-theme',
  'i18n',
  'docs-health',
]
export const COVERAGE_EXCLUDED_PATH_PREFIXES = [
  ...EXCLUDED_REPOSITORY_ROOTS.map((root) => `${root}/`),
  '.vercel/',
  'site/.next/',
  'coverage/',
]

/** Maps each coverage-matrix domain to a `source-policy.mjs` policy key. */
export const COVERAGE_DOMAIN_SOURCE_POLICY = {
  workspace: 'build',
  'next-app': 'routes',
  api: 'api',
  'route-contracts': 'routes',
  deployment: 'deployment',
  'github-actions': 'ci',
  dependabot: 'dependabot',
  environment: 'environment',
  database: 'database',
  supabase: 'database',
  'r2-assets': 'build',
  planner: 'features',
  admin: 'routes',
  'ai-openrouter': 'ai',
  testing: 'coverage',
  'css-theme': 'theme',
  i18n: 'structure',
  'docs-health': 'docs-health',
}

export { COVERAGE_REQUIRED_DOMAINS, COVERAGE_CONTRACT_PATH }

function walkFiles(rootDir, out = []) {
  try {
    const entries = readdirSync(rootDir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = path.join(rootDir, entry.name)
      if (entry.isDirectory()) {
        walkFiles(abs, out)
      } else {
        out.push(abs)
      }
    }
  } catch {
    return out
  }
  return out
}

function countTests(files) {
  return files.filter((file) => /\.test\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)).length
}

function normalizeRenderSurface(renderSurface) {
  if (Array.isArray(renderSurface)) {
    return Array.from(new Set(renderSurface))
  }
  return renderSurface
}

function normalizeSourcePath(sourcePath) {
  return String(sourcePath ?? '').replace(/\\/g, '/')
}

export function isAcceptedCoverageSourcePath(sourcePath, repoRoot = defaultRepoRoot) {
  const normalizedPath = normalizeSourcePath(sourcePath)
  if (!normalizedPath) return false
  if (normalizedPath === '_generated') return false
  if (normalizedPath === '.env.local' || normalizedPath.endsWith('/.env.local')) return false
  const relativePath = normalizeRepositoryInput(repoRoot, normalizedPath)
  if (relativePath === null) return false
  return !COVERAGE_EXCLUDED_PATH_PREFIXES.some((prefix) => relativePath.startsWith(prefix))
}

function readSourceEvidence(repoRoot, relativePath, sourceKind, sourcePointer = relativePath) {
  try {
    readFileSync(path.join(repoRoot, relativePath))
    return {
      sourcePath: relativePath.replace(/\\/g, '/'),
      sourceKind,
      sourcePointer,
    }
  } catch {
    return null
  }
}

/**
 * Classify environment names before coverage rendering: canonical names stay distinct,
 * undocumented usages become gaps, and near-duplicate prefixes stay flagged as gaps.
 */
export function classifyEnvironmentNames(environmentRecords) {
  const documentedNames = new Set(environmentRecords.map((record) => record.name))
  const undocumentedUsages = []
  for (const record of environmentRecords) {
    for (const usage of record.usages ?? []) {
      if (!isAcceptedCoverageSourcePath(usage.sourcePath)) continue
      if (!documentedNames.has(usage.name)) {
        undocumentedUsages.push(usage)
      }
    }
  }

  const prefixGroups = new Map()
  for (const name of documentedNames) {
    const prefix = name.split('_').slice(0, 2).join('_')
    const group = prefixGroups.get(prefix) ?? []
    group.push(name)
    prefixGroups.set(prefix, group)
  }

  const ambiguousPrefixGroups = [...prefixGroups.values()].filter((group) => group.length > 1)

  return {
    canonicalNameCount: documentedNames.size,
    undocumentedUsageCount: undocumentedUsages.length,
    ambiguousPrefixGroups,
    hasUndocumentedUsages: undocumentedUsages.length > 0,
    hasAmbiguousPrefixes: ambiguousPrefixGroups.length > 0,
  }
}

export function isGateWorkflowRecord(record) {
  return /release:gate|tech-docs:(?:check|gate)/i.test(
    `${record.value ?? ''} ${record.sourcePointer ?? ''} ${record.scriptName ?? ''}`,
  )
}

function normalizeTextBytesForHash(filePath, content) {
  if (!/\.(md|mdx|json|jsonc|ya?ml|toml|txt|css|scss|sql|ts|tsx|js|jsx|mjs|cjs|html|svg|xml|sh|ps1|env\.example)$/i.test(filePath)) {
    return content
  }
  return Buffer.from(normalizeSourceText(content), 'utf8')
}

function collectSourceDescriptors(model, repoRoot) {
  const seen = new Map()

  function add(filePath, sourceKind, sourcePointer) {
    if (!filePath || seen.has(filePath)) return
    if (!isAcceptedCoverageSourcePath(filePath, repoRoot)) return
    const abs = path.join(repoRoot, filePath)
    let bytes = 0
    let hash = 'missing'
    try {
      const raw = readFileSync(abs)
      const content = normalizeTextBytesForHash(filePath, raw)
      bytes = content.byteLength
      hash = `sha256:${createHash('sha256').update(content).digest('hex')}`
    } catch {
      bytes = 0
      hash = 'missing'
    }
    seen.set(filePath, {
      sourcePath: filePath,
      sourceKind,
      sourcePointer,
      hash,
      bytes,
    })
  }

  for (const record of model.dependencies) {
    add(record.fact.sourcePath, record.fact.sourceKind, record.fact.sourcePointer)
  }

  for (const record of model.commands) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.routes) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.api) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.environment) {
    add(record.sourcePath, record.sourceKind, record.sourcePointer)
    for (const usage of record.usages) add(usage.sourcePath, usage.sourceKind, usage.sourcePointer)
  }
  for (const record of model.database.schema.tables) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.database.migrations) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.features) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.workflows) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.security) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.performance) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const record of model.codeOrganization) add(record.sourcePath, record.sourceKind, record.sourcePointer)
  for (const node of model.repoGraph?.nodes ?? []) add(node.sourcePath, 'repo-graph-node', node.sourcePointer)
  for (const edge of model.repoGraph?.edges ?? []) add(edge.sourcePath, 'repo-graph-edge', edge.sourcePointer)
  for (const runner of model.runnerSelection?.runners ?? []) add(runner.sourcePath, 'runner-config', runner.sourcePointer)
  for (const selection of model.runnerSelection?.selections ?? []) add(selection.sourcePath, 'runner-selection', selection.sourcePointer)
  for (const gap of model.runnerSelection?.gaps ?? []) add(gap.sourcePath, 'runner-gap', gap.sourcePointer)

  return [...seen.values()].sort((left, right) => comparePaths(left.sourcePath, right.sourcePath))
}

function fact(value, sourcePath, sourceKind, sourcePointer, options = {}) {
  return {
    value,
    sourcePath,
    sourceKind,
    sourcePointer,
    factClassification: options.factClassification ?? 'code-proven',
    browserExposure: options.browserExposure ?? 'public-safe',
    secretRisk: options.secretRisk ?? 'none',
    renderSurface: normalizeRenderSurface(options.renderSurface ?? ['markdown', 'renderer']),
    verificationMode: options.verificationMode ?? 'source-backed',
  }
}

function toFacts(model) {
  const facts = [...model.dependencies]

  const summaryFacts = [
    ['overview.commands', 'overview', 'commands', 'Commands', String(model.commands.length)],
    ['overview.dependencies', 'overview', 'dependencies', 'Dependencies', String(model.dependencies.length)],
    ['overview.routes', 'overview', 'routes', 'Routes', String(model.routes.length)],
    ['overview.api', 'overview', 'api', 'API', String(model.api.length)],
    ['overview.features', 'overview', 'features', 'Features', String(model.features.length)],
    ['architecture.rootScripts', 'architecture', 'rootScripts', 'Root scripts location', `${SOURCE_PACKAGE_DIR}/scripts/`],
    ['architecture.separateVite', 'architecture', 'separateVite', 'Separate Vite package', `${SOURCE_PACKAGE_DIR}/`],
    ['architecture.generatedOutput', 'architecture', 'generatedOutput', 'Generated output', `${GENERATED_ROOT_DIR}/`],
    ['build.outDir', 'build', 'outDir', 'Output directory', `${GENERATED_ROOT_DIR}/site`],
    ['build.syncCss', 'build', 'syncCss', 'CSS snapshot', `${GENERATED_ROOT_DIR}/data/css/`],
    ['provenance.total', 'governance', 'total', 'Total factual fields', 'derived from source facts'],
    ['provenance.exact', 'governance', 'exact', 'Exact source matches', 'derived from source facts'],
  ]

  for (const [id, domain, field, label, value] of summaryFacts) {
    facts.push({
      id,
      domain,
      field,
      label,
      fact: fact(value, '_generated', 'generated-summary', id),
    })
  }

  for (const record of model.commands) {
    facts.push({
      id: `${record.id}.command`,
      domain: 'commands',
      field: 'command',
      label: `${record.packageName} ${record.scriptName}`,
      fact: fact(record.command, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.routes) {
    facts.push({
      id: `${record.id}.route`,
      domain: 'routes',
      field: 'path',
      label: record.path,
      fact: fact(record.path, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.api) {
    facts.push({
      id: `${record.id}.method`,
      domain: 'api',
      field: 'method',
      label: record.path,
      fact: fact(record.method, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.environment) {
    facts.push({
      id: `${record.name}.env`,
      domain: 'environment',
      field: 'name',
      label: record.name,
      fact: fact(record.name, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.database.schema.tables) {
    facts.push({
      id: `${record.name}.table`,
      domain: 'database',
      field: 'table',
      label: record.name,
      fact: fact(record.name, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.database.migrations) {
    facts.push({
      id: `${record.path}.migration`,
      domain: 'database',
      field: 'migration',
      label: record.path,
      fact: fact(record.path, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.features) {
    for (const field of ['kind', 'slug', 'title', 'tagline', 'summary', 'helpSectionId', 'tryPath', 'memberPath']) {
      if (record[field] === undefined || record[field] === null || record[field] === '') continue
      facts.push({
        id: `${record.slug}.${field}`,
        domain: 'features',
        field,
        label: record.slug,
        fact: fact(
          String(record[field]),
          record.sourcePath,
          record.sourceKind ?? 'product-surface',
          `${record.sourcePointer ?? record.slug}.${field}`,
        ),
      })
    }
  }

  for (const record of model.workflows) {
    facts.push({
      id: `${record.id}.value`,
      domain: 'workflows',
      field: 'value',
      label: record.label,
      fact: fact(record.value, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.security) {
    facts.push({
      id: `${record.id}.value`,
      domain: 'security',
      field: 'value',
      label: record.label,
      fact: fact(record.value, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.performance) {
    facts.push({
      id: `${record.id}.value`,
      domain: 'performance',
      field: 'value',
      label: record.label,
      fact: fact(record.value, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  for (const record of model.codeOrganization) {
    facts.push({
      id: `${record.id}.value`,
      domain: 'code-organization',
      field: 'value',
      label: record.label,
      fact: fact(record.value, record.sourcePath, record.sourceKind, record.sourcePointer),
    })
  }

  return facts
}

function buildSummary(model, repoRoot) {
  // Product + tech-docs tests live under monorepo tests/ (not site/tests or package tests/)
  const rootTestFiles = walkFiles(path.join(repoRoot, 'tests'))
  const siteTestFiles = []
  const generatorTestFiles = walkFiles(
    path.join(repoRoot, 'tests', 'tech-docs-generator'),
  )

  return {
    commands: model.commands.length,
    dependencies: model.dependencies.length,
    routes: model.routes.length,
    api: model.api.length,
    environment: model.environment.length,
    databaseTables: model.database.schema.tables.length,
    databaseMigrations: model.database.migrations.length,
    features: model.features.length,
    workflows: model.workflows.length,
    security: model.security.length,
    performance: model.performance.length,
    codeOrganization: model.codeOrganization.length,
    testFiles: {
      root: countTests(rootTestFiles),
      site: countTests(siteTestFiles),
      generator: countTests(generatorTestFiles),
    },
  }
}

function buildTestingPolicyFacts(_repoRoot) {
  return [
    {
      id: 'testing.coverage-floor',
      domain: 'testing',
      field: 'coverageFloor',
      label: 'Coverage floor',
      fact: fact('95%', `${SOURCE_PACKAGE_DIR}/scripts/check-coverage.mjs`, 'checked-in-script-or-config', 'THRESHOLDS.minimum'),
    },
    {
      id: 'testing.coverage-warning',
      domain: 'testing',
      field: 'coverageWarning',
      label: 'Coverage warning band',
      fact: fact('No warning band is configured', '_generated', 'unsupported-gap', 'testing.coverage-warning', { factClassification: 'unknown-gap', verificationMode: 'manual-verification' }),
    },
    {
      id: 'testing.coverage-complete',
      domain: 'testing',
      field: 'coverageComplete',
      label: 'Coverage completion threshold',
      fact: fact('95%', `${SOURCE_PACKAGE_DIR}/scripts/check-coverage.mjs`, 'checked-in-script-or-config', 'THRESHOLDS.minimum'),
    },
  ]
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function firstEvidenceFromNormalized(records) {
  if (!records?.length) return null
  const [entry] = records
  return {
    sourcePath: entry.sourcePath,
    sourceKind: entry.sourceKind,
    sourcePointer: entry.sourcePointer,
  }
}

function buildCoverageMatrix(model, { repoRoot = defaultRepoRoot } = {}) {
  const acceptedCommands = model.commands.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedRoutes = model.routes.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedApi = model.api.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedFeatures = model.features.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedWorkflows = model.workflows.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedCodeOrganization = model.codeOrganization.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedTables = model.database.schema.tables.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedMigrations = model.database.migrations.filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
  const acceptedEnvironment = model.environment
    .filter((record) => isAcceptedCoverageSourcePath(record.sourcePath))
    .map((record) => ({
      ...record,
      usages: record.usages.filter((usage) => isAcceptedCoverageSourcePath(usage.sourcePath)),
    }))

  const acceptedDependencySources = uniqueBy(
    model.dependencies
      .map((record) => record.fact)
      .filter((entry) => isAcceptedCoverageSourcePath(entry.sourcePath)),
    (entry) => `${entry.sourcePath}:${entry.sourceKind}:${entry.sourcePointer}`,
  )
  const routeContractMatches = collectRouteContractMatches({ repoRoot })
  const routeContractPaths = [...routeContractMatches.keys()]
  const routeContractBackedRoutes = acceptedRoutes.filter((record) => record.contractPointers.length > 0)
  const dynamicApiRoutes = acceptedApi.filter((record) => record.path.includes('['))
  const rootScripts = acceptedCommands.filter((record) => record.sourcePath === 'package.json')
  const databaseScripts = acceptedCommands.filter(
    (record) =>
      record.sourcePath.endsWith('package.json') &&
      (/^db:|^seed:/.test(record.scriptName) || /\bdrizzle\b/i.test(record.command)),
  )
  const assetCommands = acceptedCommands.filter((record) =>
    /assets:cdn|assets:r2|backup:r2|catalog:snapshot:r2|repo:backup:r2|backup:supabase:r2/i.test(
      `${record.scriptName} ${record.command}`,
    ),
  )
  const plannerCommands = acceptedCommands.filter((record) => /planner/i.test(`${record.scriptName} ${record.command}`))
  const adminRoutes = acceptedRoutes.filter((record) => record.path.startsWith('/admin'))
  const adminApi = acceptedApi.filter((record) => record.path.startsWith('/api/admin'))
  const adminEnvUsage = acceptedEnvironment.filter((record) =>
    record.usages.some((usage) => /\/admin\/|admin\./i.test(usage.sourcePath)),
  )
  const plannerRoutes = acceptedRoutes.filter((record) => record.path.startsWith('/planner'))
  const plannerApi = acceptedApi.filter((record) => record.path.includes('/planner'))
  const plannerEnvUsage = acceptedEnvironment.filter((record) =>
    record.usages.some((usage) => usage.sourcePath.includes('/planner/')),
  )
  const openRouterEnv = acceptedEnvironment.filter((record) => record.name.startsWith('OPENROUTER_'))
  const openRouterUsage = acceptedEnvironment.filter((record) =>
    record.usages.some((usage) => /openrouter|providerchain|\/api\/(filter|generate-alt|nav-search)\//i.test(usage.sourcePath)),
  )
  const supabaseEnv = acceptedEnvironment.filter((record) => record.name.includes('SUPABASE'))
  const supabaseUsage = acceptedEnvironment.filter((record) =>
    record.usages.some((usage) => usage.sourcePath.includes('/supabase/') || usage.sourcePath.includes('supabase')),
  )
  const i18nUsage = acceptedCodeOrganization.filter((record) => record.value.includes('site/i18n/'))
  const packageManagerEvidence = acceptedDependencySources.filter((entry) => entry.sourcePath === 'pnpm-lock.yaml')
  const workspaceShapeEvidence = acceptedDependencySources.filter(
    (entry) => entry.sourcePath === 'pnpm-workspace.yaml' || entry.sourcePointer === 'workspaces',
  )
  const nextAppRouteEvidence = acceptedRoutes
  const vercelConfigEvidence = readSourceEvidence(repoRoot, 'vercel.json', 'vercel-config')
  const handoverDeploymentEvidence = {
    sourcePath: 'docs/Plan.md',
    sourceKind: 'handover-note',
    sourcePointer: 'Vercel (current truth)',
  }
  const failuresDeploymentEvidence = {
    sourcePath: 'Failures.md',
    sourceKind: 'failures-log',
    sourcePointer: 'Tech stack docs / Repo CI',
  }
  const envValidatorEvidence = readSourceEvidence(repoRoot, 'scripts/general/validate-launch-env.mjs', 'env-validator')
  const envServerEvidence = readSourceEvidence(repoRoot, 'site/lib/env.server.ts', 'env-reader')

  function firstEvidence(entries, fallbackPointer = 'contract') {
    if (entries.length > 0) {
      const [entry] = entries
      return {
        sourcePath: entry.sourcePath,
        sourceKind: entry.sourceKind,
        sourcePointer: entry.sourcePointer,
      }
    }
    return {
      sourcePath: COVERAGE_CONTRACT_PATH,
      sourceKind: 'coverage-contract',
      sourcePointer: fallbackPointer,
    }
  }

  function record(id, classification, evidence, note) {
    return {
      id,
      classification,
      note,
      ...evidence,
    }
  }

  const domainRecords = {
    workspace: [
      rootScripts.length > 0
        ? record('workspace.root-package-scripts', 'code-proven', firstEvidence(rootScripts, 'Workspace root package scripts'))
        : record('workspace.root-package-scripts', 'unknown-gap', firstEvidence([], 'Workspace root package scripts')),
      workspaceShapeEvidence.length > 0
        ? record('workspace.workspace-shape', 'code-proven', firstEvidence(workspaceShapeEvidence, 'Workspace pnpm workspace shape'))
        : record('workspace.workspace-shape', 'unknown-gap', firstEvidence([], 'Workspace pnpm workspace shape')),
      packageManagerEvidence.length > 0
        ? record('workspace.package-manager', 'code-proven', firstEvidence(packageManagerEvidence, 'Workspace package manager'))
        : record('workspace.package-manager', 'unknown-gap', firstEvidence([], 'Workspace package manager')),
      packageManagerEvidence.length > 0
        ? record('workspace.lockfile', 'code-proven', firstEvidence(packageManagerEvidence, 'Workspace lockfile'))
        : record('workspace.lockfile', 'unknown-gap', firstEvidence([], 'Workspace lockfile')),
    ],
    'next-app': [
      nextAppRouteEvidence.length > 0
        ? record('next-app.page-files', 'code-proven', firstEvidence(nextAppRouteEvidence, 'Next app page files'))
        : record('next-app.page-files', 'unknown-gap', firstEvidence([], 'Next app page files')),
      record('next-app.layout-files', 'unknown-gap', firstEvidence([], 'Next app layout files')),
      record('next-app.loading-files', 'unknown-gap', firstEvidence([], 'Next app loading files')),
      record('next-app.error-files', 'unknown-gap', firstEvidence([], 'Next app error files')),
      record('next-app.not-found-files', 'unknown-gap', firstEvidence([], 'Next app not-found files')),
      record('next-app.template-files', 'unknown-gap', firstEvidence([], 'Next app template files')),
      record('next-app.default-files', 'unknown-gap', firstEvidence([], 'Next app default files')),
      record('next-app.metadata-route-handlers', 'unknown-gap', firstEvidence([], 'Next app metadata and image route handlers')),
    ],
    api: [
      acceptedApi.length > 0
        ? record('api.route-handler-files', 'code-proven', firstEvidence(acceptedApi, 'API route handler files'))
        : record('api.route-handler-files', 'unknown-gap', firstEvidence([], 'API route handler files')),
      acceptedApi.length > 0
        ? record('api.http-methods', 'code-proven', firstEvidence(acceptedApi, 'API HTTP methods'))
        : record('api.http-methods', 'unknown-gap', firstEvidence([], 'API HTTP methods')),
      acceptedApi.length > 0
        ? record('api.route-paths', 'code-proven', firstEvidence(acceptedApi, 'API route paths'))
        : record('api.route-paths', 'unknown-gap', firstEvidence([], 'API route paths')),
      dynamicApiRoutes.length > 0 || acceptedApi.some((record) => record.path.includes('[') || record.path.includes(']'))
        ? record('api.dynamic-params', 'code-proven', firstEvidence(dynamicApiRoutes.length > 0 ? dynamicApiRoutes : acceptedApi, 'API dynamic params'))
        : record('api.dynamic-params', 'unknown-gap', firstEvidence([], 'API dynamic params')),
    ],
    'route-contracts': [
      routeContractPaths.length > 0
        ? record(
            'route-contracts.contract-file',
            'code-proven',
            {
              sourcePath: 'site/platform/route-contract.json',
              sourceKind: 'route-contract',
              sourcePointer: routeContractMatches.get(routeContractPaths[0])?.[0] ?? 'site/platform/route-contract.json',
            },
          )
        : record('route-contracts.contract-file', 'unknown-gap', firstEvidence([], 'Route contract file')),
      routeContractBackedRoutes.length > 0
        ? record('route-contracts.route-metadata-links', 'code-proven', firstEvidence(routeContractBackedRoutes, 'Route contract links'))
        : record('route-contracts.route-metadata-links', 'unknown-gap', firstEvidence([], 'Route contract links')),
      record('route-contracts.normalized-contract-records', 'unknown-gap', firstEvidence([], 'Route contract normalized records')),
    ],
    deployment: [
      vercelConfigEvidence
        ? record('deployment.vercel-config', 'code-proven', vercelConfigEvidence)
        : record('deployment.vercel-config', 'unknown-gap', firstEvidence([], 'Deployment vercel config')),
      vercelConfigEvidence
        ? record('deployment.build-command', 'code-proven', {
            ...vercelConfigEvidence,
            sourcePointer: 'buildCommand',
          })
        : record('deployment.build-command', 'unknown-gap', firstEvidence([], 'Deployment build command')),
      record(
        'deployment.root-assumptions',
        'manual-verification',
        handoverDeploymentEvidence,
        'Confirm Vercel Root Directory = site in the Vercel dashboard',
      ),
      vercelConfigEvidence
        ? record('deployment.branch-rules', 'code-proven', {
            ...vercelConfigEvidence,
            sourcePointer: 'git.deploymentEnabled',
          })
        : record('deployment.branch-rules', 'unknown-gap', firstEvidence([], 'Deployment branch rules')),
      record(
        'deployment.install-behavior',
        'manual-verification',
        handoverDeploymentEvidence,
        'Confirm pnpm install cwd matches monorepo layout in Vercel project settings',
      ),
      record(
        'deployment.blockers',
        'live-status',
        failuresDeploymentEvidence,
        'Deployment blockers logged in Failures.md',
      ),
    ],
    'github-actions': [
      (model.ci ?? []).length > 0
        ? record('github-actions.workflow-files', 'code-proven', firstEvidenceFromNormalized(model.ci.filter((entry) => entry.category === 'workflow-file')) ?? firstEvidence([], 'GitHub Actions workflow files'))
        : record('github-actions.workflow-files', 'unknown-gap', firstEvidence([], 'GitHub Actions workflow files')),
      (model.ci ?? []).some((entry) => entry.category === 'workflow-trigger')
        ? record('github-actions.triggers', 'code-proven', firstEvidenceFromNormalized(model.ci.filter((entry) => entry.category === 'workflow-trigger')))
        : record('github-actions.triggers', 'unknown-gap', firstEvidence([], 'GitHub Actions triggers')),
      (model.ci ?? []).some((entry) => entry.category === 'workflow-schedule')
        ? record('github-actions.schedules', 'code-proven', firstEvidenceFromNormalized(model.ci.filter((entry) => entry.category === 'workflow-schedule')))
        : record('github-actions.schedules', 'unknown-gap', firstEvidence([], 'GitHub Actions schedules')),
      record('github-actions.permissions', 'unknown-gap', firstEvidence([], 'GitHub Actions permissions')),
      (model.ci ?? []).some((entry) => entry.category === 'workflow-secret-names')
        ? record('github-actions.secret-names', 'code-proven', firstEvidenceFromNormalized(model.ci.filter((entry) => entry.category === 'workflow-secret-names')))
        : record('github-actions.secret-names', 'unknown-gap', firstEvidence([], 'GitHub Actions secret names')),
    ],
    dependabot: [
      (model.dependabot ?? []).length > 0
        ? record('dependabot.config', 'code-proven', firstEvidenceFromNormalized(model.dependabot))
        : record('dependabot.config', 'unknown-gap', firstEvidence([], 'Dependabot config')),
      (model.dependabot ?? []).some((entry) => entry.category === 'dependabot-schedule')
        ? record('dependabot.schedules', 'code-proven', firstEvidenceFromNormalized(model.dependabot.filter((entry) => entry.category === 'dependabot-schedule')))
        : record('dependabot.schedules', 'unknown-gap', firstEvidence([], 'Dependabot schedules')),
      (model.dependabot ?? []).some((entry) => entry.category === 'dependabot-pr-limit')
        ? record('dependabot.pr-limits', 'code-proven', firstEvidenceFromNormalized(model.dependabot.filter((entry) => entry.category === 'dependabot-pr-limit')))
        : record('dependabot.pr-limits', 'unknown-gap', firstEvidence([], 'Dependabot PR limits')),
      (model.dependabot ?? []).some((entry) => entry.category === 'dependabot-ignore')
        ? record('dependabot.ignore-rules', 'code-proven', firstEvidenceFromNormalized(model.dependabot.filter((entry) => entry.category === 'dependabot-ignore')))
        : record('dependabot.ignore-rules', 'unknown-gap', firstEvidence([], 'Dependabot ignore rules')),
      (model.dependabot ?? []).some((entry) => entry.category === 'dependabot-group')
        ? record('dependabot.groups', 'code-proven', firstEvidenceFromNormalized(model.dependabot.filter((entry) => entry.category === 'dependabot-group')))
        : record('dependabot.groups', 'unknown-gap', firstEvidence([], 'Dependabot groups')),
    ],
    environment: [
      acceptedEnvironment.length > 0
        ? record('environment.documented-names', 'code-proven', firstEvidence(acceptedEnvironment, 'Environment names'))
        : record('environment.documented-names', 'unknown-gap', firstEvidence([], 'Environment names')),
      acceptedEnvironment.some((record) => record.usages.length > 0)
        ? record('environment.usages', 'code-proven', firstEvidence(acceptedEnvironment.filter((record) => record.usages.length > 0), 'Environment usages'))
        : record('environment.usages', 'unknown-gap', firstEvidence([], 'Environment usages')),
      envValidatorEvidence
        ? record('environment.validators', 'code-proven', envValidatorEvidence)
        : record('environment.validators', 'unknown-gap', firstEvidence([], 'Environment validators')),
      envServerEvidence
        ? record('environment.server-client-split', 'code-proven', envServerEvidence)
        : record('environment.server-client-split', 'unknown-gap', firstEvidence([], 'Environment server/client split')),
    ],
    database: [
      acceptedTables.length > 0
        ? record('database.drizzle-schemas', 'code-proven', firstEvidence(acceptedTables, 'Database drizzle schemas'))
        : record('database.drizzle-schemas', 'unknown-gap', firstEvidence([], 'Database drizzle schemas')),
      acceptedTables.some((record) => record.sourcePath.endsWith('/catalog.ts'))
        ? record(
            'database.products-db',
            'code-proven',
            firstEvidence(acceptedTables.filter((record) => record.sourcePath.endsWith('/catalog.ts')), 'Database products DB'),
          )
        : record('database.products-db', 'unknown-gap', firstEvidence([], 'Database products DB')),
      acceptedTables.some((record) => record.sourcePath.endsWith('/planner.ts'))
        ? record(
            'database.admin-planner-db',
            'code-proven',
            firstEvidence(acceptedTables.filter((record) => record.sourcePath.endsWith('/planner.ts')), 'Database admin/planner DB'),
          )
        : record('database.admin-planner-db', 'unknown-gap', firstEvidence([], 'Database admin/planner DB')),
      acceptedMigrations.length > 0
        ? record('database.migrations', 'code-proven', firstEvidence(acceptedMigrations, 'Database migrations'))
        : record('database.migrations', 'unknown-gap', firstEvidence([], 'Database migrations')),
      databaseScripts.length > 0
        ? record('database.scripts', 'code-proven', firstEvidence(databaseScripts, 'Database scripts'))
        : record('database.scripts', 'unknown-gap', firstEvidence([], 'Database scripts')),
    ],
    supabase: [
      supabaseEnv.length > 0
        ? record('supabase.env-names', 'code-proven', firstEvidence(supabaseEnv, 'Supabase env names'))
        : record('supabase.env-names', 'unknown-gap', firstEvidence([], 'Supabase env names')),
      supabaseUsage.length > 0
        ? record('supabase.auth-usage', 'code-proven', firstEvidence(supabaseUsage, 'Supabase auth usage'))
        : record('supabase.auth-usage', 'unknown-gap', firstEvidence([], 'Supabase auth usage')),
      record('supabase.legacy-http-clients', 'unknown-gap', firstEvidence([], 'Supabase legacy HTTP clients')),
      record('supabase.generated-types-and-edge-functions', 'unknown-gap', firstEvidence([], 'Supabase generated types and edge functions')),
    ],
    'r2-assets': [
      assetCommands.some((record) => /assets:cdn/i.test(record.scriptName))
        ? record(
            'r2-assets.cdn-scripts',
            'code-proven',
            firstEvidence(assetCommands.filter((record) => /assets:cdn/i.test(record.scriptName)), 'R2 assets CDN scripts'),
          )
        : record('r2-assets.cdn-scripts', 'unknown-gap', firstEvidence([], 'R2 assets CDN scripts')),
      assetCommands.some((record) => /backup:r2|repo:backup:r2|backup:supabase:r2/i.test(record.scriptName))
        ? record(
            'r2-assets.backup-scripts',
            'code-proven',
            firstEvidence(
              assetCommands.filter((record) => /backup:r2|repo:backup:r2|backup:supabase:r2/i.test(record.scriptName)),
              'R2 assets backup scripts',
            ),
          )
        : record('r2-assets.backup-scripts', 'unknown-gap', firstEvidence([], 'R2 assets backup scripts')),
      assetCommands.some((record) => /catalog:snapshot:r2/i.test(record.scriptName))
        ? record(
            'r2-assets.catalog-snapshot-scripts',
            'code-proven',
            firstEvidence(assetCommands.filter((record) => /catalog:snapshot:r2/i.test(record.scriptName)), 'R2 assets catalog snapshots'),
          )
        : record('r2-assets.catalog-snapshot-scripts', 'unknown-gap', firstEvidence([], 'R2 assets catalog snapshots')),
      record('r2-assets.asset-path-policy', 'unknown-gap', firstEvidence([], 'R2 assets path policy')),
    ],
    planner: [
      acceptedFeatures.length > 0
        ? record('planner.feature-metadata', 'code-proven', firstEvidence(acceptedFeatures, 'Planner feature metadata'))
        : record('planner.feature-metadata', 'unknown-gap', firstEvidence([], 'Planner feature metadata')),
      plannerRoutes.length > 0
        ? record('planner.app-routes', 'code-proven', firstEvidence(plannerRoutes, 'Planner app routes'))
        : record('planner.app-routes', 'unknown-gap', firstEvidence([], 'Planner app routes')),
      plannerApi.length > 0 || plannerEnvUsage.length > 0
        ? record(
            'planner.persistence',
            'code-proven',
            firstEvidence(plannerApi.length > 0 ? plannerApi : plannerEnvUsage, 'Planner persistence'),
          )
        : record('planner.persistence', 'unknown-gap', firstEvidence([], 'Planner persistence')),
      plannerCommands.length > 0
        ? record('planner.tests', 'code-proven', firstEvidence(plannerCommands, 'Planner tests'))
        : record('planner.tests', 'unknown-gap', firstEvidence([], 'Planner tests')),
      record('planner.stores', 'unknown-gap', firstEvidence([], 'Planner stores')),
      record('planner.gate-blockers', 'unknown-gap', firstEvidence([], 'Planner gate blockers')),
    ],
    admin: [
      adminRoutes.length > 0
        ? record('admin.routes', 'code-proven', firstEvidence(adminRoutes, 'Admin routes'))
        : record('admin.routes', 'unknown-gap', firstEvidence([], 'Admin routes')),
      adminApi.length > 0
        ? record('admin.catalog-workflow', 'code-proven', firstEvidence(adminApi, 'Admin catalog workflow'))
        : record('admin.catalog-workflow', 'unknown-gap', firstEvidence([], 'Admin catalog workflow')),
      adminEnvUsage.length > 0
        ? record('admin.db-usage', 'code-proven', firstEvidence(adminEnvUsage, 'Admin DB usage'))
        : record('admin.db-usage', 'unknown-gap', firstEvidence([], 'Admin DB usage')),
      record('admin.tests', 'unknown-gap', firstEvidence([], 'Admin tests')),
    ],
    'ai-openrouter': [
      openRouterEnv.length > 0
        ? record('ai-openrouter.env-names', 'code-proven', firstEvidence(openRouterEnv, 'AI OpenRouter env names'))
        : record('ai-openrouter.env-names', 'unknown-gap', firstEvidence([], 'AI OpenRouter env names')),
      openRouterUsage.some((record) => record.usages.some((usage) => usage.sourcePath.includes('/api/')))
        ? record(
            'ai-openrouter.api-routes',
            'code-proven',
            firstEvidence(
              openRouterUsage.filter((record) => record.usages.some((usage) => usage.sourcePath.includes('/api/'))),
              'AI OpenRouter API routes',
            ),
          )
        : record('ai-openrouter.api-routes', 'unknown-gap', firstEvidence([], 'AI OpenRouter API routes')),
      openRouterUsage.some((record) => record.usages.some((usage) => usage.sourcePath.includes('providerChain')))
        ? record(
            'ai-openrouter.provider-chain',
            'code-proven',
            firstEvidence(
              openRouterUsage.filter((record) => record.usages.some((usage) => usage.sourcePath.includes('providerChain'))),
              'AI OpenRouter provider chain',
            ),
          )
        : record('ai-openrouter.provider-chain', 'unknown-gap', firstEvidence([], 'AI OpenRouter provider chain')),
      record('ai-openrouter.fallback-behavior', 'unknown-gap', firstEvidence([], 'AI OpenRouter fallback behavior')),
    ],
    testing: [
      acceptedCommands.some((record) => /^test($|:)/.test(record.scriptName))
        ? record(
            'testing.test-scripts',
            'code-proven',
            firstEvidence(acceptedCommands.filter((record) => /^test($|:)/.test(record.scriptName)), 'Testing scripts'),
          )
        : record('testing.test-scripts', 'unknown-gap', firstEvidence([], 'Testing scripts')),
      acceptedWorkflows.some(isGateWorkflowRecord)
        ? record(
            'testing.gate-scripts',
            'code-proven',
            firstEvidence(
              acceptedWorkflows.filter(isGateWorkflowRecord),
              'Testing gate scripts',
            ),
          )
        : record('testing.gate-scripts', 'unknown-gap', firstEvidence([], 'Testing gate scripts')),
      model.testingPolicy.length > 0
        ? record('testing.coverage-policy', 'code-proven', firstEvidence(model.testingPolicy.map((entry) => entry.fact), 'Testing coverage policy'))
        : record('testing.coverage-policy', 'unknown-gap', firstEvidence([], 'Testing coverage policy')),
      record('testing.vitest-config', 'unknown-gap', firstEvidence([], 'Testing Vitest config')),
      record('testing.playwright-config', 'unknown-gap', firstEvidence([], 'Testing Playwright config')),
      existsSync(path.join(repoRoot, SOURCE_PACKAGE_DIR, 'scripts', 'fake-test-audit.mjs'))
        ? record(
            'testing.fake-test-audit',
            'code-proven',
            firstEvidence(
              [{ value: 'tech-docs-generator/scripts/fake-test-audit.mjs', sourcePointer: 'auditTests' }],
              'Testing fake-test audit',
            ),
          )
        : record('testing.fake-test-audit', 'unknown-gap', firstEvidence([], 'Testing fake-test audit')),
    ],
    'css-theme': [
      (model.theme ?? []).some((entry) => entry.id === 'theme.token-source')
        ? record('css-theme.token-source', 'code-proven', firstEvidenceFromNormalized(model.theme.filter((entry) => entry.id === 'theme.token-source')))
        : record('css-theme.token-source', 'unknown-gap', firstEvidence([], 'CSS theme token source')),
      (model.theme ?? []).some((entry) => entry.id === 'theme.renderer-css-sync')
        ? record('css-theme.renderer-css-sync', 'code-proven', firstEvidenceFromNormalized(model.theme.filter((entry) => entry.id === 'theme.renderer-css-sync')))
        : record('css-theme.renderer-css-sync', 'unknown-gap', firstEvidence([], 'CSS theme renderer CSS sync')),
      (model.theme ?? []).some((entry) => entry.id === 'theme.renderer-css-sync')
        ? record('css-theme.mirrored-css-manifest', 'code-proven', firstEvidenceFromNormalized(model.theme.filter((entry) => entry.id === 'theme.renderer-css-sync')))
        : record('css-theme.mirrored-css-manifest', 'unknown-gap', firstEvidence([], 'CSS theme mirrored CSS manifest')),
    ],
    i18n: [
      i18nUsage.length > 0
        ? record('i18n.loader', 'code-proven', firstEvidence(i18nUsage, 'i18n loader'))
        : record('i18n.loader', 'unknown-gap', firstEvidence([], 'i18n loader')),
      record('i18n.message-files', 'unknown-gap', firstEvidence([], 'i18n message files')),
    ],
    'docs-health': [
      (model.docsHealth ?? []).some((entry) => entry.category === 'root-doc')
        ? record('docs-health.root-docs', 'code-proven', firstEvidenceFromNormalized(model.docsHealth.filter((entry) => entry.category === 'root-doc')))
        : record('docs-health.root-docs', 'unknown-gap', firstEvidence([], 'Docs health root docs')),
      (model.docsHealth ?? []).some((entry) => entry.sourcePath === 'README.md' || entry.sourcePath === 'OPERATIONS_RUNBOOK.md')
        ? record('docs-health.runbooks', 'code-proven', firstEvidenceFromNormalized(model.docsHealth.filter((entry) => ['README.md', 'OPERATIONS_RUNBOOK.md'].includes(entry.sourcePath))))
        : record('docs-health.runbooks', 'unknown-gap', firstEvidence([], 'Docs health runbooks')),
      (model.docsHealth ?? []).some((entry) => entry.sourcePath === 'Failures.md')
        ? record('docs-health.failures-log', 'code-proven', firstEvidenceFromNormalized(model.docsHealth.filter((entry) => entry.sourcePath === 'Failures.md')))
        : record('docs-health.failures-log', 'unknown-gap', firstEvidence([], 'Docs health failures log')),
      (model.failuresStatus ?? []).some((entry) => entry.category === 'plan-pack')
        ? record('docs-health.plan-packs', 'code-proven', firstEvidenceFromNormalized(model.failuresStatus.filter((entry) => entry.category === 'plan-pack')))
        : record('docs-health.plan-packs', 'unknown-gap', firstEvidence([], 'Docs health plan packs')),
      (model.docsHealth ?? []).some((entry) => entry.category === 'architecture-doc')
        ? record('docs-health.architecture-docs', 'code-proven', firstEvidenceFromNormalized(model.docsHealth.filter((entry) => entry.category === 'architecture-doc')))
        : record('docs-health.architecture-docs', 'unknown-gap', firstEvidence([], 'Docs health architecture docs')),
      record('docs-health.api-docs', 'unknown-gap', firstEvidence([], 'Docs health api docs')),
    ],
  }

  const rows = COVERAGE_REQUIRED_DOMAINS.map((domain) => {
    const records = domainRecords[domain] ?? []
    const counts = {
      codeProvenCount: records.filter((entry) => entry.classification === 'code-proven').length,
      handoverProvenCount: records.filter((entry) => entry.classification === 'handover-proven').length,
      manualVerificationCount: records.filter((entry) => entry.classification === 'manual-verification').length,
      liveStatusCount: records.filter((entry) => entry.classification === 'live-status').length,
      unknownGapCount: records.filter((entry) => entry.classification === 'unknown-gap').length,
      unsupportedClaimCount: records.filter((entry) => entry.classification === 'unsupported-claim').length,
    }
    const recordCount =
      counts.codeProvenCount +
      counts.handoverProvenCount +
      counts.manualVerificationCount +
      counts.liveStatusCount +
      counts.unknownGapCount +
      counts.unsupportedClaimCount

    let status = 'unknown-gap'
    if (counts.unknownGapCount === 0 && counts.manualVerificationCount === 0 && counts.liveStatusCount === 0 && counts.handoverProvenCount === 0) {
      status = 'covered'
    } else if (counts.codeProvenCount > 0) {
      status = 'partial'
    } else if (counts.manualVerificationCount > 0 && counts.unknownGapCount === 0) {
      status = 'manual-verification'
    }

    return {
      domain,
      status,
      recordCount,
      ...counts,
    }
  })

  return {
    contractSourcePath: COVERAGE_CONTRACT_PATH,
    rows,
  }
}

/** @type {Map<string, ReturnType<typeof buildGeneratorModelUncached>>} */
const generatorModelCache = new Map()

function buildGeneratorModelUncached({ repoRoot = defaultRepoRoot } = {}) {
  const dependencies = normalizeDependencyRecords(extractDependencyRecords({ repoRoot })).map((record) => ({
    ...record,
    fact: fact(record.fact.value, record.fact.sourcePath, record.fact.sourceKind, record.fact.sourcePointer),
  }))
  const commands = extractCommandRecords({ repoRoot })
  const routes = extractRouteRecords({ repoRoot })
  const api = extractApiRecords({ repoRoot })
  const environment = extractEnvironmentRecords({ repoRoot })
  const database = extractDatabaseRecords({ repoRoot })
  const features = extractFeatureRecords({ repoRoot })
  const workflows = extractWorkflowRecords({ repoRoot })
  const security = extractSecurityRecords({ repoRoot })
  const performance = extractPerformanceRecords({ repoRoot })
  const codeOrganization = extractCodeOrganizationRecords({ repoRoot })
  const deployment = extractDeploymentRecords({ repoRoot, commands })
  const ci = extractCiRecords({ repoRoot })
  const dependabot = extractDependabotRecords({ repoRoot })
  const ai = extractAiRecords({ repoRoot, api })
  const theme = extractThemeRecords({ repoRoot })
  const failuresStatus = extractFailuresStatusRecords({ repoRoot })
  const docsHealth = extractDocsHealthRecords({ repoRoot })
  const summary = buildSummary(
    { dependencies, commands, routes, api, environment, database, features, workflows, security, performance, codeOrganization },
    repoRoot,
  )
  const testingPolicy = buildTestingPolicyFacts(repoRoot)
  const coverageMatrix = buildCoverageMatrix(
    {
      dependencies,
      commands,
      routes,
      api,
      environment,
      database,
      features,
      workflows,
      security,
      performance,
      codeOrganization,
      summary,
      testingPolicy,
      deployment,
      ci,
      dependabot,
      theme,
      failuresStatus,
      docsHealth,
    },
    { repoRoot },
  )
  const gaps = buildGapRecords(coverageMatrix)
  const facts = [
    ...toFacts({
      dependencies,
      commands,
      routes,
      api,
      environment,
      database,
      features,
      workflows,
      security,
      performance,
      codeOrganization,
      summary,
    }),
    ...testingPolicy,
  ].map((record) => ({
    category: record.category ?? record.domain,
    ...record,
  }))
  const repoGraph = extractRepoGraph({ repoRoot })
  const runnerSelection = extractRunnerSelection({ repoRoot })
  const sources = collectSourceDescriptors(
    {
      dependencies,
      commands,
      routes,
      api,
      environment,
      database,
      features,
      workflows,
      security,
      performance,
      codeOrganization,
      repoGraph,
      runnerSelection,
    },
    repoRoot,
  )

  return {
    repoRoot,
    dependencies,
    commands,
    routes,
    api,
    environment,
    database,
    features,
    workflows,
    security,
    performance,
    codeOrganization,
    summary,
    coverageMatrix,
    testingPolicy,
    deployment,
    ci,
    dependabot,
    ai,
    theme,
    failuresStatus,
    docsHealth,
    gaps,
    facts,
    sources,
    repoGraph,
    runnerSelection,
  }
}

/**
 * Seed the in-process memo (used by tests that restore a disk snapshot so
 * generateDocs/emitRendererData do not cold-rebuild inside the same worker).
 *
 * @param {string} repoRoot
 * @param {ReturnType<typeof buildGeneratorModelUncached>} model
 */
export function primeGeneratorModelCache(repoRoot, model) {
  generatorModelCache.set(path.resolve(repoRoot), model)
}

export function buildGeneratorModel({ repoRoot = defaultRepoRoot } = {}) {
  const resolvedRoot = path.resolve(repoRoot)
  const cached = generatorModelCache.get(resolvedRoot)
  if (cached) {
    return cached
  }

  const model = buildGeneratorModelUncached({ repoRoot: resolvedRoot })
  generatorModelCache.set(resolvedRoot, model)
  return model
}
