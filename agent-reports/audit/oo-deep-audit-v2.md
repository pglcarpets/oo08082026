# OOplannerOOStudio Deep Page-by-Page Audit and 10-Phase Remediation Plan (v2)

Scope: All live Next.js `page.tsx` routes listed in `docs/architecture/routes.md`, aligned with product domains and UI zones from `docs/architecture/product-map.md`.[cite:29][cite:31]

Authority: user instruction → live code + fresh command output → `AGENTS.md` → `docs/**`.[cite:28]

Quality targets: WCAG 2.2 AA, OWASP ASVS L2, LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 — enforced via tests and browser proof, not static docs.[cite:31]

---

## 1. Domain and Zone-Level Audit

Before page-level work, establish per-domain baselines:

- Site (marketing): `(site)/*`, `components/home/`, `features/site/`.[cite:31]
- Admin: `/admin/*`, `features/admin/`.[cite:31]
- Planner fork: `/ooplanner*`, `features/Planner/`, `components/Planner/`, `lib/Planner/`, `@planner/*`.[cite:31]
- Studio fork: `/oostudio*`, `features/Studio/`, `components/Studio/`, `lib/Studio/`, `@studio/*`.[cite:31]
- Tech-docs SPA: `tech-docs-generator/` (inventory UI, not FOCSS).[cite:31]

For each domain/zones, evaluate:

- Layout paradigm: top/bottom chrome, app shell presence, panel behavior.
- Interaction stack: canvas engine, dock layout, store mode (disk vs Supabase).
- Shared rules: semantic tokens, loading/empty/error states, no silent failure, keyboard support.

---

## 2. Page-Level Audit Parameters (Expanded)

For every route, evaluate at least:

- Domain and zone: site / admin / planner / studio / tech-docs.
- Surface type: marketing / catalog / portal / tools / admin / docs.
- Primary job story: concrete user intent ("plan a living room", "get a quote", "see price books").
- Navigation topology:
  - Entry nodes (header, app shell, deep links, redirects).
  - Exit nodes (next logical screens, back paths).
- Layout:
  - Mobile: app shell, header, safe areas, thumb reach, canvas/panel proportions.
  - Desktop: grid, chrome, panel structure.
- Interaction:
  - Primary flows, multi-step wizards, drag/drop, search/filter.
  - Error handling, confirmation patterns.
- Visual design:
  - FOCSS tokens, typography, color, icon usage.
- Accessibility:
  - Semantics, focus, keyboard, ARIA.
- Performance:
  - Critical path payload, prefetching, code splitting.

---

## 3. Per-Route Deep Audit Checklist

### 3.1 Interactive Apps

1. `/` — Marketing homepage
   - Domain: site.
   - Job stories: discover Oando, reach Planner/Studio, start quote.
   - Audit:
     - Hero clarity and CTA hierarchy.
     - App-shell behavior on mobile (tabs, actions).
     - Consistency of header and brand across domains.

2. `/oostudio` — Furniture Studio
   - Domain: Studio fork.
   - Job stories: author furniture, use AI helpers, save to catalog.[cite:31]
   - Audit:
     - Canvas layout (Fabric canvas, dockview shell).[cite:31]
     - Toolbars, panels, save/export flows.
     - Mode-aware persistence (disk vs Supabase).

3. `/ooplanner` — Planner
   - Domain: Planner fork.
   - Job stories: lay out rooms, place furniture, generate BOQ.[cite:31]
   - Audit:
     - Canvas, rails, panel layout.
     - Project creation/editing.
     - Handoff to staff via BOQ.

4. `/ooplanner/projects` & `/ooplanner/projects/[id]`
   - Domain: Planner.
   - Job stories: manage and open plans.
   - Audit:
     - List semantics and filters.
     - Detail screen layout.
     - Navigation back to list.

5. `/offline`
   - Domain: site.
   - Job stories: explain offline state, offer recovery.
   - Audit:
     - Integration with app shell.
     - Clear options (retry, cached views, contact).

### 3.2 Site / Marketing Pages

Apply full parameter set to each:

6. `/about`, `/access`, `/career`, `/clients`, `/trusted-by`: trust and story.
7. `/planning`, `/planner`, `/planner/features`, `/planner/features/[slug]`, `/planner/help`: explain Planner, differentiate marketing from app routes.
8. `/products`, `/products/*`, `/products/category/*`: catalog navigation, filters, card design.
9. `/solutions`, `/solutions/[category]`: solution-based navigation.
10. `/quote-cart`, `/contact`, `/showrooms`, `/service`, `/downloads`: transactional flows and contact points.
11. `/sustainability`, `/privacy`, `/terms`, `/refund-and-return-policy`: legal and policy clarity.
12. `/dashboard`, `/portal`, `/portal/*`, `/login`: auth, member, and portal UX.

