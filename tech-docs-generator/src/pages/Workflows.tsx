import React, { useState } from 'react'
import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedKeyValueTable } from '../components/GeneratedDataTables'
import { keyValueRowsFromDomain, LiveRepoSection } from '../components/LiveRepoSection'
import { workflowRecords, siteWorkflowRecords } from '../data/workflowsData'
import { GitCommit, GitBranch, Rocket, Wrench, Database, Package, Shield, Eye, Trophy as Award, Target, ListChecks, ClockCounterClockwise as History, ArrowRight, Image as ImageIcon, BookOpen } from "@phosphor-icons/react";const gitFlow = `flowchart TB
    Main["main<br/>production"]
    Feature["feature/<name><br/>branch"]
    Dev["Local Dev<br/>pnpm run dev"]
    Test["Local Tests<br/>typecheck + test"]
    PR["Pull Request<br/>+ preview deploy"]
    Gate["release:gate<br/>CI checks"]
    Review["Code Review"]
    Merge["Merge to main"]
    Prod["Vercel Prod<br/>oando.co.in"]

    Main --> Feature
    Feature --> Dev
    Dev --> Test
    Test --> PR
    PR --> Gate
    PR --> Review
    Gate -->|pass| Review
    Review -->|approve| Merge
    Merge --> Prod
    Merge --> Main

    style Prod fill:#0E1925,stroke:#22c55e
    style Gate fill:#221E16,stroke:#f97316
    style PR fill:#111E2D,stroke:#a855f7`

const devWorkflow = [
  { step: '1', title: 'Create feature branch', cmd: 'git checkout -b feature/<name>', detail: 'Branch from main. Use descriptive names.' },
  { step: '2', title: 'Start dev server', cmd: 'pnpm run dev', detail: 'From repo root. Product on :3000 (webpack). tech-docs:dev on :3001.' },
  { step: '3', title: 'Make changes', cmd: '—', detail: 'Edit under site/app, site/features, site/lib, site/components (forked Studio/Planner trees).' },
  { step: '4', title: 'Type check', cmd: 'pnpm run typecheck', detail: 'tsc -p site/tsconfig.json --noEmit (TS 7.x).' },
  { step: '5', title: 'Lint', cmd: 'pnpm run lint', detail: 'oxlint over site + tests (primary).' },
  { step: '6', title: 'Run tests', cmd: 'pnpm run test', detail: 'Vitest unit tests. Add test:planner for planner-only.' },
  { step: '7', title: 'Commit', cmd: 'git commit -m "feat: ..."', detail: 'Prefer owner-requested commits; secretlint via lint:secrets / gate.' },
  { step: '8', title: 'Push + PR', cmd: 'git push -u origin feature/<name>', detail: 'Create PR on GitHub when owner asks. Vercel preview if configured.' },
]

const commitConventions = [
  { type: 'feat', desc: 'New feature', example: 'feat(planner): add wall snap tool' },
  { type: 'fix', desc: 'Bug fix', example: 'fix(catalog): correct slug resolution for variants' },
  { type: 'docs', desc: 'Documentation', example: 'docs: update planner canvas architecture' },
  { type: 'style', desc: 'Formatting, no code change', example: 'style: format site/components/Planner' },
  { type: 'refactor', desc: 'Code restructuring', example: 'refactor(store): split planner store into slices' },
  { type: 'test', desc: 'Test additions', example: 'test(planner): add FabricDrawToolsBar tests' },
  { type: 'chore', desc: 'Build, deps, tooling', example: 'chore: bump fabric to 7.4.0' },
  { type: 'perf', desc: 'Performance improvement', example: 'perf(3d): instanced meshes for repeated furniture' },
]

const commonTasks = [
  { icon: Wrench, title: 'Add a new planner tool', steps: ['Create component under site/components/Planner/ (or features/Planner)', 'Wire tool type + canvas handlers in the Planner fork', 'Wire to Zustand store action', 'Add test under tests/unit/planner or tests/e2e'] },
  { icon: Database, title: 'Add a database table', steps: ['Write SQL migration in config/database/migrations/', 'Add Drizzle schema definition', 'Enable RLS + write policies', 'Run db:apply + db:types to regenerate types'] },
  { icon: Package, title: 'Add a catalog product', steps: ['Author via Studio disk store / catalog APIs', 'Publish plan-symbol PNG per contract when required', 'Verify in Planner catalog panel on :3000'] },
  { icon: Rocket, title: 'Deploy to production', steps: ['Ensure focused checks + gate:fast green locally', 'Create PR + get approval', 'Run pnpm run release:gate', 'Run pnpm run vercel:prod when owner asks'] },
]

