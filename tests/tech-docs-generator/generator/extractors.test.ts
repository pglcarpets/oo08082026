import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractApiRecords } from '../../../tech-docs-generator/scripts/extract-api.mjs'
import { extractDatabaseRecords } from '../../../tech-docs-generator/scripts/extract-database.mjs'
import { extractEnvironmentRecords } from '../../../tech-docs-generator/scripts/extract-environment.mjs'
import { extractCommandRecords } from '../../../tech-docs-generator/scripts/extract-commands.mjs'
import { extractDependencyRecords } from '../../../tech-docs-generator/scripts/extract-dependencies.mjs'
import { extractFeatureRecords } from '../../../tech-docs-generator/scripts/extract-features.mjs'
import { extractRouteRecords } from '../../../tech-docs-generator/scripts/extract-routes.mjs'
import { normalizeDependencyRecords } from '../../../tech-docs-generator/scripts/normalize.mjs'

describe('dependency extractor', () => {
  it('extracts requested and resolved dependency facts from workspace importers', () => {
    const records = extractDependencyRecords()
    const ids = records.map((record) => record.id)

    // Product deps live on root package.json (importer ".") — site/ has no package.json.
    expect(ids).toContain('.:dependencies:next')
    expect(ids).toContain('tech-docs-generator:dependencies:react')
    expect(ids).toContain('.:devDependencies:typescript')

    // Assert against the live manifest + installed package — never a frozen literal.
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
    const rootPackage = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
    const installedNext = JSON.parse(
      readFileSync(path.join(repoRoot, 'node_modules', 'next', 'package.json'), 'utf8'),
    )

    const next = records.find((record) => record.id === '.:dependencies:next')
    expect(next?.requested).toMatchObject({
      value: rootPackage.dependencies.next,
      sourceKind: 'package-manifest',
      sourcePath: 'package.json',
    })
    expect(next?.resolved).toMatchObject({
      value: installedNext.version,
      sourceKind: 'lockfile',
      sourcePath: 'pnpm-lock.yaml',
    })
  })

  it('normalizes dependency records into stable factual outputs', () => {
    const normalized = normalizeDependencyRecords(
      extractDependencyRecords({ importerNames: ['.'] }).slice(0, 2),
    )

    expect(normalized.length).toBe(4)
    expect(normalized[0].id).toContain('requested-range')
    expect(normalized[1].id).toContain('resolved-version')
    expect(normalized.every((entry: { domain: string }) => entry.domain === 'dependencies')).toBe(true)
  })

  it('extracts route and api proofs from the site tree', () => {
    const routes = extractRouteRecords()
    const apiRecords = extractApiRecords()

    const plannerRoutes = routes.filter((record) => record.path === '/ooplanner')
    expect(plannerRoutes).toHaveLength(1)
    expect(plannerRoutes[0]).toMatchObject({
      sourcePath: 'site/app/ooplanner/page.tsx',
      aliasPaths: [],
    })
    expect(routes.some((record) => record.path === '/products/[category]')).toBe(true)
    expect(apiRecords).toContainEqual(
      expect.objectContaining({
        path: '/api/ai-advisor',
        method: 'POST',
        sourceKind: 'route-file',
      }),
    )
    expect(apiRecords).toContainEqual(
      expect.objectContaining({
        path: '/api/theme/active',
        method: 'GET',
        sourceKind: 'route-file',
      }),
    )
  })

  it('extracts environment and database sources', () => {
    const envRecords = extractEnvironmentRecords()
    const databaseRecords = extractDatabaseRecords()
    const featureRecords = extractFeatureRecords()
    const commandRecords = extractCommandRecords()

    expect(envRecords.some((record) => record.name === 'NEXT_PUBLIC_SUPABASE_URL')).toBe(true)
    expect(
      envRecords.find((record) => record.name === 'OPENROUTER_API_KEY_PRIMARY')?.usages.length ?? 0,
    ).toBeGreaterThan(0)

    expect(databaseRecords.schema.tables.map((table) => table.name)).toContain('catalog_products')
    expect(databaseRecords.schema.tables.map((table) => table.name)).toContain('profiles')
    expect(databaseRecords.migrations.length).toBeGreaterThan(0)

    const featureSlugs = featureRecords.map((feature) => feature.slug)
    for (const slug of ['studio', 'planner', 'catalog']) {
      expect(featureSlugs).toContain(slug)
    }

    expect(commandRecords.some((record) => record.scriptName === 'build')).toBe(true)
    expect(commandRecords.some((record) => record.packageName === 'oando-tech-docs')).toBe(true)
  }, 20000)
})
