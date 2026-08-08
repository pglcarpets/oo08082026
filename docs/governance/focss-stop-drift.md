# FOCSS drift and custom CSS — stop and correct

**Binding.** Stops FOCSS structural drift and ad-hoc colours/CSS across Site, Admin, and Planner. Live CSS contract remains [`../architecture/css.md`](../architecture/css.md). Programme rules C1–C10 live in [`rules.md`](./rules.md) §3; this file owns **allowed vs forbidden**, **verification**, and the **correction plan** for preexisting debt.

Process: `Agents/07-css.md`. Charter: R3 / R4 / R29 / R30 in [`charter.md`](./charter.md).

When this file and live code disagree on a path detail, **code + fresh gate output win**. Direction here still binds.

---

## 1. Purpose

1. Keep one CSS home: `site/focss/` (plain tree, `@focss/*` alias — **not** an npm package, no `site/focss/package.json`).
2. Keep colour and density on **semantic tokens** — no scattered hex / palette / one-off sheets in product TSX.
3. Clear preexisting token-bypass and style-coverage debt on a ratchet; do not raise the baseline.

Engineering clears blockers. Do not wait on a freeze to migrate.

---

## 2. Scope

All product surfaces under `site/`:

| Surface | Routes (summary) | Zone entry |
|--------|-------------------|------------|
| **Site** | `(site)/*` | `@focss/site/entry.css` |
| **Admin** | `/admin/*` | `@focss/admin/entry.css` only (no ShadcnChrome) |
| **Planner fork** | `/ooplanner*` | `@focss/planner/entry.css` (self-contained) |
| **Studio fork** | `/oostudio*` | `@focss/studio/entry.css` (self-contained) |

Out of scope for this doc: `tech-docs-generator/src/styles/` (not FOCSS). Do not move tech-docs styles into `site/focss/`. Admin only **links** to tech-docs (external URL, new tab) — see [`tech-docs-link.md`](./tech-docs-link.md).

---

## 3. Allowed vs forbidden

Aligned with `css.md` and README C1–C10. Do not invent a second stack.

| | Allowed | Forbidden |
|---|---|---|
| **Colour** | Semantic tokens (`--surface-*`, `--text-*`, `--color-*`) from `site/focss/base/` | Raw hex / `rgb()` / `rgba()` in product TSX or non-token CSS; ad-hoc Tailwind palette classes that bypass tokens |
| **Size / space** | Scale steps and token-backed utilities | Raw `px` in `className` / inline `style` where a scale step exists |
| **Tailwind** | Token-layer utilities on Product primitives (`bg-card`, `text-muted-foreground`, `border-border`, …); layout-shape arbitraries (`fr`, `vh`, `aspect`, `minmax`) when no scale step exists | Arbitrary colour/size values that duplicate tokens; parallel palettes |
| **Sheets** | Zone `entry.css` + packages under `focss/{site,admin,planner,studio,base}/` | New parallel CSS trees; Studio↔Planner FOCSS cross-import; Site loading admin packs |
| **Controls** | Product/admin: `components/ui/*` + `features/admin/ui/*` (**FOCSS + React Aria**). Site: `MarketingCtaLink` / `@utility btn-*` | Fourth button system, resurrecting shadcn/Radix registry chrome |
| **Surfaces** | Light chrome via ecru (`--surface-page`, `--surface-card`) | Pure `bg-white` shells on Product light chrome |
| **Layout ownership (R30)** | FOCSS block class owns display / flex / gap / size / position | Split ownership (CSS + Tailwind fighting on the same element) |
| **Style coverage (R29)** | One owning rule per composer class | Unstyled class names or dead rules |
| **Tokens** | Add/change tokens in `focss/base/` when the phase needs a real shared value | Thrashing token sheets for one-off feature experiments; hex only outside `focss/base/` |
| **Package** | Alias-only `@focss/*` | `@oando/focss` workspace package or nested `site/focss/package.json` |
| **Locked / retired** | — | Edits under retired `site/app/css/core/locked/**` if present; resurrecting `focss/zones/`, `focss/chrome/`, repo-root `focss/` |

**Declared exceptions (C10):** Satori / OG image routes may use literals; they stay on the allowlist in `check:style-tokens`, not discovered ad hoc.

---

## 4. Verification (run from repo root)

