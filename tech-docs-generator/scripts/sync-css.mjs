import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalJsonString, resetDirectory } from './filesystem.mjs'
import { getRendererDataRoot } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function walkCssFiles(dir, acc = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      await walkCssFiles(full, acc)
    } else if (ent.name.endsWith('.css')) {
      acc.push(full)
    }
  }
  return acc
}

/**
 * Sync FOCSS sheets into generated-documents/data/css for the tech-docs renderer.
 * Canonical source: site/focss/ (stubs under site/app/css removed — phase 3f).
 */
async function copyCssTree({ repoRoot, outRoot, manifest }) {
  const focssRoot = path.join(repoRoot, 'site', 'focss')
  const entryRel = 'site/entry.css'
  const entryAbs = path.join(focssRoot, entryRel)
  const entryText = await readFile(entryAbs, 'utf8')

  const cssFiles = await walkCssFiles(focssRoot)
  for (const sourcePath of cssFiles) {
    const relative = path.relative(focssRoot, sourcePath).split(path.sep).join('/')
    const targetRelative = path.posix.join('focss', relative)
    const targetPath = path.join(outRoot, targetRelative)
    await mkdir(path.dirname(targetPath), { recursive: true })
    const content = await readFile(sourcePath, 'utf8')
    await writeFile(targetPath, content, 'utf8')
    manifest.files.push({
      path: targetRelative.replace(/\\/g, '/'),
      sourcePath: `site/focss/${relative}`,
      hash: `sha256:${sha256(content)}`,
    })
  }

  const entryContent = `${entryText.trim()}\n`
  const entryPath = path.join(outRoot, 'entry.css')
  // Point renderer entry at the copied FOCSS entry (relative within outRoot).
  const wrapper = `@import "./focss/${entryRel}";\n`
  await writeFile(entryPath, wrapper, 'utf8')
  manifest.files.push({
    path: 'entry.css',
    sourcePath: `site/focss/${entryRel}`,
    hash: `sha256:${sha256(wrapper)}`,
  })

  // Keep entry source hash too for debugging
  void entryContent

  return { importCount: cssFiles.length }
}

export async function syncSiteCss({ repoRoot = defaultRepoRoot } = {}) {
  const outRoot = path.join(getRendererDataRoot(repoRoot), 'css')
  await resetDirectory(outRoot)

  const manifest = {
    version: 'v1',
    syncedAt: new Date().toISOString(),
    files: [],
  }

  const { importCount } = await copyCssTree({ repoRoot, outRoot, manifest })
  await writeFile(path.join(outRoot, 'manifest.json'), canonicalJsonString(manifest), 'utf8')

  return { outRoot, importCount, fileCount: manifest.files.length }
}

export function stableManifestForCompare(manifest) {
  const { syncedAt: _syncedAt, ...stable } = manifest
  return stable
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  syncSiteCss()
    .then((result) => {
      console.log(
        `Synced FOCSS → ${result.outRoot} (${result.importCount} css files, ${result.fileCount} manifest entries)`,
      )
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
}
