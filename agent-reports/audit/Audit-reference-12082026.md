# Audit Reference — Consolidated Prior Audits

**Date compiled:** 2026-08-12
**Sources consolidated:**
1. `Deep CI and live-site audit for oo08082026.md` (CI + live-site, ~7.5KB)
2. `Mobile app shell for oando.co.md` (UX/UI prompt backlog, ~12.2KB)
3. `oo-deep-audit-v2.md` (10-phase remediation plan, ~13.1KB)

**Purpose:** Single-file reference so the 3 prior docs need not be opened individually. Preserves their substance; flags evidence-backed findings vs aspirational/narrative content. The live codebase + fresh commands remain the source of truth (per `AGENTS.md §1`) — where these docs conflict with code, code wins.

**Honest assessment of evidence value:** All 3 are narrative/prompt/aspirational. None contain file:line evidence or fresh command output. The quality targets (WCAG 2.2 AA, OWASP ASVS L2, LCP≤2.5s, INP≤200ms, CLS≤0.1) and the 10-phase remediation shape are the most reusable parts. Everything else was re-derived from the repo directly this session.

---

## Part 1 — CI and Live-Site Audit

*From: `Deep CI and live-site audit for oo08082026.md`*

### Repository shape
- Monorepo `pglcarpets/oo08082026` containing: Furniture Studio (`/oostudio`), Floor Planner (`/ooplanner`), marketing site (`(site)`), admin suite (`/admin/*`), tech-docs generator, operational tooling.
- CI orchestrated via multiple GitHub Actions under `.github/workflows` with gate-style jobs (`gate`, `gate-fast`, `gate-full`) enforcing pre-deploy checks.
- No GitHub Releases configured; single branch `main` — CI status on `main` is the primary deploy-readiness signal.

### CI signal (as of prior audit)
- PR #1 (Dependabot bump for `react-aria-components`): 4 check runs — `gate-full` (skipped), `gate` (two failures), `gate-fast` (failure).
- Failing checks linked to Actions runs (`31266959864`, `…872`, `…874`). Gate pipeline actively blocks merges on test/lint/boundary/governance breaks.
- `pnpm run gate` + related commands are top-level CI gates (per README / OPERATIONS_RUNBOOK).

### Branch and commit context
- Single non-protected branch `main` — all pushes go directly to primary deployment line.
- Latest commit at time of audit: `1d209d4413a1ee6ef52f5517b49fcb20056c60de` — `.gitignore`, Playwright config, Vite base paths in tests, robots metadata, TypeScript env/types, tech-docs test config.
- Visual regression snapshots under `tests/e2e/site-visual-regression.spec.ts-snapshots/*` modified — common cause of CI differences if baselines drift from tests.

### Workflows and responsibilities
- `release-gate.yml` — sits between tests and deployment; enforces governance (cost, safety, access) before agents/apps deploy.
- `site-ui.yml` — UI checks for marketing + product surfaces.
- `supabase-backup-r2.yml` — nightly `pg_dump` for both DBs + catalog snapshot + repo archive to R2 (02:15 UTC).
- `tech-docs.yml` — tech-docs build + gate.

### Live-site implications
- Live at `oostudiooplanner.vercel.app` — 4 surfaces: marketing `/`, Studio `/oostudio`, Planner `/ooplanner`, admin `/admin/*`.
- Studio ↔ Planner intentionally separated at namespace + persistence boundaries; `scan:boundaries` enforces no cross-app imports.
- Persistence modes depend on environment (disk vs Supabase); CI in non-prod must avoid writing to filesystem paths that are read-only in production. Mode-aware wrappers are part of gate tests.

### Primary CI failure vectors (as of prior audit)
- Gate jobs chain `typecheck`, `scan:boundaries`, test suites — any can fail after refactors (e.g. robots metadata + tsconfig changes).
- Visual regression: snapshot PNG changes without corresponding test updates (or vice versa).
- Tech-docs generator: `tests/tech-docs-generator/package.test.ts` + `tech-docs.yml`; mismatched Vite base paths, missing docs artifacts, Backstage/TechDocs config changes.

