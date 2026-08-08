import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedKeyValueTable } from '../components/GeneratedDataTables'
import { keyValueRowsFromDomain, LiveRepoSection } from '../components/LiveRepoSection'
import { codeOrganizationRecords } from '../data/codeOrganizationData'
import { Folder, FileCode, Gear as Settings, TestTube, Database } from "@phosphor-icons/react";function getTopDirs() {
  return [
    { name: 'site/', desc: 'Next.js product app (app, components, features, lib, focss, platform, i18n, data/storage)', icon: FileCode, color: 'text-brand-400' },
    { name: 'site/app/', desc: 'App Router routes: (site), admin, oostudio, ooplanner, api/*', icon: FileCode, color: 'text-brand-400' },
    { name: 'site/components/', desc: 'UI trees: Studio, Planner, site marketing, admin ui/*', icon: Folder, color: 'text-accent-400' },
    { name: 'site/features/', desc: 'Feature modules: Studio, Planner, site, admin, crm, ops, shared', icon: Folder, color: 'text-accent-400' },
    { name: 'site/lib/', desc: 'Cross-cutting utils: auth, catalog, security, Planner/Studio forks — not Supabase clients', icon: Folder, color: 'text-success-400' },
    { name: 'site/platform/', desc: 'Platform integrations: supabase/ (server + admin clients), drizzle, types', icon: Settings, color: 'text-brand-400' },
    { name: 'site/focss/', desc: 'FOCSS product CSS home (@focss/* tokens and composers)', icon: FileCode, color: 'text-warning-400' },
    { name: 'config/build/', desc: 'Build/test harness: tsconfig, next.config, postcss, Playwright, vitest reporter', icon: Settings, color: 'text-pink-400' },
    { name: 'tests/', desc: 'Vitest unit tests + Playwright E2E specs (repo root)', icon: TestTube, color: 'text-yellow-400' },
    { name: 'scripts/', desc: 'Root operational scripts: seed, migrations, CDN, audits, docs gates', icon: FileCode, color: 'text-warning-400' },
    { name: 'tech-docs-generator/', desc: 'Optional Vite inventory SPA (dev :3001)', icon: Folder, color: 'text-docs-text-muted' },
    { name: 'site/data/storage/', desc: 'Disk store for Studio/Planner projects and catalogs', icon: Database, color: 'text-danger-400' },
  ]
}

function getPlannerStructure() {
  return `site/ (Planner fork — illustrative)
├── app/ooplanner/           # Planner App Router entry
├── components/Planner/      # Dock shell, canvas chrome, UI
├── features/Planner/        # Feature modules for Planner
├── lib/Planner/             # Planner domain helpers / handoff
└── data/storage/            # Disk-backed projects (not lib/supabase)

Related residual:
├── platform/supabase/       # Auth + residual DB clients (shared)
└── focss/                   # Planner/product CSS via FOCSS`
}

function getLibStructure() {
  return `site/lib/                    # Cross-cutting product libs
├── auth/                    # Auth helpers (uses platform/supabase)
├── catalog/                 # Catalog / plan-symbol contracts
├── security/                # CSRF + sanitize helpers
├── Planner/ · Studio/       # Fork domain code
├── store/                   # Shared Zustand stores
├── analytics/ · tracking/   # Analytics residual
├── rateLimit.ts             # Rate limiting (server-only)
└── …                        # hooks, types, theme, etc.

site/platform/supabase/      # Live Supabase clients (NOT site/lib/supabase)
├── server.ts                # createServerClient / createClient
├── client.ts · supabaseAdmin.ts · adminServer.ts
└── migrations/ · types`
}

