import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizedRecord } from './normalized-record.mjs'
import { SOURCE_PACKAGE_DIR } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

const ROOT_DOCS = [
  'AGENTS.md',
  'README.md',
  'START.md',
  'CONTENTS.md',
  'DOC-MAP.md',
  'OPERATIONS_RUNBOOK.md',
  'Testing-handbook.md',
  'Failures.md',
  'docs/README.md',
]

const PLANS_DIR = 'plans'

const TECH_DOCS = [
  `${SOURCE_PACKAGE_DIR}/README.md`,
]

const ARCHITECTURE_DOCS_DIR = 'docs/architecture'

function readMarkdownTitle(filePath) {
  try {
    const heading = readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .find((line) => /^#\s+\S/.test(line.trim()))
    return heading ? heading.trim().replace(/^#\s+/, '') : path.basename(filePath, '.md')
  } catch {
    return path.basename(filePath, '.md')
  }
}

const OUTPUT_PATH_SNIPPETS = [
  { label: 'Vite outDir', needle: 'generated-documents/site', files: TECH_DOCS },
  { label: 'tech-docs generate script', needle: 'tech-docs:generate', files: ['package.json', ...TECH_DOCS] },
]

export function extractDocsHealthRecords({ repoRoot = defaultRepoRoot } = {}) {
  const records = []

  for (const relativePath of ROOT_DOCS) {
    const exists = existsSync(path.join(repoRoot, relativePath))
    records.push(
      createNormalizedRecord({
        id: `docs-health.root.${relativePath.replace(/[^a-z0-9]+/gi, '-')}`,
        category: 'root-doc',
        label: relativePath,
        value: exists ? 'present' : 'missing',
        sourcePath: relativePath,
        sourceKind: 'readme-doc',
        sourcePointer: 'file.exists',
        factClassification: exists ? 'code-proven' : 'unknown-gap',
      }),
    )
  }

  const plansRoot = path.join(repoRoot, PLANS_DIR)
  if (existsSync(plansRoot)) {
    const planDocs = readdirSync(plansRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))

    for (const fileName of planDocs) {
      const relativePath = `${PLANS_DIR}/${fileName}`
      records.push(
        createNormalizedRecord({
          id: `docs-health.plan.${fileName.replace(/[^a-z0-9]+/gi, '-')}`,
          category: 'plan-doc',
          label: readMarkdownTitle(path.join(plansRoot, fileName)),
          value: 'present',
          sourcePath: relativePath,
          sourceKind: 'plan-doc',
          sourcePointer: 'file.exists',
          factClassification: 'code-proven',
        }),
      )
    }
  }

  const architectureRoot = path.join(repoRoot, ARCHITECTURE_DOCS_DIR)
  if (existsSync(architectureRoot)) {
    const architectureDocs = readdirSync(architectureRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right))

    for (const fileName of architectureDocs) {
      const relativePath = `${ARCHITECTURE_DOCS_DIR}/${fileName}`
      records.push(
        createNormalizedRecord({
          id: `docs-health.architecture.${fileName.replace(/[^a-z0-9]+/gi, '-')}`,
          category: 'architecture-doc',
          label: readMarkdownTitle(path.join(architectureRoot, fileName)),
          value: 'indexed',
          sourcePath: relativePath,
          sourceKind: 'architecture-doc',
          sourcePointer: 'heading.1',
          factClassification: 'code-proven',
        }),
      )
    }
  }

  for (const check of OUTPUT_PATH_SNIPPETS) {
    const matches = check.files.filter((filePath) => {
      try {
        return readFileSync(path.join(repoRoot, filePath), 'utf8').includes(check.needle)
      } catch {
        return false
      }
    })
    records.push(
      createNormalizedRecord({
        id: `docs-health.consistency.${check.label.replace(/[^a-z0-9]+/gi, '-')}`,
        category: 'docs-consistency',
        label: check.label,
        value: matches.length === check.files.length ? 'consistent' : `matched ${matches.length}/${check.files.length} files`,
        sourcePath: matches[0] ?? check.files[0],
        sourceKind: 'readme-doc',
        sourcePointer: check.needle,
        factClassification: matches.length === check.files.length ? 'code-proven' : 'partial',
        verificationMode: matches.length === check.files.length ? 'source-backed' : 'manual-verification',
      }),
    )
  }

  records.push(
    createNormalizedRecord({
      id: 'docs-health.fake-test-audit.shape',
      category: 'audit-shape',
      label: 'Fake-test audit',
      value: 'Enforced by tech-docs:gate via fake-test-audit.mjs',
      sourcePath: `${SOURCE_PACKAGE_DIR}/scripts/fake-test-audit.mjs`,
      sourceKind: 'fake-test-audit',
      sourcePointer: 'auditTests',
      factClassification: 'code-proven',
    }),
  )

  const themeChecks = [
    {
      id: 'docs-health.theme.renderer-token-bridge',
      label: 'Renderer token bridge maps brand/accent to site tokens',
      sourcePath: `${SOURCE_PACKAGE_DIR}/scripts/check-theme-alignment.mjs`,
      sourcePointer: 'checkThemeAlignment',
    },
    {
      id: 'docs-health.theme.mobile-overlap',
      label: 'Mobile table/sidebar overlap and tone',
      sourcePath: `${SOURCE_PACKAGE_DIR}/src/index.css`,
      sourcePointer: 'manual.browser.visual',
    },
    {
      id: 'docs-health.theme.mermaid-render',
      label: 'Mermaid diagram contrast on site surfaces',
      sourcePath: `${SOURCE_PACKAGE_DIR}/src/components/MermaidDiagram.tsx`,
      sourcePointer: 'manual.browser.visual',
    },
  ]

  for (const check of themeChecks) {
    records.push(
      createNormalizedRecord({
        id: check.id,
        category: 'theme-visual',
        label: check.label,
        value: check.id.includes('token-bridge') ? 'static-check in tech-docs:gate' : 'requires browser proof',
        sourcePath: check.sourcePath,
        sourceKind: 'theme-alignment',
        sourcePointer: check.sourcePointer,
        factClassification: check.id.includes('token-bridge') ? 'code-proven' : 'partial',
        verificationMode: check.id.includes('token-bridge') ? 'source-backed' : 'manual-verification',
        browserExposure: 'public-safe',
        renderSurface: ['docs-health', 'renderer'],
      }),
    )
  }

  return records.sort((left, right) => left.id.localeCompare(right.id))
}