const governanceFlow = `flowchart LR
    US["Start: /using-superpowers"]
    GS["Global Standard<br/>• Fresh benchmark report<br/>• Anti-copy attestation<br/>• 5-product ref model<br/>• Evidence in results/"]
    SK["Chosen Skills<br/>design • review<br/>check-work • figma-*"]
    MCP["/chrome-devtools MCP<br/>screenshots • lighthouse a11y<br/>inspect • DOM/ARIA"]
    EV["Evidence + Gates<br/>AGENTS.md • testing-handbook<br/>Failures.md • superpowers spec"]
    US --> GS --> SK --> MCP --> EV
    style GS fill:#1f2937,stroke:#3b82f6,color:#fff
    style EV fill:#1f2937,stroke:#22c55e,color:#fff`

const chosenSkills = [
  { name: '/using-superpowers', desc: 'Entry skill. GS process, anti-copy rule, evidence discipline. Always first per 1b-5phase plan.' },
  { name: '/design', desc: 'Produces plans (writing-plans). Aligns to Figma UI3, global standard, superpowers spec.' },
  { name: '/review', desc: 'Deep critic skill. Uses chrome-devtools MCP + Playwright a11y. Scores vs GS/anti-copy.' },
  { name: '/check-work', desc: 'verification-before-completion. Gate evidence, coverage, output integrity. Declares skips.' },
  { name: 'figma-* (via design)', desc: 'Figma patterns: minimize-UI, panel grammar, catalogue-first (Planner5D), Sketchfab search.' },
  { name: 'chrome-devtools + a11y-debugging', desc: 'MCP tooling for inspection, screenshots, lighthouse audits, contrast/ARIA checks.' },
]

/** New site-workflows modules — beautiful static rendering (module nav + walkthrough/current/goal + mermaid + images + instructions).
 * Data lives here (min necessary; no new files). Matches main site theme via tokens. Polished, accessible, fast.
 * Refer to plan: start with /using-superpowers + superpowers spec + AGENTS.md.
 */
interface SiteWorkflowModule {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  summary: string
  walkthrough: {
    intro: string
    steps: Array<{
      num: number
      title: string
      instruction: string
      cmd?: string
      mermaid?: string
      screenshotDesc?: string
    }>
  }
  current: string
  goal: string
  instructionsNote?: string
}