### Recommendations from prior audit
- Run gate locally: `pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate` on `main` before pushing.
- Inspect failing runs via `html_url` links from check runs — examine exact failing steps, don't guess.
- Snapshot discipline: treat UI snapshots as versioned contract; update tests + baselines consistently.
- Robots/sitemap: confirm sitemap URL matches production host; verify crawlers see correct robots + sitemap.
- Add Lighthouse / Web Vitals checks to `site-ui.yml` if not present.
- Embrace `release-gate` audit + score modes; build `governance.yaml`.
- Consider tag-based release workflow (`v*` triggers release publishing + gates).
- Keep tech-docs CI healthy so route/ops/schema docs stay current.

**Evidence value:** Contextual framing only. All facts re-derived this session from `AGENTS.md` + `package.json` + `OPERATIONS_RUNBOOK.md`. No file:line evidence in the original.

---

## Part 2 — UX/UI Prompt Backlog

*From: `Mobile app shell for oando.co.md`*

This is a **prompt backlog** (20 short prompts), not an audit. No file:line, no evidence. Preserved here as a reference of intended UX work; the live codebase is the source of truth for current state.

1. **Mobile app shell** — unified shell with minimal top bar + bottom tab bar (Home, Catalog, Planner, Studio, Account). Wrap `(site)` pages + `/ooplanner*` + `/oostudio*` when viewport < 768px. Canvas-first layouts on mobile; stay isolated via `@planner/*` / `@studio/*`.
2. **Homepage IA + CTA redesign** — hero strips (Government, Corporate, Retail & Office, Global Standards) + "Furniture That Works as Hard as You Do" driving flows into Products, Planner, Studio, Contact. Replace repeated "Explore Products / Contact Us" with sector-specific CTAs.
3. **Showrooms** — metrics row (clients, projects, sectors) as cards; elevate "View full gallery" + "workspace solutions" to primary buttons; guided "Book showroom visit" flow (date, time, location, project type) wired to contact/portal routes.
4. **Contact + quote flow** — corporate office / showroom / sales blocks with labeled actions (Call, WhatsApp, Email, Request quote); lightweight quote form (project type, headcount, location, timeline, budget band) integrated into admin/CRM so submissions surface in `/admin/customer-queries`.
5. **Policies** — refund + privacy summaries: "Key points" (3–5 bullets) atop each page; restructure long paragraphs into sections (Refunds, Returns, Cancellations, Data use, Cookies, Security, Contact); highlight contact methods as distinct action lines.
6. **Products + plan symbol contract** — align catalog views with `planSymbolPngContract.ts` and actual floorplan usage; every product card in `/products*` maps clearly to a plan symbol used in Planner; tests verifying mapping between product IDs and symbol assets.
7. **Planner marketing vs Planner app** — reconcile marketing `/planner`, `/planner/features`, `/planner/help` with real app `/ooplanner*`; clear CTAs + deep links from marketing into `/ooplanner` with context.
8. **Portal + dashboard journeys** — map `/dashboard` + `/portal/*` to real journeys (quote tracking, plan review, project status); simplified flows ("View my quotes", "View my plans", "Share plan with team").
9. **Admin UX standardization** — standard `AdminShell` (header, sidebar, content area); uniform table/grid components with filtering, sorting, bulk actions.
10. **Planner mobile canvas + panels** — full-screen canvas with collapsible bottom sheet for furniture rail + properties; core actions (Save, Export, BOQ, Back) always visible + thumb-reachable.
11. **Studio mobile UX** — match Planner's style but furniture-first; panel behavior for variants, materials, dimensions, AI helpers.
12. **Navigation consistency** — audit all nav (SiteHeader, MobileNavDrawer, Planner/Studio top bars); nav hierarchy: marketing chrome vs tool chrome vs admin chrome; enforce without copying code between Studio and Planner.
13. **Search UX** — header vs mobile drawer search; debounce, results, fallbacks; unified search result design + ranking.
14. **Accessibility pass** — WCAG 2.2 AA for `/`, `/showrooms`, `/contact`, `/products`, `/ooplanner`, `/oostudio`, `/portal`, `/dashboard`; headings, landmarks, ARIA roles, focus order, keyboard support; route-by-route checklist.
15. **Performance budgets + instrumentation** — LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 for key pages; identify heavy assets + blocking scripts; code splitting, image optimization, skeleton screens; metrics instrumentation plan (Lighthouse/Playwright + logging).
16. **Offline behavior** — integrate `/offline` with app shell + key flows; define how `/offline` is reached; offline messaging + options (retry, cached views, contact later).
17. **Tech-docs alignment** — update `docs/architecture/*` + tech-docs generator to reflect new UX + shell; route maps, domain descriptions, shell descriptions; `check:docs-all` + tech-docs gates pass.
18. **Release-gate governance for UX + perf** — wire UX/perf/security checks into `release-gate.yml`; governance yaml metrics (UX tests, Lighthouse budgets, accessibility checks); block releases on fail.
19. **Visual regression baselines** — expand + refine snapshots for critical routes (homepage, showrooms, contact, products listing, Planner canvas, Studio canvas, portal/dashboard); update baselines once new UX implemented.
20. **Content refinement** — sharpen homepage + about copy (Patna/Jharkhand, government/corporate/etc.); case study pages for Titan/DMRC/Usha (project overview, challenges, solutions, products used, photos); BOQ handoff → admin CRM integration; language + i18n UX; edge/proxy + routing sanity; end-to-end QA script (human + AI).

