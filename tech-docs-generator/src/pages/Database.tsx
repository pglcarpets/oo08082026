import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedKeyValueTable, GeneratedSimpleTable } from '../components/GeneratedDataTables'
import { LiveRepoSection } from '../components/LiveRepoSection'
import {
  databaseCommands,
  databaseMigrations,
  databaseTables,
} from '../data/databaseData'
import { databaseBoundaries, databasePersistenceRoutes } from '../data/databaseBoundaries'

const schemaDiagram = `erDiagram
    users ||--o{ plans : owns
    users ||--o{ leads : manages
    users ||--o{ activity : performs
    products ||--o{ plan_items : placed_in
    plans ||--o{ plan_items : contains
    products ||--o{ product_images : has
    products ||--o{ product_variants : has
    leads ||--o{ activity : tracks

    users {
        uuid id PK
        text email UK
        text role
        timestamptz created_at
    }
    plans {
        uuid id PK
        uuid user_id FK
        jsonb data
        text name
        timestamptz updated_at
    }
    products {
        uuid id PK
        text slug UK
        text name
        text category
        numeric price
        text image_path
        text model_path
        jsonb metadata
    }
    plan_items {
        uuid id PK
        uuid plan_id FK
        uuid product_id FK
        jsonb transform
    }
    leads {
        uuid id PK
        uuid assigned_to FK
        text name
        text email
        text stage
        numeric value
    }
    product_images {
        uuid id PK
        uuid product_id FK
        text path
        int sort_order
    }
    product_variants {
        uuid id PK
        uuid product_id FK
        text name
        jsonb options
    }
    activity {
        uuid id PK
        uuid user_id FK
        uuid lead_id FK
        text type
        jsonb payload
    }`

const rlsDiagram = `flowchart LR
    Client["Client Request<br/>+ JWT"]
    Supa["Supabase API"]
    RLS["RLS Policies<br/>on each table"]
    DB[("PostgreSQL")]
    Result{"Filtered<br/>Rows"}

    Client --> Supa
    Supa --> RLS
    RLS --> DB
    DB --> Result

    Result -->|user owns| Pass["Rows returned"]
    Result -->|not owner| Empty["No rows"]

    style RLS fill:#0E1925,stroke:#22c55e
    style Pass fill:#0E1925,stroke:#22c55e
    style Empty fill:#221E16,stroke:#ef4444`

const migrationCommands = [
  { cmd: 'pnpm run db:apply', desc: 'Apply pending migrations to linked Supabase' },
  { cmd: 'pnpm run db:sync-drizzle', desc: 'Sync Drizzle schema to Supabase' },
  { cmd: 'pnpm run db:types', desc: 'Generate TypeScript types from Supabase schema' },
  { cmd: 'pnpm run db:types:admin', desc: 'Generate admin-specific types' },
  { cmd: 'pnpm run db:advisors:security', desc: 'Run security advisor checks' },
  { cmd: 'pnpm run db:advisors:performance', desc: 'Run performance advisor checks' },
  { cmd: 'pnpm run db:test', desc: 'Test database connection' },
  { cmd: 'pnpm run db:ensure-plans', desc: 'Ensure plans table exists' },
  { cmd: 'pnpm run db:backup-dropped', desc: 'Backup dropped tables before changes' },
  { cmd: 'pnpm run seed', desc: 'Seed development data' },
]

