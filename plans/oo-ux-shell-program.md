# One&Only — Unified Mobile App Shell & UX Remediation Program

**Status:** Plan (awaiting approval). Aligned with `oo-deep-audit-v2.md` (10-phase).
**Scope:** This is a **phased program, not one PR**. Phase 1 is the shippable PR (mobile app shell). Phases 2–10 are sequenced follow-ups with exact file targets.
**Authority:** user instruction → live code + fresh commands → `AGENTS.md` → `docs/**`. Source of truth for all paths/classes/analytics below is the repo (`E:\oo08082026`), verified via 6 exploration agents + 2 live fetches on 2026-08-11.

---

## Guiding constraints (non-negotiable)

These came out of the audit and must hold across every phase:

1. **Domain boundaries.** `@planner/*` and `@studio/*` are strictly forked. `scripts/scan-boundaries.mjs` flags any cross-import **and** any textual reference to the other fork; `FORBIDDEN_DIRS` forbids `site/focss/ooshared|ooplanner|oostudio` and `site/components/OOShared`. → **Shell chrome is duplicated per fork**, never shared. The marketing shell lives in `site/components/site/` (neutral, used only by `(site)` pages).
2. **Analytics shapes preserved.** Nav tracking flows through `handlePlannerEntryNavigation` (→ `planner_launch_clicked` site event + `planner_entry` conversion) and `trackSiteCtaClick` (prefixed `*_cta_clicked`). Both invoked from `TrackedLink`/`PlannerLaunchLink`. `surface` is free-form `string`. New tab events must funnel through `emitSiteEvent` (consent-gated, Vercel transport). No direct `gtag`/`window.va.track`.
3. **FOCSS conventions.** Global `*.css` (no modules), zone-scoped by root prefix (`.site-*`, `.ooplanner-*`, `.oostudio-*`, `.shell-admin-*`). Mobile-only = `@media (width < theme(--breakpoint-md))` (768px). Reuse tokens (`--surface-glass-strong`, `--border-soft`, `--shadow-panel`, `--radius-pill`, `--space-*`, `--text-strong|-muted`) before new CSS. Icons from `@phosphor-icons/react`.
4. **Safe-area.** `env(safe-area-inset-bottom, 0px)` is used defensively everywhere; `viewportFit: "cover"` is NOT set in `site/lib/siteViewport.ts`. Phase 1 enables it.
5. **Taste.** Narrowly scoped, preserve existing layout, fix in-pass with rechecks. The app-shell redesign is explicitly requested by the user, so it overrides the default "avoid redesigns" preference for the mobile viewport only — desktop stays untouched.

---

## PHASE 1 — App Shell Unification (the PR)

**Goal:** minimal top bar + bottom tab bar (Home, Catalog, Planner, Studio, Account) visible on viewport < 768px across `(site)` pages; domain-aware for tool routes.

### Concrete changes — ~10 files

#### 1. `site/lib/siteViewport.ts` — enable edge-to-edge
```ts
export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",                 // ← ADD (unlocks env(safe-area-inset-*))
  themeColor: [ /* unchanged */ ],
};
```
Trade-off: existing `env(safe-area-inset-*, 0px)` fallbacks already degrade gracefully, so this is safe and finally makes the bottom tab bar clear the home indicator.

#### 2. `site/features/site/data/navigation.ts` — add tab config
```ts
import { PRODUCT_SUITE } from "@/features/site/data/productSuite";

export const MOBILE_TABS = [
  { id: "home",     label: "Home",    href: "/",                   icon: "House" },
  { id: "catalog",  label: "Catalog", href: "/products",          icon: "SquaresFour" },
  { id: "planner",  label: "Planner", href: PRODUCT_SUITE.planner.routes.guest, icon: "PencilSimple" }, // /ooplanner
  { id: "studio",   label: "Studio",  href: "/oostudio",          icon: "PaintBrush" },
  { id: "account",  label: "Account", href: SITE_AUTH_LINK.href,   icon: "UserCircle" }, // /access
] as const;
export type MobileTabId = (typeof MOBILE_TABS)[number]["id"];
```
Notes: `/ooplanner` is a planner-entry href → its tab renders via `PlannerLaunchLink` (stamps `siteSource`/utm + fires `planner_entry`). Others use `TrackedLink`. `/oostudio` has no `PRODUCT_SUITE` entry — reference directly (confirmed in exploration).

