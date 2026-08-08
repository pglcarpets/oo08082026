import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkHardcoding } from '../../../tech-docs-generator/scripts/hardcoding-guard.mjs'
import { auditTests } from '../../../tech-docs-generator/scripts/fake-test-audit.mjs'

const tempRoots: string[] = []

function createFixtureRoot(files: Record<string, string>) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'tech-stack-guard-'))
  tempRoots.push(root)

  writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
      },
    }, null, 2),
  )

  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath)
    mkdirSync(path.dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, contents)
  }

  return root
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop()
    if (root) rmSync(root, { recursive: true, force: true })
  }
})

describe('phase 3 guards', () => {
  it('passes hardcoding guard for the current Phase 3 package state', () => {
    const violations = checkHardcoding()
    expect(violations).toEqual([])
  })

  it('flags non-allowlisted src/pages files with page-local factual arrays', () => {
    const root = createFixtureRoot({
      'src/pages/NonAllowlisted.tsx': `const sections = ['one', 'two']\nexport function NonAllowlisted() { return <div>{sections.length}</div> }\n`,
    })

    const violations = checkHardcoding(root)

    expect(violations).toEqual([
      {
        file: 'src/pages/NonAllowlisted.tsx',
        line: 1,
        reason: 'module-level array literal with 2 element(s)',
      },
    ])
  })

  it('allows explicitly allowlisted src/pages files to keep page-local facts', () => {
    const root = createFixtureRoot({
      'src/pages/TechStack.tsx': `const categoryOrder = ['Runtime', 'Workspace']\nexport function TechStack() { return <div>{categoryOrder.join(', ')}</div> }\n`,
    })

    const violations = checkHardcoding(root)

    expect(violations).toEqual([])
  })

  it('flags nested src/app files with module-level object facts', () => {
    const root = createFixtureRoot({
      'src/app/docs/route/page.tsx': `const routeMeta = { label: 'Docs', path: '/docs', owner: 'platform' }\nexport default function Page() { return <div>{routeMeta.label}</div> }\n`,
    })

    const violations = checkHardcoding(root)

    expect(violations).toEqual([
      {
        file: 'src/app/docs/route/page.tsx',
        line: 1,
        reason: 'module-level object literal with 3 properties',
      },
    ])
  })

  it('passes clean non-allowlisted page files without module-level facts', () => {
    const root = createFixtureRoot({
      'src/pages/Clean.tsx': `export function Clean() { return <div>Pure UI</div> }\n`,
    })

    const violations = checkHardcoding(root)

    expect(violations).toEqual([])
  })

  it('passes fake-test audit for current test files', () => {
    const violations = auditTests()
    expect(violations).toEqual([])
  })
})
