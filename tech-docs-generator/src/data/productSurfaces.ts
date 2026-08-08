/**
 * Live product surface map for tech-docs.
 * Authority: site/app + site/features + adminNav — re-check disk if routes move.
 */

export type SurfaceRow = {
  surface: string
  routes: string
  code: string
  stack: string
  notes: string
}

/** High-level product areas (not npm packages). */
export const productSurfaces: SurfaceRow[] = [
  {
    surface: 'Marketing site',
    routes: '/ · /products · /contact · /about · /portal · …',
    code: 'site/app/(site)/ · site/features/site/ · site/components/home|site/',
    stack: 'Next App Router · next-intl · FOCSS marketing · SEO (robots/sitemap)',
    notes: 'Public brand site; residual portal/guest flows',
  },
  {
    surface: 'Floor Planner (fork)',
    routes: '/ooplanner · /ooplanner/projects · /ooplanner/projects/[id]',
    code: 'site/app/ooplanner/ · components/Planner · lib/Planner · features/Planner',
    stack: 'dockview-react · fabric · Zustand · /api/Planner/*',
    notes:
      'Projects: disk when DEV_AUTH_BYPASS=1, else oando_plans Supabase only (no dual-write). scan:boundaries vs Studio.',
  },
  {
    surface: 'Furniture Studio (fork)',
    routes: '/oostudio',
    code: 'site/app/oostudio/ · components/Studio · lib/Studio · features/Studio',
    stack: 'dockview-react · fabric · Three residual · sharp PNG · /api/Studio/*',
    notes: 'Furniture disk under bypass today; publish → descriptors/PNG. No Planner cross-imports.',
  },
  {
    surface: 'Admin console',
    routes: '/admin/*',
    code: 'site/app/admin/ · site/features/admin/ · AdminLayoutShell',
    stack: 'FOCSS admin · React Aria fields · residual shadcn/Radix ui · withAuth',
    notes: 'Residual product-studio tree retired; Studio linked out to /oostudio',
  },
  {
    surface: 'CRM (admin residual)',
    routes: '/admin/crm · /admin/crm/clients|projects|quotes',
    code: 'site/features/crm/ · site/features/admin/crm/',
    stack: 'CRM views · demo seed residual · projects API dual story',
    notes: 'Ops customer-queries under admin + features/ops',
  },
  {
    surface: 'Ops / customer queries',
    routes: '/admin/customer-queries',
    code: 'site/features/ops/ · site/features/admin/customer-queries/',
    stack: 'Ops page views · contact form API residual',
    notes: 'Linked from admin nav System/Overview as present on disk',
  },
  {
    surface: 'Catalog admin',
    routes: '/admin/catalog · /admin/planner-catalog · /admin/workspace-catalog · /admin/price-books',
    code: 'site/features/admin/catalog|pricing|workspace-catalog · site/lib/catalog/',
    stack: 'Drizzle/Supabase residual · price books · plan-symbol PNG contract',
    notes: 'Configurator + library + commercial pricing residual',
  },
  {
    surface: 'Admin planner residual',
    routes: '/admin/plans · /admin/features · /admin/analytics',
    code: 'site/features/admin/plans|feature-flags|analytics/',
    stack: 'Saved plans · feature flags · usage analytics residual',
    notes: 'Feature flags also gate Planner/Studio capabilities',
  },
  {
    surface: 'Design kit',
    routes: '/admin/design-kit',
    code: 'site/features/admin/design-kit/',
    stack: 'FOCSS tokens showcase · admin chrome samples',
    notes: 'Internal design reference',
  },
  {
    surface: 'Auth / access',
    routes: '/access · login/signup residual · guest cookies',
    code: 'site/features/shared/auth/ · site/lib/auth/ · proxy.ts',
    stack: 'Supabase Auth residual · DEV_AUTH_BYPASS (dev only) · CSRF',
    notes: 'Edge proxy protects /admin · /crm · /ops prefixes',
  },
  {
    surface: 'Shared API layer',
    routes: '/api/Planner/* · /api/Studio/* · /api/admin/* · /api/products · /api/csrf · …',
    code: 'site/app/api/ · features/shared/api/withAuth.ts',
    stack: 'withAuth · CSRF · rateLimit · Zod residual',
    notes: 'Fork disk APIs guest+CSRF; member writes edge-gated',
  },
  {
    surface: 'FOCSS design system',
    routes: '(all product UI)',
    code: 'site/focss/ · @focss/* imports',
    stack: 'Tokens · planner/studio/admin/site zones · no raw hex in components',
    notes: 'Product CSS home — not Tailwind-first',
  },
  {
    surface: 'Tech docs (optional)',
    routes: 'dev :3001 · prod docs.oando.co.in',
    code: 'tech-docs-generator/ · admin System → Architecture docs',
    stack: 'Vite · React · generated inventory from package.json',
    notes: 'Separate process from product :3000',
  },
]

