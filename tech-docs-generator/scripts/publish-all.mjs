import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GENERATED_SURFACES, getGeneratedRoot } from './output-contract.mjs'
import { validateGeneratedSurface, writeSurfaceManifest } from './publish-generated-tree.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

/**
 * Finalize live surfaces in place: write manifest + validate.
 * No staging swap — Vite/site and generate writers already wrote into
 * `generated-documents/<surface>/`.
 */
export async function publishAll({ repoRoot = defaultRepoRoot, surfaces } = {}) {
  if (!Array.isArray(surfaces) || surfaces.length === 0) throw new Error('publishAll requires an explicit surface list')
  for (const surface of surfaces) {
    if (!GENERATED_SURFACES.includes(surface)) throw new Error(`Unknown generated surface: ${surface}`)
    const root = path.join(getGeneratedRoot(repoRoot), surface)
    await writeSurfaceManifest({ stagingRoot: root, surface })
    await validateGeneratedSurface({ root, surface })
  }
  return { finalized: [...surfaces] }
}

function cliSurfaces(argv) {
  const option = argv.find((value) => value.startsWith('--surfaces='))
  if (option) return option.slice('--surfaces='.length).split(',').filter(Boolean)
  const positional = argv.filter((value) => !value.startsWith('-'))
  return positional.length ? positional : [...GENERATED_SURFACES]
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  publishAll({ surfaces: cliSurfaces(process.argv.slice(2)) }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
