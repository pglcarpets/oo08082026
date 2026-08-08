import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedKeyValueTable, GeneratedSimpleTable } from '../components/GeneratedDataTables'
import { keyValueRowsFromDomain, LiveRepoSection } from '../components/LiveRepoSection'
import { authFeatureRecords } from '../data/featuresData'
import { securityRecords } from '../data/securityData'
import { Shield, Lock, Key, Eye, Warning as AlertTriangle, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react"

const securityLayers = [
  {
    icon: Lock,
    name: 'Authentication',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    points: [
      'Supabase Auth residual (session helpers under site/lib/auth + platform/supabase)',
      'Cookie-oriented sessions — not localStorage bearer tokens for product gates',
      'DEV_AUTH_BYPASS=1 only via pnpm run dev (non-prod) for local admin/P0 work',
      'Fork Studio/Planner APIs allow guest role with handler-level auth',
    ],
  },
  {
    icon: Shield,
    name: 'Edge proxy + headers',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    points: [
      'Next 16 entry: site/proxy.ts (not middleware.ts)',
      'CSP + X-Frame-Options and related security headers on responses',
      'Protected page prefixes bounce unauthenticated traffic (/admin, /crm, /ops)',
      'Member-only write APIs rejected early; maintenance mode can 503 writes',
    ],
  },
  {
    icon: Key,
    name: 'CSRF + API withAuth',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    points: [
      'CSRF helpers: site/lib/security/csrf.ts',
      'Bootstrap route: GET /api/csrf (site/app/api/csrf/route.ts)',
      'withAuth({ requireCsrf }) on mutating handlers (features/shared/api/withAuth.ts)',
      'Fork writes: withAuth({ role: "guest", requireCsrf }) + rate limits',
    ],
  },
  {
    icon: Eye,
    name: 'Secrets + validation',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    points: [
      'Secrets only in .env.local / deploy secrets — never committed',
      'server-only modules for privileged server code',
      'NEXT_PUBLIC_* for client-safe vars only',
      'Zod + shared API error patterns on residual routes',
    ],
  },
  {
    icon: RefreshCw,
    name: 'Rate limiting',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    points: [
      'site/lib/rateLimit.ts (server-only) used by API handlers',
      'In-memory map with optional DB upsert path for rate_limits',
      'Per-key limits (IP / route scopes) — re-read callers for exact quotas',
      'Does not replace edge origin checks or CSRF',
    ],
  },
  {
    icon: AlertTriangle,
    name: 'Auditing scripts',
    color: 'text-danger-400',
    bg: 'bg-danger-500/10',
    points: [
      'pnpm run lint:secrets / scan:secrets',
      'pnpm run db:advisors:security (Supabase advisors)',
      'pnpm run audit:supabase:admin (when wired)',
      'test:priority-8 covers proxy / CSRF / withAuth unit surface',
    ],
  },
]

export function Security() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Security Practices</h1>
        <p className="section-subheading">
          Live product security surface: <code className="text-brand-400">site/proxy.ts</code>,{' '}
          <code className="text-brand-400">withAuth</code> + CSRF, rate limits, secrets hygiene, residual RLS.
          Product UI proof is always <code className="text-brand-400">http://localhost:3000</code>.
        </p>
      </header>

      {authFeatureRecords.length > 0 ? (
        <LiveRepoSection title="Auth roles (generated)">
          <GeneratedSimpleTable
            columns={[
              { key: 'title', header: 'Fact' },
              { key: 'summary', header: 'Summary' },
              { key: 'sourcePath', header: 'Source' },
            ]}
            rows={authFeatureRecords.map((record) => ({
              title: record.title,
              summary: record.summary,
              sourcePath: record.sourcePath,
            }))}
          />
        </LiveRepoSection>
      ) : null}

      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Security Layers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {securityLayers.map(layer => {
            const Icon = layer.icon
            return (
              <div key={layer.name} className="card">
                <div className={`p-2.5 rounded-xl ${layer.bg} inline-flex mb-3`}>
                  <Icon size={20} className={layer.color} />
                </div>
                <h3 className="font-semibold text-docs-text-strong text-base mb-2">{layer.name}</h3>
                <ul className="space-y-2">
                  {layer.points.map(p => (
                    <li key={p} className="text-sm text-docs-text-muted leading-relaxed flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${layer.color.replace('text', 'bg')} mt-2 flex-shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-12">
        <CollapsibleSection title="Edge proxy (site/proxy.ts)" badge="Next 16">
          <p className="text-base text-docs-text-muted mb-3 leading-relaxed">
            Next 16 uses <code className="text-brand-400">export async function proxy</code> in{' '}
            <code className="text-brand-400">site/proxy.ts</code> — not <code className="text-brand-400">middleware.ts</code>.
            It attaches CSP/security headers, protects admin-ish page prefixes, blocks member-only writes when unauthenticated,
            and respects maintenance read-only mode.
          </p>
          <CodeBlock
            title="site/proxy.ts (roles — pattern)"
            language="typescript"
            code={`// Next 16 edge entry — site/proxy.ts
export async function proxy(request: NextRequest) {
  // - build Content-Security-Policy (eval allowed on canvas/dev paths)
  // - set X-Frame-Options, etc.
  // - bounce /admin, /crm, /ops without session (DEV_AUTH_BYPASS in non-prod)
  // - 503 mutating methods under maintenance on known API prefixes
  // - early reject member-only write APIs without auth
  // Fork /api/Planner + /api/Studio: handler withAuth(guest + CSRF) + rateLimit
}

export const config = { matcher: [/* product + api surfaces */] }`}
          />
        </CollapsibleSection>
      </section>

      <section className="mb-12">
        <CollapsibleSection title="CSRF + withAuth" badge="API" defaultOpen={false}>
          <p className="text-base text-docs-text-muted mb-3 leading-relaxed">
            Browser mutations bootstrap a token from <code className="text-brand-400">/api/csrf</code>.
            Handlers wrap with <code className="text-brand-400">withAuth</code> and{' '}
            <code className="text-brand-400">requireCsrf</code> when needed.
          </p>
          <CodeBlock
            title="features/shared/api/withAuth.ts (pattern)"
            language="typescript"
            code={`import { withAuth } from '@/features/shared/api/withAuth'

// Member residual writes
export const POST = withAuth(
  async (req, auth) => { /* … */ },
  { role: 'member', requireCsrf: true },
)

// Fork disk APIs (Studio / Planner) — guest OK, CSRF still required on mutates
export const PUT = withAuth(
  async (req, auth) => { /* … */ },
  { role: 'guest', requireCsrf: true },
)`}
          />
        </CollapsibleSection>
      </section>

      <section className="mb-12">
        <CollapsibleSection title="Supabase server clients" badge="platform" defaultOpen={false}>
          <p className="text-base text-docs-text-muted mb-3 leading-relaxed">
            Live clients live under <code className="text-brand-400">site/platform/supabase/</code>
            (<code className="text-brand-400">server.ts</code>, <code className="text-brand-400">supabaseAdmin.ts</code>),
            not a root <code className="text-brand-400">lib/supabase/server.ts</code> path.
            Prefer <code className="text-brand-400">server-only</code> on privileged modules.
          </p>
          <CodeBlock
            title="site/platform/supabase (conceptual)"
            language="typescript"
            code={`// Anon / cookie server client + separate admin (service role) client
// Service role must never ship to the browser bundle.
// Residual tables use RLS policies in site/platform/supabase/migrations/*.sql
// Fork Studio/Planner product data is largely disk under site/data/storage/`}
          />
        </CollapsibleSection>
      </section>

      <section className="mb-12">
        <CollapsibleSection title="Rate limiting" badge="site/lib/rateLimit.ts" defaultOpen={false}>
          <CodeBlock
            title="site/lib/rateLimit.ts (pattern)"
            language="typescript"
            code={`import 'server-only'
// In-memory Map + optional Supabase rate_limits upsert
export async function rateLimit(
  key: string,
  opts: { intervalMs: number; maxRequests: number },
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  // … see live file for eviction + DB path
}

// Typical handler usage:
// const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
// const { success } = await rateLimit(\`route:\${ip}\`, { intervalMs: 60_000, maxRequests: 30 })
// if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })`}
          />
        </CollapsibleSection>
      </section>

      <section className="mb-12">
        <CollapsibleSection title="Secret scanning" badge="pnpm" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-base text-docs-text-muted leading-relaxed">
              Root scripts: <code className="text-brand-400">pnpm run lint:secrets</code> (secretlint) and{' '}
              <code className="text-brand-400">pnpm run scan:secrets</code>. Fast gate wires{' '}
              <code className="text-brand-400">scan:secrets</code>. There is no committed{' '}
              <code className="text-brand-400">.husky/pre-commit</code> in this checkout — do not claim husky hooks without checking disk.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="card">
                <h4 className="text-base font-semibold text-docs-text-strong mb-1">Local / gate</h4>
                <p className="text-sm text-docs-text-muted leading-relaxed">
                  <code className="text-brand-400">pnpm run lint:secrets</code> ·{' '}
                  <code className="text-brand-400">pnpm run scan:secrets</code> ·{' '}
                  <code className="text-brand-400">pnpm run gate</code>
                </p>
              </div>
              <div className="card">
                <h4 className="text-base font-semibold text-docs-text-strong mb-1">Env policy</h4>
                <p className="text-sm text-docs-text-muted leading-relaxed">
                  Secrets only in <code className="text-brand-400">.env.local</code> (and deploy secrets). Track{' '}
                  <code className="text-brand-400">.env.example</code> only.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </section>

      <section className="mb-12">
        <div className="card border-brand-200 bg-brand-50/60">
          <h3 className="text-base font-semibold text-brand-700 mb-3">Security checklist (honest)</h3>
          <p className="text-sm text-docs-text-muted mb-3 leading-relaxed">
            These are design targets / wired surfaces — not a claim that every table or route is proven green in production.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              'site/proxy.ts sets CSP + security headers',
              'Protected pages gated at edge (/admin, /crm, /ops)',
              'Mutating APIs: withAuth + requireCsrf where configured',
              'CSRF bootstrap at /api/csrf',
              'Rate limits via site/lib/rateLimit.ts on write paths',
              'Service role / admin clients stay server-only',
              'Secrets out of git; lint:secrets + scan:secrets available',
              'DEV_AUTH_BYPASS non-prod only (pnpm run dev)',
              'Residual RLS policies in Supabase migrations (verify table-by-table)',
              'Unit coverage: proxy, csrf, withAuth, rateLimit, devAuthBypass',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-docs-text leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveRepoSection title="Live security scripts + server-only files">
        <GeneratedKeyValueTable rows={keyValueRowsFromDomain(securityRecords)} />
      </LiveRepoSection>
    </div>
  )
}
