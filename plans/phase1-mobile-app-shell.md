# Phase 1 — Mobile App Shell (10-file PR)

**Status:** Plan, awaiting approval. Concrete diffs against real file contents (read 2026-08-11).
**Scope:** A single PR. Mobile (< 1280px) gets a minimal top bar + bottom tab bar (Home, Catalog, Planner, Studio, Account); desktop (≥ 1280px) is untouched. The mobile drawer is simplified to search + 4 curated shortcuts. Domain boundaries preserved (`scan:boundaries` stays green). Analytics shapes preserved (`planner_entry` conversion still fires on the Planner tab; new `site_tab_selected` event added through the existing consent-gated transport).

**Spec note & trade-off:** the brief said "viewport < 768px". I extend the shell to **< 1280px (xl)** so tablet (768–1280px) doesn't lose nav when the hamburger is removed, and because the owner wants it to "feel like a proper app shell". Phone (≤ 768px) is the primary target; tablet inherits the same chrome. If you want strict < 768px, the only change is the media-query breakpoint token (`--breakpoint-xl` → `--breakpoint-md`) in file #5 — flag it and I'll switch.

---

## The 10 files

| # | File | Change |
|---|---|---|
| 1 | `site/lib/siteViewport.ts` | add `viewportFit: "cover"` |
| 2 | `site/features/site/data/navigation.ts` | add `MOBILE_TABS` + `activeTabFor()` |
| 3 | `site/lib/analytics/siteEvents.ts` | add `trackSiteTabSelected()` |
| 4 | `site/components/site/MobileAppShell.tsx` | NEW — top bar + bottom tabs + owns the drawer |
| 5 | `site/focss/site/components/chrome/app-shell.css` | NEW — shell/tab CSS, hide `.site-header` < 1280 |
| 6 | `site/focss/site/entry.css` | `@import` the new sheet |
| 7 | `site/app/(site)/layout.tsx` | wrap `children` in `<MobileAppShell>` |
| 8 | `site/components/site/MobileNavDrawer.tsx` | simplify → search + 4 curated shortcuts |
| 9 | `site/components/site/Header.tsx` | remove hamburger + drawer render (desktop-only) |
| 10 | `tests/unit/features/site/navigation.test.ts` | NEW — `MOBILE_TABS` + `activeTabFor` unit test |

---

## File 1 — `site/lib/siteViewport.ts`

Add `viewportFit: "cover"` so `env(safe-area-inset-*)` (already used defensively across the codebase) actually returns the home-indicator/notch insets.

```ts
export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",          // ← ADD
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "var(--color-white-50)" },
    { media: "(prefers-color-scheme: dark)", color: "var(--color-dark-midnight-blue-950)" },
  ],
};
```

---

## File 2 — `site/features/site/data/navigation.ts`

Append after `SITE_AUTH_LINK` (line 33). `PRODUCT_SUITE` is already imported at the top of this file.

```ts
/** Bottom tab bar destinations for the mobile app shell (visible < 1280px). */
export const MOBILE_TABS = [
  { id: "home",    label: "Home",    href: "/",                                    icon: "House" },
  { id: "catalog", label: "Catalog", href: "/products",                           icon: "SquaresFour" },
  { id: "planner", label: "Planner", href: PRODUCT_SUITE.planner.routes.guest,     icon: "PencilSimple" },  // /ooplanner
  { id: "studio",  label: "Studio",  href: "/oostudio",                           icon: "PaintBrush" },
  { id: "account", label: "Account", href: SITE_AUTH_LINK.href,                    icon: "UserCircle" },    // /access
] as const;

export type MobileTabId = (typeof MOBILE_TABS)[number]["id"];

/** Resolve the active tab id from a pathname (null = interior page, no active tab). */
export function activeTabFor(pathname: string): MobileTabId | null {
  const p = (pathname || "/").replace(/\/+$/, "") || "/";
  if (p === "/") {return "home";}
  if (p.startsWith("/products")) {return "catalog";}
  if (p.startsWith("/ooplanner") || p.startsWith("/planner")) {return "planner";}
  if (p.startsWith("/oostudio")) {return "studio";}
  if (["/access", "/dashboard", "/portal", "/login"].some((s) => p.startsWith(s))) {return "account";}
  return null;
}
```

Notes:
- `/ooplanner` is a planner-entry href → its tab renders via `PlannerLaunchLink` (stamps `siteSource`/utm + fires `planner_launch_clicked` + the `planner_entry` conversion). Other tabs use `TrackedLink`.
- `/oostudio` has no `PRODUCT_SUITE` entry (confirmed) — referenced directly.

