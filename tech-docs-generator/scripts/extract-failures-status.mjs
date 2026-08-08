import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizedRecord } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

/**
 * Parse Failures.md active blockers.
 * Supports legacy checkbox form: `- \`[x]\` body` / `[!]` / `[~]` / `[ ]`
 * and current plain bullets: `- Active blocker text…`
 */
function parseFailuresBullets(text, sourcePath) {
  const records = []
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const checkbox = line.match(/^-\s+`\[([!~x ])\]`\s+(.+)$/)
    const plain = !checkbox ? line.match(/^-\s+(.+)$/) : null
    if (!checkbox && !plain) continue

    const marker = checkbox ? checkbox[1] : '!'
    const body = (checkbox ? checkbox[2] : plain[1]).trim()
    if (!body || body.startsWith('#')) continue

    // Label = first sentence or first 120 chars for table display.
    const label =
      body.split(/(?<=[.!?])\s+/)[0]?.trim().slice(0, 120) ||
      body.slice(0, 120) ||
      `Item ${index}`

    records.push(
      createNormalizedRecord({
        id: `failures.${sourcePath.replace(/[^a-z0-9]+/gi, '-')}.${index}`,
        category: 'operational-status',
        label,
        value: body,
        sourcePath,
        sourceKind: sourcePath === 'Failures.md' ? 'failures-log' : 'handover-note',
        sourcePointer: `line ${index + 1}`,
        factClassification: marker === 'x' ? 'code-proven' : 'live-status',
        status: marker === 'x' ? 'resolved' : marker === '!' ? 'blocked' : marker === '~' ? 'partial' : 'partial',
      }),
    )
  }
  return records
}

export function extractFailuresStatusRecords({ repoRoot = defaultRepoRoot } = {}) {
  const records = []

  for (const relativePath of ['Failures.md']) {
    try {
      const text = readFileSync(path.join(repoRoot, relativePath), 'utf8')
      records.push(...parseFailuresBullets(text, relativePath))
    } catch {
      records.push(
        createNormalizedRecord({
          id: `failures.missing.${relativePath.replace(/\./g, '-')}`,
          category: 'operational-status',
          label: `Missing ${relativePath}`,
          value: 'Source file not readable',
          sourcePath: relativePath,
          sourceKind: relativePath === 'Failures.md' ? 'failures-log' : 'handover-note',
          sourcePointer: 'file',
          factClassification: 'unknown-gap',
        }),
      )
    }
  }

  return records.sort((left, right) => left.id.localeCompare(right.id))
}
