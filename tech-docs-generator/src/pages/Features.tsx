import { GeneratedSimpleTable } from '../components/GeneratedDataTables'
import { LiveRepoSection } from '../components/LiveRepoSection'
import {
  authFeatureRecords,
  otherFeatureRecords,
  productSurfaceRecords,
} from '../data/featuresData'
import {
  PenNib as PenTool,
  ShoppingBag,
  Users,
  Gear as Settings,
  Cube as Box,
  Globe,
  Wrench,
  Shield,
  type Icon,
} from '@phosphor-icons/react'

const surfaceIcons: Record<string, Icon> = {
  admin: Settings,
  planner: PenTool,
  studio: Box,
  catalog: ShoppingBag,
  crm: Users,
  ops: Wrench,
  'site-marketing': Globe,
}

function iconForSlug(slug: string): Icon {
  return surfaceIcons[slug] ?? Box
}

export function Features() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Features</h1>
        <p className="section-subheading">
          Auto-generated product surfaces and auth roles from the live app tree and
          <code className="text-docs-text mx-1">withAuth</code> / roles helpers. Re-run{' '}
          <code className="text-docs-text">pnpm run tech-docs:generate</code> after route or auth changes.
        </p>
      </header>

      <section id="product-surfaces" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Product surfaces</h2>
        {productSurfaceRecords.length === 0 ? (
          <p className="text-sm text-docs-text-muted">No product surfaces found — regenerate tech-docs data.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productSurfaceRecords.map((surface) => {
              const Icon = iconForSlug(surface.slug)
              return (
                <article key={surface.slug} id={surface.slug} className="card scroll-mt-4">
                  <div className="p-2.5 rounded-xl bg-brand-500/10 inline-flex mb-3">
                    <Icon size={20} className="text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-docs-text-strong text-sm mb-1">{surface.title}</h3>
                  <p className="text-xs text-docs-text-subtle mb-2">{surface.tagline}</p>
                  <p className="text-xs text-docs-text-muted leading-relaxed mb-2">{surface.summary}</p>
                  <code className="text-xs text-docs-text-subtle font-mono break-all block">{surface.sourcePath}</code>
                  {surface.tryPath ? (
                    <p className="text-xs text-brand-400 font-mono mt-2">{surface.tryPath}</p>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section id="auth-roles" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10">
            <Shield size={20} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-docs-text-strong">Auth roles</h2>
            <p className="text-xs text-docs-text-subtle">
              From <code className="text-docs-text">AuthRole</code>, <code className="text-docs-text">roles.ts</code>, session gates, and withAuth scans
            </p>
          </div>
        </div>
        {authFeatureRecords.length === 0 ? (
          <p className="text-sm text-docs-text-muted">No auth role facts yet — regenerate tech-docs data.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {authFeatureRecords.map((record) => (
              <article key={record.slug} className="card">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-docs-text-strong text-sm">{record.title}</h3>
                  {record.kind ? (
                    <span className="text-[0.6875rem] px-2 py-0.5 rounded-md bg-docs-surface-strong/50 text-docs-text-muted font-medium shrink-0">
                      {record.kind}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-docs-text-subtle mb-2">{record.tagline}</p>
                <p className="text-xs text-docs-text-muted leading-relaxed mb-2">{record.summary}</p>
                <code className="text-xs text-docs-text-subtle font-mono break-all">{record.sourcePath}</code>
              </article>
            ))}
          </div>
        )}
      </section>

      {otherFeatureRecords.length > 0 ? (
        <LiveRepoSection title="Other generated feature facts">
          <GeneratedSimpleTable
            columns={[
              { key: 'slug', header: 'Slug' },
              { key: 'title', header: 'Title' },
              { key: 'sourcePath', header: 'Source' },
            ]}
            rows={otherFeatureRecords.map((feature) => ({
              slug: feature.slug,
              title: feature.title,
              sourcePath: feature.sourcePath,
            }))}
          />
        </LiveRepoSection>
      ) : null}

      <LiveRepoSection title="All feature facts (raw)">
        <GeneratedSimpleTable
          columns={[
            { key: 'kind', header: 'Kind' },
            { key: 'slug', header: 'Slug' },
            { key: 'title', header: 'Title' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={[...productSurfaceRecords, ...authFeatureRecords, ...otherFeatureRecords].map((feature) => ({
            kind: feature.kind ?? '—',
            slug: feature.slug,
            title: feature.title,
            sourcePath: feature.sourcePath,
          }))}
        />
      </LiveRepoSection>
    </div>
  )
}