---

## File 3 — `site/lib/analytics/siteEvents.ts`

Add before the `@internal test-only aliases` block (line 169). No tab event exists today (confirmed by grep); this matches the `SiteEventPayload` primitive-only contract and is consent-gated automatically via `emitSiteEvent`.

```ts
export function trackSiteTabSelected(params: {
  pathname: string;
  tab: string;
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

The Planner tab additionally flows through `PlannerLaunchLink` (which calls `handlePlannerEntryNavigation` → `trackPlannerLaunchClicked` + `planner_entry` conversion) — `trackSiteTabSelected` is additive, not a replacement.

---

## File 4 — `site/components/site/MobileAppShell.tsx` (NEW)

Client component. Renders the mobile top bar (logo + search trigger) and the bottom tab bar around `children`, and owns the (simplified) `MobileNavDrawer` so there is a single drawer instance. Hidden on ≥ 1280px via CSS (file #5).

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  SquaresFour,
  PencilSimple,
  PaintBrush,
  UserCircle,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { isPlannerEntryHref } from "@/lib/analytics/plannerEntry";
import { trackSiteTabSelected } from "@/lib/analytics/siteEvents";
import { MOBILE_TABS, activeTabFor } from "@/features/site/data/navigation";
import { MobileNavDrawer } from "@/components/site/MobileNavDrawer";

const TAB_ICONS = { House, SquaresFour, PencilSimple, PaintBrush, UserCircle } as const;

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [navOpen, setNavOpen] = useState(false);
  const active = activeTabFor(pathname);

  return (
    <div className="mobile-app-shell">
      <header className="mobile-app-bar">
        <Link href="/" aria-label="One&Only — home" className="mobile-app-bar__brand">
          <OneAndOnlyLogo variant="orange" className="h-7" />
        </Link>
        <button
          type="button"
          aria-label="Search"
          aria-expanded={navOpen}
          aria-controls="mobile-nav-drawer"
          aria-haspopup="dialog"
          onClick={() => setNavOpen(true)}
          className="mobile-app-bar__action shell-icon-button"
        >
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <div className="mobile-app-main">{children}</div>

      <nav className="mobile-tab-bar" aria-label="Mobile primary">
        {MOBILE_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.icon as keyof typeof TAB_ICONS];
          const isPlanner = isPlannerEntryHref(tab.href);
          const LinkCmp = isPlanner ? PlannerLaunchLink : TrackedLink;
          const isActive = active === tab.id;
          return (
            <LinkCmp
              key={tab.id}
              href={tab.href}
              label={tab.label}
              surface="mobile-tab-bar"
              onClick={() =>
                trackSiteTabSelected({ pathname, tab: tab.id, destination: tab.href })
              }
              className={`mobile-tab${isActive ? " mobile-tab--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              <span className="mobile-tab__label">{tab.label}</span>
            </LinkCmp>
          );
        })}
      </nav>

      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  );
}
```

Notes:
- `MobileNavDrawer` is simplified (file #8) and no longer needs `groupedCategories` or `closeButtonRef`, so its props reduce to `{ open, onClose }`.
- z-index: `.mobile-app-bar` and `.mobile-tab-bar` are `z-50` (same layer as `SiteHeader`); the drawer's react-aria `ModalOverlay` is `z-[60]`/`z-[70]` so it still covers the tab bar — correct.
- The layout's `<main id="main-content">` (file #7) wraps this shell, so the existing skip-link target still works; the shell renders `<div>`s only (no duplicate `main`).

---

## File 5 — `site/focss/site/components/chrome/app-shell.css` (NEW)

Global FOCSS sheet (no modules — matches house style). Reuses existing tokens (`--surface-glass-strong`, `--border-soft`, `--surface-panel-strong`, `--text-strong`, `--text-muted`, `--radius-pill`). Mobile-only via `@media (width < theme(--breakpoint-xl))` (= 1280px).

```css
/* Mobile app shell — visible < 1280px (phone + tablet). Desktop uses SiteHeader. */
.mobile-app-shell { display: none; }

