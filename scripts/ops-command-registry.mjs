import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const OPS_COMMAND_KEY_PATTERN = /^\s+(?:"([^"]+)"|([a-z][\w:.-]*)):\s*/

/**
 * Ops command names from `scripts/run-ops.mjs` COMMANDS map.
 * Parsed at read time so the registry stays in sync without duplicating the handler table.
 *
 * @param {{ repoRoot?: string }} [options]
 * @returns {string[]}
 */
export function listOpsCommandNames({ repoRoot = defaultRepoRoot } = {}) {
  const filePath = path.join(repoRoot, 'scripts/run-ops.mjs')
  const content = readFileSync(filePath, 'utf8')
  const blockStart = content.indexOf('const COMMANDS = {')
  if (blockStart === -1) {
    return []
  }

  const names = []
  for (const line of content.slice(blockStart).split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '};') {
      break
    }

    const match = line.match(OPS_COMMAND_KEY_PATTERN)
    if (!match) {
      continue
    }

    const name = match[1] ?? match[2]
    if (name) {
      names.push(name)
    }
  }

  return names.sort((left, right) => left.localeCompare(right))
}

/**
 * @param {{ repoRoot?: string, scriptName: string }} options
 */
export function opsCommandInvocation({ repoRoot: _repoRoot = defaultRepoRoot, scriptName }) {
  return `pnpm run ops ${scriptName}`
}

export const OPS_COMMAND_SOURCE_PATH = 'scripts/run-ops.mjs'
export const OPS_COMMAND_SOURCE_KIND = 'ops-command'
