import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalJsonString, ensureDir, resetDirectory } from './filesystem.mjs'
import { getRendererDataRoot, getSourcePackageRoot } from './output-contract.mjs'
import { validateGeneratedSurface, writeSurfaceManifest } from './publish-generated-tree.mjs'
import { buildGeneratorModel } from './model.mjs'
import {
  buildRendererAccuracyReport,
  buildRendererDataPayloads,
} from './renderer-data.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

/** Wipe `outDir` and write fresh renderer data directly (no staging). */
export async function emitRendererData({
  repoRoot = defaultRepoRoot,
  model = buildGeneratorModel({ repoRoot }),
  outDir = getRendererDataRoot(repoRoot),
} = {}) {
  const payloads = buildRendererDataPayloads(model)
  await resetDirectory(outDir)
  await ensureDir(outDir)

  for (const [filename, value] of Object.entries(payloads)) {
    await writeFile(path.join(outDir, filename), `${canonicalJsonString(value)}\n`, 'utf8')
  }

  const packageRoot = getSourcePackageRoot(repoRoot)
  const accuracy = buildRendererAccuracyReport(model, payloads, { packageRoot })
  await writeFile(
    path.join(outDir, '_accuracy-renderer.json'),
    `${canonicalJsonString(accuracy)}\n`,
    'utf8',
  )
  const nextManifest = await writeSurfaceManifest({ stagingRoot: outDir, surface: 'data' })
  await validateGeneratedSurface({ root: outDir, surface: 'data' })

  return {
    outDir,
    nextManifest,
    payloads,
    fileCount: Object.keys(payloads).length + 1,
    dependencyCount: model.dependencies.length,
    searchCount: payloads['search-items.json'].length,
  }
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  emitRendererData()
    .then((result) => {
      console.log(
        `Emitted renderer data: ${result.fileCount} files (${result.dependencyCount} dependencies, ${result.searchCount} search items) → ${result.outDir}`,
      )
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
}