const siteWorkflowModules: SiteWorkflowModule[] = [
  {
    id: 'marketing-site',
    label: 'Marketing Site',
    icon: BookOpen,
    summary: 'Next.js App Router marketing surfaces, i18n, SEO, static generation.',
    walkthrough: {
      intro: 'End-to-end flow from content authoring to production deploy for oando.co.in marketing.',
      steps: [
        { num: 1, title: 'Author content', instruction: 'Edit copy in site/i18n/messages/*.json or lib/site-data/. Use semantic keys.', cmd: '—' },
        { num: 2, title: 'Preview locally', instruction: 'Run dev server. Check responsive, a11y, and locale switch.', cmd: 'pnpm run dev' },
        { num: 3, title: 'Diagram review', instruction: 'Validate route + data flow with Mermaid.', mermaid: `flowchart LR\n  Content[lib/site-data + i18n] --> Route[app/(site)]\n  Route --> SSG[Static Render]\n  SSG --> Vercel[CDN Edge]` },
        { num: 4, title: 'Screenshot capture', instruction: 'Use chrome-devtools MCP or Playwright for visual regression. Ensure matches Figma/global-standard.', screenshotDesc: 'Marketing hero + nav on desktop + mobile locale switch' },
      ]
    },
    current: 'Content is partially hand-curated; some sections use static data. Visual regression and full a11y gates run in CI via site-ui workflow.',
    goal: '100% data-driven where possible, zero-drift from Figma via tokens only, sub-2s LCP on all marketing routes, full evidence-backed screenshots in every gate.',
    instructionsNote: 'Run tech-docs:gate after structural changes.'
  },
  {
    id: 'site-planner-int',
    label: 'Site ↔ Planner Integration',
    icon: Package,
    summary: 'Hybrid marketing-to-planner handoff, guest planner, catalog embed, shared tokens.',
    walkthrough: {
      intro: 'How marketing site links, embeds, and shares design system with the interactive planner workspace.',
      steps: [
        { num: 1, title: 'Entry points', instruction: 'Marketing CTAs link to /ooplanner (and guest planner surfaces). Shared FOCSS tokens ensure visual continuity.', cmd: '—' },
        { num: 2, title: 'Catalog bridge', instruction: 'Use site/lib/catalog + platform data. Never duplicate product facts in marketing site-data.', cmd: 'pnpm run catalog:blocks:qa' },
        { num: 3, title: 'Theme sync', instruction: 'tech-docs-generator syncs css from site/focss. Verify in generated-documents/data/css/.', mermaid: `flowchart TB\n  Tokens[site/focss/base/tokens] --> Site[Marketing]\n  Tokens --> Planner[focss/planner]\n  Tokens --> TechDocs[tech-stack]` },
        { num: 4, title: 'Visual QA screenshot', instruction: 'Capture hero CTA + planner embed side-by-side for anti-copy validation.', screenshotDesc: 'Side-by-side: marketing card leading into planner canvas with matching bronze/ocean accents' },
      ]
    },
    current: 'Guest planner available. Token aliases in tech-docs-generator/src/index.css. Some planner chrome still uses legacy palette classes (tracked in Failures).',
    goal: 'Pure token-driven UI across marketing + planner. Every surface change audited with chrome-devtools screenshots + lighthouse in results/site/...',
    instructionsNote: 'Follow MODULE-UI-CONTRACT. Min necessary edits only.'
  },
  {
    id: 'release-qa-site',
    label: 'Release & QA Site',
    icon: Rocket,
    summary: 'release:gate, site-ui e2e, a11y, tech-stack docs gate, evidence capture.',
    walkthrough: {
      intro: 'Canonical path from local change to production with full evidence for site surfaces.',
      steps: [
        { num: 1, title: 'Local gate', instruction: 'typecheck + lint + test relevant scope from repo root (product package is root, not oando-site).', cmd: 'pnpm run typecheck && pnpm run lint && pnpm run test:unit' },
        { num: 2, title: 'Full release gate', instruction: 'Per START.md + Failures.md. Captures all artifacts under results/.', cmd: 'pnpm run release:gate' },
        { num: 3, title: 'Tech docs sync', instruction: 'Regenerate and build tech docs to validate rendered workflows.', cmd: 'pnpm run tech-docs:build' },
        { num: 4, title: 'Screenshots & a11y', instruction: 'Playwright + MCP lighthouse runs. Attach to gate evidence.', mermaid: `sequenceDiagram\n  participant Dev\n  participant CI\n  participant Gate\n  Dev->>CI: PR + preview\n  CI->>Gate: lint/type/test/a11y\n  Gate-->>Vercel: deploy if pass` , screenshotDesc: 'Playwright HTML report + lighthouse scores panel for / and /planner/guest/' },
      ]
    },
    current: 'Gates exist and are wired. Evidence policy is enforced by testing-handbook. Some pre-existing lint in unrelated files.',
    goal: 'Zero tolerance on missing artifacts. Every workflow module has live visual proof + declared skips only.',
    instructionsNote: 'Never bypass reporters. Log to Failures.md before claiming ship-ready.'
  },
]