@media (width < theme(--breakpoint-xl)) {
  .mobile-app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  /* Minimal top bar */
  .mobile-app-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    height: 3.25rem;
    padding-inline: var(--space-3);
    padding-top: env(safe-area-inset-top, 0px);
    border-bottom: 1px solid var(--border-soft);
    background-color: var(--surface-glass-strong);
    backdrop-filter: blur(16px);
  }
  .mobile-app-bar__brand { display: inline-flex; align-items: center; }
  .mobile-app-bar__action {
    height: 2.5rem;
    width: 2.5rem;
    border-radius: var(--radius-pill);
  }

  .mobile-app-main {
    flex: 1 1 0%;
    min-width: 0;
  }

  /* Bottom tab bar */
  .mobile-tab-bar {
    position: sticky;
    bottom: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-top: 1px solid var(--border-soft);
    background-color: var(--surface-panel-strong);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .mobile-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 3.5rem;
    padding-block: var(--space-1);
    color: var(--text-muted);
    font-size: 0.6875rem;
    line-height: 1;
  }
  .mobile-tab--active { color: var(--text-strong); }
  .mobile-tab__label { line-height: 1; }

  /* Hide the marketing SiteHeader on phone+tablet — the app bar is the only top chrome. */
  .site-header { display: none; }

  /* The fixed-header offset is no longer needed < 1280px (app bar is in-flow). */
  .site-main-under-header { padding-top: 0; }
}
```

---

## File 6 — `site/focss/site/entry.css`

Append the new sheet after `./components/index.css` (line 8):

```css
@import "./components/chrome/app-shell.css";
```

---

## File 7 — `site/app/(site)/layout.tsx`

Add the import and wrap `children` in the shell. The `<main id="main-content">` stays (skip-link target); the shell renders inside it.

```tsx
import { MobileAppShell } from "@/components/site/MobileAppShell";
// ...
<main id="main-content" className="site-main-under-header">
  <MobileAppShell>{children}</MobileAppShell>
</main>
```

(The rest of the layout — `RouteChromeSuspense`, `QuoteCartChrome`, providers — is unchanged. `RouteChrome` still mounts `SiteHeader`, which is now CSS-hidden < 1280px.)

---

## File 8 — `site/components/site/MobileNavDrawer.tsx` — simplify

Reduce the drawer to **search + 4 curated shortcuts**. Remove the accordion categories, the auth link, the call link, `LanguageSwitcher`, and the CTA grid (language/auth/CTAs move to the Account tab → `/access`/`/dashboard` in Phase 4).

Props change from `{ open, onClose, closeButtonRef, groupedCategories }` → `{ open, onClose }`. Drop imports: `MarketingCtaLink`, `PlannerLaunchLink`, `LanguageSwitcher`, `SITE_NAV_LINKS`, `SITE_CTA_LINKS`, `SITE_AUTH_LINK`, `isPlannerEntryHref`, `GroupedCategory`, `CaretDown`, `cn`. Keep: search form (unchanged), `TrackedLink`, `OneAndOnlyLogo`, `trackSiteSearchSubmitted`, `MagnifyingGlass`, `Sparkle`, `X`, `Dialog`/`Modal`/`ModalOverlay`, `Link`, `useRouter`.

Replace the `<ul className="min-w-0 space-y-1">…</ul>` (lines 342–466) **and** the footer `<div>` (lines 469–502) with:

```tsx
<ul className="min-w-0 space-y-1">
  <li>
    <TrackedLink href="/products?sort=new-arrivals" label="New arrivals" surface="mobile-nav" className={drawerLinkClass} onClick={handleClose}>
      New arrivals
    </TrackedLink>
  </li>
  <li>
    <TrackedLink href="/products?filter=best-sellers" label="Best sellers" surface="mobile-nav" className={drawerLinkClass} onClick={handleClose}>
      Best sellers
    </TrackedLink>
  </li>
  <li>
    <TrackedLink href="/portal" label="Saved plans" surface="mobile-nav" className={drawerLinkClass} onClick={handleClose}>
      Saved plans
    </TrackedLink>
  </li>
  <li>
    <TrackedLink href="/contact" label="Contact" surface="mobile-nav" className={drawerLinkClass} onClick={handleClose}>
      Contact
    </TrackedLink>
  </li>
