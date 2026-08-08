import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedApiTable } from '../components/GeneratedDataTables'
import { LiveRepoSection } from '../components/LiveRepoSection'
import { apiRoutes as generatedApiRoutes } from '../data/apiData'
import { Globe, Lock, Database, Lightning as Zap } from '@phosphor-icons/react'

const patterns = [
  {
    icon: Lock,
    title: 'withAuth first',
    desc: 'Protected handlers wrap withAuth({ role: admin | member | guest }). Admin is app_metadata only; guest allows anonymous.',
  },
  {
    icon: Database,
    title: 'Zod validation',
    desc: 'Request bodies and query params validated with Zod before DB or disk work where handlers adopt the pattern.',
  },
  {
    icon: Zap,
    title: 'CSRF on mutates',
    desc: 'Browser mutations use requireCsrf with double-submit bootstrap from GET /api/csrf.',
  },
  {
    icon: Globe,
    title: 'Typed envelopes',
    desc: 'Shared ApiError / response helpers under features/shared/api for residual routes.',
  },
]

const roleCounts = generatedApiRoutes.reduce<Record<string, number>>((acc, route) => {
  const key = route.authRole ?? '(no withAuth role parsed)'
  acc[key] = (acc[key] ?? 0) + 1
  return acc
}, {})

export function ApiDesign() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">API Design</h1>
        <p className="section-subheading">
          Auto-generated from <code className="text-docs-text">site/app/api/**/route.ts</code>, including
          parsed <code className="text-docs-text">withAuth</code> roles where present.
        </p>
      </header>

      <section id="patterns" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Design patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patterns.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="card flex items-start gap-3">
                <div className="p-2 rounded-lg bg-docs-surface-strong/50 flex-shrink-0">
                  <Icon size={16} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-docs-text-strong mb-1">{p.title}</h3>
                  <p className="text-xs text-docs-text-subtle leading-relaxed">{p.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="auth-roles" className="mb-8 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-3">Auth role coverage</h2>
        <p className="text-sm text-docs-text-muted mb-3">
          Counts of methods under <code className="text-docs-text">site/app/api</code> where extractors found a withAuth role.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([role, count]) => (
              <span
                key={role}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-docs-surface border border-docs-border text-xs font-medium text-docs-text-muted"
              >
                <span className="font-mono text-docs-text-strong">{role}</span>
                <span className="text-brand-400">{count}</span>
              </span>
            ))}
        </div>
      </section>

      <LiveRepoSection title="Live API routes">
        <GeneratedApiTable
          routes={generatedApiRoutes.map((route) => ({
            method: route.method,
            path: route.path,
            authRole: route.authRole,
            sourcePath: route.sourcePath,
            sourcePointer: route.sourcePointer,
          }))}
        />
      </LiveRepoSection>

      <section className="mb-12">
        <CollapsibleSection title="withAuth pattern" badge="API">
          <CodeBlock
            title="features/shared/api/withAuth.ts (pattern)"
            language="typescript"
            code={`import { withAuth } from '@/features/shared/api/withAuth'

// Admin residual
export const GET = withAuth(
  async (req, auth) => { /* … */ },
  { role: 'admin', rateLimitScope: 'admin:example' },
)

// Authenticated member
export const POST = withAuth(
  async (req, auth) => { /* … */ },
  { role: 'member', requireCsrf: true, rateLimitScope: 'plans:write' },
)

// Fork disk APIs — guest OK, CSRF on mutates
export const PUT = withAuth(
  async (req, auth) => { /* … */ },
  { role: 'guest', requireCsrf: true, rateLimitScope: 'studio:write' },
)`}
          />
        </CollapsibleSection>
      </section>
    </div>
  )
}
