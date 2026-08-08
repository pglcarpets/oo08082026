/**
 * Display label for generated dependency facts.
 * Keep the real package id (including scope) — stripping @scope made many rows
 * read as the same name (e.g. @gsap/react and @phosphor-icons/react → "React").
 */
export function humanizePackageName(packageName) {
  if (typeof packageName !== 'string' || packageName.length === 0) return packageName
  return packageName
}

export function dependencyFactId(record, field) {
  return `${record.importer}:${record.section}:${record.packageName}.${field}`
}

export function normalizeDependencyRecords(records) {
  return records
    .flatMap((record) => [
      {
        id: dependencyFactId(record, 'requested-range'),
        domain: 'dependencies',
        field: 'requestedRange',
        label: `${record.displayName} requested range`,
        fact: record.requested,
      },
      {
        id: dependencyFactId(record, 'resolved-version'),
        domain: 'dependencies',
        field: 'resolvedVersion',
        label: `${record.displayName} resolved version`,
        fact: record.resolved,
      },
    ])
    .sort((left, right) => {
      if (left.id !== right.id) return left.id.localeCompare(right.id)
      if (left.field !== right.field) return left.field.localeCompare(right.field)
      return left.fact.sourcePath.localeCompare(right.fact.sourcePath)
    })
}