/** Admin console modules from live adminNav + app/admin pages. */
export const adminModules: Array<{
  group: string
  items: Array<{ label: string; href: string; description: string }>
}> = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', description: 'Admin hub and quick links' },
    ],
  },
  {
    group: 'Planner',
    items: [
      { label: 'Plans', href: '/admin/plans', description: 'Saved planner documents' },
      { label: 'Features', href: '/admin/features', description: 'Toolbar and capability toggles' },
      { label: 'Analytics', href: '/admin/analytics', description: 'Usage volume and export activity' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Products', href: '/admin/catalog', description: 'Editable managed products' },
      { label: 'Configurator', href: '/admin/planner-catalog', description: 'Parametric and discrete SKUs' },
      { label: 'Library', href: '/admin/workspace-catalog', description: 'Read-only workspace elements' },
      { label: 'Furniture Studio', href: '/oostudio', description: 'Draw & export catalog furniture' },
      { label: 'Prices', href: '/admin/price-books', description: 'BOQ price books draft → activate' },
    ],
  },
  {
    group: 'CRM',
    items: [
      { label: 'CRM hub', href: '/admin/crm', description: 'CRM overview' },
      { label: 'Clients', href: '/admin/crm/clients', description: 'Client roster residual' },
      { label: 'Projects', href: '/admin/crm/projects', description: 'CRM projects residual' },
      { label: 'Quotes', href: '/admin/crm/quotes', description: 'Quotes residual' },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Customer queries', href: '/admin/customer-queries', description: 'Ops inbox residual' },
      { label: 'Inventory', href: '/admin/inventory', description: 'Inventory residual' },
      { label: 'Themes', href: '/admin/themes', description: 'Theme editor residual' },
      { label: 'Settings', href: '/admin/settings', description: 'Admin settings residual' },
      { label: 'Design kit', href: '/admin/design-kit', description: 'FOCSS / UI samples' },
      {
        label: 'Architecture docs',
        href: 'https://docs.oando.co.in (or :3001 in dev)',
        description: 'External tech-docs SPA (NEXT_PUBLIC_TECH_DOCS_URL)',
      },
    ],
  },
]

/** Stack roles that are easy to miss if only looking at dep cards. */
export const stackRoleGaps: Array<{ role: string; packageOrCode: string; usedBy: string }> = [
  { role: 'Admin chrome / forms', packageOrCode: 'React Aria · FOCSS admin · components/ui (Radix residual)', usedBy: '/admin/*' },
  { role: 'Marketing motion', packageOrCode: 'framer-motion · gsap · @gsap/react', usedBy: 'site marketing' },
  { role: 'Data fetching residual', packageOrCode: '@tanstack/react-query', usedBy: 'admin/site residual' },
  { role: 'Forms residual', packageOrCode: 'react-hook-form · zod · @hookform/resolvers', usedBy: 'admin forms' },
  { role: 'Auth + DB residual', packageOrCode: '@supabase/* · drizzle-orm · postgres', usedBy: 'admin/CRM/catalog residual' },
  {
    role: 'Two Supabase projects',
    packageOrCode:
      'Admin rxzpznmxbaoxpikowmfc (createAuthServerClient) · Products erpweaiypimorcunaimz (createServerClient)',
    usedBy: 'site/platform/supabase/ — see Tech Stack → Database boundaries',
  },
  { role: 'AI residual', packageOrCode: '@mastra/* · @lancedb/lancedb · @orama/orama', usedBy: 'site/lib/ai · assistant' },
  { role: 'Shape graph residual', packageOrCode: '@xyflow/react', usedBy: 'declared; product-studio tree retired' },
  { role: 'Plan-symbol PNG', packageOrCode: 'sharp · planSymbolPngContract', usedBy: 'Studio publish · Planner paint' },
  { role: 'Edge security', packageOrCode: 'site/proxy.ts · csrf · rateLimit · withAuth', usedBy: 'all product routes' },
  { role: 'i18n marketing', packageOrCode: 'next-intl · site/i18n/messages/*', usedBy: 'marketing Site' },
]
