import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizedRecord } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function extractYamlScalar(block, key) {
  const match = block.match(new RegExp(`^${key}:\\s*"?([^"\\n#]+)"?`, 'm'))
  return match?.[1]?.trim() ?? null
}

function extractCronSchedules(text) {
  const schedules = []
  for (const match of text.matchAll(/cron:\s*"([^"]+)"/g)) {
    schedules.push(match[1])
  }
  return schedules
}

function extractSecretNames(text) {
  const names = new Set()
  for (const match of text.matchAll(/\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}/g)) {
    names.add(match[1])
  }
  return [...names].sort()
}

function extractWorkflowTriggers(text) {
  const triggers = []
  if (/^\s*push:/m.test(text)) triggers.push('push')
  if (/^\s*pull_request:/m.test(text)) triggers.push('pull_request')
  if (/^\s*schedule:/m.test(text)) triggers.push('schedule')
  if (/^\s*workflow_dispatch:/m.test(text)) triggers.push('workflow_dispatch')
  return triggers
}

function extractNodeVersion(text) {
  return extractYamlScalar(text, 'node-version')
}

function extractPnpmVersion(text, repoRoot = defaultRepoRoot) {
  const match = text.match(/pnpm\/action-setup@v\d+\s*\n\s*with:\s*\n\s*version:\s*"?([^"\n]+)"?/m)
  if (match?.[1]?.trim()) {
    return match[1].trim()
  }
  try {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
    const pm = typeof pkg.packageManager === 'string' ? pkg.packageManager : ''
    const fromPackageManager = pm.match(/^pnpm@([^+]+)/)?.[1]?.trim()
    return fromPackageManager ?? null
  } catch {
    return null
  }
}

export function extractCiRecords({ repoRoot = defaultRepoRoot } = {}) {
  const workflowDir = path.join(repoRoot, '.github', 'workflows')
  const records = []

  if (!existsSync(workflowDir)) {
    return records
  }

  for (const fileName of readdirSync(workflowDir).sort()) {
    if (!fileName.endsWith('.yml') && !fileName.endsWith('.yaml')) continue
    const relativePath = `.github/workflows/${fileName}`
    const text = readFileSync(path.join(repoRoot, relativePath), 'utf8')
    const workflowId = fileName.replace(/\.(yml|yaml)$/, '')

    records.push(
      createNormalizedRecord({
        id: `ci.workflow.${workflowId}.file`,
        category: 'workflow-file',
        label: fileName,
        value: extractYamlScalar(text, 'name') ?? workflowId,
        sourcePath: relativePath,
        sourceKind: 'workflow-file',
        sourcePointer: 'name',
      }),
    )

    const triggers = extractWorkflowTriggers(text)
    if (triggers.length > 0) {
      records.push(
        createNormalizedRecord({
          id: `ci.workflow.${workflowId}.triggers`,
          category: 'workflow-trigger',
          label: `${workflowId} triggers`,
          value: triggers.join(', '),
          sourcePath: relativePath,
          sourceKind: 'workflow-file',
          sourcePointer: 'on',
        }),
      )
    }

    const schedules = extractCronSchedules(text)
    for (const [index, cron] of schedules.entries()) {
      records.push(
        createNormalizedRecord({
          id: `ci.workflow.${workflowId}.schedule.${index}`,
          category: 'workflow-schedule',
          label: `${workflowId} cron`,
          value: cron,
          sourcePath: relativePath,
          sourceKind: 'workflow-file',
          sourcePointer: `on.schedule[${index}].cron`,
        }),
      )
    }

    const nodeVersion = extractNodeVersion(text)
    if (nodeVersion) {
      records.push(
        createNormalizedRecord({
          id: `ci.workflow.${workflowId}.node`,
          category: 'workflow-runtime',
          label: `${workflowId} node version`,
          value: nodeVersion,
          sourcePath: relativePath,
          sourceKind: 'workflow-file',
          sourcePointer: 'setup-node.with.node-version',
        }),
      )
    }

    const pnpmVersion = extractPnpmVersion(text, repoRoot)
    if (pnpmVersion) {
      records.push(
        createNormalizedRecord({
          id: `ci.workflow.${workflowId}.pnpm`,
          category: 'workflow-runtime',
          label: `${workflowId} pnpm version`,
          value: pnpmVersion,
          sourcePath: relativePath,
          sourceKind: 'workflow-file',
          sourcePointer: 'package.json#packageManager',
        }),
      )
    }

    const secrets = extractSecretNames(text)
    if (secrets.length > 0) {
      records.push(
        createNormalizedRecord({
          id: `ci.workflow.${workflowId}.secrets`,
          category: 'workflow-secret-names',
          label: `${workflowId} secret names`,
          value: secrets.join(', '),
          sourcePath: relativePath,
          sourceKind: 'workflow-file',
          sourcePointer: 'secrets.*',
          browserExposure: 'server-name-safe',
          secretRisk: 'name-only',
        }),
      )
    }

    const workingDirMatch = text.match(/working-directory:\s*(\S+)/)
    if (workingDirMatch) {
      records.push(
        createNormalizedRecord({
          id: `ci.workflow.${workflowId}.working-directory`,
          category: 'workflow-runtime',
          label: `${workflowId} working directory`,
          value: workingDirMatch[1],
          sourcePath: relativePath,
          sourceKind: 'workflow-file',
          sourcePointer: 'defaults.run.working-directory',
        }),
      )
    }
  }

  return records
}
