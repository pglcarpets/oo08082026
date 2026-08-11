import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "tech-docs-generator")
const repoRoot = path.resolve(packageRoot, '..')

function readSource(filePath: string) {
  return readFileSync(filePath, 'utf8')
}

function readWorkspacePackages(source: string) {
  const packages: string[] = []
  let inPackages = false

  for (const line of source.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true
      continue
    }

    if (!inPackages) continue
    if (line.trim() === '') continue
    if (!/^\s+-\s+/.test(line)) break

    const rawEntry = line.replace(/^\s+-\s+/, '').trim()
    const quoted = rawEntry.match(/^(['"])(.*)\1$/)
    packages.push(quoted?.[2] ?? rawEntry)
  }

  return packages
}

describe('tech docs package contract', () => {
  it('uses the approved workspace directory', () => {
    const workspace = readSource(path.join(repoRoot, 'pnpm-workspace.yaml'))
    const packages = readWorkspacePackages(workspace)

    expect(packages).toContain('tech-docs-generator')
  })

  it('removes the legacy workspace directory', () => {
    const workspace = readSource(path.join(repoRoot, 'pnpm-workspace.yaml'))
    const packages = readWorkspacePackages(workspace)

    expect(packages).not.toContain('legacy-tech-docs-generator')
  })

  it('uses the approved package name', () => {
    const packageJson = JSON.parse(readSource(path.join(packageRoot, 'package.json'))) as {
      name?: unknown
    }

    expect(packageJson.name).toBe('oando-tech-docs')
  })

  it('uses an absolute Vite base for deep-route refreshes', () => {
    const vite = readSource(path.join(packageRoot, 'vite.config.ts'))

    expect(vite).toMatch(/base:\s*['"]\/['"]/)
  })

  it('registers the live repository regeneration plugin', () => {
    const vite = readSource(path.join(packageRoot, 'vite.config.ts'))
    const plugin = readSource(path.join(packageRoot, 'scripts', 'vite-plugin-repo-live.ts'))

    expect(vite).toContain('repoLivePlugin')
    expect(plugin).toContain("name: 'oando-repo-live'")
  })

  it('writes the Vite site output directly under generated-documents/site', () => {
    const vite = readSource(path.join(packageRoot, 'vite.config.ts'))

    expect(vite).toContain('getSiteOutputRoot(repoRoot)')
    expect(vite).not.toContain('getStagingSiteOutputRoot')
    expect(vite).not.toContain('../.tmp/generated-documents/site')
  })

  it('keeps the Vite and Vitest cache outside the package node_modules', () => {
    const vite = readSource(path.join(packageRoot, 'vite.config.ts'))

    expect(vite).toContain('getTechDocsViteCacheDir(repoRoot)')
    expect(vite).not.toMatch(/['"]\.tmp['"],\s*['"]tech-docs['"]/)
  })

  it('documents the current tech docs development command', () => {
    // Root package.json owns the workspace script; package README documents it.
    const rootPackageJson = JSON.parse(readSource(path.join(repoRoot, 'package.json'))) as {
      scripts?: Record<string, string>
    }
    const techDocsReadme = readSource(path.join(packageRoot, 'README.md'))
    const rootReadme = readSource(path.join(repoRoot, 'README.md'))

    expect(rootPackageJson.scripts?.['tech-docs:dev']).toContain('oando-tech-docs')
    expect(rootPackageJson.scripts?.['tech-docs:dev']).toMatch(/3001|dev/)
    expect(techDocsReadme).toContain('pnpm run tech-docs:dev')
    expect(techDocsReadme).toContain('3001')
    expect(`${rootReadme}\n${techDocsReadme}`).not.toContain('pnpm run dev:tech-stack')
  })

  it('uses direct-write generation and build finalize commands', () => {
    const packageJson = JSON.parse(readSource(path.join(packageRoot, 'package.json'))) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.dev).toBe('vite')
    expect(packageJson.scripts?.generate).toBe('node scripts/generate-all.mjs')
    expect(packageJson.scripts?.test).toBe('node ../node_modules/vitest/vitest.mjs run')
    expect(packageJson.scripts?.['test:coverage']).toBe(
      'node ../node_modules/vitest/vitest.mjs run --coverage',
    )
    expect(packageJson.scripts?.check).toBe('node scripts/check.mjs')
    // generate writes data/docs directly; vite writes site directly; publish-all finalizes site manifest.
    expect(packageJson.scripts?.build).toBe(
      'node scripts/generate-all.mjs && vite build && node scripts/publish-all.mjs --surfaces=site',
    )
    expect(packageJson.scripts?.gate).toBe('node scripts/gate.mjs')
    const rootPackageJson = JSON.parse(readSource(path.join(repoRoot, 'package.json'))) as {
      scripts?: Record<string, string>
    }
    expect(rootPackageJson.scripts?.['test:audit:fake-test']).toContain('fake-test-audit.mjs')
    // No --max-old-space-size caps in scripts (heap unbounded by package scripts).
    for (const script of Object.values(packageJson.scripts ?? {})) {
      expect(script).not.toMatch(/max-old-space-size/)
    }
  })

  it('writes coverage output under root results tooling paths', () => {
    const vitest = readSource(path.join(packageRoot, 'vitest.config.ts'))
    const coverageScript = readSource(path.join(packageRoot, 'scripts', 'check-coverage.mjs'))
    const coverageReport = readSource(path.join(packageRoot, 'scripts', 'generate-coverage-report.mjs'))

    expect(vitest).toContain("path.resolve(repoRoot, 'results', 'tooling', 'tech-docs', 'coverage')")
    expect(coverageScript).toContain("path.join(root, 'results', 'tooling', 'tech-docs', 'coverage', 'coverage-summary.json')")
    expect(coverageReport).toContain("path.join(root, 'results', 'tooling', 'tech-docs', 'coverage', 'coverage-summary.json')")
  })

  it('runs a single-pass gate: one wipe+generate, validate, build site, coverage only', () => {
    const checkScript = readSource(path.join(packageRoot, 'scripts', 'check.mjs'))
    const generateAllScript = readSource(path.join(packageRoot, 'scripts', 'generate-all.mjs'))
    const gateScript = readSource(path.join(packageRoot, 'scripts', 'gate.mjs'))

    expect(generateAllScript).toContain('wipeDisposableGeneratedOutputs')
    expect(generateAllScript).toContain('getGeneratedRoot')
    expect(generateAllScript).toContain('generate: delete')
    expect(generateAllScript).toContain('generateDocs({ repoRoot, model })')
    expect(generateAllScript).toContain('emitRendererData({ repoRoot, model })')
    expect(generateAllScript).not.toContain('apply: true')
    expect(generateAllScript).not.toContain('stageOnly')
    expect(checkScript).toContain('validateGeneratedDocs')
    expect(checkScript).toContain('generateAll({ repoRoot })')
    expect(checkScript).not.toContain('stageOnly')
    expect(gateScript).toContain('generateAll({ repoRoot: root })')
    expect(gateScript).toContain('validateGeneratedDocs({ repoRoot: root })')
    expect(gateScript).not.toContain('checkDocs({')
    expect(gateScript).toContain("console.log('docs:gate - generate')")
    expect(gateScript).toContain("console.log('docs:gate - validate')")
    expect(gateScript).toContain("console.log('docs:gate - hardcoding guard')")
    expect(gateScript).toContain("console.log('docs:gate - fake-test audit')")
    expect(gateScript).toContain("console.log('docs:gate - theme alignment')")
    expect(gateScript).toContain("console.log('docs:gate - typecheck')")
    expect(gateScript).toContain("console.log('docs:gate - build site')")
    expect(gateScript).toContain("console.log('docs:gate - coverage')")
    expect(gateScript).not.toContain("console.log('docs:gate - test')")
    const generateAt = gateScript.indexOf("console.log('docs:gate - generate')")
    const validateAt = gateScript.indexOf("console.log('docs:gate - validate')")
    const typecheckAt = gateScript.indexOf("console.log('docs:gate - typecheck')")
    const buildAt = gateScript.indexOf("console.log('docs:gate - build site')")
    const coverageAt = gateScript.indexOf("console.log('docs:gate - coverage')")
    expect(generateAt).toBeGreaterThan(-1)
    expect(validateAt).toBeGreaterThan(generateAt)
    expect(typecheckAt).toBeGreaterThan(validateAt)
    expect(buildAt).toBeGreaterThan(typecheckAt)
    expect(coverageAt).toBeGreaterThan(buildAt)
  })

  it('runs tech docs CI without path filters', () => {
    const workflow = readSource(path.join(repoRoot, '.github', 'workflows', 'tech-docs.yml'))

    expect(workflow).not.toMatch(/\n\s+paths:\n/)
    expect(workflow).toContain('run: pnpm run tech-docs:gate')
    expect(workflow).toContain('path: generated-documents/site/')
  })
})
