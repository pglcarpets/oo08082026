import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  listOpsCommandNames,
  opsCommandInvocation,
  OPS_COMMAND_SOURCE_KIND,
  OPS_COMMAND_SOURCE_PATH,
} from '../../scripts/ops-command-registry.mjs'
import { SOURCE_PACKAGE_DIR } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

const WORKFLOW_SCRIPT_ALLOWLIST = {
  // Product scripts live on root package.json (site/ is app dir only).
  'package.json': [
    'dev',
    'dev:turbo',
    'typecheck',
    'lint',
    'test',
    'build',
    'release:gate',
    'docs:sync',
    'docs:sync:all',
    'tech-docs:generate',
    'tech-docs:check',
    'tech-docs:gate',
    'lint:secrets',
    'vercel:prod',
  ],
}

const SECURITY_SCRIPT_PATTERN = /^(db:advisors:security|scan:secrets|lint:secrets)$/

const PERFORMANCE_SCRIPT_PATTERN = /^db:advisors:performance$/

const PERFORMANCE_PACKAGES = new Set([
  '@vercel/analytics',
  '@vercel/speed-insights',
  'sharp',
  'lighthouse',
  '@gltf-transform/core',
  '@react-three/fiber',
  'three',
])

const SITE_DIR_EXCLUDE = new Set([
  'node_modules',
  '.vercel',
  'archive',
  'backups',
  'fixtures',
  'results',
])

const SECURITY_MODULE_PATHS = [
  'site/lib/rateLimit.ts',
  'site/app/api/csrf/route.ts',
  'site/features/shared/api/withAuth.ts',
  'site/lib/auth/roles.ts',
  'site/lib/auth/session.ts',
  'site/lib/auth/devAuthBypass.ts',
  'site/lib/security/csrf.ts',
  'site/proxy.ts',
]

const PERFORMANCE_MODULE_PATHS = ['site/app/api/dev-tools/lighthouse/route.ts']

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function relativePath(repoRoot, absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, '/')
}

function walkSourceFiles(rootDir, out = []) {
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const abs = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue
      walkSourceFiles(abs, out)
      continue
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      out.push(abs)
    }
  }
  return out
}

function scriptsFromAllowlist(repoRoot, allowlist) {
  const records = []
  for (const [manifestPath, scriptNames] of Object.entries(allowlist)) {
    const abs = path.join(repoRoot, manifestPath)
    const pkg = readJson(abs)
    const scripts = pkg.scripts ?? {}
    for (const scriptName of scriptNames) {
      const command = scripts[scriptName]
      if (!command) continue
      records.push({
        id: `workflows.${manifestPath.replace(/\//g, '_').replace(/\.json$/, '')}.${scriptName}`,
        category: 'dev-loop',
        label: scriptName,
        value: command,
        sourcePath: manifestPath,
        sourceKind: 'package-script',
        sourcePointer: `scripts.${scriptName}`,
      })
    }
  }
  return records.sort((left, right) => left.id.localeCompare(right.id))
}

function commandsMatching(repoRoot, pattern) {
  const packageFiles = [
    path.join(repoRoot, 'package.json'),
    path.join(repoRoot, SOURCE_PACKAGE_DIR, 'package.json'),
    path.join(repoRoot, 'tech-docs-generator', 'package.json'),
  ].filter((absPath) => {
    try {
      statSync(absPath)
      return true
    } catch {
      return false
    }
  })

  const packageRecords = packageFiles.flatMap((absPath) => {
    const pkg = readJson(absPath)
    const manifestPath = relativePath(repoRoot, absPath)
    const packageName = pkg.name ?? path.basename(path.dirname(absPath))
    const scripts = pkg.scripts ?? {}

    return Object.entries(scripts)
      .filter(([scriptName]) => pattern.test(scriptName))
      .map(([scriptName, command]) => ({
        id: `${packageName}:${scriptName}`,
        category: 'command',
        label: scriptName,
        value: command,
        sourcePath: manifestPath,
        sourceKind: 'package-script',
        sourcePointer: `scripts.${scriptName}`,
      }))
  })

  const opsRecords = listOpsCommandNames({ repoRoot })
    .filter((scriptName) => pattern.test(scriptName))
    .map((scriptName) => ({
      id: `ops:${scriptName}`,
      category: 'command',
      label: scriptName,
      value: opsCommandInvocation({ repoRoot, scriptName }),
      sourcePath: OPS_COMMAND_SOURCE_PATH,
      sourceKind: OPS_COMMAND_SOURCE_KIND,
      sourcePointer: `ops.${scriptName}`,
    }))

  return [...packageRecords, ...opsRecords]
}

function moduleFacts(repoRoot, modulePaths, domain, category) {
  return modulePaths
    .map((modulePath) => {
      const abs = path.join(repoRoot, modulePath)
      try {
        statSync(abs)
      } catch {
        return null
      }
      const id = `${domain}.${modulePath.replace(/\//g, '.').replace(/\.(ts|tsx)$/, '')}`
      return {
        id,
        category,
        label: path.basename(modulePath),
        value: modulePath,
        sourcePath: modulePath,
        sourceKind: 'source-module',
        sourcePointer: 'file',
      }
    })
    .filter(Boolean)
}

