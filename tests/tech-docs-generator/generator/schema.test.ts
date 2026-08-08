import { describe, expect, it } from 'vitest'
import {
  accuracyReportSchema,
  factFieldSchema,
  manifestSchema,
  normalizedFactSchema,
  pageSchema,
  searchRecordSchema,
  sourcesDocumentSchema,
} from '../../../tech-docs-generator/scripts/schema.mjs'

const factField = {
  value: '^16.2.9',
  sourcePath: 'tech-docs-generator/src/data/techStack.ts',
  sourceKind: 'static-data',
  sourcePointer: 'techStack[0].version',
  factClassification: 'code-proven',
  browserExposure: 'public-safe',
  secretRisk: 'none',
  renderSurface: ['markdown', 'renderer'],
  verificationMode: 'source-backed',
}

describe('tech stack schemas', () => {
  it('rejects missing provenance on fact fields', () => {
    expect(() =>
      factFieldSchema.parse({
        value: 'Next.js',
        sourcePath: 'tech-docs-generator/src/data/techStack.ts',
        sourceKind: 'static-data',
      }),
    ).toThrow(/sourcePointer/)

    expect(() =>
      normalizedFactSchema.parse({
        id: 'nextjs.version',
        domain: 'dependencies',
        category: 'dependencies',
        field: 'version',
        label: 'Next.js version',
        fact: { ...factField, sourcePath: undefined },
      }),
    ).toThrow(/sourcePath/)

    expect(() =>
      normalizedFactSchema.parse({
        id: 'nextjs.version',
        domain: 'dependencies',
        category: 'dependencies',
        field: 'version',
        label: 'Next.js version',
        fact: { ...factField, sourceKind: undefined },
      }),
    ).toThrow(/sourceKind/)

    expect(() =>
      normalizedFactSchema.parse({
        id: 'nextjs.version',
        domain: 'dependencies',
        category: 'dependencies',
        field: 'version',
        label: 'Next.js version',
        fact: { ...factField, factClassification: undefined },
      }),
    ).toThrow(/factClassification/)
  })

  it('accepts representative generated records', () => {
    expect(
      factFieldSchema.parse(factField),
    ).toMatchObject({ value: '^16.2.9' })

    expect(
      normalizedFactSchema.parse({
        id: 'nextjs.version',
        domain: 'dependencies',
        category: 'dependencies',
        field: 'version',
        label: 'Next.js version',
        fact: factField,
      }),
    ).toMatchObject({ id: 'nextjs.version' })

    expect(
      pageSchema.parse({
        id: 'dependencies',
        path: '/dependencies',
        title: 'Dependencies',
        factIds: ['nextjs.version'],
        sections: [{ id: 'frontend', title: 'Frontend', factIds: ['nextjs.version'] }],
      }),
    ).toMatchObject({ path: '/dependencies' })

    expect(
      searchRecordSchema.parse({
        id: 'nextjs',
        title: 'Next.js',
        path: '/tech-stack#frontend',
        excerpt: 'App Router and SSR',
        section: 'Tech Stack',
        factIds: ['nextjs.version'],
      }),
    ).toMatchObject({ id: 'nextjs' })

    expect(
      sourcesDocumentSchema.parse({
        entries: [
          {
            sourcePath: 'package.json',
            sourceKind: 'package-manifest',
            sourcePointer: 'scripts.build',
            hash: 'sha256:abc',
            bytes: 12,
          },
        ],
      }),
    ).toMatchObject({ entries: expect.any(Array) })

    expect(
      accuracyReportSchema.parse({
        totalFactualFields: 1,
        fieldsWithProvenance: 1,
        exactSourceMatches: 1,
        mismatches: [],
        documents: [{ path: 'overview/index.md', factualFields: 1, exactMatches: 1, mismatches: 0 }],
      }),
    ).toMatchObject({ exactSourceMatches: 1 })

    expect(
      manifestSchema.parse({
        version: 'v1',
        root: 'Documents',
        files: [{ path: 'markdown/overview/index.md', hash: 'sha256:abc', bytes: 10 }],
      }),
    ).toMatchObject({ version: 'v1' })
  })
})
