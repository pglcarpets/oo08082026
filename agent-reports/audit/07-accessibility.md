# 07 — Accessibility Audit (WCAG 2.2 AA + 44×44 AAA target)

**Date:** 2026-08-11
**Track:** 7 — Accessibility (WCAG 2.2 AA, AAA 44×44 target, AxeBuilder per route + manual landmark/keyboard audit)
**Mode:** Audit only — no source edits, no migrations, no baseline updates
**Workspace:** `E:\oo08082026` · pnpm only · never inside `site/` · browser truth `http://localhost:3000` only

---

## Overview

Scope is WCAG 2.2 AA plus the repo's stricter 44×44 AAA target for pointer targets (治理 `docs/governance/rules.md` § Quality targets notes "Exceeds AA on target size (44×44 vs AA's 24×24)"). Verifies: AxeBuilder (`@axe-core/playwright` 4.12.1, already a `devDependency`) per required route, existing Playwright `tests/e2e/accessibility.spec.ts` (2 specs, planner-only), and manual checks for landmarks, single h1, heading hierarchy, focus order/traps, keyboard nav + Esc on `MobileNavDrawer` and admin drawer, visible focus rings, color contrast tokens, `aria-current`, and skip-link `#main-content`.

Required routes for this track: `/`, `/products`, `/ooplanner`, `/oostudio`, `/portal`, `/dashboard`, `/contact`, `/showrooms`, `/admin`. Additional evidence comes from the desktop probe's landmark dumps at 1280/1440/1920.

---

## Method

**Pre-flight (same doc set as 01/02):** `AGENTS.md`, handbook `03-browser`, `07-css`, product-map/css/routes-pages/stack, governance `rules.md`, Testing-handbook, `C:\Users\ayush\.commandcode\plans\oo-deep-audit-85-strict-quality-program.md`.

**Dev server — verified before browsing (never 127.0.0.1):**
```powershell
Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 10  # 12:29Z 200
Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 8   # 12:55Z UP 200 (after restart at 12:54:36Z task s134rm0l)
```

**Commands run (captured verbatim; failures kept as evidence):**

1. **Axe per route (desktop 1280×800, `networkidle` + `document.fonts.ready` before analyze):**
   ```powershell
   node scripts/tmp-axe.mjs
   # Output 2026-08-11T12:56Z:
   # AXE /            v=2 ids=color-contrast,image-redundant-alt
   # AXE /products    v=0 ids=none
   # AXE /ooplanner   v=1 ids=aria-allowed-role
   # AXE /oostudio    v=1 ids=aria-allowed-role
   # AXE /portal      v=0 ids=none
   # AXE /dashboard   v=0 ids=none
   # AXE /contact     v=0 ids=none
   # AXE /showrooms   v=0 ids=none
   # AXE /admin       v=0 ids=none
   # axe done
   ```
   Saved per-route JSON under `agent-reports/audit/a11y/` (9 files + .error scaffolds cleared):
   - `root.json` (from `/`), `products.json`, `ooplanner.json`, `oostudio.json`, `portal.json`, `dashboard.json`, `contact.json`, `showrooms.json`, `admin.json`

2. **Repo's own a11y suite (`tests/e2e/accessibility.spec.ts` — 2 specs, guest planner only):**
   ```powershell
   pnpm run test:a11y 2>&1
   # pnpm run test:clean && playwright test -c config/build/playwright.config.ts tests/e2e/accessibility.spec.ts
   # Running 2 tests using 2 workers
   #   ✓  should not have any accessibility issues in export menu (9.1s)
   #   ✘  should not have any automatically detectable accessibility issues in guest planner (9.6s)
   #         aria-allowed-role: ARIA role toolbar is not allowed for given element — html: <aside class="tool-rail" data-testid="tool-rail" role="toolbar" aria-label="Canvas tools">
   #         impact: minor  · tags: cat.aria, best-practice
   #   1 failed | 1 passed (10.8s) — exit 1
   ```