**Evidence value:** Aspirational prompt list. Useful as a backlog of intended UX work; not a statement of current state. Many items already partially implemented per live code read this session.

---

## Part 3 — 10-Phase Remediation Plan (v2)

*From: `oo-deep-audit-v2.md`*

### Quality targets (reusable, evidence-backed in `docs/governance/benchmarks.md`)
- WCAG 2.2 Level AA — full conformance, 0 unreviewed axe violations.
- WCAG 2.2 SC 2.5.5 Target Size (Enhanced) — 44×44 CSS px (AAA, exceeds AA 2.5.8 24×24).
- OWASP ASVS L2 (risk-based).
- LCP ≤ 2.5s p75 · INP ≤ 200ms p75 · CLS ≤ 0.1 · pointer→paint ≤ 100ms · frame ≤ 16.7ms.

### Domains and zones
- **Site (marketing):** `(site)/*`, `components/home/`, `features/site/`.
- **Admin:** `/admin/*`, `features/admin/`.
- **Planner fork:** `/ooplanner*`, `features/Planner/`, `components/Planner/`, `lib/Planner/`, `@planner/*`.
- **Studio fork:** `/oostudio*`, `features/Studio/`, `components/Studio/`, `lib/Studio/`, `@studio/*`.
- **Tech-docs SPA:** `tech-docs-generator/` (inventory UI, not FOCSS).

Per-domain evaluation: layout paradigm (top/bottom chrome, app shell, panel behavior); interaction stack (canvas engine, dock layout, store mode disk vs Supabase); shared rules (semantic tokens, loading/empty/error states, no silent failure, keyboard support).

### Page-level audit parameters
For every route: domain + zone; surface type (marketing/catalog/portal/tools/admin/docs); primary job story; navigation topology (entry/exit nodes); layout (mobile + desktop); interaction (primary flows, wizards, drag/drop, search/filter, error handling); visual design (FOCSS tokens, typography, color, icons); accessibility (semantics, focus, keyboard, ARIA); performance (critical path payload, prefetching, code splitting).

### The 10 phases

**Phase 1 — App Shell Unification.** Unified app shell across domains: mobile bottom tabs (Home, Catalog, Planner, Studio, Account), desktop consistent top chrome with domain markers. Remove marketing-only header behavior from tool surfaces. Success: all tools render within dedicated app shell distinct from marketing; mobile tabs test-covered.

**Phase 2 — Planner & Studio Interaction Redesign.** Canvas-first, panel-second. Predictable undo/redo, selection, zoom. Documented tool patterns (selection, movement, rotation, snapping); documented keyboard mappings + touch gestures per fork.

**Phase 3 — Catalog + Symbol Contract Reform.** `planSymbolPngContract.ts` + catalog adapters. Clear visual mapping between catalog cards + plan symbols. Performance budgets met on catalog routes.

**Phase 4 — Portal, Dashboard, Quote Flow Consolidation.** Unify customer flows into well-shaped journeys. Documented flows: "new customer from quote", "repeat customer from dashboard". Fewer screens, more clarity.

**Phase 5 — Admin UX + Governance.** `AdminShell` across all `/admin/*`. Standard tables + filters. Bulk edit patterns. Governance rules in `docs/governance`.

