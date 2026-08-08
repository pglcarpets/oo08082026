import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedKeyValueTable } from '../components/GeneratedDataTables'
import { keyValueRowsFromDomain, LiveRepoSection } from '../components/LiveRepoSection'
import { performanceRecords } from '../data/performanceData'
import { Lightning as Zap, Image, Database, Code, HardDrives as Server, Gauge } from "@phosphor-icons/react";const optimizations = [
  {
    icon: Server,
    name: 'Server Components',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    desc: 'Next.js 16 App Router uses Server Components by default. Data fetching happens on the server, reducing client JS.',
    points: [
      'Default to server components',
      'Only mark "use client" where needed (canvas, 3D)',
      'Server-side Supabase queries reduce client waterfalls',
      'Streaming with Suspense boundaries',
    ],
  },
  {
    icon: Image,
    name: 'Image Optimization',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    desc: 'Catalog images served from R2 CDN with next/image for responsive sizing and lazy loading.',
    points: [
      'next/image for automatic responsive sizing',
      'Sharp for server-side image processing',
      'Lazy loading below-the-fold images',
      'WebP/AVIF format negotiation',
      'CDN edge caching via R2',
    ],
  },
  {
    icon: Database,
    name: 'Data Caching',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    desc: 'TanStack Query for client cache + Next.js fetch caching for server data.',
    points: [
      'TanStack Query stale-while-revalidate',
      'Per-query cache keys with invalidation',
      'Next.js unstable_cache for expensive queries',
      'revalidatePath on mutations',
    ],
  },
  {
    icon: Code,
    name: 'Bundle Optimization',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    desc: 'Code splitting and dynamic imports keep the initial bundle small.',
    points: [
      'Dynamic import for Fabric.js and Three.js',
      'Route-level code splitting (App Router)',
      'Tree-shaking unused exports',
      'Server-only modules excluded from client',
    ],
  },
  {
    icon: Gauge,
    name: 'Core Web Vitals',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    desc: 'Lighthouse + @vercel/speed-insights track LCP, FID, CLS in production.',
    points: [
      '@vercel/analytics for real user monitoring',
      '@vercel/speed-insights for Web Vitals',
      'Lighthouse CI in release:gate',
      'Target: LCP < 2.5s, CLS < 0.1',
    ],
  },
  {
    icon: Zap,
    name: '3D Performance',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    desc: 'React Three Fiber scene optimized for smooth 60fps interaction.',
    points: [
      'GLTF Draco compression via gltf-transform',
      'Instanced meshes for repeated furniture',
      'LOD (level of detail) for distant objects',
      'Suspense for model loading states',
      'Framer Motion for layout animations',
    ],
  },
]