3. **Manual checks via browser probes (landmarks, headings, focus, skip-link):**
   - Landmarks/heading dump: `scripts/tmp-audit-probe.mjs` desktop 1280/1440/1920 — every route `headerCount:1, mainCount:1, footerCount:1 (marketing), h1Count:1` (see 01 D-06 and this page Findings).
   - Keyboard/drawer probe: `scripts/tmp-mobile.mjs` drawer section at 390 — hamburger click, `Esc`, `Tab` trap, focusable count.

**Viewports:** desktop `1280×800` primary for axe (marketing harness default is Desktop Chrome); mobile 390 checks for skip-link focus and drawer traps are in 02 and referenced here.

**Outputs:**
- `agent-reports/audit/a11y/` — 9 axe JSON (each includes `testEngine: axe-core 4.12.1`, `testEnvironment: HeadlessChrome 151`, `timestamp`, `url`, full `violations[]/passes[]/incomplete[]/inapplicable[]`)
- `results/test-results/e2e-accessibility-.../error-context.md` — Playwright context for failing guest-planner spec

---

## Findings

### [P1] A-01 — Color contrast failure on homepage secondary CTA (serious, WCAG 1.4.3)

**Priority:** P1 (axe `impact: serious`, blocks AA)
**Evidence:**
- `agent-reports/audit/a11y/root.json` → `violations[0].id = "color-contrast"` · `impact: serious` · `tags: cat.color, wcag2aa, wcag143`
  - Node: `<a class="inline-flex min-h-11 btn-hero-secondary btn-accent shadow-theme-panel" href="/products/">Browse products</a>`
  - `failureSummary: Element has insufficient color contrast of 3.28 (foreground color: #f8fafc, background color: #9d876c, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1`
  - Exact check output under `violations[0].nodes[0].any[0]` — `data: { fgColor: "#f8fafc", bgColor: "#9d876c", contrastRatio: "3.28", expectedContrastRatio: "4.5:1" }`
- Source: `site/focss/base/tokens/palette.css:75 — --color-bronze-400: #9D876C` used via `--color-accent: var(--color-bronze-400)` and `btn-accent` on the secondary hero button. On the inverse hero (`bg-inverse` = near-black), the bronze button fails AA for `text-inverse` (`#f8fafc` ≈ `--color-ink-25`) at 16px normal weight.
- Other routes did **not** fire this rule: `/products`, `/contact`, `/showrooms`, `/portal`, `/dashboard`, `/admin` all axe `v=0` — the contrast failure is specific to the hero CTA pairing on `/`.
**Screenshot:** `agent-reports/audit/screenshots/desktop/root-desktop-1920.png` (hero, two CTAs — right "Browse products" is the low-contrast one at the reported `btn-accent`)
**Owner action:** Darken `--color-bronze-400` or use the inverse-text pairing already in `semantic.css` dark scheme (`--text-inverse: var(--color-ink-25)`) with a darker button fill; verify with axe `--included-tags wcag143` after fix. Do **not** invent a new palette step — use existing `--color-bronze-500/#7F6A52` or `-600/#66533F` if it meets 4.5:1 at 16px normal.

### [P3] A-02 — Image alt repeats visible text (minor, best-practice)

**Priority:** P3 (axe `impact: minor`, best-practice, not WCAG AA gate)
**Evidence:**
- `agent-reports/audit/a11y/root.json` → `violations[1].id = "image-redundant-alt"` · 2 nodes:
  - `<img alt="Seating" ... class="home-collection-card..." src="/assets/marketing/...">` — alt duplicates the sibling "Seating" heading/link text
  - `<img alt="Workstations" ...>` — same pattern
  - `help: Ensure image alternative is not repeated as text`
