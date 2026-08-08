import type { ReactNode } from 'react'
import type { RouteDomainRecord } from '../data/routeDomainTypes'

type LiveRepoSectionProps = {
  title?: string
  children: ReactNode
}

export function LiveRepoSection({
  title = 'Live repo facts',
  children,
}: LiveRepoSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-docs-text-strong mb-3">{title}</h2>
      <p className="text-sm text-docs-text-muted mb-4">
        Extracted from the repo on last sync. Re-run{' '}
        <code className="text-brand-400">pnpm run tech-docs:generate</code> after site changes.
      </p>
      {children}
    </section>
  )
}

export function keyValueRowsFromDomain(records: RouteDomainRecord[]) {
  return records.map((record) => ({
    label: record.label,
    value: record.value,
    sourcePath: record.sourcePath,
    sourcePointer: record.sourcePointer,
  }))
}
