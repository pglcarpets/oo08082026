import { MermaidDiagram } from '../components/MermaidDiagram'
import { GeneratedKeyValueTable, GeneratedSimpleTable } from '../components/GeneratedDataTables'
import { keyValueRowsFromDomain, LiveRepoSection } from '../components/LiveRepoSection'
import { architectureDocuments } from '../data/architectureDocsData'
import {
  architectureFeatureModules,
  architectureRoutes,
  architectureStats,
  architectureTopLevelDirs,
} from '../data/architectureData'

const highLevelDiagram = `flowchart TB
  Browser["Browser"]
  Routes["Next.js App Router"]
  PublicSite["Public site"]
  Planner["Planner"]
  Admin["Admin"]
  APIs["Route handlers"]
  Products[("Products database")]
  AdminDb[("Admin database")]
  SvgDisk["Published SVG files"]
  R2["Cloudflare R2 target"]

  Browser --> Routes
  Routes --> PublicSite
  Routes --> Planner
  Routes --> Admin
  PublicSite --> APIs
  Planner --> APIs
  Admin --> APIs
  APIs --> Products
  APIs --> AdminDb
  APIs --> SvgDisk
  APIs -. immutable artifact target .-> R2`

const plannerDataFlow = `flowchart LR
  User["Draw, place, select"]
  Command["Planner command"]
  History["Project and history"]
  Fabric["Fabric 2D stage"]
  Three["Three.js 3D view"]
  Save["Local or cloud autosave"]
  Catalog["Published catalog APIs"]
  Placement["Placement action"]

  User --> Command
  Command --> History
  History --> Fabric
  History --> Three
  History --> Save
  Catalog --> Placement
  Placement --> Command`

const authFlow = `flowchart TB
  Guest["Guest visitor"] --> GuestPlanner["Public guest Planner"]
  Member["Signed-in member"] --> Proxy["Session validation"]
  AdminUser["Admin user"] --> Proxy
  Proxy --> ProtectedPage["Protected page"]
  Mutation["Browser mutation"] --> Bootstrap["CSRF bootstrap"]
  Bootstrap --> Header["Cookie and request header"]
  Header --> WithAuth["Auth, CSRF, and rate limit"]
  WithAuth --> Handler["Route handler"]`

const docsFlow = `flowchart LR
  Markdown["docs/architecture/*.md"]
  Extractor["Docs health extractor"]
  Json["generated docs-health.json"]
  Page["Architecture source index"]

  Markdown --> Extractor
  Extractor --> Json
  Json --> Page`

export function Architecture() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Architecture</h1>
        <p className="section-subheading">
          Live runtime boundaries and generated repository facts. Target-state differences are explicit.
        </p>
      </header>

      <section id="app-structure" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Runtime system</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Product sources live under <code className="text-brand-400">site/</code> (root package{' '}
          <code className="text-brand-400">ooplanner-oostudio</code>): marketing site, forked Studio/Planner,
          Admin, and API routes. Products and admin data use separate database boundaries. Released plan-symbol
          PNG/SVG residual may remain disk-authoritative until cutover is complete.
        </p>
        <MermaidDiagram chart={highLevelDiagram} title="Live runtime architecture" />

        <div className="grid gap-4 mt-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-docs-text-strong">Live authority</h3>
            <p className="text-sm text-docs-text-muted mt-2">
              Managed products use the Products database. Released SVG descriptors and bytes still use repository
              disk paths.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-docs-text-strong">Target authority</h3>
            <p className="text-sm text-docs-text-muted mt-2">
              Products database records and immutable R2 artifacts replace split filesystem authority after the
              cutover gates pass.
            </p>
          </div>
        </div>
      </section>

      <section id="data-flow" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Planner data flow</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Planner actions pass through the command and project-history layer. Fabric renders 2D. Three.js projects
          the same project model into 3D. A fresh project is blank unless a saved draft or explicit template exists.
        </p>
        <MermaidDiagram chart={plannerDataFlow} title="Planner project flow" />
      </section>

      <section id="auth-flow" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Access and mutation security</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Guest Planner access is public. Protected pages validate sessions. Protected route handlers enforce role,
          rate limits, and CSRF where a cookie-authenticated mutation requires it.
        </p>
        <MermaidDiagram chart={authFlow} title="Access and CSRF flow" />
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Architecture document sync</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Generation indexes every Markdown file under docs/architecture. Re-run the generator after a source
          change. The SPA shows the generated source index. It does not duplicate full Markdown bodies.
        </p>
        <MermaidDiagram chart={docsFlow} title="Architecture docs generation flow" />
      </section>

      <LiveRepoSection title="Architecture source documents">
        <GeneratedSimpleTable
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'sourcePath', header: 'Source' },
            { key: 'status', header: 'Status' },
          ]}
          rows={architectureDocuments.map((document) => ({
            title: document.label,
            sourcePath: document.sourcePath,
            status: document.value,
          }))}
        />
      </LiveRepoSection>

      <LiveRepoSection>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {architectureStats.map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl font-bold text-docs-text-strong">{stat.value}</div>
              <div className="text-xs text-docs-text-subtle mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Site directories</h3>
        <GeneratedKeyValueTable rows={keyValueRowsFromDomain(architectureTopLevelDirs)} />
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">Feature modules</h3>
        <GeneratedKeyValueTable rows={keyValueRowsFromDomain(architectureFeatureModules)} />
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">App routes</h3>
        <GeneratedSimpleTable
          columns={[
            { key: 'path', header: 'Path' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={architectureRoutes.map((route) => ({
            path: route.path,
            sourcePath: route.sourcePath,
          }))}
        />
      </LiveRepoSection>
    </div>
  )
}
