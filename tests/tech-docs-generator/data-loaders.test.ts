import { describe, expect, it } from 'vitest'
import { apiRoutes } from '../../tech-docs-generator/src/data/apiData'
import {
  architectureFeatureModules,
  architectureRoutes,
  architectureStats,
  architectureTopLevelDirs,
} from '../../tech-docs-generator/src/data/architectureData'
import { codeOrganizationRecords } from '../../tech-docs-generator/src/data/codeOrganizationData'
import {
  databaseCommands,
  databaseMigrations,
  databaseTables,
} from '../../tech-docs-generator/src/data/databaseData'
import {
  deploymentCommands,
  deploymentEnvironmentVariables,
  environmentVariables,
  parseDeploymentCommandLabel,
  releaseGateSteps,
} from '../../tech-docs-generator/src/data/deploymentData'
import { featureRecords } from '../../tech-docs-generator/src/data/featuresData'
import { overviewDocSections, overviewQuickCommands } from '../../tech-docs-generator/src/data/overviewData'
import { performanceRecords } from '../../tech-docs-generator/src/data/performanceData'
import { securityRecords } from '../../tech-docs-generator/src/data/securityData'
import { testCommands, testingPolicy } from '../../tech-docs-generator/src/data/testingData'
import { workflowRecords } from '../../tech-docs-generator/src/data/workflowsData'

describe('deploymentData helpers', () => {
  it('parses package and script names from deployment command labels', () => {
    expect(parseDeploymentCommandLabel('ooplanner-oostudio:vercel:prod')).toEqual({
      packageName: 'ooplanner-oostudio',
      scriptName: 'vercel:prod',
    })
    expect(parseDeploymentCommandLabel('build')).toEqual({
      packageName: 'ooplanner-oostudio',
      scriptName: 'build',
    })
  })
})

describe('generated-data loaders', () => {
  it('exports non-empty api routes', () => {
    expect(apiRoutes.length).toBeGreaterThan(0)
    expect(apiRoutes[0]?.path.startsWith('/')).toBe(true)
  })

  it('exports architecture facts from summary and routes', () => {
    expect(architectureStats.length).toBeGreaterThan(0)
    expect(architectureRoutes.length).toBeGreaterThan(0)
    expect(architectureFeatureModules.length).toBeGreaterThan(0)
    expect(architectureTopLevelDirs.length).toBeGreaterThan(0)
  })

  it('exports route-domain records for wired sections', () => {
    expect(codeOrganizationRecords.length).toBeGreaterThan(0)
    expect(performanceRecords.length).toBeGreaterThan(0)
    expect(securityRecords.length).toBeGreaterThan(0)
    expect(workflowRecords.length).toBeGreaterThan(0)
  })

  it('exports database schema and commands', () => {
    expect(databaseTables.length).toBeGreaterThan(0)
    expect(databaseMigrations.length).toBeGreaterThan(0)
    expect(databaseCommands.length).toBeGreaterThan(0)
  })

  it('exports deployment and testing command sets', () => {
    expect(environmentVariables.length).toBeGreaterThan(0)
    expect(deploymentCommands.length).toBeGreaterThan(0)
    expect(deploymentEnvironmentVariables.length).toBeGreaterThan(0)
    expect(releaseGateSteps.length).toBeGreaterThan(0)
    // Product scripts live on root package.json (site/ has no package.json).
    expect(releaseGateSteps[0]).toMatchObject({
      category: 'release-gate',
      factClassification: 'code-proven',
      sourcePath: 'package.json',
    })
    expect(releaseGateSteps.every((step) => step.sourcePath === 'package.json')).toBe(true)
    expect(testingPolicy.length).toBeGreaterThan(0)
    expect(testCommands.length).toBeGreaterThan(0)

    expect(testingPolicy.find((record) => record.id === 'testing.coverage-floor')).toMatchObject({
      id: 'testing.coverage-floor',
      label: 'Coverage floor',
      fact: {
        sourcePath: 'tech-docs-generator/scripts/check-coverage.mjs',
        sourceKind: 'checked-in-script-or-config',
        sourcePointer: 'THRESHOLDS.minimum',
        factClassification: 'code-proven',
      },
    })

    expect(environmentVariables.find((record) => record.name === 'OPENROUTER_API_KEY_PRIMARY')).toMatchObject({
      name: 'OPENROUTER_API_KEY_PRIMARY',
      sourcePath: '.env.example',
      sourceKind: 'env-example',
      usages: expect.arrayContaining([
        expect.objectContaining({
          sourcePath: expect.any(String),
          sourceKind: 'env-reader',
          sourcePointer: expect.stringMatching(/^match at index /),
        }),
      ]),
    })
  })

  it('exports feature catalog and overview wiring', () => {
    expect(featureRecords.length).toBeGreaterThan(0)
    expect(overviewQuickCommands.length).toBeGreaterThan(0)
    expect(overviewDocSections.length).toBeGreaterThan(0)
    expect(overviewDocSections.every((section) => section.path !== '/')).toBe(true)
  })
})
