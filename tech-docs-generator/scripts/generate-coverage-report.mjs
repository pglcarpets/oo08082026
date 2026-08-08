import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(packageRoot, '..')

export function renderCoverageReport({ root = repoRoot } = {}) {
  const summaryPath = path.join(root, 'results', 'tooling', 'tech-docs', 'coverage', 'coverage-summary.json')
  const raw = JSON.parse(readFileSync(summaryPath, 'utf8'))
  const total = raw.total
  const date = new Date().toISOString().slice(0, 10)

  const fileRows = Object.entries(raw)
    .filter(([key]) => key !== 'total')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([file, metrics]) => {
      const relFile = file.replace(/\\/g, '/').replace(/^.*?tech-docs-generator\//, '')
      const stmt = metrics.statements
      const note = stmt.pct >= 95 ? 'meets gate' : 'below gate'
      return `| \`${relFile}\` | ${stmt.covered}/${stmt.total} (${stmt.pct}%) | ${metrics.branches.pct}% | ${metrics.functions.pct}% | ${metrics.lines.pct}% | ${note} |`
    })

  return `# Tech Stack Coverage Report

Generated from \`results/tooling/tech-docs/coverage/coverage-summary.json\` after \`pnpm run tech-docs:gate\` on ${date}.

## Summary

| Metric | Covered | Total | Percent |
|---|---:|---:|---:|
| Statements | ${total.statements.covered} | ${total.statements.total} | ${total.statements.pct}% |
| Branches | ${total.branches.covered} | ${total.branches.total} | ${total.branches.pct}% |
| Functions | ${total.functions.covered} | ${total.functions.total} | ${total.functions.pct}% |
| Lines | ${total.lines.covered} | ${total.lines.total} | ${total.lines.pct}% |

Gate floor: **95%** for lines, branches, functions, and statements.

## File Wise

| File | Statements | Branches | Functions | Lines | Notes |
|---|---:|---:|---:|---:|---|
${fileRows.join('\n')}
`
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  const report = renderCoverageReport()
  const outPath = path.join(packageRoot, 'COVERAGE-REPORT.md')
  writeFileSync(outPath, report, 'utf8')
  console.log(`Wrote ${outPath}`)
}
