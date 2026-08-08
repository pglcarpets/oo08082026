/**
 * Two-database Supabase model — authority: AGENTS.md + site/platform/supabase/.
 * Tech-docs route: /database (this SPA). Product app has no public /database page.
 */

export type DatabaseBoundaryRow = {
  role: string
  projectId: string
  urlEnv: string
  anonKeyEnv: string
  serviceRoleEnv: string
  serverEntry: string
  migrations: string
  holds: string
}

/** Live Supabase projects (never dual-write across them). */
export const databaseBoundaries: DatabaseBoundaryRow[] = [
  {
    role: 'Admin — auth, CRM, planner saves, furniture library',
    projectId: 'rxzpznmxbaoxpikowmfc',
    urlEnv: 'NEXT_ADMIN_SUPABASE_URL (alias SUPABASE_AUTH_URL)',
    anonKeyEnv: 'NEXT_ADMIN_SUPABASE_ANON_KEY',
    serviceRoleEnv: 'SUPABASE_ADMIN_SERVICE_ROLE_KEY',
    serverEntry: '@/platform/supabase/server → createAuthServerClient() · auth-admin.ts for service role',
    migrations: 'site/platform/supabase/migrations.admin/',
    holds:
      'oando_plans, profiles, handoffs, teams, price books, customer_queries, audit, furniture_catalog, catalog-assets bucket',
  },
  {
    role: 'Products — catalog, configurator, descriptors, flags',
    projectId: 'erpweaiypimorcunaimz',
    urlEnv: 'NEXT_PUBLIC_SUPABASE_URL',
    anonKeyEnv: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    serviceRoleEnv: 'SUPABASE_SERVICE_ROLE_KEY',
    serverEntry: '@/platform/supabase/server → createServerClient() · supabaseAdmin.ts for service role',
    migrations: 'site/platform/supabase/migrations/',
    holds: 'catalog tables, block_descriptors, feature_flags (Products copy), configurator SKUs',
  },
]

export const databasePersistenceRoutes = [
  {
    domain: 'Planner projects',
    dev: 'site/platform/Planner/data/projects/ (DEV_AUTH_BYPASS=1)',
    prod: 'Admin public.oando_plans',
    selector: 'site/lib/Planner/plannerPersistenceMode.ts',
  },
  {
    domain: 'Furniture library',
    dev: 'site/platform/shared/data/furniture/',
    prod: 'Admin furniture_catalog + catalog-assets',
    selector: 'site/lib/catalog/furnitureCatalogMode.ts',
  },
  {
    domain: 'Published block descriptors',
    dev: 'site/inventory/descriptors/',
    prod: 'Products block_descriptors',
    selector: 'site/platform/.../blockDescriptorStore.supabase.ts',
  },
] as const

/** Internal docs URL — not a Next.js app route. */
export const TECH_DOCS_DATABASE_PATH = '/database'
