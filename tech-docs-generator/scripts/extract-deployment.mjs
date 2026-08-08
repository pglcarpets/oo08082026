import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizedRecord } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function readText(repoRoot, relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function readJson(repoRoot, relativePath) {
  return JSON.parse(readText(repoRoot, relativePath))
}

function parseReleaseGateSteps(repoRoot) {
  // Product package is root package.json (site/ has no package.json).
  const pkg = readJson(repoRoot, 'package.json')
  const command = pkg.scripts?.['release:gate']
  if (!command) return []

  return command
    .split('&&')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('pnpm run ') || part.startsWith('npm run '))
    .map((part, index) => {
      const scriptName = part.replace(/^(?:pnpm|npm) run\s+/, '')
      return createNormalizedRecord({
        id: `deployment.release-gate-step.${scriptName}`,
        category: 'release-gate',
        label: `Step ${index + 1}: ${scriptName}`,
        value: part,
        sourcePath: 'package.json',
        sourceKind: 'package-script',
        sourcePointer: `scripts.release:gate (segment ${index + 1})`,
      })
    })
}

function parseHandoverDeployLines(handoverText) {
  const records = []
  for (const [index, line] of handoverText.split(/\r?\n/).entries()) {
    const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s+—\s+(.+)$/)
    if (!match) continue
    const [, title, body] = match
    if (!/deploy|vercel|ci|gate|backup/i.test(`${title} ${body}`)) continue
    records.push(
      createNormalizedRecord({
        id: `deployment.handover.${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        category: 'handover-context',
        label: title,
        value: body.trim(),
        sourcePath: 'docs/Plan.md',
        sourceKind: 'handover-note',
        sourcePointer: `line ${index + 1}`,
        factClassification: /dashboard|confirm|you \/ ops|you\)/i.test(body) ? 'manual-verification' : 'handover-proven',
        verificationMode: /dashboard|confirm/i.test(body) ? 'manual-verification' : 'source-backed',
      }),
    )
  }
  return records
}

function parseFailuresDeployLines(failuresText) {
  const records = []
  for (const [index, line] of failuresText.split(/\r?\n/).entries()) {
    const match = line.match(/^-\s+`\[([!~x ])\]`\s+(.+)$/)
    if (!match) continue
    const [, marker, body] = match
    if (!/deploy|vercel|release:gate|dependabot|backup|supabase-backup/i.test(body)) continue
    const classification = marker === 'x' ? 'code-proven' : marker === '!' ? 'live-status' : 'live-status'
    records.push(
      createNormalizedRecord({
        id: `deployment.failures.${index}`,
        category: 'deploy-blocker',
        label: body.split('—')[0]?.trim() ?? body.trim(),
        value: body.trim(),
        sourcePath: 'Failures.md',
        sourceKind: 'failures-log',
        sourcePointer: `line ${index + 1}`,
        factClassification: classification,
        verificationMode: 'source-backed',
        status: marker === 'x' ? 'resolved' : 'open',
      }),
    )
  }
  return records
}

/**
 * @param {{ repoRoot?: string, commands?: unknown[] }} [opts]
 */
export function extractDeploymentRecords({ repoRoot = defaultRepoRoot, commands = [] } = {}) {
  const records = []
  // vercel.json lives at monorepo root (moved from site/)
  const vercelPath = 'vercel.json'
  const vercel = readJson(repoRoot, vercelPath)

  records.push(
    createNormalizedRecord({
      id: 'deployment.vercel.framework',
      category: 'vercel-config',
      label: 'Framework',
      value: vercel.framework ?? 'unknown',
      sourcePath: vercelPath,
      sourceKind: 'vercel-config',
      sourcePointer: 'framework',
    }),
    createNormalizedRecord({
      id: 'deployment.vercel.buildCommand',
      category: 'vercel-config',
      label: 'Build command',
      value: vercel.buildCommand ?? 'unknown',
      sourcePath: vercelPath,
      sourceKind: 'vercel-config',
      sourcePointer: 'buildCommand',
    }),
  )

  const dependabotBranches = vercel.git?.deploymentEnabled
  if (dependabotBranches && typeof dependabotBranches === 'object') {
    for (const [branchPattern, enabled] of Object.entries(dependabotBranches)) {
      records.push(
        createNormalizedRecord({
          id: `deployment.vercel.branch.${branchPattern.replace(/[^a-z0-9]+/gi, '-')}`,
          category: 'branch-policy',
          label: `Branch deploy: ${branchPattern}`,
          value: enabled ? 'enabled' : 'disabled',
          sourcePath: vercelPath,
          sourceKind: 'vercel-config',
          sourcePointer: `git.deploymentEnabled.${branchPattern}`,
        }),
      )
    }
  }

  const deployCommands = commands.filter((record) =>
    /^(vercel|release:gate|build|docs:sync|docs:check)/.test(record.scriptName),
  )
  for (const command of deployCommands) {
    records.push(
      createNormalizedRecord({
        id: `deployment.command.${command.id}`,
        category: 'deploy-command',
        label: `${command.packageName}:${command.scriptName}`,
        value: command.command,
        sourcePath: command.sourcePath,
        sourceKind: command.sourceKind,
        sourcePointer: command.sourcePointer,
      }),
    )
  }

  records.push(...parseReleaseGateSteps(repoRoot))

  let handoverText = ''
  let failuresText = ''
  try {
    handoverText = readText(repoRoot, 'docs/Plan.md')
    records.push(...parseHandoverDeployLines(handoverText))
  } catch {
    /* optional */
  }
  try {
    failuresText = readText(repoRoot, 'Failures.md')
    records.push(...parseFailuresDeployLines(failuresText))
  } catch {
    /* optional */
  }

  records.push(
    createNormalizedRecord({
      id: 'deployment.status.vercel-root-directory',
      category: 'status-card',
      label: 'Vercel Root Directory',
      value: 'Should be monorepo root (vercel.json + package.json at root; Next app under site/) — confirm in Vercel dashboard',
      sourcePath: 'docs/Plan.md',
      sourceKind: 'handover-note',
      sourcePointer: 'Vercel (current truth) · Root Directory',
      factClassification: 'manual-verification',
      verificationMode: 'manual-verification',
    }),
    createNormalizedRecord({
      id: 'deployment.status.supabase-backup-cron',
      category: 'status-card',
      label: 'supabase-backup-r2 scheduled cron',
      value: '02:15 UTC — unverified in dashboard',
      sourcePath: 'Failures.md',
      sourceKind: 'failures-log',
      sourcePointer: 'Repo / CI · supabase-backup-r2.yml',
      factClassification: 'manual-verification',
      verificationMode: 'manual-verification',
    }),
  )

  const releaseGateBlocked = failuresText.includes('release:gate') && failuresText.includes('[!]')
  records.push(
    createNormalizedRecord({
      id: 'deployment.status.release-gate',
      category: 'status-card',
      label: 'Full release:gate',
      value: releaseGateBlocked
        ? 'Blocked — see Failures.md gate policy'
        : 'See Failures.md for current gate status',
      sourcePath: 'Failures.md',
      sourceKind: 'failures-log',
      sourcePointer: 'Gate policy (browser / Playwright / release:gate)',
      factClassification: 'live-status',
      verificationMode: 'source-backed',
      status: releaseGateBlocked ? 'blocked' : 'unknown',
    }),
  )

  const dependabotDisabled = dependabotBranches?.['dependabot/**'] === false
  records.push(
    createNormalizedRecord({
      id: 'deployment.status.dependabot-branch',
      category: 'status-card',
      label: 'Dependabot preview deploys',
      value: dependabotDisabled ? 'Disabled via vercel.json' : 'Not disabled in vercel.json',
      sourcePath: vercelPath,
      sourceKind: 'vercel-config',
      sourcePointer: 'git.deploymentEnabled.dependabot/**',
      factClassification: 'code-proven',
    }),
  )

  return records.sort((left, right) => left.id.localeCompare(right.id))
}
