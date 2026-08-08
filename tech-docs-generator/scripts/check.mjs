import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateAll } from './generate-all.mjs'
import { validateGeneratedSurface } from './publish-generated-tree.mjs'
import {
  getDocumentsRoot,
  getRendererDataRoot,
} from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

/**
 * Validate live docs/data trees only — no wipe, no regenerate.
 * Gate calls this after a single `generateAll`.
 */
export async function validateGeneratedDocs({
  repoRoot = defaultRepoRoot,
  documentsRoot = getDocumentsRoot(repoRoot),
  rendererDataRoot = getRendererDataRoot(repoRoot),
} = {}) {
  await validateGeneratedSurface({ root: documentsRoot, surface: 'docs' })
  await validateGeneratedSurface({ root: rendererDataRoot, surface: 'data' })
  return true
}

/**
 * Wipe + regenerate docs/data, then validate. Standalone `pnpm run tech-docs:check`.
 */
export async function checkDocs({
  repoRoot = defaultRepoRoot,
} = {}) {
  await generateAll({ repoRoot })
  return validateGeneratedDocs({ repoRoot })
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  checkDocs().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
