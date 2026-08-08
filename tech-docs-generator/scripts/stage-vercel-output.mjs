/**
 * Copy generated SPA into tech-docs-generator/dist for Vercel static deploy.
 * Vercel root directory is this package; output cannot use parent paths (../).
 */
import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSiteOutputRoot } from './output-contract.mjs'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(packageRoot, '..')
const source = getSiteOutputRoot(repoRoot)
const target = path.resolve(packageRoot, 'dist')

if (!existsSync(source)) {
  console.error(`stage-vercel-output: missing build output at ${source}`)
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })
cpSync(source, target, { recursive: true })
console.log(`stage-vercel-output: ${source} -> ${target}`)