### 3.3 Admin Routes

13. `/admin` and all `/admin/*` routes: admin flows for catalog, CRM, themes, price books, inventory, workspace catalog.[cite:29]

Audit:

- Consistency of admin chrome.
- Data-dense layouts and sorting/filtering.
- Form behaviors and validation.

---

## 4. Ten-Phase Remediation Plan (v2, More Aggressive)

Each phase has crisp success criteria and CI hooks.

### Phase 1 — App Shell Unification

Scope: site + Planner + Studio + portal/dashboard.

Goals:

- Introduce a unified app shell across domains:
  - Mobile: bottom tabs, minimal header.
  - Desktop: consistent top chrome with domain markers.
- Remove marketing-only header behavior from tool surfaces.

Success criteria:

- All tools (`/ooplanner`, `/oostudio`, portal, dashboard) render within a dedicated app shell distinct from marketing.
- Mobile tabs exist and are test-covered for Home, Catalog, Planner, Studio, Account.

### Phase 2 — Planner & Studio Interaction Redesign

Scope: Planner and Studio forks.

Goals:

- Redesign interaction model as native-feeling tools:
  - Canvas-first, panel-second.
  - Predictable undo/redo, selection, and zoom.

Success criteria:

- Defined, documented tool patterns (selection, movement, rotation, snapping).
- Documented keyboard mappings and touch gestures.

### Phase 3 — Catalog and Symbol Contract Reform

Scope: `/products*`, catalog adapters, `planSymbolPngContract.ts`.[cite:31]

Goals:

- Make catalog UI honest, fast, and aligned with plan symbol contract.

Success criteria:

- Clear visual mapping between catalog cards and plan symbols.
- Performance budgets met on catalog routes.

### Phase 4 — Portal, Dashboard, and Quote Flow Consolidation

Scope: `/dashboard`, `/portal*`, `/quote-cart`.

Goals:

- Unify customer flows into a small number of well-shaped journeys.

Success criteria:

- Clearly documented flows: "new customer from quote", "repeat customer from dashboard".
- Fewer screens, more clarity per screen.

### Phase 5 — Admin UX and Governance

Scope: `/admin/*`, `features/admin/`, governance docs for admin.[cite:31]

Goals:

- Make admin usable at scale: bulk operations, views tuned for staff, explicit data contracts.

Success criteria:

- Standard admin layout applied across routes.
- Bulk edit patterns established and documented.

### Phase 6 — Accessibility and Semantics Enforcement

Scope: all domains.

Goals:

- Achieve WCAG 2.2 AA for key user flows.

Success criteria:

- Audit report listing controls, labels, roles, and focus paths.
- CI checks for accessibility (lint + runtime tests).

### Phase 7 — Performance and Offline Contracts

Scope: `/`, app entries, `/offline`.

Goals:

- Make performance constraints real and monitorable.

Success criteria:

- LCP/INP/CLS monitored and budgeted.
- Offline behaviors wired to clear contracts.

### Phase 8 — Release and Governance (release-gate)

Scope: CI workflows (`release-gate.yml`, `site-ui.yml`, `tech-docs.yml`).[cite:9][cite:31]

Goals:

- Make release-gate enforce UX, performance, and security.

Success criteria:

- Governance yaml defines metrics, tests, and evidence packs.
- Release-gate scores and gates are interpreted in `docs/governance`.

### Phase 9 — Tech-Docs and System Map

Scope: `tech-docs-generator`, `docs/architecture/*`, `site/platform/route-contract.json`.[cite:29][cite:31]

Goals:

- Keep every route, flow, and domain introspectable via tech-docs.

Success criteria:

- Tech-docs SPA shows route maps and domain boundaries.
- `check:docs-all` passes alongside UX changes.[cite:28]

### Phase 10 — Continuous UX Regression Protection

Scope: all domains.

Goals:

- Harden against UX regressions via tests and snapshots.

Success criteria:

- Visual regression suite aligned with app shell and key flows.
- Gate commands (`pnpm run gate`) include UX-critical tests.

---

## 5. Improved AI Prompt Templates (Per Phase)

Below are more precise templates designed for AI coding assistants.

### Prompt — Phase 1: App Shell Unification

"You are redesigning the UI architecture of `ooplanner-oostudio` to use a unified app shell.

Context:
- Domains: site, admin, Planner, Studio.
- Current mobile UX: marketing header + large navigation drawer.