function collectServerOnlyModules(repoRoot) {
  const siteRoot = path.join(repoRoot, 'site')
  return walkSourceFiles(siteRoot)
    .filter((absPath) => !absPath.includes(`${path.sep}tests${path.sep}`))
    .filter((absPath) => /^import\s+["']server-only["']/m.test(readFileSync(absPath, 'utf8')))
    .map((absPath) => {
      const modulePath = relativePath(repoRoot, absPath)
      const id = `security.server-only.${modulePath.replace(/\//g, '.').replace(/\.(ts|tsx)$/, '')}`
      return {
        id,
        category: 'server-only',
        label: path.basename(absPath),
        value: modulePath,
        sourcePath: modulePath,
        sourceKind: 'server-only-import',
        sourcePointer: 'import "server-only"',
      }
    })
    .sort((left, right) => left.value.localeCompare(right.value))
}

function collectPerformanceDependencies(repoRoot) {
  const rootPkgPath = path.join(repoRoot, 'package.json')
  const pkg = readJson(rootPkgPath)
  const records = []

  for (const section of ['dependencies', 'devDependencies']) {
    for (const [packageName, requested] of Object.entries(pkg[section] ?? {})) {
      if (!PERFORMANCE_PACKAGES.has(packageName)) continue
      records.push({
        id: `performance.dep.${packageName.replace(/[@/]/g, '_')}`,
        category: 'dependency',
        label: packageName,
        value: String(requested),
        sourcePath: 'package.json',
        sourceKind: 'package-manifest',
        sourcePointer: `${section}.${packageName}`,
      })
    }
  }

  return records.sort((left, right) => left.label.localeCompare(right.label))
}

function collectSiteTopLevelDirs(repoRoot) {
  const siteRoot = path.join(repoRoot, 'site')
  return readdirSync(siteRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !SITE_DIR_EXCLUDE.has(entry.name))
    .map((entry) => {
      const dirPath = `site/${entry.name}/`
      return {
        id: `code-organization.dir.${entry.name}`,
        category: 'top-level-dir',
        label: entry.name,
        value: dirPath,
        sourcePath: 'site/',
        sourceKind: 'directory',
        sourcePointer: entry.name,
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
}

function collectFeatureModules(repoRoot) {
  const featuresRoot = path.join(repoRoot, 'site', 'features')
  return readdirSync(featuresRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const modulePath = `site/features/${entry.name}/`
      return {
        id: `code-organization.feature.${entry.name}`,
        category: 'feature-module',
        label: entry.name,
        value: modulePath,
        sourcePath: 'site/features/',
        sourceKind: 'directory',
        sourcePointer: entry.name,
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
}

function collectPathAliases(repoRoot) {
  const tsconfigPath = path.join(repoRoot, 'site', 'tsconfig.json')
  const tsconfig = readJson(tsconfigPath)
  const paths = tsconfig.compilerOptions?.paths ?? {}

  return Object.entries(paths)
    .map(([alias, targets]) => {
      const target = Array.isArray(targets) ? targets.join(', ') : String(targets)
      const safeId = alias.replace(/[@/*]/g, '').replace(/\./g, '_') || 'root'
      return {
        id: `code-organization.path.${safeId}`,
        category: 'path-alias',
        label: alias,
        value: target,
        sourcePath: 'site/tsconfig.json',
        sourceKind: 'tsconfig-path',
        sourcePointer: `compilerOptions.paths.${alias}`,
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function extractWorkflowRecords({ repoRoot = defaultRepoRoot } = {}) {
  return scriptsFromAllowlist(repoRoot, WORKFLOW_SCRIPT_ALLOWLIST)
}

export function extractSecurityRecords({ repoRoot = defaultRepoRoot } = {}) {
  return [
    ...commandsMatching(repoRoot, SECURITY_SCRIPT_PATTERN),
    ...moduleFacts(repoRoot, SECURITY_MODULE_PATHS, 'security', 'module'),
    ...collectServerOnlyModules(repoRoot),
  ].sort((left, right) => left.id.localeCompare(right.id))
}

export function extractPerformanceRecords({ repoRoot = defaultRepoRoot } = {}) {
  return [
    ...commandsMatching(repoRoot, PERFORMANCE_SCRIPT_PATTERN),
    ...moduleFacts(repoRoot, PERFORMANCE_MODULE_PATHS, 'performance', 'module'),
    ...collectPerformanceDependencies(repoRoot),
  ].sort((left, right) => left.id.localeCompare(right.id))
}

export function extractCodeOrganizationRecords({ repoRoot = defaultRepoRoot } = {}) {
  return [
    ...collectSiteTopLevelDirs(repoRoot),
    ...collectFeatureModules(repoRoot),
    ...collectPathAliases(repoRoot),
  ].sort((left, right) => left.id.localeCompare(right.id))
}
