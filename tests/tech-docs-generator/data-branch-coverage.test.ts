import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { overviewKeyTech } from '../../tech-docs-generator/src/data/overviewSummary'
import { techStack } from '../../tech-docs-generator/src/data/techStack'
import { testCommands } from '../../tech-docs-generator/src/data/testingData'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const rootPackage = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
  name: string
  scripts: Record<string, string>
}

describe('live data helpers', () => {
  it('pins overview, stack, and test commands to the live root package', () => {
    expect(rootPackage.name).toBe('ooplanner-oostudio')
    expect(overviewKeyTech.some((item) => item.name.toLowerCase().includes('next'))).toBe(true)
    expect(techStack.some((item) => item.name === 'next')).toBe(true)
    expect(testCommands.every((command) => command.packageName === 'ooplanner-oostudio')).toBe(true)
    expect(rootPackage.scripts.test).toBeTruthy()
    expect(testCommands.some((command) => command.scriptName === 'test')).toBe(true)
  })
})
