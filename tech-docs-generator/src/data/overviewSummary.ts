import summaryJson from '../../../generated-documents/data/summary.json'

type OverviewSummary = {
  stats: Array<{ label: string; value: string }>
  keyPackages: Array<{ name: string; version: string; packageName: string }>
}

const summary = summaryJson as OverviewSummary

export const overviewStats = summary.stats

const packageTags: Record<string, string> = {
  next: 'Framework',
  react: 'UI',
  typescript: 'Language',
  fabric: '2D Canvas',
  three: '3D',
  'drizzle-orm': 'DB',
  zustand: 'State',
  tailwindcss: 'CSS residual',
  vitest: 'Testing',
}

const packageColors: Record<string, string> = {
  next: 'bg-docs-surface-strong text-docs-text',
  react: 'bg-brand-500/10 text-brand-400',
  typescript: 'bg-brand-500/10 text-brand-400',
  fabric: 'bg-accent-500/10 text-accent-400',
  three: 'bg-docs-surface text-docs-text',
  'drizzle-orm': 'bg-warning-500/10 text-warning-400',
  zustand: 'bg-warning-500/10 text-warning-400',
  tailwindcss: 'bg-brand-500/10 text-brand-400',
  vitest: 'bg-warning-500/10 text-warning-400',
}

export const overviewKeyTech = summary.keyPackages.map((pkg) => ({
  name: `${pkg.name} ${pkg.version}`,
  tag: packageTags[pkg.packageName] ?? pkg.packageName,
  color: packageColors[pkg.packageName] ?? 'bg-docs-surface-strong text-docs-text',
}))
