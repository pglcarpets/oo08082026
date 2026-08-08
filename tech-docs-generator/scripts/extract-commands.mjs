import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  listOpsCommandNames,
  opsCommandInvocation,
  OPS_COMMAND_SOURCE_KIND,
  OPS_COMMAND_SOURCE_PATH,
} from '../../scripts/ops-command-registry.mjs'
import { SOURCE_PACKAGE_DIR } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

export function extractCommandRecords({ repoRoot = defaultRepoRoot } = {}) {
  // Product scripts live on root package.json; site/ has no package.json.
  const packageFiles = [
    path.join(repoRoot, 'package.json'),
    path.join(repoRoot, SOURCE_PACKAGE_DIR, 'package.json'),
    path.join(repoRoot, 'tech-docs-generator', 'package.json'),
  ].filter((filePath) => existsSync(filePath))

  const rootPkgPath = path.join(repoRoot, 'package.json')
  const rootPackageName = existsSync(rootPkgPath)
    ? (readJson(rootPkgPath).name ?? 'ooplanner-oostudio')
    : 'ooplanner-oostudio'

  const packageRecords = packageFiles.flatMap((filePath) => {
    const pkg = readJson(filePath)
    const scripts = pkg.scripts ?? {}
    const packageName = pkg.name ?? path.basename(path.dirname(filePath))
    const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/')

    return Object.entries(scripts).map(([scriptName, command]) => ({
      id: `${packageName}:${scriptName}`,
      packageName,
      scriptName,
      command,
      sourcePath: relativePath,
      sourceKind: 'package-script',
      sourcePointer: `scripts.${scriptName}`,
    }))
  })

  const opsRecords = listOpsCommandNames({ repoRoot }).map((scriptName) => ({
    id: `${rootPackageName}:ops:${scriptName}`,
    packageName: rootPackageName,
    scriptName,
    command: opsCommandInvocation({ repoRoot, scriptName }),
    sourcePath: OPS_COMMAND_SOURCE_PATH,
    sourceKind: OPS_COMMAND_SOURCE_KIND,
    sourcePointer: `ops.${scriptName}`,
  }))

  return [...packageRecords, ...opsRecords].sort((left, right) => {
    if (left.packageName !== right.packageName) return left.packageName.localeCompare(right.packageName)
    return left.scriptName.localeCompare(right.scriptName)
  })
}