**Phase 6 — Accessibility + Semantics Enforcement.** WCAG 2.2 AA for key flows. Audit report listing controls, labels, roles, focus paths. CI checks (lint + runtime tests).

**Phase 7 — Performance + Offline Contracts.** LCP/INP/CLS monitored + budgeted. Offline behaviors wired to clear contracts.

**Phase 8 — Release + Governance (release-gate).** `release-gate.yml`, `site-ui.yml`, `tech-docs.yml`. Governance yaml defines metrics, tests, evidence packs. Release-gate scores interpreted in `docs/governance`.

**Phase 9 — Tech-Docs + System Map.** `tech-docs-generator`, `docs/architecture/*`, `site/platform/route-contract.json`. Every route, flow, domain introspectable via tech-docs. `check:docs-all` passes alongside UX changes.

**Phase 10 — Continuous UX Regression Protection.** Harden against UX regressions via tests + snapshots. Visual regression suite aligned with app shell + key flows. Gate commands (`pnpm run gate`) include UX-critical tests.

### Per-route deep audit checklist (from v2)

**Interactive apps:**
1. `/` — marketing homepage. Hero clarity, CTA hierarchy, app-shell behavior on mobile, header/brand consistency.
2. `/oostudio` — Furniture Studio. Canvas layout (Fabric + dockview), toolbars/panels/save-export, mode-aware persistence.
3. `/ooplanner` — Planner. Canvas/rails/panel layout, project creation/editing, handoff to staff via BOQ.
4. `/ooplanner/projects` + `/ooplanner/projects/[id]` — list semantics + filters, detail screen layout, back navigation.
5. `/offline` — integration with app shell, clear recovery options.

**Site/marketing pages:** `/about`, `/access`, `/career`, `/clients`, `/trusted-by` (trust + story); `/planning`, `/planner`, `/planner/features`, `/planner/features/[slug]`, `/planner/help` (planner marketing vs app); `/products`, `/products/*`, `/products/category/*` (catalog); `/solutions`, `/solutions/[category]` (solution nav); `/quote-cart`, `/contact`, `/showrooms`, `/service`, `/downloads` (transactional); `/sustainability`, `/privacy`, `/terms`, `/refund-and-return-policy` (legal); `/dashboard`, `/portal`, `/portal/*`, `/login` (auth/member).

**Admin routes:** `/admin` + all `/admin/*` — catalog, CRM, themes, price books, inventory, workspace catalog. Consistency of admin chrome, data-dense layouts, sorting/filtering, form behaviors + validation.

**Evidence value:** The quality targets + 10-phase shape are reusable (and align with `docs/governance/benchmarks.md` verified this session). The per-route checklist is a useful audit template. No file:line evidence in the original — all specifics re-derived from live code.

---

## Cross-reference to current audit program

This session's audit program (`00-audit-program.md`) supersedes these 3 docs for **current state**. Mapping:

| Prior doc concept | Current audit track |
|---|---|
| v2 quality targets (WCAG/OWASP/CWV) | Tracks 4 (security), 6 (Lighthouse), 7 (a11y) |
| v2 Phase 1 app shell | Tracks 1 (desktop), 2 (mobile) |
| v2 Phase 2 interaction | Tracks 1, 2 |
| v2 Phase 3 catalog/symbol | Track 9 (API safety) + catalog in track 1 |
| v2 Phase 4 portal/dashboard | Tracks 1, 2 (route coverage) |
| v2 Phase 5 admin | Tracks 1, 2 (admin routes) |
| v2 Phase 6 a11y | Track 7 |
| v2 Phase 7 perf/offline | Track 6 |
| v2 Phase 8 release-gate | Track 11 (VR/E2E) + Phase B/C gates |
| v2 Phase 9 tech-docs | Track 11 + `check:docs-all` |
| v2 Phase 10 VR | Track 11 |
| CI audit gate failures | Track 11 + Phase B verification |
| UX prompt backlog (20 items) | Folded into Phase C fix sequence by priority |

**Bottom line:** These 3 docs provided the quality targets + a remediation shape. The actual evidence (198 files: 179 screenshots + 19 axe/console JSON under `results/audit/`, plus 3 track reports `01-ui-desktop.md`, `02-ui-mobile.md`, `07-accessibility.md`) was produced this session by reading the repo + running fresh commands. Code wins.