#### 3. `site/lib/analytics/siteEvents.ts` — add tab event (no existing tab event; confirmed)
```ts
export function trackSiteTabSelected(params: {
  pathname: string;
  tab: string;        // MobileTabId
  destination: string;
}) {
  emitSiteEvent("site_tab_selected", {
    pathname: params.pathname,
    surface: "mobile-tab-bar",
    tab: params.tab,
    destination: params.destination,
  });
}
```
Matches the `SiteEventPayload` primitive-only contract; consent-gated automatically. Planner tab click additionally flows through `PlannerLaunchLink` (preserves `planner_entry` conversion) — do NOT short-circuit it.

#### 4. `site/components/site/MobileAppShell.tsx` — NEW (client)
Responsibilities: render a mobile-only top bar (logo + one primary action) and the bottom tab bar around `children`; compute active tab + domain from `usePathname()`; hide both on ≥768 via CSS (desktop keeps `SiteHeader`). Only mounted under `(site)` (see layout change). Planner/Studio get their **own** duplicated shells (Phase 2), not this one.

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { isPlannerEntryHref } from "@/lib/analytics/plannerEntry";
import { MOBILE_TABS, type MobileTabId } from "@/features/site/data/navigation";
import { trackSiteTabSelected } from "@/lib/analytics/siteEvents";
import { House, SquaresFour, PencilSimple, PaintBrush, UserCircle } from "@phosphor-icons/react";

const ICONS = { House, SquaresFour, PencilSimple, PaintBrush, UserCircle } as const;

function activeTabFor(pathname: string): MobileTabId | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return "home";
  if (p.startsWith("/products")) return "catalog";
  if (p.startsWith("/ooplanner") || p.startsWith("/planner")) return "planner";
  if (p.startsWith("/oostudio")) return "studio";
  if (["/access","/dashboard","/portal","/login"].some(s => p.startsWith(s))) return "account";
  return null; // interior marketing page → no active tab, shell still visible
}

