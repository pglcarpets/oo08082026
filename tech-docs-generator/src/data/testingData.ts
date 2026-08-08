import commandsJson from '../../../generated-documents/data/commands.json'
import testingPolicyJson from '../../../generated-documents/data/testing-policy.json'

export type TestingPolicyRecord = {
  id: string
  label: string
  fact: {
    value: string
    sourcePath: string
    sourcePointer: string
    factClassification?: string
    browserExposure?: string
    secretRisk?: string
    renderSurface?: string | string[]
    verificationMode?: string
  }
}

type CommandRecord = {
  packageName: string
  scriptName: string
  command: string
  sourcePath: string
  sourcePointer: string
}

const commands = commandsJson as CommandRecord[]
const TEST_COMMAND_ORDER = new Map(
  (
    'test|test:watch|test:ui|test:coverage|test:planner|test:unit|' +
    'test:planner-catalog|test:e2e:nav|test:a11y|release:gate'
  )
    .split('|')
    .map((scriptName, index) => [scriptName, index] as const),
)

function scopeForTestCommand(scriptName: string) {
  if (scriptName === 'release:gate') return 'All'
  if (scriptName.includes('a11y') || scriptName.includes('e2e') || scriptName.includes('planner-catalog')) {
    return 'Playwright'
  }
  return 'Vitest'
}

function descForTestCommand(scriptName: string) {
  switch (scriptName) {
    case 'test':
      return 'Run all Vitest unit tests'
    case 'test:watch':
      return 'Watch mode'
    case 'test:ui':
      return 'Vitest UI dashboard'
    case 'test:coverage':
      return 'Run with V8 coverage'
    case 'test:planner':
      return 'Planner-only tests'
    case 'test:unit':
      return 'Exclude planner tests'
    case 'test:planner-catalog':
      return 'Planner catalog + chrome E2E'
    case 'test:e2e:nav':
      return 'Navigation smoke E2E tests'
    case 'test:a11y':
      return 'Accessibility (axe-core) E2E'
    case 'release:gate':
      return 'Full pre-release pipeline'
    default:
      return scriptName
  }
}

export const testingPolicy = testingPolicyJson as TestingPolicyRecord[]

export const testCommands = commands
  .filter(
    (record) =>
      record.sourcePath === 'package.json' &&
      (record.scriptName.startsWith('test') || record.scriptName === 'release:gate'),
  )
  .sort((left, right) => left.scriptName.localeCompare(right.scriptName))

export const testingCommandCards = testCommands
  .filter((record) => TEST_COMMAND_ORDER.has(record.scriptName))
  .sort((left, right) => (TEST_COMMAND_ORDER.get(left.scriptName) ?? 0) - (TEST_COMMAND_ORDER.get(right.scriptName) ?? 0))
  .map((record) => ({
    scriptName: record.scriptName,
    cmd: record.command,
    desc: descForTestCommand(record.scriptName),
    scope: scopeForTestCommand(record.scriptName),
  }))
