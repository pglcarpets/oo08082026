import { describe, expect, it } from 'vitest'
import { buildRendererDataPayloads } from '../../../tech-docs-generator/scripts/renderer-data.mjs'
import { extractDeploymentRecords } from '../../../tech-docs-generator/scripts/extract-deployment.mjs'
import { extractCiRecords } from '../../../tech-docs-generator/scripts/extract-ci.mjs'
import { extractDependabotRecords } from '../../../tech-docs-generator/scripts/extract-dependabot.mjs'
import { extractAiRecords } from '../../../tech-docs-generator/scripts/extract-ai.mjs'
import { extractThemeRecords } from '../../../tech-docs-generator/scripts/extract-theme.mjs'
import { defaultRepoRoot, getSharedRepoModel } from '../helpers/shared-repo-model.mjs'

const repoRoot = defaultRepoRoot

const PLAN_PAYLOADS = [
  'deployment.json',
  'ci.json',
  'dependabot.json',
  'ai.json',
  'theme.json',
  'gaps.json',
  'docs-health.json',
  'failures-status.json',
  'coverage-matrix.json',
]

describe('domain extractors (plan 02)', () => {
  it('extracts deployment records with status cards and vercel config', () => {
    const model = getSharedRepoModel(repoRoot)
    const records = extractDeploymentRecords({ repoRoot, commands: model.commands })

    expect(records.some((record) => record.category === 'vercel-config')).toBe(true)
    expect(records.some((record) => record.category === 'status-card' && record.factClassification === 'manual-verification')).toBe(true)
    expect(records.every((record) => record.sourcePath && record.sourcePointer && record.factClassification)).toBe(true)
  }, 120_000)

  it('extracts CI workflow metadata without secret values', () => {
    const records = extractCiRecords({ repoRoot })
    expect(records.length).toBeGreaterThan(3)
    expect(records.some((record) => record.category === 'workflow-schedule')).toBe(true)
    expect(JSON.stringify(records)).not.toMatch(/sk-[a-z0-9]/i)
  }, 30_000)

  it('extracts dependabot policy records from checked-in config', () => {
    const records = extractDependabotRecords({ repoRoot })
    expect(records.some((record) => record.category === 'dependabot-ecosystem')).toBe(true)
    expect(records.some((record) => record.value.includes('weekly'))).toBe(true)
  })

  it('extracts AI provider chain facts without emitting key values', () => {
    const model = getSharedRepoModel(repoRoot)
    const records = extractAiRecords({ repoRoot, api: model.api })
    expect(records.some((record) => record.id === 'ai.openrouter.fallback')).toBe(true)
    expect(records.some((record) => record.label === 'OPENROUTER_API_KEY_PRIMARY')).toBe(true)
    expect(JSON.stringify(records)).not.toMatch(/OPENROUTER_API_KEY_PRIMARY":"[^"]+/)
  }, 30_000)

  it('extracts theme token and CSS sync records', () => {
    const records = extractThemeRecords({ repoRoot })
    expect(records.some((record) => record.sourcePath === 'site/focss/base/tokens/palette.css')).toBe(true)
    expect(records.some((record) => record.sourceKind === 'theme-token-file')).toBe(true)
  })

  it('keeps docs-health deterministic by excluding generated-artifact self-checks', () => {
    const model = getSharedRepoModel(repoRoot)

    expect(model.docsHealth.some((record) => record.category === 'generated-artifact')).toBe(false)
  }, 30_000)
})

describe('renderer payloads (plan 02)', () => {
  it('emits all planned renderer JSON payloads', () => {
    const model = getSharedRepoModel(repoRoot)
    const payloads = buildRendererDataPayloads(model) as Record<string, unknown>

    for (const fileName of PLAN_PAYLOADS) {
      expect(payloads[fileName], `missing payload ${fileName}`).toBeDefined()
    }

    expect(Array.isArray(payloads['deployment.json'])).toBe(true)
    expect((payloads['deployment.json'] as unknown[]).length).toBeGreaterThan(0)
    expect((payloads['gaps.json'] as unknown[]).length).toBeGreaterThan(0)
  }, 30_000)

  it('summary.keyPackages is non-empty for highlight packages (next/react/…)', () => {
    const model = getSharedRepoModel(repoRoot)
    const payloads = buildRendererDataPayloads(model)
    const summary = payloads['summary.json'] as {
      keyPackages: Array<{ packageName: string; version: string; name: string }>
    }

    expect(summary.keyPackages.length).toBeGreaterThan(0)
    const names = summary.keyPackages.map((p) => p.packageName)
    expect(names).toContain('next')
    expect(names).toContain('react')
    for (const pkg of summary.keyPackages) {
      expect(pkg.version).toMatch(/\d/)
      expect(pkg.name.length).toBeGreaterThan(0)
    }
  }, 30_000)

  it('excludes secret-value-forbidden records from browser environment payload', () => {
    const model = getSharedRepoModel(repoRoot)
    const payloads = buildRendererDataPayloads(model)
    for (const record of payloads['environment.json']) {
      expect(record.browserExposure).not.toBe('secret-value-forbidden')
      expect(record.browserExposure).not.toBe('server-report-only')
    }
  }, 30_000)
})