export function MobileAppShell({ children, primaryAction }: {
  children: React.ReactNode;
  primaryAction?: { label: string; href: string };
}) {
  const pathname = usePathname() || "/";
  const active = activeTabFor(pathname);
  return (
    <div className="mobile-app-shell">
      <header className="mobile-app-bar">
        <Link href="/" aria-label="One&Only — home" className="mobile-app-bar__brand">
          <OneAndOnlyLogo variant="orange" className="h-7" />
        </Link>
        {primaryAction ? (
          <TrackedLink href={primaryAction.href} label={primaryAction.label} surface="mobile-app-bar"
            className="btn-primary mobile-app-bar__cta">
            {primaryAction.label}
          </TrackedLink>
        ) : <span className="mobile-app-bar__spacer" />}
      </header>
      <main id="main-content" className="mobile-app-main">{children}</main>
      <nav className="mobile-tab-bar" aria-label="Mobile primary">
        {MOBILE_TABS.map((tab) => {
          const Icon = ICONS[tab.icon as keyof typeof ICONS];
          const isPlanner = isPlannerEntryHref(tab.href);
          const LinkCmp = isPlanner ? PlannerLaunchLink : TrackedLink;
          const isActive = active === tab.id;
          return (
            <LinkCmp key={tab.id} href={tab.href} label={tab.label}
              surface="mobile-tab-bar"
              onClick={() => trackSiteTabSelected({ pathname, tab: tab.id, destination: tab.href })}
              className={`mobile-tab${isActive ? " mobile-tab--active" : ""}`}
              aria-current={isActive ? "page" : undefined}>
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              <span className="mobile-tab__label">{tab.label}</span>
            </LinkCmp>
          );
        })}
      </nav>
    </div>
  );
}
```
**z-index:** `.mobile-app-bar` z-50 (same as `SiteHeader`); `.mobile-tab-bar` z-50. The existing `MobileNavDrawer` react-aria Modal sits at z-[60]/z-[70], so it still covers the tab bar — correct.

#### 5. `site/focss/site/components/chrome/app-shell.css` — NEW FOCSS
```css
.mobile-app-shell { display: none; }                       /* desktop: hidden */
@media (width < theme(--breakpoint-md)) {
  .mobile-app-shell {
    display: flex; flex-direction: column; min-height: 100dvh;
  }
  .mobile-app-bar {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
    height: 3.25rem; padding-inline: var(--space-3);
    border-bottom: 1px solid var(--border-soft);
    background-color: var(--surface-glass-strong);
    backdrop-filter: blur(16px);
    padding-top: env(safe-area-inset-top, 0px);
  }
  .mobile-app-bar__cta { min-height: 2.25rem; padding-inline: var(--space-3); border-radius: var(--radius-pill); font-size: .875rem; }
  .mobile-app-main { flex: 1 1 0%; min-width: 0; }
  .mobile-tab-bar {
    position: sticky; bottom: 0; z-index: 50;
    display: grid; grid-template-columns: repeat(5, 1fr);
    border-top: 1px solid var(--border-soft);
    background-color: var(--surface-panel-strong);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .mobile-tab {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    min-height: 3.5rem; padding-block: var(--space-1);
    color: var(--text-muted); font-size: .6875rem;
  }
  .mobile-tab--active { color: var(--text-strong); }
  .mobile-tab__label { line-height: 1; }
}
/* Hide the marketing SiteHeader on mobile so the app bar is the only top chrome */
@media (width < theme(--breakpoint-md)) {
  .site-header { display: none; }
}
```
Registered via the site entry chain (see #7). Note: hiding `.site-header` <768 means `MobileNavDrawer` (triggered by the hamburger) is also unreachable from the header — the drawer becomes search-first and is opened from a search affordance in the app bar or the Catalog/Account tab. See #8.

#### 6. `site/focss/site/entry.css` — register new sheet
Add after the existing chrome imports:
```css
@import "./components/chrome/app-shell.css";
```

#### 7. `site/app/(site)/layout.tsx` — wrap pages in the shell
The current layout renders `RouteChromeSuspense(position="top")` (= `SiteHeader`), `<main class="site-main-under-header">`, `RouteChromeSuspense(position="bottom")`. Change: keep desktop chrome as-is (it's hidden <768 by #5), and wrap `children` in `<MobileAppShell>`. The shell's own top bar + tabs are mobile-only.

```tsx
// add import
import { MobileAppShell } from "@/components/site/MobileAppShell";
// in the return, replace the <main> block with:
<main id="main-content" className="site-main-under-header">
  <MobileAppShell>
    {children}
  </MobileAppShell>
</main>
```
Trade-off: on mobile the page content is now nested inside `.mobile-app-main` (flex child) — existing `.site-main-under-header` top padding (for the fixed h-16 header) becomes redundant <768 since the app bar is `position: sticky` (in-flow). Add a scoped override in `app-shell.css`: `@media (width < theme(--breakpoint-md)) { .site-main-under-header { padding-top: 0; } }`.

#### 8. `site/components/site/MobileNavDrawer.tsx` — simplify to search-first + curated shortcuts
Today the drawer holds: search + accordion categories + auth + language + 2 CTAs + call link. Per the task, reduce to **search + curated shortcuts**, moving language/auth/CTAs into the Account tab (Account → `/access` → `/dashboard`, where `LanguageSwitcher` and account actions live).

New drawer body (keep the react-aria `Modal`/`Dialog` shell, focus trap, Esc, body-scroll-lock — all unchanged):
```tsx
<nav aria-label="Mobile navigation">
  {/* 1. Search — UNCHANGED behavior (POST /api/nav-search/, context:mobile, trackSiteSearchSubmitted surface:mobile) */}
  <form role="search" ...>…</form>

  {/* 2. Curated shortcuts (replaces accordion categories + CTAs) */}
  <ul className="drawer-shortcuts">
    <li><TrackedLink href="/products?sort=new-arrivals"     label="New arrivals"  surface="mobile-nav">New arrivals</TrackedLink></li>
    <li><TrackedLink href="/products?filter=best-sellers"   label="Best sellers" surface="mobile-nav">Best sellers</TrackedLink></li>
    <li><TrackedLink href="/portal"                           label="Saved plans"  surface="mobile-nav">Saved plans</TrackedLink></li>
    <li><TrackedLink href="/contact"                          label="Contact"     surface="mobile-nav">Contact</TrackedLink></li>
  </ul>
</nav>
```
Notes & trade-offs:
- `/new-arrivals`, `/best-sellers`, `/saved-plans` do **not** exist as routes (confirmed). They become **query-param facets on `/products`** and the existing `/portal` (Saved plans) — no new routes needed. If product tagging for "new/best-seller" isn't backed by data yet, ship the links as `TrackedLink` now and wire the `/products` filter parser in Phase 3 (catalog). Mark as a Phase-1→3 dependency in the checklist.
- Remove `LanguageSwitcher`, the call link, and the `SITE_CTA_LINKS` block from the drawer. `LanguageSwitcher` relocates to the Account destination (`/dashboard`) in Phase 4.
- `trackSiteSearchSubmitted` surface stays `"mobile"` — do not change (it's a union type).
- Open trigger: since the header hamburger is hidden <768, open the drawer from a search icon button added to `.mobile-app-bar` (add a `<button>` in `MobileAppShell` that calls the same `onOpen` — pass an `onOpenNav` prop, or lift drawer state into `MobileAppShell`). Simplest: move `MobileNavDrawer` + its open state into `MobileAppShell` so the app bar owns the trigger.

#### 9. `site/components/site/Header.tsx` — no JSX change required
The desktop header stays. It is hidden <768 by the CSS rule in #5. Its hamburger + `MobileNavDrawer` mount moves into `MobileAppShell` (per #8). Remove the now-duplicate drawer render from `Header.tsx` and the `mobileOpen` state (or leave it dormant behind the desktop hamburger, which is hidden anyway). Cleanest: delete the drawer render + `mobileOpen` state from `Header.tsx`; desktop-only nav remains.

#### 10. Boundaries & analytics verification (no code, but required)
- Run `pnpm run scan:boundaries` — must stay green (no new cross-fork imports; `MobileAppShell` is in `site/components/site/`, neutral).
- Confirm `trackSiteTabSelected` events appear in Vercel after consent (queued pre-consent via `emitSiteEvent`, flushed by `CookieConsentBar`).
- Confirm `planner_entry` conversion still fires on the Planner tab (because it uses `PlannerLaunchLink`).

### Phase 1 acceptance (mobile)
- [ ] App shell visible on <768 across all `(site)` pages.
- [ ] Bottom tabs render Home/Catalog/Planner/Studio/Account; active state follows `usePathname`.
- [ ] Planner tab fires `planner_entry` conversion (not just `site_tab_selected`).
- [ ] `MobileNavDrawer` contains only search + 4 curated shortcuts (no language/auth/CTAs).
- [ ] `scan:boundaries` green; `pnpm run check:layout` green; `pnpm run gate` green.

---

## PHASE 2 — Planner & Studio canvas-first mobile (concrete)

**Goal:** full-screen canvas, bottom-sheet panels, always-visible thumb-reachable Save/Export/BOQ.

### Planner (already has a partial mobile shell — extend it)
Files: `site/components/Planner/Planner.tsx`, `site/focss/planner/chrome.css`.

Today `.planner-mobile-bottom-chrome` holds Select/Wall/Furniture/Inventory/Properties/`ExportMenu("More")`. **Save/Export/BOQ are buried in "More".** Promote them:

- Add a **primary action cluster** to the bottom chrome (large buttons, always visible): `Save` (→ `saveProject`), `Export` (→ opens `ExportMenu` plan section), `BOQ` (→ `openBoqPanel`). Keep the tool row (Select/Wall/Furniture) but move Inventory/Properties into **bottom-sheet panels** that slide up over the canvas when toggled (reuse `toggleMobilePanel("left"/"right")` which already exists).
- The real Fabric canvas stays in `.canvas-stage` (the existing `.planner-mobile-canvas` overlay is `aria-hidden`/decorative — leave it).
- Bottom sheet: add `.planner-mobile-sheet` in `planner/chrome.css` (`position:absolute; bottom:0; left:0; right:0; z-index:30; border-radius: var(--radius-xl) var(--radius-xl) 0 0; background: var(--surface-panel-strong); max-height: 70dvh; transform: translateY(100%); transition: transform var(--motion-fast);` + `.planner-mobile-sheet--open { transform: translateY(0); }`). Mount the existing `DockShell` panels (Catalog/Properties) inside it when `narrow`.

### Studio (no mobile shell today — build one, DUPLICATED, not shared)
Files: `site/components/Studio/Studio.tsx`, `site/focss/studio/chrome.css`.

- Add `.studio-mobile-shell` + `.studio-mobile-bottom-chrome` to `Studio.tsx` (mirror the Planner pattern, **written separately** — do not import any `planner-*` class or component; `scan-boundaries.mjs` flags textual references too). Bottom chrome: tool row (select/rect/circle/…) + primary cluster `Save` (→ `openSave`), `Export` (→ `ExportMenu`), (no BOQ — Studio has none). Side panels (Color/Layers/Properties) become bottom sheets.
- Add the `.studio-mobile-sheet` styles to `studio/chrome.css` (duplicate of the planner sheet rules, scoped under `.oostudio-root`).
- Keep `matchMedia("(max-width: 639px)")` panel-collapse effect; the new shell just layers chrome on top.

### Phase 2 acceptance
- [ ] `/ooplanner` and `/ooplanner/projects/[id]`: canvas fills viewport; Save/Export/BOQ always visible & thumb-reachable.
- [ ] `/oostudio`: canvas-first; Save/Export always visible; no BOQ (correct — Studio is a symbol editor).
- [ ] `scan:boundaries` green (Studio mobile shell does not reference any `@planner/*` or `planner-*` symbol).

---

## PHASE 3 — Catalog ↔ plan-symbol contract + homepage IA (scoped)

### 3a. Catalog cards show plan symbols
Files: `site/features/site/catalog/FilterGrid.components.tsx` (`ProductCard`), `site/lib/catalog/planSymbolPngContract.ts`, new test `tests/unit/lib/catalog/productCardPlanSymbol.test.ts`.

- `ProductCard` today renders only a marketing photo. Add a small plan-symbol thumbnail (corner of `.catalog-card__media`) resolved via `buildPlanSymbolPngPublicUrl(product.slug)`; render only when the asset exists (reuse the PDP's `resolvePdpPlanSvgThumb` resolver which already returns `null` when absent — no fallback asset exists, so conditionally render).
- Add a vitest mirroring `tests/unit/features/site/planSvg/resolvePdpPlanSvgThumb.test.ts` style: assert a known slug → `/png-catalog/{slug}.png`, and that unmapped slugs return `null` (card omits the symbol). happy-dom env, `describe`/`it`/injected stubs.

### 3b. Homepage IA + sector CTAs
Files: `site/app/(site)/page.tsx`, `site/components/home/PlannerToolsShowcase.tsx`, `site/features/site/data/homepage.ts` (`HOMEPAGE_SECTORS` is dead data — revive it).

Findings grounding this: the homepage has **no** "Furniture That Works as Hard as You Do", **no** sector hero strips, **no** "Explore Products"/"Contact Us" pairs (those were assumed — they don't exist). Current hero CTAs: "Browse products" (`/products`, `TrackedLink`, `homepage-hero`), "Launch planner" (`/planner` via plain `Link` — **untracked**, because `/planner` is a bare landing and `isPlannerEntryHref` is false). The defined-but-unrendered `primaryCta` "Design layout" → `/planner` should either be rendered or deleted.

- Revive `HOMEPAGE_SECTORS` with sector-specific CTAs (not all → `/clients`): Government → "Plan a government office" (`/contact?intent=quote&sector=government`), Corporate → "View corporate case studies" (`/clients?sector=corporate`), Retail & Office → "Browse office furniture" (`/products?sector=retail-office`), Global Standards → "View standards & compliance" (`/sustainability`). Render a new `SectorStrips` section in `page.tsx` between `TrustStrip` and `HomeDeferredSections`.
- Fix "Launch planner" tracking: route it through `PlannerLaunchLink` with a `/ooplanner` href (guest workspace) instead of bare `/planner` plain `Link`, so it stamps attribution and fires `planner_entry`. (Keep `/planner` as the marketing overview link in the footer.)

### 3c. Planner marketing reconciliation
Files: `site/features/site/planner/landing/PlannerFloorplanHero.tsx`, `PlannerFeaturesHubPage.tsx`, `PlannerFeaturePageView.tsx`, `PlannerHelpPage.tsx`, `plannerFeaturePages.ts`.

- Feature/help pages already link to `/ooplanner/` but via **plain `Link`** (no attribution). Swap the prominent header/card CTAs to `PlannerLaunchLink` (the bottom `RouteCtaBand` already uses `TrackedLink` and stamps). Standardize vocabulary to one label set: primary "Open planner" (`/ooplanner`), secondary "Sign in" (`/access?next=/ooplanner`). Remove "Start free"/"Try free"/"Open the canvas" inconsistency.
- Landing "Start free" → `/choose-product?mode=guest` stays (it's the documented chooser funnel) but wrap in `PlannerLaunchLink` so the chooser entry is attributed.

---

## PHASE 4 — Showrooms, Contact, Policies, Portal/Dashboard (scoped)

### 4a. Showrooms (`site/app/(site)/showrooms/page.tsx`, `ShowroomsPageView.tsx`, `routeCopy.ts`)
- Add a **metrics row** (clients / projects / sectors) as cards. Data is currently hardcoded in `routeCopy.ts` (`SHOWROOMS_HIGHLIGHTS` is 3 narrative cards; `SHOWROOMS_CLIENTS` is 8 names but unrendered; numeric stats exist only on `/solutions`). Add `SHOWROOMS_METRICS` to `routeCopy.ts` and render a `showrooms-metrics` grid.
- Elevate dead copy to primary buttons: `clientsCta` "View full client list" → `/clients` and `highlightsCta` "Explore client work" → `/clients` as primary `MarketingCtaLink`s (currently not passed to the view).
- "Book showroom visit" flow: add a guided form (date/time/location/project-type) that POSTs to the existing `submitContactAction` with `source: "website-showroom-visit"`, `requirement: "showroom-visit"`. It lands in `/admin/customer-queries` automatically (confirmed: `customer_queries` table, 10s auto-refresh). No new API.

### 4b. Contact (`site/app/(site)/contact/page.tsx`, `ContactPageView.tsx`, `CustomerQueryForm.tsx`, `customerQuerySchema.ts`)
- Live `https://www.oando.co.in/contact-us` → **404** (the route is `/contact`). Note this; no route change needed, but consider a `next.config` redirect from `/contact-us` → `/contact` for link-rot safety.
- Render three labeled blocks (Corporate office / Showroom / Sales) each with distinct action lines: Call (`tel:`), WhatsApp (`buildWhatsAppHref`), Email (`mailto:`), Request quote. Today phone/email are in a flat `contact-channels-panel`; refactor into per-block action rows. Data source: `site/features/site/data/contact.ts` `SITE_CONTACT` (salesPhone +91 98356 30940, supportPhone +91 90310 22875, salesEmail sales@oando.co.in). Render `openingHours` (currently unrendered).
- Lightweight quote form: extend the existing `CustomerQueryForm` (don't build a parallel form). Add fields to `customerQuerySchema.ts`: `projectType` (select: office/government/retail/institutional), `headcount` (number), `location` (text), `timeline` (select), `budgetBand` (select). These columns already exist on `customer_queries` (`requirement, budget, timeline` are already selected by `/api/customer-queries/manage`). Map the new fields into those columns + add new columns via a migration (with `-- rollback` per AGENTS.md §7) if needed.
- CRM integration: submissions already surface at `/admin/customer-queries` (Supabase `customer_queries`). No new wiring — just ensure `source: "website-contact-quote"` distinguishes quote intent.

### 4c. Policies (`refund-and-return-policy/page.tsx`, `privacy/page.tsx`, `site/components/legal/`)
- Add a **"Key points"** summary (3–5 bullets) at the top of each: introduce a small `LegalKeyPoints` component in `site/components/legal/` (new, shared by both pages — legal is neutral, no fork boundary). Bullets sourced from i18n (`legal.refund.keyPoints`, `legal.privacy.keyPoints` — add to `en.json` + mirrors).
- Privacy body headings are hardcoded in TSX ("How we use your information", "Links and security", "Cookies…", "Questions about privacy?"). Extract to i18n + section into the 7 requested headings: Refunds / Returns / Cancellations (refund page) and Data use / Cookies / Security / Contact (privacy page).
- Contact methods as **distinct action lines** (not inert text): refund `contactLines` today are plain `<p>` with no `tel:`/`mailto:`. Wrap them: email → `<a href={mailto:${SITE_CONTACT.salesEmail}}>`, phone → `<a href={tel:...}>`.

### 4d. Portal/Dashboard journeys (`site/features/shared/dashboard/DashboardClient.tsx`, `site/features/site/portal/*`, `workspaceHub.ts`)
- Map screens to use cases: `/portal` = "View my plans" (list), `/portal/[id]` = "View a plan", `/portal/guest` = "Browse without account", `/dashboard` = "Returning customer hub". `/quote-cart` = "Build a quote".
- Add "Share plan with team" affordance on `PortalPlanPageView` (currently only "Open in planner"). Phase-4 scope: generate a share link (signed) — needs a small API + migration; flag as a sub-task.
- Dashboard reads only `localStorage` today; add a server fetch of the member's recent plans (`listPlannerDocumentsFromStore`) so "View my plans" is real, not just a draft count.

---

## PHASE 5 — Admin standardization (scoped)

Files: `site/features/admin/ui/AdminLayoutShell.tsx` (exists — keep), new `site/features/admin/ui/AdminDataTable.tsx`, `site/focss/admin/base/tables.css`, apply to `AdminPlansPageView`, `AdminCatalogTable` (generalize), `AdminWorkspaceCatalogPageView`, `AdminPriceBookPageView`, `AdminInventoryPageView`.

- `AdminLayoutShell` already provides the shell (`.shell-admin-layout` grid + topbar + sidebar + main; mobile two-row topbar + drawer). **Keep it.** The gap is data tables: every list page hand-rolls `<table className="admin-table">` with ad-hoc columns and per-page `nuqs` filter/sort.
- Build `AdminDataTable` with a `columns` prop (`{ id, header, cell, sortable?, width? }`), server-or-client rows, built-in filter/sort/pagination (via `nuqs` to match `AdminPlansPageView`'s existing pattern), and bulk-action toolbar (`selectedIds` + actions).
- Migrate the 5 list pages to it. `AdminCatalogTable` becomes a thin columns config.
- CRM (`/admin/crm/*`) is explicitly a "localStorage demo — not production CRM" (quoted in every CRM page header). Do **not** invest in hardening it in this phase; only `/admin/customer-queries` is server-backed (Supabase) and already fine.

---

## PHASE 6 — Accessibility (WCAG 2.2 AA) (scoped)
- Audit landmarks/roles/focus on `/`, `/products`, `/ooplanner`, `/oostudio`, `/portal`, `/dashboard`. The new shell already adds `<nav aria-label>`, `aria-current`, skip-link (exists). Add a `plan_review`-style checklist per route. Add `@axe-core/playwright` to the e2e lane gating the 6 routes.

## PHASE 7 — Performance & offline (scoped)
- Files: `site/app/offline/` (design recovery UI: retry / cached views / contact-later; wire into `next/navigation`'s `notFound`/error boundaries + a service-worker-free fallback since SW isn't present today), add Web Vitals instrumentation (`@vercel/analytics` already mounted; add `onLCP`/`onINP`/`onCLS` reporters to `SiteAnalytics.tsx` with LCP≤2.5s/INP≤200ms/CLS≤0.1 budgets asserted in tests).

## PHASE 8 — release-gate governance (scoped)
- Files: `.github/workflows/release-gate.yml`, new `docs/governance/ux-metrics.yaml`. Add jobs: Lighthouse budgets (LCP/INP/CLS), `axe` a11y, `pnpm run gate` (already runs layout/boundaries/tests). Block release on fail. Add the `P4_migration_no_rollback` governance check is already enforced — extend the yaml with UX metrics.

## PHASE 9 — tech-docs & system map (scoped)
- Files: `docs/architecture/routes.md`, `docs/architecture/product-map.md`, `tech-docs-generator/`. Update route map to reflect the new `MOBILE_TABS` + `MobileAppShell`; document the domain-aware shell (marketing `.mobile-app-shell` vs duplicated `.planner-mobile-shell`/`.studio-mobile-shell`). Keep `check:docs-all` green.

## PHASE 10 — visual regression (scoped)
- Files: `tests/e2e/` (Playwright). Baseline snapshots for: homepage, showrooms, contact, `/products/[category]`, `/ooplanner` (mobile), `/oostudio` (mobile), `/portal`, `/dashboard`, `/admin/plans`. Update baselines after Phases 1–2 land. Add to `pnpm run gate`.

---

## Cross-cutting workstreams (folded into the phases above)

| Workstream (from your messages) | Phase |
|---|---|
| Mobile app shell + bottom tabs + simplified drawer | **1** |
| Canvas-first Planner/Studio, large Save/Export/BOQ | **2** |
| Catalog ↔ plan symbols + tests; homepage IA + sector CTAs; planner-marketing reconciliation | **3** |
| Showrooms metrics + book-visit; contact quote form → `/admin/customer-queries`; policies Key-points; portal/dashboard journeys | **4** |
| Admin shell + uniform tables + bulk actions | **5** |
| Accessibility WCAG 2.2 AA | **6** |
| `/offline` recovery + Web Vitals budgets | **7** |
| `release-gate.yml` UX/perf/security gates | **8** |
| tech-docs + route/domain maps | **9** |
| Visual regression snapshots | **10** |
| Copy sharpening (homepage/about, Patna/Jharkhand, sectors, warranties) | folded into **3b** (copy lives in `site/i18n/messages/en.json` + `site/features/site/data/homepage.ts`) |
| Titan/DMRC/Usha case-study templates | folded into **3b/4a** (new route `(site)/case-studies/[slug]` + `CaseStudyPageView`; wire homepage/portfolio tiles) |
| BOQ handoff → admin CRM | folded into **4d/5** (audit `POST /api/Planner/handoff`; add admin handoff inbox + portal status) |
| i18n / LanguageSwitcher UX | folded into **1/4** (promote en/hi; move switcher to Account) |
| Routing/proxy audit (`site/proxy.ts`, `route-contract.json`) | folded into **3c/9** (add `/contact-us`→`/contact` redirect; verify planner/studio entry rewrites) |
| Header + drawer search unification | folded into **1/3** (shared `nav-search` result card design + ranking via `/api/nav-search/`) |
| QA script (human + AI) | folded into **10** (`docs/qa/qa-script.md` with per-route manual steps mapped to automated specs) |

---

## Mobile acceptance checklist (the original ask — Phase 1+2)

- [ ] **App shell visible** on every `(site)` page at viewport <768 (top bar + content + bottom tabs).
- [ ] **Bottom tabs working**: Home/Catalog/Planner/Studio/Account; active state from `usePathname`; Planner tab fires `planner_entry` conversion; others fire `site_tab_selected` + `site_cta_clicked`.
- [ ] **Canvas-first Planner/Studio**: `/ooplanner` + `/ooplanner/projects/[id]` + `/oostudio` render full-screen canvas with bottom-sheet panels; Save/Export(/BOQ) always visible & thumb-reachable.
- [ ] **Drawer only search + curated links**: `MobileNavDrawer` contains only search + (New arrivals / Best sellers / Saved plans / Contact); no language/auth/CTA blocks.
- [ ] `scan:boundaries` green; `pnpm run check:layout` green; `pnpm run gate` green; `pnpm run test` both lanes green.

---

## Verification commands (run before considering any phase done)
```
pnpm run scan:boundaries
pnpm run check:layout
pnpm run check:style-tokens
pnpm run gate
pnpm run test          # check BOTH lane summaries (default + tech-docs)
pnpm run release:gate  # full, for phase completion
```

## Sequencing recommendation
1. **Phase 1** (this PR) — app shell + tabs + simplified drawer.
2. **Phase 2** — canvas-first Planner/Studio (depends on 1's shell conventions).
3. **Phase 3** — catalog symbols + homepage IA + planner-marketing CTAs.
4. **Phase 4** — showrooms/contact/policies/portal.
5. **Phase 5** — admin tables.
6. Phases 6–10 in parallel after 1–2 land (a11y, perf/offline, release-gate, docs, regression).

Each phase = its own PR. Phase 1 is ready to implement on approval.
