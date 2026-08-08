import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')

const FORBIDDEN_RENDERER_HEX = [
  '#0ea5e9',
  '#38bdf8',
  '#0284c7',
  '#d946ef',
  '#e879f9',
  '#c026d3',
  '#f0f9ff',
  '#fdf4ff',
]

const REQUIRED_ALIASES = [
  '--color-brand-500: var(--color-ocean-boat-blue-500)',
  '--color-accent-500: var(--color-bronze-500)',
  'background: var(--surface-canvas)',
]

export function checkThemeAlignment({ root = packageRoot } = {}) {
  const violations = []
  const indexCss = readFileSync(path.join(root, 'src', 'index.css'), 'utf8')

  for (const hex of FORBIDDEN_RENDERER_HEX) {
    if (indexCss.toLowerCase().includes(hex)) {
      violations.push({ file: 'src/index.css', reason: `forbidden standalone hex ${hex}` })
    }
  }

  for (const alias of REQUIRED_ALIASES) {
    if (!indexCss.includes(alias)) {
      violations.push({ file: 'src/index.css', reason: `missing token alias: ${alias}` })
    }
  }

  if (/@apply\s+bg-gray-950/.test(indexCss)) {
    violations.push({ file: 'src/index.css', reason: 'body still uses raw gray-950 instead of site surface tokens' })
  }

  return violations
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  const violations = checkThemeAlignment()
  if (violations.length > 0) {
    console.error(`Theme alignment failed (${violations.length}):`)
    for (const item of violations) {
      console.error(`- ${item.file}: ${item.reason}`)
    }
    process.exitCode = 1
  } else {
    console.log('Theme alignment check passed')
  }
}
