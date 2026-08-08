import { describe, expect, it } from 'vitest'
import {
  snapshotDependencies,
  SnapshotValidationError,
  validateDependenciesSnapshot,
} from '../../tech-docs-generator/src/data/snapshot'

function makeRecord(factOverrides: Record<string, unknown> = {}, recordOverrides: Record<string, unknown> = {}) {
  return {
    id: '.:dependencies:next.resolved-version',
    domain: 'dependencies',
    field: 'resolvedVersion',
    label: 'next resolved version',
    fact: {
      value: '15.0.0',
      sourcePath: 'pnpm-lock.yaml',
      sourceKind: 'lockfile',
      sourcePointer: 'importers...dependencies.next.version',
      factClassification: 'code-proven',
      browserExposure: 'public-safe',
      secretRisk: 'none',
      verificationMode: 'source-backed',
      ...factOverrides,
    },
    ...recordOverrides,
  }
}

describe('snapshot module', () => {
  describe('live data validation', () => {
    it('exports validated dependencies from the real JSON', () => {
      expect(Array.isArray(snapshotDependencies)).toBe(true)
      expect(snapshotDependencies.length).toBeGreaterThan(0)
    })

    it('every record has required provenance fields', () => {
      for (const record of snapshotDependencies) {
        expect(record.id).toBeTruthy()
        expect(record.fact.value).toBeDefined()
        expect(record.fact.sourcePath).toBeTruthy()
        expect(record.fact.sourceKind).toBeTruthy()
        expect(record.fact.sourcePointer).toBeTruthy()
      }
    })

    it('includes known packages (next, react)', () => {
      const ids = snapshotDependencies.map((r) => r.id)
      expect(ids.some((id) => id.includes(':next.'))).toBe(true)
      expect(ids.some((id) => id.includes(':react.'))).toBe(true)
    })
  })

  describe('validateDependenciesSnapshot', () => {
    it('accepts a real-shaped record', () => {
      const result = validateDependenciesSnapshot([makeRecord()])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('.:dependencies:next.resolved-version')
    })

    it('accepts provenance-only shape (no classification enums)', () => {
      const record = makeRecord({
        value: '1.0.0',
        sourcePath: 'package.json',
        sourceKind: 'manifest',
        sourcePointer: 'dependencies.foo',
      })
      delete record.fact.factClassification
      delete record.fact.browserExposure
      delete record.fact.secretRisk
      delete record.fact.verificationMode
      const result = validateDependenciesSnapshot([record])
      expect(result).toHaveLength(1)
    })

    it('accepts an empty array', () => {
      const result = validateDependenciesSnapshot([])
      expect(result).toHaveLength(0)
    })

    it('accepts duplicate ids (reshape handles filtering)', () => {
      const result = validateDependenciesSnapshot([makeRecord(), makeRecord()])
      expect(result).toHaveLength(2)
    })

    it('throws SnapshotValidationError on non-array input', () => {
      expect(() => validateDependenciesSnapshot('not-an-array')).toThrow(SnapshotValidationError)
    })

    it('throws on missing fact.value', () => {
      const record = makeRecord()
      delete (record.fact as Record<string, unknown>).value
      expect(() => validateDependenciesSnapshot([record])).toThrow(SnapshotValidationError)
    })

    it('throws on empty fact.sourcePath', () => {
      const record = makeRecord({ sourcePath: '' })
      expect(() => validateDependenciesSnapshot([record])).toThrow(/sourcePath/)
    })

    it('throws on empty fact.sourceKind', () => {
      const record = makeRecord({ sourceKind: '' })
      expect(() => validateDependenciesSnapshot([record])).toThrow(/sourceKind/)
    })

    it('throws on empty fact.sourcePointer', () => {
      const record = makeRecord({ sourcePointer: '' })
      expect(() => validateDependenciesSnapshot([record])).toThrow(/sourcePointer/)
    })

    it('throws on missing id', () => {
      const record = makeRecord()
      delete (record as Record<string, unknown>).id
      expect(() => validateDependenciesSnapshot([record])).toThrow(/id/)
    })

    it('throws on non-object record in array', () => {
      expect(() => validateDependenciesSnapshot(['not-an-object'])).toThrow(/Expected an object/)
    })

    it('throws on null fact', () => {
      const record = { id: 'test', domain: 'dependencies', field: 'resolvedVersion', fact: null }
      expect(() => validateDependenciesSnapshot([record])).toThrow(/fact/)
    })

    it('error includes schema name and issues', () => {
      try {
        validateDependenciesSnapshot('bad')
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SnapshotValidationError)
        const swe = error as SnapshotValidationError
        expect(swe.schemaName).toBe('DependenciesFact')
        expect(swe.issues.length).toBeGreaterThan(0)
        expect(swe.message).toContain('DependenciesFact validation failed')
      }
    })

    it('collects multiple issues from one bad record', () => {
      const record = {
        id: '',
        domain: 'dependencies',
        fact: { value: undefined, sourcePath: '', sourceKind: '', sourcePointer: '' },
      }
      try {
        validateDependenciesSnapshot([record])
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SnapshotValidationError)
        expect((error as SnapshotValidationError).issues.length).toBeGreaterThanOrEqual(3)
      }
    })
  })
})
