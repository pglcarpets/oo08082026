import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createManifestRecord,
  GENERATED_ROOT_CONTENT,
  GENERATED_ROOT_FILENAME,
  canonicalJsonString,
  ensureDir,
  getDocumentsRoot,
  resetDirectory,
  writeCanonicalJsonFile,
} from './filesystem.mjs'
import { buildGeneratorModel } from './model.mjs'
import { renderJsonOutputs } from './render-json.mjs'
import { renderMarkdownOutputs } from './render-markdown.mjs'
import { GENERATED_ROOT_DIR } from './output-contract.mjs'
import { validateGeneratedSurface } from './publish-generated-tree.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function writeOutputs(rootDir, outputs) {
  await ensureDir(rootDir)
  await writeFile(path.join(rootDir, GENERATED_ROOT_FILENAME), GENERATED_ROOT_CONTENT, 'utf8')

  for (const [relativePath, content] of Object.entries(outputs).sort(([left], [right]) => left.localeCompare(right))) {
    const targetPath = path.join(rootDir, relativePath)
    await ensureDir(path.dirname(targetPath))
    await writeFile(targetPath, content, 'utf8')
  }
}

function buildOutputMap(model) {
  const jsonOutputs = renderJsonOutputs(model)
  const markdownOutputs = renderMarkdownOutputs(model, jsonOutputs)
  const outputs = {}

  for (const [relativePath, value] of Object.entries(jsonOutputs)) {
    outputs[relativePath] = canonicalJsonString(value)
  }

  for (const [relativePath, value] of Object.entries(markdownOutputs)) {
    outputs[relativePath] = value.endsWith('\n') ? value : `${value}\n`
  }

  return { outputs, jsonOutputs }
}

/** Wipe `documentsRoot` and write fresh docs output directly (no staging). */
export async function generateDocs({
  repoRoot = defaultRepoRoot,
  model = buildGeneratorModel({ repoRoot }),
  documentsRoot = getDocumentsRoot(repoRoot),
} = {}) {
  const { outputs, jsonOutputs } = buildOutputMap(model)
  const rootMarkerEntry = {
    path: GENERATED_ROOT_FILENAME,
    hash: `sha256:${sha256(GENERATED_ROOT_CONTENT)}`,
    bytes: Buffer.byteLength(GENERATED_ROOT_CONTENT, 'utf8'),
  }
  const nextManifest = createManifestRecord({
    version: 'v1',
    root: `${GENERATED_ROOT_DIR}/docs`,
    files: [
      rootMarkerEntry,
      ...Object.entries(outputs).map(([relativePath, content]) => ({
        path: relativePath,
        hash: `sha256:${sha256(content)}`,
        bytes: Buffer.byteLength(content, 'utf8'),
      })),
    ].sort((left, right) => left.path.localeCompare(right.path)),
  })

  await resetDirectory(documentsRoot)
  await writeOutputs(documentsRoot, outputs)
  await writeCanonicalJsonFile(path.join(documentsRoot, '_manifest.json'), nextManifest)
  await validateGeneratedSurface({ root: documentsRoot, surface: 'docs' })

  return { model, jsonOutputs, outputs, nextManifest, documentsRoot }
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  generateDocs().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
