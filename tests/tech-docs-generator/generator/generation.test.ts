import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateDocs } from '../../../tech-docs-generator/scripts/generate.mjs'
import { emitRendererData } from '../../../tech-docs-generator/scripts/emit-renderer-data.mjs'
import { defaultRepoRoot, getSharedRepoModel } from '../helpers/shared-repo-model.mjs'

const repoRoot = defaultRepoRoot
const tempRoots: string[] = []

function createTempRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'oando-tech-docs-'))
  tempRoots.push(root)
  return root
}

function snapshotTree(root: string, relative = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const next = relative ? path.join(relative, entry.name) : entry.name
    if (entry.isDirectory()) Object.assign(result, snapshotTree(root, next))
    if (entry.isFile()) result[next.replace(/\\/g, '/')] = readFileSync(path.join(root, next)).toString('base64')
  }
  return result
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop()
    if (root) rmSync(root, { recursive: true, force: true })
  }
})

describe('tech stack generation', () => {
  it('writes stable output directly into the documents root', async () => {
    const documentsRoot = path.join(createTempRoot(), 'generated-documents', 'docs')
    // Freeze the model once. Re-building from the live repo between calls races with
    // parallel writers (other vitest forks / editors) and makes consecutive hashes diverge
    // even when generateDocs itself is deterministic.
    const model = getSharedRepoModel(repoRoot)

    const first = await generateDocs({ repoRoot, model, documentsRoot })
    const second = await generateDocs({ repoRoot, model, documentsRoot })

    expect(first.nextManifest.hash).toBe(second.nextManifest.hash)
    expect(readFileSync(path.join(documentsRoot, '_manifest.json'), 'utf8')).toContain(first.nextManifest.hash)
    expect(readFileSync(path.join(documentsRoot, 'data', 'dependencies.json'), 'utf8')).toContain('"id": ".:dependencies:next.resolved-version"')
    expect(readFileSync(path.join(documentsRoot, 'markdown', 'overview', 'index.md'), 'utf8')).toContain('# Overview')
    expect(readFileSync(path.join(documentsRoot, 'markdown', 'architecture', 'index.md'), 'utf8')).toContain('architecture.rootScripts')
    expect(readFileSync(path.join(documentsRoot, '_accuracy.json'), 'utf8')).toContain('"exactSourceMatches"')
  }, 120_000)

  it('cleans the destination before writing fresh outputs', async () => {
    const documentsRoot = path.join(createTempRoot(), 'generated-documents', 'docs')
    mkdirSync(documentsRoot, { recursive: true })
    writeFileSync(path.join(documentsRoot, 'stale.txt'), 'remove-me', 'utf8')

    const model = getSharedRepoModel(repoRoot)
    await generateDocs({ repoRoot, model, documentsRoot })

    expect(existsSync(path.join(documentsRoot, 'stale.txt'))).toBe(false)
    expect(existsSync(path.join(documentsRoot, '_manifest.json'))).toBe(true)
    expect(existsSync(path.join(documentsRoot, 'data', 'dependencies.json'))).toBe(true)
  }, 120_000)

  it('overwrites renderer data directly and drops stale files', async () => {
    const outDir = path.join(createTempRoot(), 'generated-documents', 'data')
    const model = getSharedRepoModel(repoRoot)
    await emitRendererData({ repoRoot, model, outDir })
    const previous = snapshotTree(outDir)

    writeFileSync(path.join(outDir, 'rogue.txt'), 'owner-data')
    await emitRendererData({ repoRoot, model, outDir })

    expect(existsSync(path.join(outDir, 'rogue.txt'))).toBe(false)
    expect(snapshotTree(outDir)).toEqual(previous)
  }, 120_000)

  it('emits normalized facts with provenance metadata', () => {
    const model = getSharedRepoModel(repoRoot)

    expect(model.facts.length).toBeGreaterThan(0)
    for (const record of model.facts) {
      expect(record.fact).toEqual(
        expect.objectContaining({
          sourcePath: expect.any(String),
          sourceKind: expect.any(String),
          sourcePointer: expect.any(String),
          factClassification: expect.any(String),
        }),
      )
    }

    expect(model.facts.find((record) => record.id === 'overview.commands')).toMatchObject({
      id: 'overview.commands',
      category: 'overview',
      fact: expect.objectContaining({
        sourcePath: '_generated',
        sourceKind: 'generated-summary',
        sourcePointer: 'overview.commands',
        factClassification: 'code-proven',
        browserExposure: 'public-safe',
        secretRisk: 'none',
        renderSurface: ['markdown', 'renderer'],
        verificationMode: 'source-backed',
      }),
    })

    expect(model.testingPolicy.find((record) => record.id === 'testing.coverage-floor')).toMatchObject({
      id: 'testing.coverage-floor',
      fact: {
        sourcePath: 'tech-docs-generator/scripts/check-coverage.mjs',
        sourceKind: 'checked-in-script-or-config',
        sourcePointer: 'THRESHOLDS.minimum',
        factClassification: 'code-proven',
      },
    })
  }, 30_000)
})