</ul>
```

The search form block (lines 262–340), the focus-trap/Esc/scroll-lock effects, and the `Modal`/`Dialog` shell stay unchanged — including `trackSiteSearchSubmitted({ surface: "mobile", … })` (do **not** change the `surface` union value).

**Dependency note:** `/products?sort=new-arrivals` and `?filter=best-sellers` query params are not yet parsed by the products page (confirmed). The links still work (land on `/products`) but won't filter until Phase 3 wires the filter parser. `/new-arrivals`, `/best-sellers`, `/saved-plans` routes do **not** exist (confirmed) — intentionally not created; `/portal` covers "Saved plans". This is flagged in the acceptance checklist as a Phase 1→3 dependency.

---

## File 9 — `site/components/site/Header.tsx` — desktop-only

Remove the mobile drawer ownership (now in `MobileAppShell`). Specifically remove:
- `import { MobileNavDrawer } from "@/components/site/MobileNavDrawer";` (line 18)
- `import { flushSync } from "react-dom";` (line 4 — only used by the hamburger)
- `mobileOpen` state (line 90) and `hamburgerRef` (line 102)
- the resize effect that closes the drawer at ≥ 1280px (lines 181–188)
- the hamburger `<button>` (lines 536–564)
- the `<MobileNavDrawer …/>` render (lines 580–586)

Keep the desktop nav, `HeaderSearchPanel`, `HeaderProductsMegaMenu`, `LanguageSwitcher`, and the auth `TrackedLink`. The `.site-header` element is now CSS-hidden < 1280px (file #5), so its remaining desktop chrome only shows on ≥ 1280px.

---

## File 10 — `tests/unit/features/site/navigation.test.ts` (NEW)

Pure-function unit test (no React/render mocking needed) — matches the house style of `tests/unit/features/site/planSvg/resolvePdpPlanSvgThumb.test.ts` (vitest, `describe`/`it`/`expect`, happy-dom lane).

```ts
import { describe, expect, it } from "vitest";
import { MOBILE_TABS, activeTabFor } from "@/features/site/data/navigation";

describe("MOBILE_TABS", () => {
  it("exposes the 5 canonical tabs in order", () => {
    expect(MOBILE_TABS.map((t) => t.id)).toEqual([
      "home", "catalog", "planner", "studio", "account",
    ]);
  });

  it("points planner at the guest workspace (/ooplanner) and account at /access", () => {
    const byId = Object.fromEntries(MOBILE_TABS.map((t) => [t.id, t.href]));
    expect(byId.planner).toBe("/ooplanner");
    expect(byId.account).toBe("/access");
    expect(byId.studio).toBe("/oostudio");
  });
});

describe("activeTabFor", () => {
  it("resolves home on root", () => {
    expect(activeTabFor("/")).toBe("home");
  });
  it("resolves catalog for any /products path", () => {
    expect(activeTabFor("/products")).toBe("catalog");
    expect(activeTabFor("/products/seating")).toBe("catalog");
  });
  it("resolves planner for /ooplanner and /planner marketing paths", () => {
    expect(activeTabFor("/ooplanner")).toBe("planner");
    expect(activeTabFor("/ooplanner/projects/123")).toBe("planner");
    expect(activeTabFor("/planner/features")).toBe("planner");
  });
  it("resolves studio for /oostudio", () => {
    expect(activeTabFor("/oostudio")).toBe("studio");
  });
  it("resolves account for auth/portal/dashboard paths", () => {
    expect(activeTabFor("/access")).toBe("account");
    expect(activeTabFor("/dashboard")).toBe("account");
    expect(activeTabFor("/portal/abc")).toBe("account");
  });
  it("returns null for interior marketing pages", () => {
    expect(activeTabFor("/about")).toBeNull();
    expect(activeTabFor("/showrooms")).toBeNull();
  });
});
```

Run: `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/features/site/navigation.test.ts`.

---

## Mobile acceptance checklist (Phase 1)

- [ ] **App shell visible** on every `(site)` page at < 1280px (top bar + content + bottom tabs); desktop (≥ 1280px) unchanged.
- [ ] **Bottom tabs working**: Home/Catalog/Planner/Studio/Account render; active state follows `usePathname` via `activeTabFor`; tab click fires `site_tab_selected`; **Planner tab additionally fires `planner_entry` conversion** (via `PlannerLaunchLink`).
- [ ] **Drawer only search + curated links**: `MobileNavDrawer` contains only the search form + New arrivals / Best sellers / Saved plans / Contact; no language/auth/CTA blocks.
- [ ] `scan:boundaries` green (no new cross-fork imports — `MobileAppShell` is in `site/components/site/`, neutral).
- [ ] `pnpm run check:layout` green; `pnpm run gate` green; `pnpm run test` both lanes green (default + tech-docs).
- [ ] `viewportFit: "cover"` set; bottom tab bar clears the home indicator (`env(safe-area-inset-bottom)`).
- [ ] **Phase 1→3 dependency flagged:** `/products?sort=new-arrivals` and `?filter=best-sellers` don't filter yet (links land on `/products`); wiring lands in Phase 3.

## Verification commands
```
pnpm run scan:boundaries
pnpm run check:layout
pnpm run check:style-tokens
pnpm run gate
pnpm run test          # check BOTH lane summaries
```
