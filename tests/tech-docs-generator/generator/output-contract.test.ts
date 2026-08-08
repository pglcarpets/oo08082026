import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { getDocumentsRoot } from '../../../tech-docs-generator/scripts/filesystem.mjs'
import { getRendererDataRoot } from '../../../tech-docs-generator/scripts/output-contract.mjs'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "tech-docs-generator")
const repoRoot = path.resolve(packageRoot, '..')

describe('generated output contract', () => {
  it('places generated documents under generated-documents/docs', () => {
    expect(getDocumentsRoot(repoRoot)).toBe(
      path.join(repoRoot, 'generated-documents', 'docs'),
    )
  })

  it('places renderer data under generated-documents/data', () => {
    const rendererSource = readFileSync(
      path.join(packageRoot, 'scripts', 'emit-renderer-data.mjs'),
      'utf8',
    )

    expect(getRendererDataRoot(repoRoot)).toBe(
      path.join(repoRoot, 'generated-documents', 'data'),
    )
    expect(rendererSource).toContain('outDir = getRendererDataRoot(repoRoot)')
  })
})
