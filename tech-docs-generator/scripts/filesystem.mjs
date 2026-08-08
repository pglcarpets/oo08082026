import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, stat, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import {
  GENERATED_ROOT_DIR,
  GENERATED_DOCS_DIR,
  getDocumentsRoot,
  getStagingDocumentsRoot,
} from './output-contract.mjs'

export { getDocumentsRoot, getStagingDocumentsRoot }

/** Normalize text to LF so byte offsets and hashes match across Windows and Linux checkouts. */
export function normalizeSourceText(content) {
  return content.toString('utf8').replace(/\r\n/g, '\n')
}

/** Deterministic path sort for generated docs (matches Linux CI regardless of host locale). */
export function comparePaths(left, right) {
  return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' })
}

export function readSourceText(filePath) {
  return normalizeSourceText(readFileSync(filePath))
}

export const GENERATED_ROOT_FILENAME = '.generated-root'
export const GENERATED_ROOT_CONTENT = 'oando-tech-docs:v1\n'
export const STAGING_DOCUMENTS_DIR = path.join('.tmp', GENERATED_ROOT_DIR, GENERATED_DOCS_DIR)
/** Vite static site — separate from manifest-owned markdown/json; must not block docs sync */

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function compareCanonicalValues(left, right) {
  const leftText = JSON.stringify(left)
  const rightText = JSON.stringify(right)

  if (leftText < rightText) {
    return -1
  }

  if (leftText > rightText) {
    return 1
  }

  return 0
}

export function canonicalizeJson(value) {
  if (Array.isArray(value)) {
    const canonicalItems = value.map((item, index) => ({
      index,
      value: canonicalizeJson(item),
    }))

    canonicalItems.sort((left, right) => {
      const comparison = compareCanonicalValues(left.value, right.value)
      return comparison !== 0 ? comparison : left.index - right.index
    })

    return canonicalItems.map((item) => item.value)
  }

  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => [key, canonicalizeJson(value[key])])

    return Object.fromEntries(entries)
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  throw new TypeError(`Unsupported JSON value type: ${typeof value}`)
}

export function canonicalJsonString(value) {
  return `${JSON.stringify(canonicalizeJson(value), null, 2)}\n`
}

export function canonicalJsonHash(value) {
  return createHash('sha256').update(canonicalJsonString(value), 'utf8').digest('hex')
}

