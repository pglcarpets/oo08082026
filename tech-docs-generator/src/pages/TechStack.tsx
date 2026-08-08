import { useState } from 'react'
import { ArrowSquareOut as ExternalLink } from "@phosphor-icons/react"
import { techStack, techCategories } from '../data/techStack'
import {
  adminModules,
  productSurfaces,
  stackRoleGaps,
} from '../data/productSurfaces'
import { databaseBoundaries, databasePersistenceRoutes } from '../data/databaseBoundaries'
import { activeBlockers } from '../data/activeBlockers'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { TableOfContents } from '../components/TableOfContents'

const categoryOrder = [
  'Runtime',
  'Dev tooling',
  'Docs package',
  'Workspace',
]

const orderedCategories = [
  ...categoryOrder.filter((category) => techCategories.includes(category)),
  ...techCategories.filter((category) => !categoryOrder.includes(category)),
]

const categoryDescriptions: Record<string, string> = {
  Runtime: 'Root package.json dependencies (product Next app under site/)',
  'Dev tooling': 'Root package.json devDependencies',
  'Docs package': 'tech-docs-generator package',
  Workspace: 'Root workspace / packageManager (pnpm 11)',
}

export function TechStack() {
  const [filter, setFilter] = useState<string | null>(null)

  const filtered = filter ? techStack.filter(t => t.category === filter) : techStack

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8 relative items-start">
      <div className="flex-1 min-w-0">
        <header className="mb-8">
          <h1 className="section-heading">Technology Stack</h1>
        <p className="section-subheading">
          Product surface map + package inventory. Dependencies are generated from
          root <code className="text-docs-text mx-1">package.json</code> and
          <code className="text-docs-text mx-1">pnpm-lock.yaml</code>
          (<code className="text-docs-text mx-1">pnpm run tech-docs:generate</code>).
        </p>
      </header>

      {/* Product inventory — hand-mapped live routes (not npm rows) */}
      <section id="product-surfaces" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Product surfaces</h2>
        <p className="text-sm text-docs-text-muted mb-4 max-w-3xl">
          Live app areas under <code className="text-docs-text">site/</code>. Re-check disk if routes move.
          Package list below is separate (lockfile inventory).
        </p>
        <div className="overflow-x-auto rounded-xl border border-docs-border mb-6">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Surface</th>
                <th className="px-4 py-3 font-medium">Routes</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Stack</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {productSurfaces.map((row) => (
                <tr key={row.surface} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 font-semibold text-docs-text-strong whitespace-nowrap">{row.surface}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600 break-all">{row.routes}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.code}</td>
                  <td className="px-4 py-3 text-docs-text-muted text-xs">{row.stack}</td>
                  <td className="px-4 py-3 text-docs-text-muted text-xs">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Admin console modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {adminModules.map((group) => (
            <div key={group.group} className="card">
              <h4 className="text-sm font-bold text-docs-text-strong mb-2">{group.group}</h4>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.href + item.label} className="text-sm">
                    <span className="font-medium text-docs-text-strong">{item.label}</span>
                    <span className="block font-mono text-xs text-brand-600 break-all">{item.href}</span>
                    <span className="block text-xs text-docs-text-muted">{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Stack roles (easy to miss)</h3>
        <div className="overflow-x-auto rounded-xl border border-docs-border mb-2">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Package / code</th>
                <th className="px-4 py-3 font-medium">Used by</th>
              </tr>
            </thead>
            <tbody>
              {stackRoleGaps.map((row) => (
                <tr key={row.role} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 font-medium text-docs-text-strong">{row.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.packageOrCode}</td>
                  <td className="px-4 py-3 text-xs text-docs-text-muted">{row.usedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="database-boundaries" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Database boundaries</h2>
        <p className="text-sm text-docs-text-muted mb-4 max-w-3xl">
          Two Supabase projects — Admin vs Products. Full schema:{' '}
          <a href="/database" className="text-brand-600 hover:underline font-mono text-xs">
            /database
          </a>{' '}
          in this docs app (not a product route on oando.co.in).
        </p>
        <div className="overflow-x-auto rounded-xl border border-docs-border mb-6">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Project ID</th>
                <th className="px-4 py-3 font-medium">URL env</th>
                <th className="px-4 py-3 font-medium">Server entry</th>
                <th className="px-4 py-3 font-medium">Migrations</th>
              </tr>
            </thead>
            <tbody>
              {databaseBoundaries.map((row) => (
                <tr key={row.projectId} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 text-docs-text-strong text-xs">{row.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600">{row.projectId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.urlEnv}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.serverEntry}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">{row.migrations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Persistence selectors (dev vs prod)</h3>
        <div className="overflow-x-auto rounded-xl border border-docs-border mb-2">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Dev (disk)</th>
                <th className="px-4 py-3 font-medium">Prod (Supabase)</th>
                <th className="px-4 py-3 font-medium">Selector</th>
              </tr>
            </thead>
            <tbody>
              {databasePersistenceRoutes.map((row) => (
                <tr key={row.domain} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 font-medium text-docs-text-strong">{row.domain}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">{row.dev}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">{row.prod}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.selector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="active-blockers" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Active blockers</h2>
        <p className="text-sm text-docs-text-muted mb-4 max-w-3xl">
          Source of truth: repo-root <code className="text-docs-text">Failures.md</code>. Remove rows only with verified fix + evidence.
        </p>
        {activeBlockers.length === 0 ? (
          <p className="text-sm text-success-400">No active blockers logged.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-docs-border">
            <table className="w-full text-left text-sm leading-relaxed">
              <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Blocker</th>
                  <th className="px-4 py-3 font-medium">Evidence</th>
                  <th className="px-4 py-3 font-medium">Owner action</th>
                </tr>
              </thead>
              <tbody>
                {activeBlockers.map((row) => (
                  <tr key={row.id} className="border-t border-docs-border/80 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-danger-400">{row.id}</td>
                    <td className="px-4 py-3 text-docs-text-strong">{row.blocker}</td>
                    <td className="px-4 py-3 text-docs-text-muted text-xs">{row.evidence}</td>
                    <td className="px-4 py-3 text-docs-text-muted text-xs">{row.ownerAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <h2 id="package-inventory" className="text-xl font-bold text-docs-text-strong mb-4 scroll-mt-4">
        Package inventory
      </h2>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filter ? 'bg-brand-500 text-white' : 'bg-docs-surface text-docs-text-muted hover:text-docs-text-strong border border-docs-border'
          }`}
        >
          All ({techStack.length})
        </button>
        {orderedCategories.map(cat => {
          const count = techStack.filter(t => t.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === cat ? 'bg-brand-500 text-docs-text-strong' : 'bg-docs-surface text-docs-text-muted hover:text-docs-text-strong border border-docs-border'
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Tech list grouped by category - Bento Box Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {(filter ? [filter] : orderedCategories).map((category, catIdx) => {
          const items = filtered.filter(t => t.category === category)
          if (items.length === 0) return null

          // Bento sizing: Runtime spans full width, others are boxed
          const isLargePanel = !filter && catIdx === 0
          
          return (
            <div key={category} className={`relative flex flex-col p-6 rounded-[2rem] bg-docs-surface/30 border border-docs-border/60 backdrop-blur-md transition-all ${isLargePanel ? 'lg:col-span-2 xl:col-span-3' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 id={category.toLowerCase().replace(/[^a-z]+/g, '-')} className="text-xl font-bold text-docs-text-strong mb-1">
                    {category}
                  </h2>
                  <span className="text-xs text-docs-text-subtle font-medium">{categoryDescriptions[category]}</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold">
                  {items.length}
                </div>
              </div>
              
              <div className={`grid grid-cols-1 ${isLargePanel ? 'md:grid-cols-2 xl:grid-cols-3 gap-4' : 'gap-3'} flex-1`}>
                {items.map(tech => (
                  <div key={tech.id ?? `${tech.name}-${tech.version}`} className="group relative bg-docs-surface/50 hover:bg-docs-surface-strong/50 border border-docs-border/50 hover:border-docs-border-hover/80 rounded-2xl p-4 transition-all duration-300">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${tech.color}`}>
                          {(tech.name.startsWith('@') ? tech.name.split('/')[1] ?? tech.name : tech.name).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-docs-text-strong text-sm font-mono break-all group-hover:text-docs-text-strong transition-colors">{tech.name}</h3>
                          <span className="text-xs text-brand-400/80 font-mono break-all">{tech.version}</span>
                        </div>
                      </div>
                      {tech.docs && (
                        <a
                          href={tech.docs}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Documentation for ${tech.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-docs-surface-strong/50 text-docs-text-muted hover:bg-brand-500 hover:text-docs-text-strong transition-all flex-shrink-0"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-docs-text-muted mb-3 leading-relaxed break-words">{tech.description}</p>
                    <div className="mt-auto">
                      <span className="inline-block max-w-full px-2.5 py-1 rounded-md bg-docs-surface-strong/40 border border-docs-border-hover/30 text-[0.6875rem] text-docs-text-muted font-medium break-words whitespace-normal">
                        {tech.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* How the inventory is produced (chrome only — package rows stay generated) */}
      <div className="mt-12">
        <CollapsibleSection title="How this list is generated" badge="Source">
          <div className="space-y-3 text-sm text-docs-text-muted">
            <p>
              Dependency facts are extracted from package manifests and the lockfile, then normalized into
              <code className="text-docs-text mx-1">generated-documents/data/dependencies.json</code>.
              This page only groups and styles those rows.
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-docs-text-subtle">
              <li><span className="text-docs-text">Runtime:</span> root <code className="text-docs-text">dependencies</code> (product Next app under <code className="text-docs-text">site/</code>)</li>
              <li><span className="text-docs-text">Dev tooling:</span> root <code className="text-docs-text">devDependencies</code></li>
              <li><span className="text-docs-text">Docs package:</span> <code className="text-docs-text">tech-docs-generator</code> package deps</li>
              <li><span className="text-docs-text">Version:</span> lockfile resolved version; description shows the requested range from the manifest</li>
              <li><span className="text-docs-text">Regenerate:</span> <code className="text-docs-text">pnpm run tech-docs:generate</code> (or tech-docs build)</li>
            </ul>
          </div>
          </CollapsibleSection>
        </div>
      </div>
      
      {/* Table of Contents */}
      <TableOfContents />
    </div>
  )
}
