import type { TechItem } from '../types'
import { snapshotDependencies, type DependencyRecord } from './snapshot'

type CollapsedDependency = {
  id: string
  importer: string
  section: string
  packageName: string
  requested?: DependencyRecord
  resolved?: DependencyRecord
}

type ResolvedDependency = CollapsedDependency & { resolved: DependencyRecord }

const dependencies = snapshotDependencies

type TechCategory = 'Runtime' | 'Dev tooling' | 'Docs package' | 'Workspace'

/**
 * Fact id shape from normalize/extract:
 * `{importer}:{dependencies|devDependencies}:{packageName}.{requested-range|resolved-version}`
 * Package names may include `@scope/` — use greedy match after the section.
 */
function parseDependencyId(id: string) {
  const match = id.match(/^(.*?):(dependencies|devDependencies):(.+)\.(requested-range|resolved-version)$/)
  if (!match) return null

  return {
    importer: match[1],
    section: match[2],
    packageName: match[3],
  }
}

function categoryFor(record: CollapsedDependency): TechCategory {
  // Product package is root importer "." (site/ has no package.json).
  if (record.importer === '.') {
    return record.section === 'dependencies' ? 'Runtime' : 'Dev tooling'
  }
  if (record.importer === 'tech-docs-generator') {
    return 'Docs package'
  }
  return 'Workspace'
}

function importerLabel(importer: string) {
  return importer === '.' ? 'root' : importer
}

/** Chrome only — category tile colors; rows stay source-backed. */
const categoryColors: Record<TechCategory, string> = {
  Runtime: 'bg-brand-500 text-inverse',
  'Dev tooling': 'bg-docs-surface-strong text-docs-text-strong',
  'Docs package': 'bg-accent-500/80 text-docs-text-strong',
  Workspace: 'bg-docs-surface text-docs-text-strong',
}

const collapsedDependencies = [...dependencies].reduce<Map<string, CollapsedDependency>>((map, record) => {
  const parsed = parseDependencyId(record.id)
  if (!parsed) return map

  const baseId = `${parsed.importer}:${parsed.section}:${parsed.packageName}`
  const existing = map.get(baseId) ?? {
    id: baseId,
    importer: parsed.importer,
    section: parsed.section,
    packageName: parsed.packageName,
  }

  if (record.field === 'requestedRange') {
    existing.requested = record
  } else {
    existing.resolved = record
  }

  map.set(baseId, existing)
  return map
}, new Map())

/**
 * Inventory UI only — every name/version/range comes from dependencies.json
 * (package.json + pnpm-lock). No hand-curated package catalog.
 */
export const techStack: TechItem[] = [...collapsedDependencies.values()]
  .filter((record): record is ResolvedDependency => Boolean(record.resolved))
  .map((record) => {
    const category = categoryFor(record)
    const where = importerLabel(record.importer)
    const requested = record.requested?.fact.value

    return {
      id: record.id,
      // Real package id (e.g. @gsap/react) — not humanize that collapses scopes to "React"
      name: record.packageName,
      version: record.resolved.fact.value,
      category,
      description: requested
        ? `Requested ${requested} · resolved from ${record.resolved.fact.sourcePath}`
        : `Resolved from ${record.resolved.fact.sourcePath}`,
      role: `${where} · ${record.section}`,
      color: categoryColors[category],
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export const techCategories = [...new Set(techStack.map((item) => item.category))]