| Check | Command | What it guards |
|-------|---------|----------------|
| FOCSS graph | `pnpm run verify:focss` | Imports, site CSS, fences, module graph (C1) |
| UI contract | `pnpm run lint:ui:strict` | Scheme, palette, `bg-white`, layout ownership, legacy buttons (C2 + contract) |
| Style coverage | `pnpm run ops check:composer-styles` | Composer class ↔ FOCSS rule (C8 / R29) |
| Token ratchet | `pnpm run check:style-tokens` | No new hex / px / bad arbitraries (C3–C5, C7, C10) |
| Icons | `pnpm run ops check:product-icons` | Phosphor only on Product |
| Design kit | `pnpm run ops test:design-kit` | Visual contract after token/primitive change |
| Layout / docs | `pnpm run check:layout` · `pnpm run check:docs-all` | Repo layout + doc gates |

**Inventory / drift helpers** (not always blocking; use for remediation work):

- `pnpm run ops lint:ui` (non-strict; root script is only `lint:ui:strict`) — same UI contract without full ratchet pressure.
- Broad `audit-hardcoded-*.mjs` one-shots were removed 2026-08-02; do not resurrect them for ship claims.

Authoritative debt measure: **`pnpm run check:style-tokens`** vs `config/quality/style-token-baseline.json`. Prefer live counts over any archived markdown dump.

---

## 5. Correction plan (preexisting drift)

**Lives here (governance), not in `plans/` status.** Plan status files record phase work only. When a phase owns a remediation batch, add a row in that phase’s file pointing at this section — do not fork a second CSS ledger under `plans/`.

Goal: migrate debt into tokens / FOCSS; ratchet baselines **down only**. Structural FOCSS (`verify:focss`) is already clean at adoption — debt is **token bypass** and **composer style coverage**, not a second CSS architecture.

### Phase A — Inventory (current)

1. Re-run `pnpm run check:style-tokens` and `pnpm run ops check:composer-styles`; record exit codes and counts in `Failures.md` when they block ship.
2. Do **not** treat ungated greps or archived hardcode-audit dumps as ship defect counts.

### Phase B — Quarantine (no new debt)

1. Keep C3–C5 as a **ratchet** ([`rules.md`](./rules.md) §7): fail on increase; never raise the baseline to silence a PR.
2. New UI work must pass `lint:ui:strict` and must not add raw hex / off-token palette in TSX or non-token CSS.
3. Fix structure/TSX before adding sheets; new presentation goes under the owning zone package, not a one-off file beside a feature.

### Phase C — Migrate

Order work by severity, then by surface (Admin → Planner → Site/shared):

| Priority | What | How |
|----------|------|-----|
| **P0** | `check:composer-styles` failures (C8) | Add or restore the owning rule under the correct `focss/` package; delete dead rules |
| **P1** | HIGH colour bypass (`raw_hex`, `rgb_color`) | Replace with `var(--…)` / semantic class; if a token is missing, add it in `focss/base/` once |
| **P2** | MEDIUM size/spacing bypass | Map to scale steps or token utilities |
| **P3** | Registry / shared UI under `site/components/ui/` | Consume tokens only; no local palette definitions |
| **P4** | LOW layout-shape arbitraries | Leave unless a real scale step appears; still listed so they do not morph into colour/size bypass |

Unless a gate already fails on a specific path, clear that path first.

After each batch: focused UI check + `pnpm run check:style-tokens`. After token or primitive change: `pnpm run ops test:design-kit` when the kit is in play.

### Phase D — Gate ratchet

1. After a remediation batch, lower the recorded style-token / governance baseline (`--update` only when the count **decreased** and evidence is attached).
2. A phase may not close with a higher token-bypass count than it started with ([`rules.md`](./rules.md) §7).
3. Target end state: C8 green; HIGH colour findings at 0 outside declared C10 allowlists; MEDIUM trending to 0 under the same ratchet.

Unresolved blockers that stop a phase stay in root `Failures.md` with a repro command — remove only after verified fix.

---

## 6. Related

| Doc | Role |
|-----|------|
| [`rules.md`](./rules.md) §3, §7 | Binding C-rules + ratchet |
| [`../architecture/css.md`](../architecture/css.md) | Live CSS map |
| `pnpm run check:style-tokens` | Live token-bypass count |
| [`site/focss/README.md`](../../site/focss/README.md) | Tree ownership |
| `Agents/07-css.md` | Session CSS fence |
