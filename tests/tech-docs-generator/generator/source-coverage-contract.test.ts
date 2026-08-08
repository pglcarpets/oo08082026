import { describe, expect, it } from 'vitest'
import {
  classifyEnvironmentNames,
  COVERAGE_DOMAIN_SOURCE_POLICY,
  COVERAGE_EXCLUDED_PATH_PREFIXES,
  COVERAGE_REQUIRED_DOMAINS,
  isAcceptedCoverageSourcePath,
} from '../../../tech-docs-generator/scripts/model.mjs'
import { renderJsonOutputs } from '../../../tech-docs-generator/scripts/render-json.mjs'
import { coverageMatrixSchema } from '../../../tech-docs-generator/scripts/schema.mjs'
import { getPolicy, sourcePolicy } from '../../../tech-docs-generator/scripts/source-policy.mjs'
import * as modelModule from '../../../tech-docs-generator/scripts/model.mjs'
import { defaultRepoRoot, getSharedRepoModel } from '../helpers/shared-repo-model.mjs'

const repoRoot = defaultRepoRoot
const requiredDomains = COVERAGE_REQUIRED_DOMAINS
const rowFields = [
  'domain',
  'status',
  'recordCount',
  'codeProvenCount',
  'handoverProvenCount',
  'manualVerificationCount',
  'liveStatusCount',
  'unknownGapCount',
  'unsupportedClaimCount',
]

describe('source coverage contract', () => {
  it('recognizes current tech-docs check and gate workflows as gate evidence', () => {
    const isGateWorkflowRecord = (
      modelModule as typeof modelModule & {
        isGateWorkflowRecord?: (record: { value: string; sourcePointer: string }) => boolean
      }
    ).isGateWorkflowRecord

    expect(isGateWorkflowRecord?.({
      value: 'pnpm --filter oando-tech-docs gate',
      sourcePointer: 'scripts.tech-docs:gate',
      scriptName: 'tech-docs:gate',
    })).toBe(true)
  })

  it('extracts tech-docs gate workflow for model evidence', () => {
    const model = getSharedRepoModel(repoRoot)
    const sourcePointers = model.workflows.map((record) => record.sourcePointer)

    expect(sourcePointers).toEqual(expect.arrayContaining([
      'scripts.tech-docs:gate',
    ]))
  }, 120_000)

  it('emits one fully bucketed coverage-matrix row per required domain', () => {
    const model = getSharedRepoModel(repoRoot)
    const matrix = coverageMatrixSchema.parse(model.coverageMatrix)

    expect(matrix.contractSourcePath).toBe('plans/README.md')
    expect(matrix.rows.map((row: { domain: string }) => row.domain).sort()).toEqual([...requiredDomains].sort())

    for (const row of matrix.rows as Array<Record<string, unknown>>) {
      expect(Object.keys(row).sort()).toEqual([...rowFields].sort())
      expect(row.unsupportedClaimCount).toBe(0)
      expect(row.recordCount).toBe(
        Number(row.codeProvenCount) +
          Number(row.handoverProvenCount) +
          Number(row.manualVerificationCount) +
          Number(row.liveStatusCount) +
          Number(row.unknownGapCount) +
          Number(row.unsupportedClaimCount),
      )
    }
  }, 120_000)

  it('includes coverage-matrix.json in generated JSON outputs', () => {
    const model = getSharedRepoModel(repoRoot)
    const outputs = renderJsonOutputs(model)

    expect(outputs['data/coverage-matrix.json']).toBe(model.coverageMatrix)
    expect(coverageMatrixSchema.parse(outputs['data/coverage-matrix.json']).rows).toHaveLength(requiredDomains.length)
  }, 120_000)

  it('maps every required domain to a source-policy precedence entry', () => {
    const policyMap = COVERAGE_DOMAIN_SOURCE_POLICY as Record<string, string>
    const policies = sourcePolicy as Record<string, { precedence?: Array<{ sourceKind: string }> }>
    for (const domain of requiredDomains as string[]) {
      const policyKey = policyMap[domain]
      expect(typeof policyKey, `missing policy mapping for ${domain}`).toBe('string')
      expect(policyKey.length, `missing policy mapping for ${domain}`).toBeGreaterThan(0)
      expect(policies[policyKey]?.precedence?.length ?? 0).toBeGreaterThan(0)
      const sourceKind = getPolicy(policyKey).precedence[0].sourceKind
      expect(typeof sourceKind).toBe('string')
      expect(sourceKind.length).toBeGreaterThan(0)
    }
  })

  it('rejects generated, vendor, and transient paths for stable coverage evidence', () => {
    for (const prefix of COVERAGE_EXCLUDED_PATH_PREFIXES) {
      expect(isAcceptedCoverageSourcePath(`${prefix}example.ts`)).toBe(false)
    }

    expect(isAcceptedCoverageSourcePath('site/app/page.tsx')).toBe(true)
    expect(isAcceptedCoverageSourcePath('plans/README.md')).toBe(true)
    expect(isAcceptedCoverageSourcePath('archive/plans/wip/tech-docs/claim-inventory.json')).toBe(false)
    expect(isAcceptedCoverageSourcePath('_generated')).toBe(false)
    expect(isAcceptedCoverageSourcePath('.env.local')).toBe(false)
  })

  it('marks dashboard-only deployment facts as manual-verification or live-status', () => {
    const model = getSharedRepoModel(repoRoot)
    const deployment = model.coverageMatrix.rows.find((row) => row.domain === 'deployment')

    expect(deployment).toBeDefined()
    expect(deployment?.manualVerificationCount).toBeGreaterThanOrEqual(2)
    expect(deployment?.liveStatusCount).toBeGreaterThanOrEqual(1)
    expect(deployment?.codeProvenCount).toBeGreaterThanOrEqual(3)
    expect(deployment?.status).toBe('partial')
  }, 120_000)

  it('classifies environment names without merging ambiguous canonical names', () => {
    const model = getSharedRepoModel(repoRoot)
    const classification = classifyEnvironmentNames(model.environment)

    expect(classification.canonicalNameCount).toBe(model.environment.length)
    expect(new Set(model.environment.map((record) => record.name)).size).toBe(model.environment.length)
  }, 120_000)
})
