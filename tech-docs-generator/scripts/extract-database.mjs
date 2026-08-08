import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

function collectMigrations(rootDir, repoRoot) {
  return readdirSync(rootDir, { withFileTypes: true })
    .flatMap((entry) => {
      const abs = path.join(rootDir, entry.name)
      if (entry.isDirectory()) return collectMigrations(abs, repoRoot)
      if (entry.name.endsWith('.sql')) {
        const relativePath = path.relative(repoRoot, abs).replace(/\\/g, '/')
        return [
          {
            path: relativePath,
            sourcePath: relativePath,
            sourceKind: 'migration',
            sourcePointer: 'file',
          },
        ]
      }
      return []
    })
    .sort((left, right) => left.path.localeCompare(right.path))
}

export function extractDatabaseRecords({ repoRoot = defaultRepoRoot } = {}) {
  const schemaDir = path.join(repoRoot, 'site', 'platform', 'drizzle', 'schema')
  const schemaFiles = readdirSync(schemaDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => path.join(schemaDir, entry.name))

  const tables = []
  for (const schemaPath of schemaFiles) {
    const schemaText = readFileSync(schemaPath, 'utf8')
    const relativeSchemaPath = path.relative(repoRoot, schemaPath).replace(/\\/g, '/')
    for (const match of schemaText.matchAll(/pgTable\(\s*['"]([^'"]+)['"]/g)) {
      const name = match[1]
      tables.push({
        name,
        sourcePath: relativeSchemaPath,
        sourceKind: 'drizzle-schema',
        sourcePointer: `pgTable('${name}')`,
      })
    }
  }

  tables.sort((left, right) => left.name.localeCompare(right.name))
  const migrationDir = path.join(repoRoot, 'site', 'platform', 'drizzle', 'migrations')

  return {
    schema: {
      sourcePath: path.relative(repoRoot, schemaDir).replace(/\\/g, '/'),
      sourceKind: 'drizzle-schema',
      sourcePointer: 'schema/*.ts pgTable declarations',
      tables,
    },
    migrations: collectMigrations(migrationDir, repoRoot),
    split: [
      {
        id: 'database.products-db',
        label: 'Products DB',
        envName: 'PRODUCTS_DATABASE_URL',
        modulePath: 'site/platform/drizzle/productsDb.ts',
        schemaPath: 'site/platform/drizzle/schema/catalog.ts',
      },
      {
        id: 'database.admin-planner-db',
        label: 'Admin / planner DB',
        envName: 'SUPABASE_AUTH_DATABASE_URL',
        modulePath: 'site/platform/drizzle/adminDb.ts',
        schemaPath: 'site/platform/drizzle/schema/planner.ts',
      },
    ].map((entry) => {
      const moduleExists = (() => {
        try {
          readFileSync(path.join(repoRoot, entry.modulePath))
          return true
        } catch {
          return false
        }
      })()
      return {
        ...entry,
        sourcePath: entry.modulePath,
        sourceKind: 'drizzle-schema',
        sourcePointer: entry.envName,
        configured: moduleExists,
      }
    }),
  }
}
