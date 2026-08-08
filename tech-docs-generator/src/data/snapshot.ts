import dependenciesJson from '../../../generated-documents/data/dependencies.json'

export interface SnapshotFact {
  value: string
  sourcePath: string
  sourceKind: string
  sourcePointer: string
  factClassification?: string
  browserExposure?: string
  secretRisk?: string
  verificationMode?: string
  renderSurface?: string | string[]
}

export interface DependencyRecord {
  id: string
  domain: string
  field: string
  label?: string
  fact: SnapshotFact
}

export class SnapshotValidationError extends Error {
  schemaName: string
  issues: Array<{ path: string[]; message: string }>

  constructor(schemaName: string, issues: Array<{ path: string[]; message: string }>) {
    const details = issues.map(({ path, message }) => `${path.join('.')} ${message}`).join('; ')
    super(details ? `${schemaName} validation failed: ${details}` : `${schemaName} validation failed`)
    this.name = 'SnapshotValidationError'
    this.schemaName = schemaName
    this.issues = issues
  }
}

function validateDependenciesSnapshot(value: unknown): DependencyRecord[] {
  if (!Array.isArray(value)) {
    throw new SnapshotValidationError('DependenciesFact', [{ path: [], message: 'Expected an array' }])
  }

  const issues: Array<{ path: string[]; message: string }> = []

  for (let i = 0; i < value.length; i++) {
    const record = value[i]
    const recordPath = [String(i)]

    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      issues.push({ path: recordPath, message: 'Expected an object' })
      continue
    }

    const obj = record as Record<string, unknown>

    if (typeof obj.id !== 'string' || obj.id.trim().length === 0) {
      issues.push({ path: [...recordPath, 'id'], message: 'Expected a non-empty string' })
    }

    const fact = obj.fact
    if (typeof fact !== 'object' || fact === null || Array.isArray(fact)) {
      issues.push({ path: [...recordPath, 'fact'], message: 'Expected an object' })
      continue
    }

    const factObj = fact as Record<string, unknown>

    if (factObj.value === undefined) {
      issues.push({ path: [...recordPath, 'fact', 'value'], message: 'Expected a defined value' })
    }
    if (typeof factObj.sourcePath !== 'string' || factObj.sourcePath.trim().length === 0) {
      issues.push({ path: [...recordPath, 'fact', 'sourcePath'], message: 'Expected a non-empty string' })
    }
    if (typeof factObj.sourceKind !== 'string' || factObj.sourceKind.trim().length === 0) {
      issues.push({ path: [...recordPath, 'fact', 'sourceKind'], message: 'Expected a non-empty string' })
    }
    if (typeof factObj.sourcePointer !== 'string' || factObj.sourcePointer.trim().length === 0) {
      issues.push({ path: [...recordPath, 'fact', 'sourcePointer'], message: 'Expected a non-empty string' })
    }
  }

  if (issues.length > 0) {
    throw new SnapshotValidationError('DependenciesFact', issues)
  }

  return value as DependencyRecord[]
}

export { validateDependenciesSnapshot }

export const snapshotDependencies = validateDependenciesSnapshot(dependenciesJson)
