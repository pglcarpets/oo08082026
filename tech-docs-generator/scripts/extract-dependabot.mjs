import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizedRecord } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const CONFIG_PATH = '.github/dependabot.yml'

export function extractDependabotRecords({ repoRoot = defaultRepoRoot } = {}) {
  const records = []
  const configPath = path.join(repoRoot, CONFIG_PATH)

  if (!existsSync(configPath)) {
    return records
  }

  const text = readFileSync(configPath, 'utf8')

  const ecosystemMatches = [...text.matchAll(/package-ecosystem:\s*"([^"]+)"/g)]
  ecosystemMatches.forEach((match, index) => {
    records.push(
      createNormalizedRecord({
        id: `dependabot.ecosystem.${index}`,
        category: 'dependabot-ecosystem',
        label: `Ecosystem ${index + 1}`,
        value: match[1],
        sourcePath: CONFIG_PATH,
        sourceKind: 'dependabot-config',
        sourcePointer: `updates[${index}].package-ecosystem`,
      }),
    )
  })

  const scheduleMatches = [...text.matchAll(/interval:\s*"([^"]+)"(?:\s*\n\s*day:\s*"([^"]+)")?/g)]
  scheduleMatches.forEach((match, index) => {
    const value = match[2] ? `${match[1]} (${match[2]})` : match[1]
    records.push(
      createNormalizedRecord({
        id: `dependabot.schedule.${index}`,
        category: 'dependabot-schedule',
        label: `Schedule ${index + 1}`,
        value,
        sourcePath: CONFIG_PATH,
        sourceKind: 'dependabot-config',
        sourcePointer: `updates[${index}].schedule`,
      }),
    )
  })

  const prLimitMatch = text.match(/open-pull-requests-limit:\s*(\d+)/)
  if (prLimitMatch) {
    records.push(
      createNormalizedRecord({
        id: 'dependabot.pr-limit.npm',
        category: 'dependabot-pr-limit',
        label: 'Open PR limit (npm)',
        value: prLimitMatch[1],
        sourcePath: CONFIG_PATH,
        sourceKind: 'dependabot-config',
        sourcePointer: 'updates[].open-pull-requests-limit',
      }),
    )
  }

  if (text.includes('ignore:')) {
    records.push(
      createNormalizedRecord({
        id: 'dependabot.ignore-rules',
        category: 'dependabot-ignore',
        label: 'Ignore rules',
        value: 'semver-major updates ignored for npm ecosystem',
        sourcePath: CONFIG_PATH,
        sourceKind: 'dependabot-config',
        sourcePointer: 'updates[].ignore',
      }),
    )
  }

  if (text.includes('groups:')) {
    records.push(
      createNormalizedRecord({
        id: 'dependabot.groups.minor-and-patch',
        category: 'dependabot-group',
        label: 'Update groups',
        value: 'minor-and-patch group for npm ecosystem',
        sourcePath: CONFIG_PATH,
        sourceKind: 'dependabot-config',
        sourcePointer: 'updates[].groups',
      }),
    )
  }

  return records
}
