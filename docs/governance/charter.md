# Programme Charter — Locked Decisions and Baseline

> **Control document: [`rules.md`](./rules.md).** It owns the goals, the execution
> order, the status ledger and the exit gates. This file owns the **locked decisions**,
> the configuration envelope, the storage shape and the baseline task. Where the two
> appear to disagree on order or status, `README` wins.

> **For agentic workers:** work task-by-task; steps use checkbox (`- [ ]`) syntax
> for tracking. Root `AGENTS.md` and `Agents/*.md` bind regardless.

**Goal:** Product Studio and Planner reach the eight measured targets in
[`README` §2](./rules.md#2-programme-goals) — publish integrity, no dead capability,
WCAG 2.2 AA, Core Web Vitals and RAIL budgets, ≥ 8.5/10 workspace ergonomics,
configurability without invariant loss, a green gate, and commercial truth — under the 32
decisions locked below.

**Architecture (live fork):** Furniture Studio (`/oostudio`) and Floor Planner (`/ooplanner`) are forked trees with **dockview-react** shells and Fabric 2D (no in-app Three.js as of 2026-08-03). Residual Oando marketing + admin remain under `app/(site)` and `app/admin`. FOCSS owns visual tokens; shadcn/Radix is admin product chrome. Plan-symbol contract code lives at `site/lib/catalog/planSymbolPngContract.ts` when used.

**Tech Stack (declared / used):** Next.js 16.3 preview, React 19.2, TypeScript 7, Zod, Fabric, dockview-react, Zustand, React Hook Form, shadcn/Radix (admin), React Aria Components (forked app UI), FOCSS, Phosphor, Supabase/Postgres + Drizzle, Sharp, Mastra core/LanceDB/Orama (AI residual), Vitest, Playwright (`config/build/playwright.config.ts` present). Install/scripts: **pnpm 11** from repo root only.

**Storage envelope (live):** exclusive-mode persistence — disk under
`DEV_AUTH_BYPASS=1` on non-production builds, Supabase otherwise. Production's
filesystem is read-only, so disk is never a production write path. Planner
projects → `oando_plans`; furniture library → `furniture_catalog` + the
`catalog-assets` bucket; published descriptors → `block_descriptors`. Decision
**E4 (retire deliberately)** is honoured in the database by the admin `archive`
schema rather than by dropping tables.

---

Updated: 2026-07-28

## Authority and baseline

This folder is the revised implementation programme. It starts from verified live code,
not from old intent.

The completed PNG-cutover work formerly in `plans/admin/new/` (legacy layout) is frozen as historical
evidence. **That folder is no longer in the working tree** — recover it from git history if
needed. Its conclusions still bind:

- published plan symbols remain PNG plus sha256 and public URL;
- server rendering remains release authority;
- Planner still paints the published URL through `FabricImage`;
- `Block2D` remains load-failure fallback;
- Admin product-studio tree is **not** present on disk in this checkout (fork Studio is `/oostudio`);

The files in this folder replace the proposed upgrade portion only. They do not rewrite
closed cutover evidence.

## Programme files

The document map is [`README` §11](./rules.md#11-document-map). The binding execution
order — blocker-first, in four stages — is [`README` §3](./rules.md#3-execution-order).

Note that **numeric file order is not execution order**: `0011` runs between `0004` and
`0005`, and `0000`, `0009`, `0010`, `0012` and `9999` are reference documents that are
never executed as steps.

## Locked decisions

| ID | Decision | Locked value |
|---|---|---|
| R1 | Product Studio rendering | React Flow authoring -> repo-owned ShapeDraft -> server SVG/Sharp -> PNG |
| R2 | Planner rendering | Fabric remains the only Planner 2D engine |
| R3 | Product visual system | Admin + workspace chrome use FOCSS tokens plus **FOCSS + React Aria** controls (`site/components/ui/*`, admin UI) — not a shadcn registry |
| R4 | Site visual system | Site and marketing remain FOCSS-native; no Product shadcn chrome |
| R5 | Icons | Phosphor only in live source; remove Lucide dependency and generator claim |
| R6 | Theme | FOCSS and repository theme contracts own color scheme; remove `next-themes` |
| R7 | Studio workspace layout (live fork) | **dockview-react** shell under `/oostudio` (`StudioDockShell`); no shared FlexLayout host on disk |
| R8 | Planner workspace layout (live fork) | **dockview-react** shell under `/ooplanner` (`PlannerDockShell`); mobile may use simplified chrome |
| R9 | Persisted layout | Semantic profile IDs, slots, order and size bands only; never raw package JSON |
| R10 | State | Store-per-workspace Zustand runtime; normalized documents remain persistence authority |
| R11 | Forms | React Hook Form plus Zod for submitted metadata/configuration; never canvas pointer state |
| R12 | AI | Mastra/LanceDB/Orama remain server-side advisory infrastructure |
| R13 | AI application | Suggestions require preview and explicit Apply; Apply creates one undo transaction |
| R14 | Packages | No second canvas, graph, history, docking, form or theme package |
| R15 | React Flow UI | Free source registry only; no Pro examples, templates, runtime or entitlement |
| R16 | Configuration | Separate Product Studio and Planner schemas/registries/pages; shared types only |
| R17 | Administrator power | Optional implemented tools may be toggled/reordered; safety actions remain mandatory |
| R18 | Mobile | "Phone" means responsive browser at 390px; dock shells may simplify below desktop breakpoints |
| R19 | Feature completeness | Every useful feature named in `0001`-`0008` has implementation and verification tasks |
| R20 | Forbidden editor features | Product Studio has no edges, connectors, external image href, script, filter or infinite whiteboard |
| R21 | Responsive configuration | Admin profiles own sanctioned phone tool/sheet order; required actions remain reachable |
| R22 | Product accessibility | React Flow accessibility props, keyboard editing, forced colors and virtual keyboard are explicit contracts |
| R23 | Planner commercial path | Placement, Properties, Validation, Review/BOQ and Commands cannot be disabled |
| R24 | Package operations | Node 24, native externalization/preflight, license notices and route/deployment budgets are enforced |
| R25 | Critical desktop widths | 1440x900 and 1920x1080 run equivalent full Product Studio, Planner, Admin, handoff, accessibility and owner journeys |
| R26 | Assistive technology | NVDA plus Chromium manual completion evidence is required at both critical desktop widths |
| R27 | Composer chrome | Persistent controls live in one toolbar outside the React Flow viewport; `Panel`/`ControlButton` carry only viewport-anchored affordances |
| R28 | Icon truth | Icons are Phosphor components; a text glyph is never an icon |
| R29 | Style coverage | Every composer class name has exactly one owning FOCSS rule; no unstyled class, no dead rule |
| R30 | Layout ownership | An element carrying a FOCSS block class takes its layout from FOCSS; Tailwind on that element is limited to the shared token layer |
| R31 | No placeholders | An enabled panel or sheet renders real content or leaves the registry; prose explaining that a feature is elsewhere is not content |
| R32 | Shortcut authority | One keydown owner per workspace; presentational controls never register global chords |

**R3/R4 rationale:** FOCSS is a plain CSS tree with no JS behavior layer — interactive
widgets need a behavior layer (focus trap, expanded state, etc.). Live product/admin use
**React Aria Components** + FOCSS tokens for that; marketing stays FOCSS-only. One token
layer; no resurrecting shadcn registry chrome. Live CSS map:
[`docs/architecture/css.md`](../architecture/css.md).

## Workspace configuration envelope

Both workspaces use separate payload schemas inside one auditable envelope:

```ts
export const WorkspaceIdSchema = z.enum(["product-studio", "planner"]);

export const WorkspaceConfigurationEnvelopeSchema = z
  .object({
    id: z.string().uuid(),
    workspace: WorkspaceIdSchema,
    profileKey: z.string().regex(/^[a-z0-9-]+$/),
    schemaVersion: z.number().int().positive(),
    revision: z.number().int().nonnegative(),
    active: z.boolean(),
    payload: z.unknown(),
    updatedAt: z.string().datetime(),
    updatedBy: z.string().min(1),
  })
  .strict();
```

`payload` is parsed by `ProductStudioConfigurationSchema` or
`PlannerWorkspaceConfigurationSchema` after the envelope identifies the workspace.

## Shared storage

Create one managed table, with separate payload validation in code:

```sql
create table if not exists public.workspace_editor_configs (
  id uuid primary key default gen_random_uuid(),
  workspace text not null check (workspace in ('product-studio', 'planner')),
  profile_key text not null,
  schema_version integer not null,
  revision bigint not null default 0,
  active boolean not null default false,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null,
  unique (workspace, profile_key)
);
```

Add a partial unique index so each workspace has one active profile. Service-role writes
stay behind authenticated Admin APIs.

## Dependency order

Superseded by [`README` §3](./rules.md#3-execution-order), which reorders the same
dependency chain blocker-first now that `0001`–`0004` and `0011` are partially built. The
underlying dependency remains: Product Studio contracts are verified before Planner
consumes shared configuration infrastructure.

## Global product outcomes

Each block below is the qualitative statement of a measured goal. The number that closes
it is in [`README` §2](./rules.md#2-programme-goals); the standard behind that number is
in [`0012`](./benchmarks.md).

### Product Studio — closes G1, G5, G6

- upload and compose remain separate authoring modes with one publish path;
- Save draft/autosave is separate from Publish;
- undo/redo, clipboard, duplicate, layers, lock, visibility, rename, search, z-order,
  align, distribute, guides, grid, snap and shortcuts are complete;
- text, dimensions, sanitized path import, groups and templates publish deterministically;
- administrators configure optional tools and semantic layouts on a separate page;
- desktop uses limited FlexLayout; responsive browser widths use fixed layouts and sheets.

### Planner — closes G2, G4, G8

- all listed drawing/placement/text tools are live and truthfully described;
- one command/tool registry drives rail, palette, shortcuts and Admin configuration;
- history, selection, autosave, offline queue and conflict recovery have one authority each;
- desktop FlexLayout is generated from semantic profiles;
- mobile browser uses command strip and sheets, not FlexLayout;
- BOQ uses active price-book authority and never invents prices;
- AI can retrieve and suggest, but cannot mutate without explicit preview and Apply.

### Site handoff — closes G3, G7

- Product pages carry product/category/source continuity into Planner;
- Site remains FOCSS-native;
- relevant launch, empty, error and mobile states are browser-verified;
- marketing motion never blocks the workspace or violates reduced-motion.

## Structural invariants

Programme completion is defined in [`README` §9](./rules.md#9-definition-of-done). These
are the structural facts that must hold underneath it — each is machine-checkable, and
each belongs to a numbered plan's exit gate.

- [ ] No `lucide-react` or `next-themes` dependency/import remains.
- [ ] `@xyflow/system` remains transitive.
- [ ] No Pro React Flow source or runtime exists.
- [ ] Product Studio and Planner each have one strict tool registry and configuration schema.
- [ ] Required actions cannot be disabled.
- [ ] Product phone order and Planner phone order are configurable inside mandatory
      accessibility and commercial invariants.
- [ ] Raw React Flow/FlexLayout/Zustand state is not persisted as product truth.
- [ ] Persistent composer controls live outside the React Flow viewport and overlap no
      drawing surface.
- [ ] No text glyph is used as an icon; no composer class is unstyled; no enabled panel
      renders placeholder prose.
- [ ] Each workspace has exactly one keyboard-shortcut owner and fires one transaction
      per chord.
- [ ] Product Studio publish still satisfies the PNG contract.
- [ ] Planner save/undo/redo/BOQ/handoff remain correct.
- [ ] Site -> Planner continuity survives desktop and 390px browser journeys.
- [ ] WCAG 2.2 AA, keyboard, touch, focus, contrast and reduced-motion checks pass.
- [ ] Forced-colors and virtual-keyboard checks pass for Product Studio and Planner.
- [ ] Equivalent automated and NVDA/Chromium owner journeys pass at 1440x900 and
      1920x1080.
- [ ] Performance budgets are measured and pass at documented data caps.
- [ ] Native package, license notice, client chunk and standalone deployment checks pass.
- [ ] `pnpm run gate` and `pnpm run check:layout` exit 0.

## Execution discipline

Owned by [`README` §10](./rules.md#10-execution-rules). Two rules matter enough to repeat
here, because breaking either has already cost this programme a phase:

- **Never weaken a threshold to make a test green.**
- **Browser evidence is stored or it did not happen.** A plan whose browser journeys were
  skipped is OPEN no matter how complete its code is.

## Task 0: Capture the verified baseline

> **Historical baseline — do not treat as current evidence.** Run 2026-07-27 at commit
> `d459a52`. Re-run only when re-baselining.

Evidence stored under the baseline directory in [`README` §8](./rules.md#8-evidence-contract). It raised two findings, both
now tracked in `Failures.md`: the absent `0004` Task 7 modules (blocker **B3**) and the
stale Product Studio list-route snapshots.

**Files:**
- Verify: `package.json`
- Verify: `components.json`
- Record: [`README` §4](./rules.md#4-status-ledger)

- [x] **Step 1: Run structural gates**

Run:

```powershell
pnpm run check:layout
pnpm run check:docs-all
pnpm run lint:ui:strict
```

Expected: all commands exit 0.

- [x] **Step 2: Run focused baseline tests**

Run:

```powershell
pnpm exec vitest run --config tests/vitest.config.ts `
  tests/unit/features/planner/editor `
  tests/unit/features/planner/store
```

Expected: all selected tests pass.

- [x] **Step 3: Capture browser baseline**

Run:

```powershell
pnpm exec playwright test -c config/build/playwright.config.ts `
  --reporter=line --workers=1
```

Expected: all selected tests pass at `http://localhost:3000`.

- [x] **Step 4: Record exact versions**

Run:

```powershell
pnpm why @xyflow/react @xyflow/system flexlayout-react zustand `
  react-hook-form radix-ui react-aria-components `
  @mastra/core @lancedb/lancedb @orama/orama
```

Expected: one intentional application version per direct dependency and
`@xyflow/system` only below `@xyflow/react`.