export function normalizeRelativePosixPath(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new TypeError('Path must be a non-empty string.')
  }

  const normalizedInput = input.replace(/\\/g, '/')

  if (/^[a-zA-Z]:/.test(normalizedInput)) {
    throw new Error(`Absolute drive paths are not allowed: ${input}`)
  }

  if (normalizedInput.startsWith('//') || normalizedInput.startsWith('/')) {
    throw new Error(`Absolute paths are not allowed: ${input}`)
  }

  const normalized = path.posix.normalize(normalizedInput)

  if (normalized === '.' || normalized === '') {
    throw new Error(`Relative path resolved to empty output: ${input}`)
  }

  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Parent traversal is not allowed: ${input}`)
  }

  return normalized
}

export async function ensureGeneratedRoot(documentsRoot) {
  let entries
  try {
    entries = await readdir(documentsRoot, { withFileTypes: true })
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }

    await mkdir(documentsRoot, { recursive: true })
    entries = []
  }

  const markerPath = path.join(documentsRoot, GENERATED_ROOT_FILENAME)
  const markerEntry = entries.find((entry) => entry.isFile() && entry.name === GENERATED_ROOT_FILENAME)

  if (entries.length > 0 && !markerEntry) {
    throw new Error(
      `generated-documents/docs/ is not empty and is missing ${GENERATED_ROOT_FILENAME}; refusing to modify ${documentsRoot}.`,
    )
  }

  if (markerEntry) {
    const current = await readFile(markerPath, 'utf8')
    if (current !== GENERATED_ROOT_CONTENT) {
      throw new Error(
        `Invalid generated-root marker in ${markerPath}. Expected exact content ${JSON.stringify(GENERATED_ROOT_CONTENT)}.`,
      )
    }
    return { created: false, markerPath }
  }

  await writeFile(markerPath, GENERATED_ROOT_CONTENT, 'utf8')
  return { created: true, markerPath }
}

async function collectFiles(rootDir, relativeBase = '') {
  const entries = await readdir(rootDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relative = relativeBase ? path.posix.join(relativeBase, entry.name) : entry.name
    const absolute = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolute, relative)))
      continue
    }

    if (entry.isFile()) {
      files.push(relative.replace(/\\/g, '/'))
    }
  }

  return files.sort()
}

export async function assertDocumentsTreeOwned(documentsRoot, ownedPaths) {
  const normalizedOwned = new Set(
    ownedPaths.map((value) => normalizeRelativePosixPath(value)),
  )
  const currentFiles = await collectFiles(documentsRoot)
  const manifestMetaFiles = new Set([GENERATED_ROOT_FILENAME, '_manifest.json'])
  const unknownFiles = currentFiles.filter(
    (file) =>
      !manifestMetaFiles.has(file) &&
      !normalizedOwned.has(file),
  )

  if (unknownFiles.length > 0) {
    throw new Error(`Unknown file(s) in generated-documents/docs/: ${unknownFiles.join(', ')}`)
  }

  return { files: currentFiles }
}

async function ensureParentDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true })
}

async function copyTree(sourceRoot, targetRoot, relativeBase = '') {
  const entries = await readdir(sourceRoot, { withFileTypes: true })

  for (const entry of entries) {
    const relative = relativeBase ? path.posix.join(relativeBase, entry.name) : entry.name
    const sourcePath = path.join(sourceRoot, entry.name)
    const targetPath = path.join(targetRoot, relative)

    if (entry.isDirectory()) {
      await mkdir(targetPath, { recursive: true })
      await copyTree(sourcePath, targetRoot, relative)
      continue
    }

    if (entry.isFile()) {
      await ensureParentDir(targetPath)
      await copyFile(sourcePath, targetPath)
    }
  }
}

function normalizeManifestFileEntries(files) {
  return files
    .map((file) => {
      if (!file || typeof file !== 'object') {
        throw new TypeError('Manifest file entries must be objects.')
      }

      const normalizedPath = normalizeRelativePosixPath(file.path)
      const normalizedEntry = {
        ...file,
        path: normalizedPath,
      }

      return normalizedEntry
    })
    .sort((left, right) => left.path.localeCompare(right.path))
}

function normalizeManifestRemovalEntries(paths = []) {
  return paths.map((value) => normalizeRelativePosixPath(value)).sort()
}

/**
 * @param {{ files: Array<{ path: string, [key: string]: any }>, removed?: string[], [key: string]: any }} params
 */
export function createManifestRecord({ files, removed = [], ...metadata }) {
  const normalizedRecord = {
    ...metadata,
    files: normalizeManifestFileEntries(files),
    removed: normalizeManifestRemovalEntries(removed),
  }

  return {
    ...normalizedRecord,
    hash: canonicalJsonHash(normalizedRecord),
  }
}

export function manifestHash(manifest) {
  if (!isPlainObject(manifest)) {
    throw new TypeError('Manifest must be a plain object.')
  }

  const { hash: _ignored, ...manifestWithoutHash } = manifest
  return canonicalJsonHash(manifestWithoutHash)
}

export async function writeCanonicalJsonFile(filePath, value) {
  await ensureParentDir(filePath)
  await writeFile(filePath, canonicalJsonString(value), 'utf8')
}

export async function readCanonicalJsonFile(filePath) {
  const text = await readFile(filePath, 'utf8')
  return JSON.parse(text)
}

export async function applyManifestedDocuments({
  documentsRoot,
  stagingDocumentsRoot,
  previousManifest,
  nextManifest,
}) {
  await ensureGeneratedRoot(documentsRoot)

  const previousOwnedPaths = previousManifest?.files?.map((file) => file.path) ?? []
  const nextOwnedPaths = nextManifest?.files?.map((file) => file.path) ?? []
  const nextOwnedSet = new Set(nextOwnedPaths.map((value) => normalizeRelativePosixPath(value)))

  await assertDocumentsTreeOwned(documentsRoot, previousOwnedPaths)
  const stagingFiles = await collectFiles(stagingDocumentsRoot)
  const stagingSet = new Set(stagingFiles)
  const stagingMeta = new Set([GENERATED_ROOT_FILENAME, '_manifest.json'])
  const extraStagingFiles = stagingFiles.filter(
    (file) => !nextOwnedSet.has(file) && !stagingMeta.has(file),
  )
  const missingStagingFiles = [...nextOwnedSet].filter((file) => !stagingSet.has(file))

  if (extraStagingFiles.length > 0 || missingStagingFiles.length > 0) {
    const details = []
    if (extraStagingFiles.length > 0) {
      details.push(`unexpected: ${extraStagingFiles.join(', ')}`)
    }
    if (missingStagingFiles.length > 0) {
      details.push(`missing: ${missingStagingFiles.join(', ')}`)
    }
    throw new Error(`Staging generated-documents/docs/ mismatch (${details.join('; ')}).`)
  }

  const previousOwned = new Set(previousOwnedPaths.map((value) => normalizeRelativePosixPath(value)))
  const nextOwned = nextOwnedSet

  for (const ownedPath of previousOwned) {
    if (!nextOwned.has(ownedPath)) {
      await rm(path.join(documentsRoot, ownedPath), { force: true })
    }
  }

  await copyTree(stagingDocumentsRoot, documentsRoot)
  await ensureGeneratedRoot(documentsRoot)

  return {
    documentsRoot,
    stagingDocumentsRoot,
    previousOwned: [...previousOwned].sort(),
    nextOwned: [...nextOwned].sort(),
  }
}

export async function initializeDocumentsWorkspace(repoRoot) {
  const documentsRoot = getDocumentsRoot(repoRoot)
  const stagingDocumentsRoot = getStagingDocumentsRoot(repoRoot)

  await mkdir(stagingDocumentsRoot, { recursive: true })
  const marker = await ensureGeneratedRoot(documentsRoot)

  return {
    documentsRoot,
    stagingDocumentsRoot,
    marker,
  }
}

export async function removeTree(rootDir) {
  const exists = await stat(rootDir).then(() => true).catch((error) => {
    if (error?.code === 'ENOENT') {
      return false
    }
    throw error
  })

  if (exists) {
    await rm(rootDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    })
  }
}

/**
 * Create a directory tree. Retries ENOENT/EPERM — concurrent wipe of a parent
 * (e.g. Vite live regen + CLI generate-all) can race plain mkdir on Windows.
 */
export async function ensureDir(dirPath, { attempts = 8 } = {}) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await mkdir(dirPath, { recursive: true })
      return
    } catch (error) {
      lastError = error
      const code = error && typeof error === 'object' ? error.code : null
      if (code !== 'ENOENT' && code !== 'EPERM' && code !== 'EBUSY') {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)))
    }
  }
  throw lastError
}

export async function resetDirectory(rootDir) {
  await removeTree(rootDir)
  await ensureDir(rootDir)
}