Goal:
- Implement a `UnifiedAppShell` component with:
  - Mobile bottom tab bar (Home, Catalog, Planner, Studio, Account).
  - Domain-aware top chrome.

Tasks:
- Create `UnifiedAppShell` and integrate it with:
  - `(site)` pages for Home, catalog, solutions, contact.
  - `/ooplanner*` and `/oostudio*` tool routes.
  - `/dashboard`, `/portal*`, `/login`.
- Ensure shell only changes layout, not data flow.
- Respect domain boundaries: no shared modules between Studio and Planner.

Return:
- Updated TypeScript/React code and CSS/FOCSS needed to wire the shell.
- Explanation of how tabs and domain markers are computed from `usePathname`."

### Prompt — Phase 2: Planner & Studio Interaction Redesign

"You are refactoring the Planner and Studio forked apps to have clear, documented interaction models.

Goal:
- Define and implement consistent interactions: selection, movement, snapping, zoom, pan.

Tasks:
- Identify main interaction components in `features/Planner` and `features/Studio`.
- Implement shared patterns within each fork (but not between forks).
- Document keyboard shortcuts and touch gestures in code comments and reference docs.

Return:
- Updated components and hooks for interactions.
- A summary of the interaction contract per fork."

### Prompt — Phase 3: Catalog and Symbol Contract Reform

"You are aligning catalog UI with the plan symbol PNG contract.

Goal:
- Ensure each product card corresponds clearly to a plan symbol.

Tasks:
- Inspect `lib/catalog/planSymbolPngContract.ts` and related catalog adapters.
- Update catalog cards and listing layouts to show symbolic representations.
- Add tests verifying mapping between cards and plan symbols.

Return:
- Code changes to catalog views.
- Tests mapping products to plan symbols."

### Prompt — Phase 4: Portal, Dashboard, and Quote Flow Consolidation

"You are consolidating portal, dashboard, and quote flows into clear journeys.

Goal:
- Define a small set of user journeys and refactor screens accordingly.

Tasks:
- Map current routes under `/dashboard`, `/portal*`, `/quote-cart`.
- Identify redundant screens and merge or remove them.
- Implement journey views for: new customer, returning customer, quote follow-up.

Return:
- Code changes to routes and layouts.
- Journey diagrams as comments or docs."

### Prompt — Phase 5: Admin UX and Governance

"You are standardizing admin UX and documenting governance.

Goal:
- Create a consistent admin layout with traceable governance rules.

Tasks:
- Implement an `AdminShell` used by all `/admin/*` routes.
- Standardize tables and filters.
- Document governance rules for admin actions in `docs/governance`.

Return:
- Updated admin layout code.
- Governance documentation excerpts."

### Prompt — Phase 6: Accessibility and Semantics Enforcement

"You are enforcing accessibility on critical routes.

Goal:
- Achieve WCAG 2.2 AA for main user flows.

Tasks:
- For `/`, `/products`, `/ooplanner`, `/oostudio`, `/portal`, `/dashboard`:
  - Audit headings, landmarks, ARIA.
  - Fix focus order and traps.

Return:
- Code changes and a short checklist of fixes per route."

### Prompt — Phase 7: Performance and Offline Contracts

"You are making performance and offline contracts concrete.

Goal:
- Define and implement performance budgets, offline behaviors.

Tasks:
- Add metrics instrumentation for LCP/INP/CLS.
- Implement skeletons for `/`, `/ooplanner`, `/oostudio`.
- Wire `/offline` into app shell.

Return:
- Code changes and metrics configuration."

### Prompt — Phase 8: Release and Governance (release-gate)

"You are wiring UX and performance into `release-gate`.

Goal:
- Make release-gate enforce UX, performance, and security.

Tasks:
- Define governance yaml with metrics, tests, and evidence packs.
- Integrate gate checks into CI workflows.

Return:
- Governance yaml and updated workflows."

### Prompt — Phase 9: Tech-Docs and System Map

"You are aligning tech-docs and system maps with the new UX architecture.

Goal:
- Reflect routes, domains, and shells accurately in tech-docs.

Tasks:
- Update `docs/architecture/*` and tech-docs generator.
- Ensure `check:docs-all` passes.

Return:
- Doc updates and generator config changes."

### Prompt — Phase 10: Continuous UX Regression Protection

"You are expanding visual and interaction tests to protect UX.

Goal:
- Prevent regressions in layout, shell, and key flows.

Tasks:
- Add Playwright tests and visual snapshots for critical routes.
- Integrate tests into gate commands.

Return:
- Test specs and CI updates that enforce UX invariants."
