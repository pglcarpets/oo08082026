export const SOURCE_PACKAGE_DIR: 'tech-docs-generator'
export const SOURCE_PACKAGE_NAME: 'oando-tech-docs'
export const LEGACY_SOURCE_PACKAGE_DIR: 'tech-stack-generator'
export const GENERATED_ROOT_DIR: 'generated-documents'
export const GENERATED_DATA_DIR: 'data'
export const GENERATED_DOCS_DIR: 'docs'
export const GENERATED_SITE_DIR: 'site'
export const LEGACY_GENERATED_ROOTS: readonly string[]
export const EXCLUDED_REPOSITORY_ROOTS: readonly string[]
export const GENERATED_SURFACES: readonly string[]
export const LIVE_WATCH_ROOTS: readonly string[]

export function getSourcePackageRoot(repoRoot: string): string
export function getGeneratedRoot(repoRoot: string): string
export function getDocumentsRoot(repoRoot: string): string
export function getRendererDataRoot(repoRoot: string): string
export function getSiteOutputRoot(repoRoot: string): string
export function getTechDocsToolingRoot(repoRoot: string): string
export function getTechDocsViteCacheDir(repoRoot: string): string
export function getStagingGeneratedRoot(repoRoot: string): string
export function getStagingDocumentsRoot(repoRoot: string): string
export function getStagingRendererDataRoot(repoRoot: string): string
export function getStagingSiteOutputRoot(repoRoot: string): string
export function normalizeRepositoryInput(repoRoot: string, inputPath: string): string | null