export function Database() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Database</h1>
        <p className="section-subheading">
          PostgreSQL on Supabase — schema design, Drizzle ORM, migrations, and Row Level Security.
        </p>
      </header>

      <section id="projects" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Two Supabase projects</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Customer/staff data lives on <strong className="text-docs-text">Admin</strong>; catalog/configurator data on{' '}
          <strong className="text-docs-text">Products</strong>. Never dual-write between them. Mode-aware wrappers pick disk vs Supabase in dev.
        </p>
        <div className="overflow-x-auto rounded-xl border border-docs-border mb-6">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Project ID</th>
                <th className="px-4 py-3 font-medium">Env (URL / anon / service)</th>
                <th className="px-4 py-3 font-medium">Code entry</th>
              </tr>
            </thead>
            <tbody>
              {databaseBoundaries.map((row) => (
                <tr key={row.projectId} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 text-docs-text-strong text-xs">{row.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600">{row.projectId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">
                    {row.urlEnv} · {row.anonKeyEnv} · {row.serviceRoleEnv}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.serverEntry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Persistence routes (not HTTP)</h3>
        <div className="overflow-x-auto rounded-xl border border-docs-border">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Dev</th>
                <th className="px-4 py-3 font-medium">Prod</th>
                <th className="px-4 py-3 font-medium">Selector module</th>
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

      {/* Schema */}
      <section id="schema" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Schema Overview</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          The database stores users (Supabase Auth), plans (planner save state), products (catalog), leads (CRM), 
          and supporting tables for images, variants, and activity tracking.
        </p>
        <MermaidDiagram chart={schemaDiagram} title="Entity Relationship Diagram" />
      </section>

      {/* RLS */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Row Level Security (RLS)</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Every table with user-owned data has RLS enabled. Policies filter rows based on the authenticated user's 
          JWT claims — a user can only read/write their own plans, leads, and activity.
        </p>
        <MermaidDiagram chart={rlsDiagram} title="RLS Policy Enforcement" />

        <div className="mt-6">
          <CodeBlock
            title="Example RLS policy (SQL migration)"
            language="sql"
            code={`-- Enable RLS on plans table
alter table public.plans enable row level security;

-- Users can only see their own plans
create policy "plans_select_own"
  on public.plans for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can only insert plans they own
create policy "plans_insert_own"
  on public.plans for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can only update their own plans
create policy "plans_update_own"
  on public.plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own plans
create policy "plans_delete_own"
  on public.plans for delete
  to authenticated
  using (auth.uid() = user_id);`}
          />
        </div>
      </section>

      {/* Drizzle ORM */}
      <section id="drizzle" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Drizzle ORM</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Drizzle provides type-safe schema definitions and a query builder that compiles to SQL. It runs alongside 
          the Supabase client for direct DB access in scripts and server routes.
        </p>

        <CollapsibleSection title="Schema Definition (Drizzle)">
          <CodeBlock
            title="drizzle schema (pattern)"
            language="typescript"
            code={`import { pgTable, uuid, text, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core'

export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  imagePath: text('image_path'),
  modelPath: text('model_path'),
  metadata: jsonb('metadata'),
})`}
          />
        </CollapsibleSection>

        <div className="mt-4">
          <CollapsibleSection title="Query Example" defaultOpen={false}>
            <CodeBlock
              title="drizzle query (pattern)"
              language="typescript"
              code={`import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, and, desc } from 'drizzle-orm'
import postgres from 'postgres'
import { plans, planItems } from './schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// Fetch a user's plans with items
export async function getUserPlans(userId: string) {
  return db
    .select({
      id: plans.id,
      name: plans.name,
      data: plans.data,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.updatedAt))
}

// Insert a new plan
export async function createPlan(userId: string, name: string, data: unknown) {
  const [plan] = await db
    .insert(plans)
    .values({ userId, name, data })
    .returning()
  return plan
}`}
            />
          </CollapsibleSection>
        </div>
      </section>

      {/* Migrations */}
      <section id="migrations" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Migrations</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Migrations are applied via dedicated scripts that connect to the linked Supabase instance. Drizzle Kit 
          generates migration SQL from schema changes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {migrationCommands.map(({ cmd, desc }) => (
            <div key={cmd} className="card flex flex-col gap-1">
              <code className="text-brand-400 text-xs font-mono">{cmd}</code>
              <span className="text-docs-text-subtle text-xs font-sans">{desc}</span>
            </div>
          ))}
        </div>

        <CodeBlock
          title="scripts/db_apply_migrations.ts (pattern)"
          language="typescript"
          code={`import postgres from 'postgres'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

async function applyMigrations() {
  const migrationsDir = join(process.cwd(), 'config/database/migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), 'utf8')
    console.log(\`Applying \${file}...\`)
    await sql.unsafe(content)
  }

  console.log(\`Applied \${files.length} migrations\`)
  await sql.end()
}

applyMigrations().catch((err) => {
  console.error(err)
  process.exit(1)
})`}
        />
      </section>

      {/* Generated types */}
      <section className="mb-12">
        <CollapsibleSection title="Generated TypeScript Types" badge="Type Safety">
          <div className="space-y-3 text-sm text-docs-text-muted">
            <p>
              Supabase generates TypeScript types from the live database schema into 
              <code className="text-brand-400 bg-docs-surface px-1 rounded">config/database/types/database.types.ts</code>. 
              These power the typed Supabase client so queries are fully type-checked at compile time.
            </p>
            <CodeBlock
              title="Generated types (excerpt)"
              language="typescript"
              code={`export type Database = {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          user_id: string
          name: string
          data: JsonB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          data: JsonB
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          data?: JsonB
          updated_at?: string
        }
      }
    }
  }
}`}
            />
          </div>
        </CollapsibleSection>
      </section>

      <LiveRepoSection title="Live database inventory">
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Tables</h3>
        <GeneratedSimpleTable
          columns={[
            { key: 'name', header: 'Table' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={databaseTables.map((table) => ({
            name: table.name,
            sourcePath: table.sourcePath,
          }))}
        />
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">Migrations</h3>
        <GeneratedSimpleTable
          columns={[
            { key: 'path', header: 'Migration' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={databaseMigrations.map((migration) => ({
            path: migration.path,
            sourcePath: migration.sourcePath,
          }))}
        />
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">DB scripts</h3>
        <GeneratedKeyValueTable
          rows={databaseCommands.map((command) => ({
            label: command.scriptName,
            value: command.command,
            sourcePath: command.sourcePath,
            sourcePointer: command.sourcePointer,
          }))}
        />
      </LiveRepoSection>
    </div>
  )
}