function getConventions() {
  return [
    {
      title: 'Path Aliases',
      desc: 'site/tsconfig (+ config/build) path aliases. Common: @/lib/*, @/features/*, @/components/*, @/platform/*, @focss/* — resolved under site/.',
    },
    {
      title: 'Server-Only Code',
      desc: 'Use `import "server-only"` in privileged modules. Supabase clients live under site/platform/supabase/ (admin service role never ships to browser).',
    },
    {
      title: 'Feature Colocation',
      desc: 'Fork Studio/Planner keep components + lib trees separate (no cross-imports). Marketing residual uses site/features/site + site/components/*.',
    },
    {
      title: 'No Hex in Components',
      desc: 'Product CSS home is FOCSS (site/focss/). Prefer CSS variables / FOCSS classes; Tailwind is residual token-layer only — never raw hex.',
    },
    {
      title: 'TypeScript Strict',
      desc: 'Strict mode enabled. No handwritten any. TypeScript 7.x (root dep ^7.0.2). Lint primary: oxlint (pnpm run lint).',
    },
    {
      title: 'Install boundary',
      desc: 'pnpm from repo root only. Product deps on root package.json — there is no nested site/package.json for product installs.',
    },
  ]
}

export function CodeOrganization() {
  const topDirs = getTopDirs()
  const conventions = getConventions()

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Code Organization</h1>
        <p className="section-subheading">
          How the codebase is structured — directory layout, module conventions, and import patterns.
        </p>
      </header>

      {/* Top-level dirs */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Top-Level Directories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topDirs.map(dir => {
            const Icon = dir.icon
            return (
              <div key={dir.name} className="card flex items-start gap-3">
                <div className="p-2 rounded-lg bg-docs-surface-strong/50 flex-shrink-0">
                  <Icon size={16} className={dir.color} />
                </div>
                <div>
                  <code className="text-sm font-mono text-brand-400 font-semibold">{dir.name}</code>
                  <p className="text-xs text-docs-text-subtle mt-1">{dir.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Planner structure */}
      <section className="mb-12">
        <CollapsibleSection title="Planner fork layout" badge="site/">
          <CodeBlock
            title="Planner module tree (illustrative)"
            language="bash"
            code={getPlannerStructure()}
          />
        </CollapsibleSection>
      </section>

      {/* Lib structure */}
      <section className="mb-12">
        <CollapsibleSection title="site/lib + platform/supabase" badge="Shared Code">
          <CodeBlock
            title="Shared library tree"
            language="bash"
            code={getLibStructure()}
          />
        </CollapsibleSection>
      </section>

      {/* Config structure */}
      <section className="mb-12">
        <CollapsibleSection title="config/ Structure" badge="Build Config" defaultOpen={false}>
          <CodeBlock
            title="Config tree"
            language="bash"
            code={`config/
├── build/                   # Build / test harness (live)
│   ├── tsconfig.json
│   ├── next.config.js       # base Next config (merged by site/)
│   ├── postcss.config.mjs
│   ├── playwright.config.ts
│   ├── playwrightBaseURL.cjs
│   ├── playwright-gate-specs.json
│   ├── playwright-open3d-world-specs.json
│   └── vitest-console-reporter.ts
├── database/                # migrations / types (verify disk)
└── …`}
          />
        </CollapsibleSection>
      </section>

      {/* Conventions */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Conventions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {conventions.map(c => (
            <div key={c.title} className="card">
              <h3 className="text-sm font-semibold text-docs-text-strong mb-1">{c.title}</h3>
              <p className="text-xs text-docs-text-subtle leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Import pattern */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Import Pattern</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Illustrative residual auth pattern. Live Planner product paths are under{' '}
          <code className="text-brand-400">site/app/ooplanner</code>; Supabase clients are under{' '}
          <code className="text-brand-400">@/platform/supabase/*</code>. Edge entry is{' '}
          <code className="text-brand-400">site/proxy.ts</code> (not middleware.ts).
        </p>
        <CodeBlock
          title="site/app/… residual auth pattern"
          language="tsx"
          code={`import { createClient } from '@/platform/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // site/proxy.ts may bounce some prefixes; handlers still re-check
    return null
  }

  return <div>…</div>
}`}
        />
      </section>

      <LiveRepoSection title="Live module inventory">
        <GeneratedKeyValueTable rows={keyValueRowsFromDomain(codeOrganizationRecords)} />
      </LiveRepoSection>
    </div>
  )
}