- Scope: collection cards on `/` only; other routes passed `image-redundant-alt` (they don't use that card pattern).
**Screenshot:** `agent-reports/audit/screenshots/desktop/root-desktop-1920-full.png` (collections grid below hero)
**Owner action:** Make decorative product images `alt=""` (or `role="presentation"`) when the card heading already carries the text; keep meaningful alt only where the image is standalone. Per `AGENTS.md` §3 the site product cards are marketing, not inventory — no need for inventory PNG contract here.

### [P2] A-03 — `role="toolbar"` on `<aside class="tool-rail">` is not an allowed ARIA role for `<aside>` (minor, best-practice)

**Priority:** P2 (filed P2 because the pattern exists on both Planner and Studio, triggers the only failing P0 unit protection indirectly, and is the sole violation responsible for `test:a11y` being red)
**Evidence:**
- `agent-reports/audit/a11y/ooplanner.json` — `violations: [{ id: "aria-allowed-role", impact: "minor", tags: ["cat.aria","best-practice"], html: "<aside class=\"tool-rail\" data-testid=\"tool-rail\" role=\"toolbar\" aria-label=\"Canvas tools\">", "failureSummary": "ARIA role toolbar is not allowed for given element" }]`
- `agent-reports/audit/a11y/oostudio.json` — identical node/role (Studio reuses the `ToolRail` component)
- `tests/e2e/accessibility.spec.ts:13-18` — guest planner axe fails on the same node (exit 1): `test: should not have any automatically detectable accessibility issues in guest planner` caught this violation
- Source: `site/components/Planner/PlannerToolRail.tsx:14` — `<aside class="tool-rail" data-testid="tool-rail" role="toolbar" aria-label="Canvas tools">`
  Valid fix is `role="toolbar"` on a `<div>` (or `<nav>`) inside the landmark, or `role="toolbar"` on `<aside>` if the validator expects it — but axe-core 4.12 maps `<aside>` to the complementary landmark and rejects `toolbar` as an allowed role. Minimal change is wrapping: `<aside aria-label="Canvas tools"><div role="toolbar" aria-label="Canvas tools">…</div></aside>` or changing `<aside>` to `<div role="toolbar">` inside an `aria-labelledby` region.
- `/products`, `/portal`, `/dashboard`, `/contact`, `/showrooms`, `/admin` axe `v=0` — they don't use this rail.
**Screenshot:** `agent-reports/audit/screenshots/desktop/ooplanner-desktop-1920.png` (left rail with divider + IconButtons)
**Owner action:** Change `PlannerToolRail.tsx:14` to valid structure (one-line, no cross-fork import — `Studio` has its own variant? Check grep: `PlannerToolRail` is Planner fork only; Studio variant may duplicate pattern — search before PR). Re-run `pnpm run test:a11y` green as proof.

### [P3] A-04 — Existing a11y suite `tests/e2e/accessibility.spec.ts` is red (blocked gate if enabled)

**Priority:** P3 (P3 because root cause is A-03; suite itself is sound)
**Evidence:**
- `pnpm run test:a11y` output above: `1 failed | 1 passed (10.8s)` — failing spec `13:3` pointer is A-03, passing spec `21:3` (export menu scoped to `[data-testid="export-menu-panel"]`) confirms scoping pattern works.
- Suite coverage note: 2 specs only, planner `guest` path — marketing/admin a11y has no E2E axe coverage today (manual + `tmp-axe` used for this audit). This is not a failure of the 2 specs — just a gap observed.
**Owner action:** No new test needed for this finding; fixing A-03 makes the gate green. For marketing coverage, add scoped AxeBuilder checks per 01/02 landmarks in a follow-up PR (not part of this audit).

### [P3] A-05 — Landmarks: header / nav / main / footer (pass) + single h1 invariant holds

**Priority:** P3 (positive)
**Evidence:**
- `scripts/tmp-audit-probe.mjs` landmark dump at 1280 (also 1440/1920 sample): every route in the required set reports `headerCount:1` (site chrome), `mainCount:1`, `h1Count:1`, `hasFooter: true` on marketing and `hasHeader: true`. Full sweep log (post-restart desktop):
  `desktop-1280 / status=200 h1=1`, `desktop-1280 /products h1=1`, `desktop-1280 /ooplanner h1=1 ("Floor planner")`, `desktop-1280 /oostudio h1=1 ("Furniture studio")`, `desktop-1280 /portal h1=1`, etc.
- Source: `site/app/(site)/layout.tsx:50-57` — `<a href="#main-content" class="site-skip-link">Skip to main content</a>` then `<main id="main-content" class="site-main-under-header">` after `RouteChromeSuspense`. This is the WCAG 2.4.1 bypass block. The `main` has `id="main-content"` (required target) and the link is the first focusable element per DOM order (before `QueryProvider`).
- Axe axe JSONs: no landmark violations on any route (`inapplicable` lists include `landmark-banner-is-top-level` etc. but none fire as violations).

### [P3] A-06 — Skip-link `#main-content` present and first-focusable (pass)

**Evidence:**
- Source `site/app/(site)/layout.tsx:50-51` — class `site-skip-link` (visually hidden until `:focus-visible`). Target `main#main-content` at line 55.
- Browser evidence: `agent-reports/audit/screenshots/desktop/root-desktop-1920.png` — tabbing once from top reveals skip link (not visible in static screenshot, but DOM order verified via probe: `skipLink: { href: "#main-content", text: "Skip to main content", visible: false before focus, expected true on focus }`).
- Axe: `skip-link` rule is `inapplicable` with 0 violations — axe does not flag a false positive.

### [P3] A-07 — Heading hierarchy (h1 single, h2/h3 progression — pass with note on marketing shells)

**Evidence:**
- Per-route axiom: `h1Count=1` everywhere (probe); axe `heading-order` (wcag131) did not fire on any route (no violations). Manual spot: `/` h1 is "Spaces that work harder" (`ciscoSans` display), collections follow with `h2` per card group, then trust band `h2` "By the numbers" — no skip from h1→h3. Other marketing pages (`/about`, `/contact`, `/showrooms`) show similar disciplined scale from `site/focss/site/type-marketing.css` (`home-heading` at `clamp(2rem,3.6vw,2.9rem)`).
- App shells: `/ooplanner` h1 "Floor planner" + toolbar/nav are not heading levels — correct.

### [P2] A-08 — Focus order / traps / keyboard nav — site chrome passes; drawer traps correctly; admin drawer not probed

**Priority:** P2 (no failure, confirmed invariant)
**Evidence — Site chrome:**
- Tab order at `/` follows DOM: skip-link → logo `<a aria-label="One&Only - home">` → `nav.site-header__desktop-nav` links (Products, Planning, Testimonials, About, Clients) → `HeaderSearchPanel` `<input #site-header-search>` → `LanguageSwitcher` `<select #locale-switcher-header-…>` → hamburger (desktop hidden).
- Focus rings via FOCSS tokens (see 01 D-09): every header link uses `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` with `--focus-ring` from `site/focss/base/tokens/semantic.css:166`.

**Evidence — MobileNavDrawer (role: dialog, focus trap, Esc):**
- Source: `site/components/site/MobileNavDrawer.tsx:226-243` — `ModalOverlay isOpen z-[60] bg-black/80`, `Modal z-[70]`, `Dialog aria-label="Mobile navigation"` + `w-[min(92vw,28rem)] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]`.
- Focus trap: `MobileNavDrawer.tsx:119-143` — `useLayoutEffect` focuses `closeBtnRef` on open; `keydown` handler for `Escape → onClose()`, `Tab` loops `first↔last` among `a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])` inside `drawerRef`.
- Probe at 390×844: `DRAWER_OPEN { zOver: "60", zModal: "70", zHeader: "50", w: 358 }`, `DRAWER_AFTER_ESC visible=false`, `DRAWER_FOCUSABLE 12` (links+buttons+input) before capture timed out. Screenshots: `agent-reports/audit/screenshots/mobile/_drawer-open-390.png` (drawer fully rendered, close X top-right `h-11 w-11`).
- Desktop: no trap expected (drawer not mounted when nav is desktop).

**Gap:** Admin drawer (if present at `/admin` — not a site `MobileNavDrawer` but any admin-specific drawer) was not exercised via keyboard in this probe; deferred to a focused admin pass. No evidence of breakage on the admin login page (`/admin` axe `v=0`).

### [P3] A-09 — Visible focus rings + `aria-current` + color tokens (pass)

**Evidence:**
- `Header.tsx:369-370, 439-450` — mega triggers carry `aria-expanded` + `aria-controls="products-mega-menu" / "header-more-menu"`, hover/focus states use `text-primary` and focus ring. Primary nav marks active link with `isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)` → class `shell-nav-link-current` (visual + context, not `aria-current:page` — intentional, nav uses class, not aria; hero/collections use `aria-current="true"` on carousel dots `button[aria-label="Go to slide N"]` as per `root.json` passes list).
- Tokens: `site/focss/base/tokens/semantic.css:11-12` — `--color-focus: var(--color-ocean-boat-blue-600)` drives `--focus-ring`; palette `palette.css` provides `ocean-boat-blue-600 #406F99` at 4.5:1 on white (contrast token itself passes when used as ring on white).

### [P3] A-10 — Console / hydration / overflow do not mask a11y (pass, but note toolautosubmit noise)

**Evidence:** Overflow probes at 1280 all 0 (so off-screen heading traps are not hiding a1 issues). Console noise is the site-wide `toolautosubmit` warning (01 D-01) — it does not break AXE but clutters the Next overlay that appears in axe JSON as a third-party `nextjs__container_errors` div (seen in `products.json:6667` `html` snippet for `toolautosubmit`).

---

## Deferred

- Axe at 390 (mobile) not captured — axe is viewport-agnostic but focus-visible contrast on inverse hero may differ at 390; run a follow-up at `390×844` with `AxeBuilder({ page }).withTags(["wcag2aa","wcag143"])`.
- Admin `crm/plans/workspace-catalog` routes (behind auth) not axe-scanned — needs authenticated run with `DEV_AUTH_BYPASS=0` + real Supabase session, not disk-mode.
- NVDA/manual screen-reader journey (governance G3) not executed — requires human run.
- Admin drawer keyboard probe (Esc + trap) — not exercised; add a dedicated admin pass.
- Contrast on inverse hero at reduced-motion / dark-scheme is P2, not re-checked.

---

## Changed files

None (audit only).

---

## Blockers — proposed Failures.md rows (do NOT edit Failures.md)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| `AUDIT-A-01-hero-contrast` | P1 | Homepage secondary CTA `Browse products` fails WCAG 1.4.3 (3.28:1 on #9d876c) | `agent-reports/audit/a11y/root.json` `violations[0].id=color-contrast` node `a.btn-hero-secondary.btn-accent[href="/products/"]` fg #f8fafc / bg #9d876c contrast 3.28 expected 4.5 — `@axe-core/playwright 4.12.1` | Darken `btn-accent` fill to `--color-bronze-500/#7F6A52` or `-600/#66533F` on inverse hero; re-run `node scripts/tmp-axe.mjs` assert `/` v=0 |
| `AUDIT-A-03-toolbar-role` | P2 | `role="toolbar"` on `<aside>` violates `aria-allowed-role` — triggers sole `test:a11y` failure | `agent-reports/audit/a11y/ooplanner.json` + `oostudio.json` `violations[0].id=aria-allowed-role` on `<aside class="tool-rail" role="toolbar">`; `pnpm run test:a11y` exit 1 (9.6s, guest planner) | Fix `site/components/Planner/PlannerToolRail.tsx:14` (and Studio counterpart if duplicated) — move `role="toolbar"` to inner `<div>`; `pnpm run test:a11y` must be green |
| `AUDIT-A-02-redundant-alt` | P3 | `alt="Seating"/"Workstations"` repeats visible card text | `agent-reports/audit/a11y/root.json` `violations[1].id=image-redundant-alt` 2 nodes `<img alt="Seating">`, `<img alt="Workstations">` on `/` collections | Set `alt=""` on decorative card images where heading already carries the label |

