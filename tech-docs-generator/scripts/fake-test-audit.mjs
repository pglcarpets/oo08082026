import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  countActiveItBlocks,
  countExpectCalls,
  findHollowPatternViolations,
} from '../../scripts/general/hollow-test-patterns.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')

function walkTests(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTests(abs, out)
      continue
    }
    if (/\.test\.(ts|tsx)$/.test(entry.name)) out.push(abs)
  }
  return out
}

export function auditTests({ root = packageRoot } = {}) {
  const violations = []
  const repoRoot = path.resolve(root, '..')
  const testsDir = path.join(repoRoot, 'tests', 'tech-docs-generator')

  for (const absPath of walkTests(testsDir)) {
    const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/')
    const text = readFileSync(absPath, 'utf8')
    const itCount = countActiveItBlocks(text)
    const expectCount = countExpectCalls(text)

    for (const hollow of findHollowPatternViolations(text, { file: relPath })) {
      violations.push(hollow)
    }

    if (itCount === 0) {
      violations.push({ file: relPath, reason: 'no it() blocks' })
      continue
    }

    if (expectCount === 0) {
      violations.push({ file: relPath, reason: 'no expect() assertions' })
      continue
    }

    if (expectCount < itCount) {
      violations.push({
        file: relPath,
        reason: `fewer expect() calls (${expectCount}) than tests (${itCount})`,
      })
    }

    if (relPath.startsWith('tests/tech-docs-generator/generator/')) {
      const hasWeak = /\bexpect\([^)]*\)\.(toBeDefined|toBeTruthy)\s*\(/.test(text)

      const hasStrong =
        /\btoBeGreaterThan\b/.test(text) ||
        /\btoEqual\b/.test(text) ||
        /\btoMatch\s*\(\s*['"`]/.test(text) ||
        /\btoContain\s*\(\s*['"`]/.test(text) ||
        /\)\.toBe\s*\(\s*(?:false|null|\d+|'|")/.test(text) ||
        /\bexpect\([^)]*\)\.not\.toMatch/.test(text)

      if (hasWeak && !hasStrong) {
        violations.push({
          file: relPath,
          reason: 'extractor test uses existence-only assertions without source-value proof',
        })
      }

      if (/vi\.mock\s*\(/.test(text) && /extract[A-Z]/.test(text)) {
        violations.push({
          file: relPath,
          reason: 'extractor test mocks the subject under test',
        })
      }
    }
  }

  return violations
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  const violations = auditTests()
  if (violations.length > 0) {
    console.error(`Fake-test audit failed (${violations.length}):`)
    for (const item of violations) {
      console.error(`- ${item.file}: ${item.reason}`)
    }
    process.exitCode = 1
  } else {
    console.log('Fake-test audit passed')
  }
}