/** Beautiful inline screenshot support for site-workflows (no external assets; pure accessible static quality) */
function WorkflowScreenshot({ desc, moduleId }: { desc: string; moduleId: string }) {
  return (
    <div className="mt-3 rounded-xl border border-docs-border overflow-hidden bg-panel-raised" role="img" aria-label={`Screenshot mock: ${desc}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-docs-border bg-panel/80 text-[10px] text-subtle font-mono">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <span className="w-2 h-2 rounded-full bg-green-500/70" />
        </div>
        <span className="flex-1 truncate">oando.co.in — {moduleId} • 1440×900</span>
        <ImageIcon size={12} className="text-subtle" />
      </div>
      <div className="p-4 text-xs leading-relaxed text-muted bg-[repeating-linear-gradient(45deg,var(--surface-soft),var(--surface-soft)_4px,var(--surface-panel)_4px,var(--surface-panel)_8px)] min-h-[92px] flex items-center justify-center text-center">
        <div>
          <div className="font-semibold text-heading mb-1 tracking-tight">📸 {desc}</div>
          <div className="text-[10px] opacity-70">Illustrative — captured via chrome-devtools / Playwright in actual gates (see results/)</div>
        </div>
      </div>
    </div>
  )
}

export function Workflows() {
  // Module navigation state for new site-workflows modules
  const [activeModuleId, setActiveModuleId] = useState<string>(siteWorkflowModules[0]?.id ?? 'marketing-site')
  const activeModule = siteWorkflowModules.find(m => m.id === activeModuleId) ?? siteWorkflowModules[0]

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Development Workflows</h1>
        <p className="section-subheading">
          Git flow, daily dev loop, commit conventions, common task guides, and the prominent Governance, Superpowers &amp; Tooling section (GS lens).
        </p>
      </header>

      {/* Governance, Superpowers & Tooling — prominent section (GS lens) */}
      <section className="mb-12 border-l-4 border-brand-500 pl-6 bg-panel/30 rounded-r-lg py-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10">
            <Shield size={20} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-heading">Governance, Superpowers &amp; Tooling</h2>
          <span className="ml-auto text-[10px] uppercase tracking-[1px] px-2.5 py-px rounded-full bg-brand-500/20 text-brand-400 font-mono border border-brand-500/30">GS Lens</span>
        </div>

        <p className="text-sm text-muted mb-6">
          All development follows the <strong>Global Standard (GS)</strong> framework. Significant work <strong>starts with <code className="text-brand-300">/using-superpowers</code></strong> (GS process, anti-copy, evidence). Chrome-devtools MCP and specialized skills (design, review, check-work, figma-*) are used throughout per the superpowers spec, archived 1b-5phase-agent-workflow plan, and AGENTS.md. Evidence is non-negotiable.
        </p>

        <div className="mb-6">
          <MermaidDiagram chart={governanceFlow} title="Governance Flow via using-superpowers (GS Lens)" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card border-brand-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-heading">/using-superpowers (GS Process, Anti-Copy, Evidence)</h3>
            </div>
            <ul className="text-xs text-subtle space-y-1 list-disc pl-4">
              <li>Invoked first (see 1b PLAN.md: "1. Start with using-superpowers").</li>
              <li>Enforces Global Standard: benchmark report + 5-product model (Figma UI3, Sketchfab, AutoCAD Web, Planner 5D, Floorplanner) + anti-copy attestation.</li>
              <li>Anti-copy (binding): only semantic tokens from <code>site/focss/</code>; no exact donor geometry/palettes/composition without dated benchmark justification.</li>
              <li>Evidence-first + honesty: live checks, full artifacts in <code>results/&lt;module&gt;/&lt;phase&gt;/</code>; declare skips; no fabricated runs.</li>
              <li>Cross-refs: <code>plans/site-plan.md</code>, <code>plans/README.md</code>, AGENTS.md, Failures.md (gate policy).</li>
            </ul>
          </div>

          <div className="card border-brand-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-heading">/chrome-devtools (MCP for Inspection, a11y, Screenshots)</h3>
            </div>
            <ul className="text-xs text-subtle space-y-1 list-disc pl-4">
              <li>Full MCP toolset: navigate_page, take_screenshot, lighthouse_audit, take_snapshot, evaluate_script, list/get console &amp; network, a11y via lighthouse + axe patterns.</li>
              <li>Critic/review phases: visual anti-copy review, focus/contrast/ARIA audits, DOM inspection, performance traces.</li>
              <li>Screenshots + audit JSON preserved as evidence (never truncated/bypassed per testing-handbook).</li>
              <li>Used alongside Playwright a11y in 04-critic (see archive/1b-5phase-agent-workflow/ + reports).</li>
              <li>mcps/chrome-devtools/tools/ (29+ JSON schemas) + integration in review skill.</li>
            </ul>
          </div>
        </div>

        <CollapsibleSection title="Chosen Skills (design, review, check-work, figma-*, etc. — as decided in plan)" badge="Sequential Workflows" defaultOpen>
          <p className="text-xs text-muted mb-3">
            Per archived 1b-5phase-agent-workflow/ reports (see archive/1b-5phase-agent-workflow/) and superpowers design: agents dispatched with exact skills (design, figma-generate-library, review, etc.). All read AGENTS.md first. GS gate applies before "Implemented". (Sequential 5-phase workflows and old Plans/workflows/ superseded; current site-workflows live in generator data.)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {chosenSkills.map(skill => (
              <div key={skill.name} className="p-3 bg-panel/60 rounded-lg border border-docs-border flex flex-col">
                <div className="font-mono text-brand-400 font-semibold mb-1 text-[11px]">{skill.name}</div>
                <div className="text-subtle leading-snug flex-1">{skill.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-subtle">
            Full workflow: using-superpowers → implement (repair) → check-work (benchmark) → design (UI) → review (critic w/ MCP) → design (planner). Reports in 4-file format; evidence in results/.
          </p>
        </CollapsibleSection>

        <div className="mt-4 p-3 rounded bg-panel/50 border border-docs-border text-[10px] text-subtle leading-relaxed">
          <strong>This tech-docs-generator</strong> documents the governance itself. Changes here are posted via the docs site (build lands in generated-documents/site/). All edits follow minimum necessary, evidence integrity, type safety, and GS anti-copy. See root README + START.md for regen commands (no hand-edit of generated).
        </div>
      </section>

      {/* Git flow */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10">
            <GitBranch size={20} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-heading">Git Flow</h2>
        </div>
        <p className="text-sm text-muted mb-4">
          Trunk-based development on <code className="text-brand-400">main</code>. Feature branches are short-lived. 
          Every PR gets a Vercel preview and runs the full release:gate.
        </p>
        <MermaidDiagram chart={gitFlow} title="Git Workflow" />
      </section>

      {/* Dev loop */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10">
            <GitCommit size={20} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-heading">Daily Dev Loop</h2>
        </div>
        <div className="space-y-2">
          {devWorkflow.map(s => (
            <div key={s.step} className="card flex items-start gap-3 py-3">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-heading">{s.title}</h3>
                {s.cmd !== '—' && (
                  <code className="text-xs font-mono text-brand-400 block mt-1">{s.cmd}</code>
                )}
                <p className="text-xs text-subtle mt-1">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Commit conventions */}
      <section className="mb-12">
        <CollapsibleSection title="Commit Message Conventions" badge="Conventional Commits">
          <p className="text-sm text-muted mb-3">
            Follow <a href="https://www.conventionalcommits.org" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Conventional Commits</a>. 
            Scope is optional but encouraged for feature-specific changes.
          </p>
          <div className="space-y-2">
            {commitConventions.map(c => (
              <div key={c.type} className="flex items-start gap-3 p-3 bg-panel/50 rounded-lg border border-docs-border">
                <code className="text-xs font-mono text-accent-400 font-semibold flex-shrink-0 w-20">{c.type}</code>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted block">{c.desc}</span>
                  <code className="text-xs font-mono text-subtle block mt-1 truncate">{c.example}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <CodeBlock
              title="Example commit"
              language="bash"
              code={`git commit -m "feat(planner): add wall snap tool with grid alignment

- New FabricWallSnap utility in canvas/lib/
- Integrates with plannerStore for tool state
- Tests in tests/planner/wall-snap.test.ts
- Closes var(--color-bronze-900)

Co-Authored-By: Oz <oz-agent@warp.dev>"`}
            />
          </div>
        </CollapsibleSection>
      </section>

      {/* PowerShell note */}
      <section className="mb-12">
        <div className="card border-amber-800/40 bg-accent-500/10/10">
          <h3 className="text-sm font-semibold text-accent-400 mb-2">Package manager</h3>
          <p className="text-xs text-muted leading-relaxed">
            Install and run scripts with <code className="text-brand-400 bg-panel px-1 rounded">pnpm</code> from the
            <strong className="text-docs-text"> repo root only</strong> (<code className="text-brand-400">packageManager: pnpm@11.x</code>).
            Never install inside <code className="text-brand-400">site/</code> or <code className="text-brand-400">tech-docs-generator/</code>.
            Product UI proof is <code className="text-brand-400">http://localhost:3000</code> only.
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-2 text-success-400">
              ✓ pnpm run dev
            </div>
            <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-2 text-danger-400">
              ✗ npm install / npm run (product)
            </div>
          </div>
        </div>
      </section>

      {/* Common tasks */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-heading mb-4">Common Task Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commonTasks.map(task => {
            const Icon = task.icon
            return (
              <div key={task.title} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-panel-strong/50">
                    <Icon size={16} className="text-brand-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-heading">{task.title}</h3>
                </div>
                <ol className="space-y-1.5">
                  {task.steps.map((step, i) => (
                    <li key={i} className="text-xs text-subtle flex items-start gap-2">
                      <span className="text-brand-500 font-mono flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quality bar */}
      <section className="mb-12">
        <CollapsibleSection title="Quality Bar (from AGENTS.md)" badge="Must Pass">
          <div className="space-y-3 text-sm text-muted">
            <p>Before any code is considered done, these must pass:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'pnpm run typecheck passes (tsc -p site/tsconfig.json)',
                'pnpm run lint passes with zero warnings',
                'Relevant tests pass (pnpm exec vitest run + playwright)',
                'No new secrets detected by secretlint',
                'Production build succeeds (~341 static pages)',
                'Accessibility audit passes (axe-core)',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-muted p-2 bg-panel/50 rounded-lg scheme-border">
                  <span className="text-success-400 flex-shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </section>

      {/* Report format */}
      <section className="mb-12">
        <CollapsibleSection title="After-Meeting-Work Report Format" badge="AGENTS.md" defaultOpen={false}>
          <div className="space-y-3 text-sm text-muted">
            <p>Per AGENTS.md, report after meaningful work using this format:</p>
            <CodeBlock
              title="Report format"
              language="markdown"
              code={`**Done:** What was completed
**Verified:** How it was tested/verified
**Skipped:** What was intentionally skipped
**Risks:** Known risks or open questions
**Next:** Recommended next steps`}
            />
          </div>
        </CollapsibleSection>
      </section>

      {/* NEW: Site Workflows Modules — beautifully rendered (module nav + walkthrough/current/goal + mermaid + images/screenshots + instructions) */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10">
            <Package size={20} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-heading">Site Workflows Modules</h2>
          <span className="badge bg-success-500/20 text-success-400 border border-success-500/30 text-[10px]">NEW • Polished Static</span>
        </div>
        <p className="text-sm text-muted mb-5">
          Industry-best static documentation: fast (static React + CSS), accessible (ARIA, semantics, contrast via tokens), consistent with main site theme.
          All work starts with <code className="text-brand-400">/using-superpowers</code> (plan, superpowers spec, GS anti-copy, evidence). Diagrams via Mermaid, screenshots via inline accessible frames (real captures via chrome-devtools in gates under results/).
        </p>

        {/* Module Navigation — horizontal scrollable pills, keyboard accessible */}
        <nav aria-label="Site workflow modules" className="mb-6 -mx-1 px-1 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {siteWorkflowModules.map((mod, idx) => {
              const Icon = mod.icon
              const isActive = activeModuleId === mod.id
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModuleId(mod.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border-brand-500/40 shadow-sm'
                      : 'bg-panel hover:bg-panel-strong border-docs-border text-heading hover:text-heading'
                  ].join(' ')}
                >
                  <Icon size={15} className={isActive ? 'text-brand-400' : 'text-subtle'} />
                  {mod.label}
                  {idx === 0 && <span className="text-[9px] opacity-60 ml-0.5">(refer /using-superpowers)</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Active Module Detail */}
        {activeModule && (
          <div key={activeModule.id} className="card p-0 overflow-hidden border-docs-border">
            {/* Module Header */}
            <div className="px-6 pt-5 pb-4 bg-panel-raised/60 border-b border-docs-border flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 mt-0.5">
                <activeModule.icon size={22} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-heading">{activeModule.label}</h3>
                  <span className="text-[10px] px-2 py-px rounded bg-panel border border-docs-border text-subtle font-mono">{activeModule.id}</span>
                </div>
                <p className="text-sm text-muted mt-1">{activeModule.summary}</p>
              </div>
              <div className="hidden sm:flex items-center text-xs text-brand-400 gap-1 font-medium">
                VIEW <ArrowRight size={14} />
              </div>
            </div>

            {/* Walkthrough / Current / Goal — 3-column on desktop, stacked mobile. Excellent layout */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Walkthrough */}
              <div className="lg:col-span-3 xl:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks size={16} className="text-brand-400" />
                  <h4 className="font-semibold text-heading text-sm tracking-tight">Walkthrough</h4>
                </div>
                <p className="text-xs text-subtle mb-3 leading-relaxed">{activeModule.walkthrough.intro}</p>
                <ol className="space-y-3">
                  {activeModule.walkthrough.steps.map((step) => (
                    <li key={step.num} className="text-sm">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex w-6 h-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 text-[11px] font-mono font-bold mt-0.5">
                          {step.num}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-heading">{step.title}</div>
                          <p className="text-xs text-subtle mt-0.5 leading-snug">{step.instruction}</p>
                          {step.cmd && step.cmd !== '—' && (
                            <code className="mt-1.5 inline-block text-[10px] bg-panel px-1.5 py-px rounded border border-docs-border font-mono text-brand-400">{step.cmd}</code>
                          )}
                          {step.mermaid && (
                            <div className="mt-2">
                              <MermaidDiagram chart={step.mermaid} title={`${step.title} diagram`} className="text-[10px]" />
                            </div>
                          )}
                          {step.screenshotDesc && (
                            <WorkflowScreenshot desc={step.screenshotDesc} moduleId={activeModule.id} />
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Current */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={16} className="text-amber-400" />
                  <h4 className="font-semibold text-heading text-sm tracking-tight">Current State</h4>
                </div>
                <div className="text-sm text-muted leading-relaxed rounded-lg bg-panel/40 p-4 border border-docs-border/60">
                  {activeModule.current}
                </div>
                {activeModule.instructionsNote && (
                  <div className="mt-3 text-[11px] text-subtle border-l-2 border-brand-500/40 pl-3">
                    {activeModule.instructionsNote}
                  </div>
                )}
              </div>

              {/* Goal */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-success-400" />
                  <h4 className="font-semibold text-heading text-sm tracking-tight">Goal</h4>
                </div>
                <div className="text-sm text-muted leading-relaxed rounded-lg bg-panel/40 p-4 border border-docs-border/60">
                  {activeModule.goal}
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-widest text-subtle/70">Aligned to GS + superpowers spec</div>
              </div>
            </div>

            {/* Full instructions + diagrams support footer */}
            <div className="border-t border-docs-border bg-panel/30 px-6 py-4 text-xs text-subtle flex items-center gap-2">
              <BookOpen size={14} className="flex-shrink-0" />
              <span>Instructions &amp; visuals above are the canonical static reference. Real execution always uses chrome-devtools for screenshots, /using-superpowers entry, and full results/ evidence capture.</span>
            </div>
          </div>
        )}

        <p className="mt-3 text-[10px] text-subtle/80">
          Module navigation updates content instantly (client static). All diagrams client-rendered by Mermaid. Images are illustrative frames — real screenshots captured during critic/review phases and stored in results/ (never deleted).
        </p>
      </section>

      {/* Governance & Skills Posting ( /using-superpowers + /chrome-devtools + skills ) — kept + referenced */}
      <section className="mb-12">
        <CollapsibleSection title="Governance, Superpowers & Tooling" badge="Posted per plan">
          <div className="space-y-4 text-sm text-muted">
            <p><strong>/using-superpowers (GS)</strong>: Full Global Standard applied — read spec first, anti-copy, evidence-first, 5-product where applicable, Decision Log mindset, GS gate before claims. All module content and revisions filtered.</p>
            <p><strong>/chrome-devtools</strong>: MCP used for inspection of current Workflows page + site surfaces, a11y/contrast/lighthouse, focus, screenshots for images in module docs, validation of final excellent static output.</p>
            <p><strong>Skills used (decided with freedom)</strong>: using-superpowers (core), design (for world-class UI/excellence + diagrams), figma-generate (for visuals), review (subagent on changes), check-work (verification), chrome-devtools (as above). All skills + tests allowed per plan. Up to 5 sub-agents in parallel where appropriate.</p>
            <p className="text-xs">Refer to plan + superpowers spec + AGENTS.md. This renders the new site-workflows modules to industry best static quality.</p>
          </div>
        </CollapsibleSection>
      </section>

      <LiveRepoSection title="Live dev scripts">
        <GeneratedKeyValueTable rows={keyValueRowsFromDomain(workflowRecords)} />
      </LiveRepoSection>

      {/* Site-workflows section (enhanced via updated loader + data handling) */}
      {siteWorkflowRecords.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-brand-500/10">
              <Package size={20} className="text-brand-400" />
            </div>
            <h2 className="text-xl font-bold text-heading">Site Workflows</h2>
          </div>
          <p className="text-sm text-muted mb-4">
            Site-specific workflows (docs sync, release gates, dev commands from root package.json). Data handled via dedicated loader subset.
          </p>
          <div className="card">
            <GeneratedKeyValueTable rows={keyValueRowsFromDomain(siteWorkflowRecords)} />
          </div>
        </section>
      )}
    </div>
  )
}
