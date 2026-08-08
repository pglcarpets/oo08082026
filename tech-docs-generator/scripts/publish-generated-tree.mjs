import { createHash, randomUUID } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  canonicalJsonString,
  createManifestRecord,
  GENERATED_ROOT_CONTENT,
  GENERATED_ROOT_FILENAME,
  manifestHash,
  normalizeRelativePosixPath,
} from './filesystem.mjs'
import { GENERATED_ROOT_DIR, GENERATED_SURFACES, getGeneratedRoot, getStagingGeneratedRoot } from './output-contract.mjs'

const MANIFEST_FILENAME = '_manifest.json'

async function exists(filePath) {
  return stat(filePath).then(() => true).catch((error) => {
    if (error?.code === 'ENOENT') return false
    throw error
  })
}

/**
 * Atomic-ish directory replace. `rename` fails on Windows when antivirus,
 * Explorer, or a file handle holds the tree (EPERM/EBUSY/EACCES). Fall back to
 * copy + remove so `pnpm run build` still publishes on locked machines.
 */
export async function replacePath(source, destination, renamePath = rename) {
  try {
    await renamePath(source, destination)
    return
  } catch (error) {
    const code = error && typeof error === 'object' ? error.code : undefined
    if (!['EPERM', 'EBUSY', 'EACCES', 'EXDEV'].includes(code)) {
      throw error
    }
  }

  await rm(destination, { recursive: true, force: true })
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(source, destination, { recursive: true, force: true })
  await rm(source, { recursive: true, force: true })
}

