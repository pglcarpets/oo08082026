import { mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  publishGeneratedTrees,
  validateGeneratedSurface,
  writeSurfaceManifest,
} from '../../../tech-docs-generator/scripts/publish-generated-tree.mjs'
import { getStagingGeneratedRoot } from '../../../tech-docs-generator/scripts/output-contract.mjs'

const roots: string[] = []
const surfaces = ['data', 'docs', 'site'] as const

function fixtureRoot() {
  const root = path.join(os.tmpdir(), `oando-publication-${process.pid}-${Math.random().toString(16).slice(2)}`)
  mkdirSync(root, { recursive: true })
  roots.push(root)
  return root
}

function treeSnapshot(root: string, relative = ''): Record<string, string> {
  const snapshot: Record<string, string> = {}
  for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const next = relative ? path.join(relative, entry.name) : entry.name
    if (entry.isDirectory()) Object.assign(snapshot, treeSnapshot(root, next))
    else if (entry.isFile()) snapshot[next.replace(/\\/g, '/')] = readFileSync(path.join(root, next)).toString('base64')
  }
  return snapshot
}

async function stage(root: string, surface: typeof surfaces[number], value: string) {
  const stagingRoot = path.join(getStagingGeneratedRoot(root), surface)
  mkdirSync(stagingRoot, { recursive: true })
  writeFileSync(path.join(stagingRoot, `${surface}.txt`), value)
  await writeSurfaceManifest({ stagingRoot, surface })
  return stagingRoot
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('transactional generated-tree publication', () => {
  it.each(surfaces)('refuses unknown files in the canonical %s surface', async (surface) => {
    const repoRoot = fixtureRoot()
    await stage(repoRoot, surface, 'old')
    await publishGeneratedTrees({ repoRoot, surfaces: [surface] })
    writeFileSync(path.join(repoRoot, 'generated-documents', surface, 'rogue.txt'), 'owner-data')
    await stage(repoRoot, surface, 'new')

    await expect(publishGeneratedTrees({ repoRoot, surfaces: [surface] }))
      .rejects.toThrow(new RegExp(`Unknown file\\(s\\) in generated-documents/${surface}/: rogue\\.txt`))
    expect(readFileSync(path.join(repoRoot, 'generated-documents', surface, 'rogue.txt'), 'utf8')).toBe('owner-data')
  })

  it.each(surfaces)('refuses unknown files in the staged %s surface', async (surface) => {
    const repoRoot = fixtureRoot()
    const stagingRoot = await stage(repoRoot, surface, 'new')
    writeFileSync(path.join(stagingRoot, 'rogue.txt'), 'unknown')
    await expect(publishGeneratedTrees({ repoRoot, surfaces: [surface] }))
      .rejects.toThrow(new RegExp(`Unknown file\\(s\\) in generated-documents/${surface}/: rogue\\.txt`))
  })

  it('refuses an unknown sibling under generated-documents', async () => {
    const repoRoot = fixtureRoot()
    await stage(repoRoot, 'docs', 'new')
    mkdirSync(path.join(repoRoot, 'generated-documents', 'owner-files'), { recursive: true })
    await expect(publishGeneratedTrees({ repoRoot, surfaces: ['docs'] }))
      .rejects.toThrow(/Unknown sibling\(s\) in generated-documents\/: owner-files/)
  })

  it('publishes all selected surfaces in one successful swap', async () => {
    const repoRoot = fixtureRoot()
    for (const surface of surfaces) await stage(repoRoot, surface, 'new')
    await publishGeneratedTrees({ repoRoot, surfaces: [...surfaces] })
    for (const surface of surfaces) {
      const canonical = path.join(repoRoot, 'generated-documents', surface)
      expect(readFileSync(path.join(canonical, `${surface}.txt`), 'utf8')).toBe('new')
      const manifest = await validateGeneratedSurface({ root: canonical, surface })
      expect(manifest.root).toBe(`generated-documents/${surface}`)
      expect(Array.isArray(manifest.files)).toBe(true)
      expect(typeof manifest.hash).toBe('string')
      expect(manifest.hash.length).toBeGreaterThan(0)
    }
  })

  it('rolls every selected surface back when a later swap fails', async () => {
    const repoRoot = fixtureRoot()
    for (const surface of surfaces) await stage(repoRoot, surface, 'old')
    await publishGeneratedTrees({ repoRoot, surfaces: [...surfaces] })
    const before = Object.fromEntries(surfaces.map((surface) => [surface, treeSnapshot(path.join(repoRoot, 'generated-documents', surface))]))
    for (const surface of surfaces) await stage(repoRoot, surface, 'new')
    let count = 0

    await expect(publishGeneratedTrees({
      repoRoot,
      surfaces: [...surfaces],
      operations: {
        rename: async (source: string, target: string) => {
          count += 1
          if (count === 4) throw new Error('injected multi-surface failure')
          await rename(source, target)
        },
      },
    })).rejects.toThrow(/injected multi-surface failure/)

    for (const surface of surfaces) {
      expect(treeSnapshot(path.join(repoRoot, 'generated-documents', surface))).toEqual(before[surface])
    }
  })

  it('restores a colliding revision byte-identically after post-install failure', async () => {
    const repoRoot = fixtureRoot()
    const stagingRoot = path.join(getStagingGeneratedRoot(repoRoot), 'data')
    const revision = path.join('revisions', 'side-table-001.8.json')
    mkdirSync(path.join(stagingRoot, 'revisions'), { recursive: true })
    writeFileSync(path.join(stagingRoot, revision), Buffer.from([0, 1, 2, 255, 10]))
    await writeSurfaceManifest({ stagingRoot, surface: 'data' })
    await publishGeneratedTrees({ repoRoot, surfaces: ['data'] })
    const canonicalRevision = path.join(repoRoot, 'generated-documents', 'data', revision)
    const oldBytes = readFileSync(canonicalRevision)

    mkdirSync(path.join(stagingRoot, 'revisions'), { recursive: true })
    writeFileSync(path.join(stagingRoot, revision), Buffer.from('new revision bytes'))
    writeFileSync(path.join(stagingRoot, 'new-partial.json'), 'must disappear')
    await writeSurfaceManifest({ stagingRoot, surface: 'data' })

    await expect(publishGeneratedTrees({
      repoRoot,
      surfaces: ['data'],
      operations: {
        afterInstall: async () => { throw new Error('injected post-install failure') },
      },
    })).rejects.toThrow(/injected post-install failure/)

    expect(readFileSync(canonicalRevision)).toEqual(oldBytes)
    expect(() => readFileSync(path.join(repoRoot, 'generated-documents', 'data', 'new-partial.json'))).toThrow()
  })

  it('preserves byte-identical canonical trees without renaming them', async () => {
    const repoRoot = fixtureRoot()
    for (const surface of surfaces) await stage(repoRoot, surface, 'same')
    await publishGeneratedTrees({ repoRoot, surfaces: [...surfaces] })
    const before = Object.fromEntries(surfaces.map((surface) => [surface, treeSnapshot(path.join(repoRoot, 'generated-documents', surface))]))
    for (const surface of surfaces) await stage(repoRoot, surface, 'same')

    const result = await publishGeneratedTrees({
      repoRoot,
      surfaces: [...surfaces],
      operations: { rename: async () => { throw new Error('identical trees must not swap') } },
    })

    expect(result.preserved).toEqual([...surfaces])
    for (const surface of surfaces) expect(treeSnapshot(path.join(repoRoot, 'generated-documents', surface))).toEqual(before[surface])
  })

  it('rejects traversal and symlink escapes in staged trees', async () => {
    const repoRoot = fixtureRoot()
    const stagingRoot = await stage(repoRoot, 'docs', 'new')
    const manifestPath = path.join(stagingRoot, '_manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.files[0].path = '../outside.txt'
    writeFileSync(manifestPath, JSON.stringify(manifest))
    await expect(validateGeneratedSurface({ root: stagingRoot, surface: 'docs' })).rejects.toThrow(/Parent traversal/)

    rmSync(stagingRoot, { recursive: true, force: true })
    mkdirSync(stagingRoot, { recursive: true })
    const outside = path.join(repoRoot, 'outside')
    mkdirSync(outside, { recursive: true })
    writeFileSync(path.join(outside, 'outside.txt'), 'outside')
    symlinkSync(outside, path.join(stagingRoot, 'escape'), 'junction')
    await expect(writeSurfaceManifest({ stagingRoot, surface: 'docs' })).rejects.toThrow(/Symlink escapes/)
  })
})
