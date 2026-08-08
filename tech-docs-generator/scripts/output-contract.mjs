import path from 'node:path'
import { existsSync, realpathSync } from 'node:fs'

export const SOURCE_PACKAGE_DIR = 'tech-docs-generator'
export const SOURCE_PACKAGE_NAME = 'oando-tech-docs'
export const LEGACY_SOURCE_PACKAGE_DIR = 'tech-stack-generator'
export const GENERATED_ROOT_DIR = 'generated-documents'
export const GENERATED_DATA_DIR = 'data'
export const GENERATED_DOCS_DIR = 'docs'
export const GENERATED_SITE_DIR = 'site'

export const LEGACY_GENERATED_ROOTS = [
  'tech-stack-generated',
  'tech-stack-docs',
  '.tech-stack-generated',
]

export const EXCLUDED_REPOSITORY_ROOTS = [
  'archive',
  'websites',
  '.archive',
  '.websites',
  GENERATED_ROOT_DIR,
  'results',
  'node_modules',
  '.git',
  '.next',
  '.tmp',
]

export const GENERATED_SURFACES = [GENERATED_DATA_DIR, GENERATED_DOCS_DIR, GENERATED_SITE_DIR]

/** Explicit repository roots watched during Vite development regeneration. */
export const LIVE_WATCH_ROOTS = [
  'site',
  'docs',
  'Agents',
  '.github',
  SOURCE_PACKAGE_DIR,
  'scripts',
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'Readme.md',
  'Failures.md',
  'AGENTS.md',
  'Testing-handbook.md',
]

function isWithinRoot(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export function normalizeRepositoryInput(repoRoot, inputPath) {
  if (typeof inputPath !== 'string' || inputPath.trim() === '') return null
  const canonicalRoot = path.resolve(repoRoot)
  const absolute = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(canonicalRoot, inputPath)
  if (!isWithinRoot(canonicalRoot, absolute)) return null
  if (existsSync(canonicalRoot)) {
    const realRoot = realpathSync.native(canonicalRoot)
    let existingAncestor = absolute
    while (!existsSync(existingAncestor) && isWithinRoot(canonicalRoot, existingAncestor)) {
      const parent = path.dirname(existingAncestor)
      if (parent === existingAncestor) break
      existingAncestor = parent
    }
    if (existsSync(existingAncestor) && !isWithinRoot(realRoot, realpathSync.native(existingAncestor))) return null
  }
  const relative = path.relative(canonicalRoot, absolute).replace(/\\/g, '/')
  if (!relative || relative === '.') return null
  const firstSegment = relative.split('/')[0]
  if (EXCLUDED_REPOSITORY_ROOTS.includes(firstSegment)) return null
  return relative
}

export function getSourcePackageRoot(repoRoot) {
  return path.resolve(repoRoot, SOURCE_PACKAGE_DIR)
}

export function getGeneratedRoot(repoRoot) {
  return path.resolve(repoRoot, GENERATED_ROOT_DIR)
}

export function getDocumentsRoot(repoRoot) {
  return path.resolve(getGeneratedRoot(repoRoot), GENERATED_DOCS_DIR)
}

export function getRendererDataRoot(repoRoot) {
  return path.resolve(getGeneratedRoot(repoRoot), GENERATED_DATA_DIR)
}

export function getSiteOutputRoot(repoRoot) {
  return path.resolve(getGeneratedRoot(repoRoot), GENERATED_SITE_DIR)
}

/** Gate/coverage/cache artifacts — never product inventory (`generated-documents/`). */
export function getTechDocsToolingRoot(repoRoot) {
  return path.resolve(repoRoot, 'results', 'tooling', 'tech-docs')
}

export function getTechDocsViteCacheDir(repoRoot) {
  return path.resolve(getTechDocsToolingRoot(repoRoot), 'vite-cache')
}

export function getStagingGeneratedRoot(repoRoot) {
  return path.resolve(getTechDocsToolingRoot(repoRoot), 'staging-generated-documents')
}

export function getStagingDocumentsRoot(repoRoot) {
  return path.resolve(getStagingGeneratedRoot(repoRoot), GENERATED_DOCS_DIR)
}

export function getStagingRendererDataRoot(repoRoot) {
  return path.resolve(getStagingGeneratedRoot(repoRoot), GENERATED_DATA_DIR)
}

export function getStagingSiteOutputRoot(repoRoot) {
  return path.resolve(getStagingGeneratedRoot(repoRoot), GENERATED_SITE_DIR)
}