export function Performance() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Performance Optimization</h1>
        <p className="section-subheading">
          Strategies for fast load times, smooth 3D rendering, and efficient data fetching.
        </p>
      </header>

      {/* Optimizations grid */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {optimizations.map(opt => {
            const Icon = opt.icon
            return (
              <div key={opt.name} className="card">
                <div className={`p-2.5 rounded-xl ${opt.bg} inline-flex mb-3`}>
                  <Icon size={20} className={opt.color} />
                </div>
                <h3 className="font-semibold text-docs-text-strong text-sm mb-1">{opt.name}</h3>
                <p className="text-xs text-docs-text-subtle leading-relaxed mb-3">{opt.desc}</p>
                <ul className="space-y-1">
                  {opt.points.map(p => (
                    <li key={p} className="text-xs text-docs-text-subtle flex items-start gap-1.5">
                      <span className={`w-1 h-1 rounded-full ${opt.color.replace('text', 'bg')} mt-1.5 flex-shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Dynamic import example */}
      <section className="mb-12">
        <CollapsibleSection title="Dynamic Imports for Heavy Libraries" badge="Code Splitting">
          <p className="text-sm text-docs-text-muted mb-3">
            Fabric.js and Three.js are large libraries. They're dynamically imported so they only load on the 
            planner route, keeping marketing pages lean.
          </p>
          <CodeBlock
            title="app/planner/page.tsx (pattern)"
            language="tsx"
            code={`import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Live planner — guest/canvas routes load workspace via PlannerHost
const PlannerHost = dynamic(
  () => import('@/components/Planner/PlannerDockShell').then(m => m.DockShell),
  { ssr: false, loading: () => <PlannerSkeleton /> }
)

export default function PlannerPage() {
  return (
    <div className="planner-layout">
      <Suspense fallback={<PlannerSkeleton />}>
        <PlannerHost />
      </Suspense>
    </div>
  )
}`}
          />
        </CollapsibleSection>
      </section>

      {/* Image optimization */}
      <section className="mb-12">
        <CollapsibleSection title="Image Optimization" badge="next/image + R2" defaultOpen={false}>
          <CodeBlock
            title="Catalog image component (pattern)"
            language="tsx"
            code={`import Image from 'next/image'
import { getR2Url } from '@/lib/assetPaths'

interface ProductImageProps {
  path: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export function ProductImage({ path, alt, width, height, priority }: ProductImageProps) {
  return (
    <Image
      src={getR2Url(path)}        // https://cdn.oando.co.in/<path>
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes="(max-width: 768px) 100vw, (max-width: 75rem) 50vw, 33vw"
      className="rounded-lg object-cover"
    />
  )
}`}
          />
        </CollapsibleSection>
      </section>

      {/* TanStack Query caching */}
      <section className="mb-12">
        <CollapsibleSection title="TanStack Query Caching" badge="Client Cache" defaultOpen={false}>
          <CodeBlock
            title="Query client configuration (pattern)"
            language="typescript"
            code={`import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Fresh data for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch on window focus (planner is interactive)
        refetchOnWindowFocus: false,
        // Retry failed queries once
        retry: 1,
      },
      mutations: {
        // Retry mutations once on network failure
        retry: 1,
      },
    },
  })
}

// Invalidation on mutation success:
// queryClient.invalidateQueries({ queryKey: ['products'] })`}
          />
        </CollapsibleSection>
      </section>

      {/* GLTF optimization */}
      <section className="mb-12">
        <CollapsibleSection title="3D Model Optimization" badge="gltf-transform" defaultOpen={false}>
          <p className="text-sm text-docs-text-muted mb-3">
            3D furniture models are processed with gltf-transform before upload to R2: Draco compression, 
            unused attribute removal, and texture resizing.
          </p>
          <CodeBlock
            title="scripts/optimize-models.ts (pattern)"
            language="typescript"
            code={`import { NodeIO } from '@gltf-transform/core'
import { draco } from '@gltf-transform/functions'
import draco3d from 'draco3d'

const io = new NodeIO()
  .registerExtensions(draco3d.createDraco())

async function optimizeModel(input: string, output: string) {
  const document = await io.read(input)

  await document.transform(
    // Compress geometry with Draco
    draco({
      encoder: draco3d.createDraco().Encoder,
      method: draco.ENCODING_METHOD.EDGEBREAKER,
      encodeSpeed: 5,
      decodeSpeed: 5,
    }),
    // Remove unused attributes
    prune(),
    // Merge accessors where possible
    weld({ tolerance: 0.0001 }),
    // Simplify meshes (optional)
    simplify({ simplifier: meshoptimizerSimplifier, ratio: 0.5 }),
  )

  await io.write(output, document)
  console.log(\`Optimized \${input} -> \${output}\`)
}`}
          />
        </CollapsibleSection>
      </section>

      {/* Monitoring */}
      <section className="mb-12">
        <CollapsibleSection title="Production Monitoring" badge="Vercel Analytics" defaultOpen={false}>
          <CodeBlock
            title="app/layout.tsx (pattern)"
            language="tsx"
            code={`import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}`}
          />
        </CollapsibleSection>
      </section>

      {/* Targets */}
      <section className="mb-12">
        <div className="card border-cyan-800/40 bg-brand-500/10/10">
          <h3 className="text-sm font-semibold text-brand-400 mb-3">Performance Targets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { metric: 'LCP', target: '< 2.5s', desc: 'Largest Contentful Paint' },
              { metric: 'CLS', target: '< 0.1', desc: 'Cumulative Layout Shift' },
              { metric: 'INP', target: '< 200ms', desc: 'Interaction to Next Paint' },
              { metric: 'Bundle', target: '< 200KB', desc: 'Initial JS (marketing)' },
            ].map(t => (
              <div key={t.metric} className="bg-docs-surface/50 rounded-lg p-3 border border-docs-border">
                <div className="text-xs text-docs-text-subtle uppercase tracking-wider">{t.metric}</div>
                <div className="text-lg font-bold text-docs-text-strong mt-1">{t.target}</div>
                <div className="text-xs text-docs-text-subtle mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveRepoSection title="Live performance scripts">
        <GeneratedKeyValueTable rows={keyValueRowsFromDomain(performanceRecords)} />
      </LiveRepoSection>
    </div>
  )
}
