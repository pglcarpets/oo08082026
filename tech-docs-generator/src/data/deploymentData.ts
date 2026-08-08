import ciJson from '../../../generated-documents/data/ci.json'
import dependabotJson from '../../../generated-documents/data/dependabot.json'
import deploymentJson from '../../../generated-documents/data/deployment.json'
import environmentJson from '../../../generated-documents/data/environment.json'

export type NormalizedDomainRecord = {
  id: string
  category: string
  label: string
  value: string
  sourcePath: string
  sourceKind: string
  sourcePointer: string
  factClassification: string
  browserExposure?: string
  secretRisk?: string
  renderSurface?: string[]
  verificationMode?: string
  status?: string
}

export type EnvironmentRecord = {
  name: string
  sourceKind: string
  sourcePath: string
  sourcePointer: string
  factClassification?: string
  browserExposure?: string
  secretRisk?: string
  renderSurface?: string[]
  verificationMode?: string
  usages: Array<{ sourcePath: string; sourcePointer: string; sourceKind?: string; name?: string }>
}

const deploymentRecords = deploymentJson as NormalizedDomainRecord[]
const ciRecords = ciJson as NormalizedDomainRecord[]
const dependabotRecords = dependabotJson as NormalizedDomainRecord[]
const environment = environmentJson as EnvironmentRecord[]

export const deploymentStatusCards = deploymentRecords
  .filter((record) => record.category === 'status-card')
  .sort((left, right) => left.label.localeCompare(right.label))

export const vercelConfigRecords = deploymentRecords.filter((record) => record.category === 'vercel-config')

export const branchPolicyRecords = deploymentRecords.filter((record) => record.category === 'branch-policy')

export const releaseGateSteps = deploymentRecords
  .filter((record) => record.category === 'release-gate')
  .sort((left, right) => left.label.localeCompare(right.label))

export const deploymentCommandRecords = deploymentRecords.filter((record) => record.category === 'deploy-command')

export const deploymentBlockers = deploymentRecords.filter((record) => record.category === 'deploy-blocker')

export const handoverDeployContext = deploymentRecords.filter((record) => record.category === 'handover-context')

export const ciWorkflowRecords = ciRecords

export const dependabotPolicyRecords = dependabotRecords

export const environmentVariables = [...environment].sort((left, right) => left.name.localeCompare(right.name))

export const deploymentEnvironmentVariables = environmentVariables

const COMMAND_LABEL_PATTERN = /^([^:]+):(.+)$/

export function parseDeploymentCommandLabel(label: string) {
  const match = COMMAND_LABEL_PATTERN.exec(label)
  return {
    packageName: match?.[1] ?? 'ooplanner-oostudio',
    scriptName: match?.[2] ?? label,
  }
}

/** @deprecated use deploymentCommandRecords — kept for tests that assert command wiring */
export const deploymentCommands = deploymentCommandRecords.map((record) => ({
  ...parseDeploymentCommandLabel(record.label),
  command: record.value,
  sourcePath: record.sourcePath,
  sourcePointer: record.sourcePointer,
}))
