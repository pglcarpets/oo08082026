import { createNormalizedRecord } from './normalized-record.mjs'

export function buildGapRecords(coverageMatrix) {
  const gaps = []

  for (const row of coverageMatrix.rows ?? []) {
    if (row.unknownGapCount > 0) {
      gaps.push(
        createNormalizedRecord({
          id: `gaps.domain.${row.domain}`,
          category: 'coverage-gap',
          label: row.domain,
          value: `${row.unknownGapCount} required fact(s) still unknown-gap`,
          sourcePath: coverageMatrix.contractSourcePath ?? 'plans/README.md',
          sourceKind: 'coverage-contract',
          sourcePointer: `domain.${row.domain}`,
          factClassification: 'unknown-gap',
          renderSurface: ['markdown', 'renderer', 'internal-report'],
        }),
      )
    }
    if (row.manualVerificationCount > 0) {
      gaps.push(
        createNormalizedRecord({
          id: `gaps.manual.${row.domain}`,
          category: 'manual-verification',
          label: `${row.domain} dashboard checks`,
          value: `${row.manualVerificationCount} record(s) require manual verification`,
          sourcePath: coverageMatrix.contractSourcePath ?? 'plans/README.md',
          sourceKind: 'coverage-contract',
          sourcePointer: `domain.${row.domain}.manualVerificationCount`,
          factClassification: 'manual-verification',
          verificationMode: 'manual-verification',
        }),
      )
    }
  }

  return gaps.sort((left, right) => left.id.localeCompare(right.id))
}
