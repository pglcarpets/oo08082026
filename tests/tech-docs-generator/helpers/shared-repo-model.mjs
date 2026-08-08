import fs from 'node:fs'
import path from 'node:path'
import v8 from 'node:v8'
import { fileURLToPath } from 'node:url'
import {
  buildGeneratorModel,
  primeGeneratorModelCache,
} from '../../../tech-docs-generator/scripts/model.mjs'

export const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

/** Cross-fork cache — isolate:true clears the in-memory Map every file. */
export const GENERATOR_MODEL_CACHE_PATH = path.join(
  defaultRepoRoot,
  'results',
  'tooling',
  'tech-docs',
  'generator-model.cache.v8',
)

/** @type {Map<string, ReturnType<typeof buildGeneratorModel>>} */
const modelByRepoRoot = new Map()

/**
 * @param {string} [repoRoot]
 */
function readDiskCache(repoRoot) {
  if (!fs.existsSync(GENERATOR_MODEL_CACHE_PATH)) return null
  try {
    const payload = v8.deserialize(fs.readFileSync(GENERATOR_MODEL_CACHE_PATH))
    if (
      payload &&
      typeof payload === 'object' &&
      payload.repoRoot === repoRoot &&
      payload.model
    ) {
      return payload.model
    }
  } catch {
    // Corrupt/stale cache — rebuild.
  }
  return null
}

/**
 * @param {string} repoRoot
 * @param {ReturnType<typeof buildGeneratorModel>} model
 */
function writeDiskCache(repoRoot, model) {
  fs.mkdirSync(path.dirname(GENERATOR_MODEL_CACHE_PATH), { recursive: true })
  fs.writeFileSync(
    GENERATOR_MODEL_CACHE_PATH,
    v8.serialize({ repoRoot, model }),
  )
}

/**
 * Module-level cached generator model for heavy tech-docs test suites.
 * Reuses an on-disk V8 snapshot across Vitest forks (isolate:true), and
 * buildGeneratorModel's own repoRoot memo within a single process.
 *
 * @param {string} [repoRoot]
 */
export function getSharedRepoModel(repoRoot = defaultRepoRoot) {
  const resolved = path.resolve(repoRoot)
  const cached = modelByRepoRoot.get(resolved)
  if (cached) {
    return cached
  }

  const fromDisk = readDiskCache(resolved)
  if (fromDisk) {
    primeGeneratorModelCache(resolved, fromDisk)
    modelByRepoRoot.set(resolved, fromDisk)
    return fromDisk
  }

  const model = buildGeneratorModel({ repoRoot: resolved })
  modelByRepoRoot.set(resolved, model)
  writeDiskCache(resolved, model)
  return model
}

/** Drop the cross-fork snapshot so the next getSharedRepoModel rebuilds. */
export function clearSharedRepoModelCache() {
  modelByRepoRoot.clear()
  try {
    fs.unlinkSync(GENERATOR_MODEL_CACHE_PATH)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      throw error
    }
  }
}