async function collectFiles(root, relativeBase = '') {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const relative = relativeBase ? path.posix.join(relativeBase, entry.name) : entry.name
    const absolute = path.join(root, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Symlink escapes are not allowed in generated trees: ${relative}`)
    if (entry.isDirectory()) files.push(...await collectFiles(absolute, relative))
    else if (entry.isFile()) files.push(relative)
    else throw new Error(`Unsupported generated tree entry: ${relative}`)
  }
  return files.sort()
}

async function fileRecord(root, relativePath) {
  const normalized = normalizeRelativePosixPath(relativePath)
  const content = await readFile(path.join(root, normalized))
  return {
    path: normalized,
    hash: `sha256:${createHash('sha256').update(content).digest('hex')}`,
    bytes: content.byteLength,
  }
}

export async function writeSurfaceManifest({ stagingRoot, surface }) {
  if (!GENERATED_SURFACES.includes(surface)) throw new Error(`Unknown generated surface: ${surface}`)
  if (!await exists(stagingRoot)) throw new Error(`Missing staged generated surface: ${stagingRoot}`)
  await writeFile(path.join(stagingRoot, GENERATED_ROOT_FILENAME), GENERATED_ROOT_CONTENT, 'utf8')
  const files = (await collectFiles(stagingRoot)).filter((file) => file !== MANIFEST_FILENAME)
  const records = []
  for (const file of files) records.push(await fileRecord(stagingRoot, file))
  const manifest = createManifestRecord({
    version: 'v1',
    root: `${GENERATED_ROOT_DIR}/${surface}`,
    files: records,
  })
  await writeFile(path.join(stagingRoot, MANIFEST_FILENAME), canonicalJsonString(manifest), 'utf8')
  return manifest
}

export async function validateGeneratedSurface({ root, surface, allowMissing = false }) {
  if (!await exists(root)) {
    if (allowMissing) return null
    throw new Error(`Missing generated surface: ${root}`)
  }
  const markerPath = path.join(root, GENERATED_ROOT_FILENAME)
  const manifestPath = path.join(root, MANIFEST_FILENAME)
  const marker = await readFile(markerPath, 'utf8').catch(() => null)
  if (marker !== GENERATED_ROOT_CONTENT) throw new Error(`Invalid or missing generated-root marker for ${surface}: ${root}`)
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => 'null'))
  if (!manifest || manifest.root !== `${GENERATED_ROOT_DIR}/${surface}`) {
    throw new Error(`Invalid or missing manifest for ${surface}: ${root}`)
  }
  const declared = new Set(manifest.files.map((entry) => normalizeRelativePosixPath(entry.path)))
  for (const removed of manifest.removed ?? []) normalizeRelativePosixPath(removed)
  if (manifestHash(manifest) !== manifest.hash) {
    throw new Error(`Invalid or missing manifest for ${surface}: ${root}`)
  }
  const actual = await collectFiles(root)
  const allowed = new Set([...declared, MANIFEST_FILENAME])
  const unknown = actual.filter((file) => !allowed.has(file))
  const missing = [...declared].filter((file) => !actual.includes(file))
  if (unknown.length) throw new Error(`Unknown file(s) in ${GENERATED_ROOT_DIR}/${surface}/: ${unknown.join(', ')}`)
  if (missing.length) throw new Error(`Missing manifested file(s) in ${GENERATED_ROOT_DIR}/${surface}/: ${missing.join(', ')}`)
  for (const entry of manifest.files) {
    const actualRecord = await fileRecord(root, entry.path)
    if (actualRecord.hash !== entry.hash || actualRecord.bytes !== entry.bytes) {
      throw new Error(`Manifest hash mismatch in ${GENERATED_ROOT_DIR}/${surface}/: ${entry.path}`)
    }
  }
  for (const removed of manifest.removed ?? []) {
    if (actual.includes(normalizeRelativePosixPath(removed))) {
      throw new Error(`Declared removal still exists in ${GENERATED_ROOT_DIR}/${surface}/: ${removed}`)
    }
  }
  return manifest
}

export async function assertGeneratedRootSiblings(repoRoot) {
  const generatedRoot = getGeneratedRoot(repoRoot)
  if (!await exists(generatedRoot)) return
  const unknown = (await readdir(generatedRoot, { withFileTypes: true }))
    .filter((entry) => !GENERATED_SURFACES.includes(entry.name))
    .map((entry) => entry.name)
    .sort()
  if (unknown.length) throw new Error(`Unknown sibling(s) in ${GENERATED_ROOT_DIR}/: ${unknown.join(', ')}`)
}

export async function publishGeneratedTrees({ repoRoot, surfaces, roots = {}, operations = {} }) {
  const selected = [...new Set(surfaces)]
  if (!selected.length || selected.some((surface) => !GENERATED_SURFACES.includes(surface))) {
    throw new Error(`Explicit valid generated surfaces are required: ${selected.join(', ')}`)
  }
  if (repoRoot) await assertGeneratedRootSiblings(repoRoot)
  const renamePath = operations.rename ?? rename
  const removePath = operations.rm ?? rm
  const replace = operations.replacePath ?? ((from, to) => replacePath(from, to, renamePath))
  const states = []
  for (const surface of selected) {
    const canonicalRoot = roots[surface]?.canonical ?? path.join(getGeneratedRoot(repoRoot), surface)
    const stagingRoot = roots[surface]?.staging ?? path.join(getStagingGeneratedRoot(repoRoot), surface)
    const nextManifest = await validateGeneratedSurface({ root: stagingRoot, surface })
    const previousManifest = await validateGeneratedSurface({ root: canonicalRoot, surface, allowMissing: true })
    states.push({ surface, canonicalRoot, stagingRoot, nextManifest, previousManifest, backupRoot: `${canonicalRoot}.backup-${randomUUID()}`, installed: false, backedUp: false })
  }
  const changed = states.filter((state) => state.previousManifest?.hash !== state.nextManifest.hash)
  try {
    for (const state of changed) {
      await mkdir(path.dirname(state.canonicalRoot), { recursive: true })
      if (state.previousManifest) {
        await replace(state.canonicalRoot, state.backupRoot)
        state.backedUp = true
      }
      await replace(state.stagingRoot, state.canonicalRoot)
      state.installed = true
      if (operations.afterInstall) await operations.afterInstall(state)
    }
  } catch (error) {
    for (const state of [...changed].reverse()) {
      if (state.installed && await exists(state.canonicalRoot)) {
        await removePath(state.canonicalRoot, { recursive: true, force: true })
      }
      if (state.backedUp && await exists(state.backupRoot)) {
        await replace(state.backupRoot, state.canonicalRoot)
      }
    }
    throw error
  }
  for (const state of changed) {
    if (state.backedUp) await removePath(state.backupRoot, { recursive: true, force: true })
  }
  return { published: changed.map((state) => state.surface), preserved: states.filter((state) => !changed.includes(state)).map((state) => state.surface) }
}

export async function publishGeneratedTree({ surface, canonicalRoot, stagingRoot, repoRoot, ...options }) {
  return publishGeneratedTrees({
    repoRoot,
    surfaces: [surface],
    roots: { [surface]: { canonical: canonicalRoot, staging: stagingRoot } },
    ...options,
  })
}
