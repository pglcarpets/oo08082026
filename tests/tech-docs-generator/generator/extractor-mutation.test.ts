import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractDeploymentRecords } from '../../../tech-docs-generator/scripts/extract-deployment.mjs'
import { stableManifestForCompare } from '../../../tech-docs-generator/scripts/sync-css.mjs'

describe('extractor mutation proof (plan 05)', () => {
  it('changes deployment build command when vercel.json changes', () => {
    const tmpRoot = mkdtempSync(path.join(tmpdir(), 'oofpl-deploy-'))
    // Product vercel.json + package.json live at monorepo root (not under site/).
    writeFileSync(
      path.join(tmpRoot, 'vercel.json'),
      JSON.stringify({ buildCommand: 'mutated-next-build', framework: 'nextjs' }),
      'utf8',
    )
    writeFileSync(
      path.join(tmpRoot, 'package.json'),
      JSON.stringify({ scripts: {} }),
      'utf8',
    )

    const records = extractDeploymentRecords({ repoRoot: tmpRoot, commands: [] })
    const buildRecord = records.find((record) => record.sourcePointer === 'buildCommand')
    expect(buildRecord?.value).toBe('mutated-next-build')
  })

  it('normalizes volatile syncedAt from CSS manifest comparison', () => {
    const left = stableManifestForCompare({
      version: 'v1',
      syncedAt: '2026-06-30T00:00:00.000Z',
      files: [{ path: 'entry.css', hash: 'sha256:abc' }],
    })
    const right = stableManifestForCompare({
      version: 'v1',
      syncedAt: '2026-06-30T12:00:00.000Z',
      files: [{ path: 'entry.css', hash: 'sha256:abc' }],
    })

    expect(left).toEqual(right)
  })
})
