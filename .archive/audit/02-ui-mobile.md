# 02 â€” UI Mobile Audit

**Date:** 2026-08-11
**Track:** 2 â€” UI Mobile (<768 phone + 820Ã—1180 tablet) + safe-area / touch targets / thumb reach
**Mode:** Audit only â€” no source edits, no migrations, no baseline updates
**Workspace:** `E:\oo08082026` Â· pnpm only Â· never inside `site/` Â· browser truth `http://localhost:3000` only

---

## Overview

Scope is the phone and tablet surface for the same marketing + app route set as 01. Verifies: overflow at 360 px (tightest Android width), touch targets â‰¥44 px (WCAG 2.5.5 AAA target, exceeds AA's 24Ã—24), `env(safe-area-inset-*)` on the drawer, thumb-zone / hamburger reach, and the pre-Phase-1 mobile chrome contract (SiteHeader hamburger + `MobileNavDrawer`).

Current contract (pre-Phase-1): Studio (`/oostudio`) has no dedicated mobile shell â€” known gap, the single shell must be verified at 390 anyway. Planner is canvas-first; mobile ergonomics are weaker than marketing and are noted without inventing a non-existent responsive plan.

---

## Method

**Pre-flight:** Same doc set as 01 (AGENTS.md Â§2, `03-browser.md`, `07-css.md`, product-map/routes/stack/rules, Testing-handbook, START, and the 85-strict plan).

**Dev server â€” verified before browsing (never 127.0.0.1):**
```powershell
Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 10   # 12:29Z STATUS:200
Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 8    # 12:55Z UP 200 (after restart)
```

**Viewports exercised (waited for `networkidle` + `document.fonts.ready` before every metric/screenshot):**
- Phone (primary): `390Ã—844` (iPhone-like) â€” required by spec and by 07's WCAG probe
- Phone (tight): `360Ã—740` â€” overflow floor (Android minimum)
- Tablet: `820Ã—1180` â€” iPad-class (proof attempted; see Deferred â€” timeout before tablet pass completed)
- Raw overflow floor: `1280 laptop` from pass-1 confirms desktopâ†’mobile transition

**Browser probes:**

1. Reused scripts:
   ```powershell
   node scripts/ui-polish-pass1-audit.mjs
   # â†’ results/ui-polish/pass-1/audit-report.json â€” phone (390) column: every 200 route horizontalOverflow:false, console=1 (toolautosubmit), except /showrooms phone 500 (flaky â€” see 01 D-03)
   
   node scripts/responsive-audit.mjs
   # â†’ results/responsive-audit-final/mobile/*.png (420 attempted) â€” mobile run completed (mobile / OK table, desktop timed out before finish)
   ```

2. Custom mobile audits (this report):
   ```powershell
   node scripts/tmp-mobile.mjs
   # Phones 390 + 360 for all 17 routes: overflow, h1Count, touch-target measure (a, button getBoundingClientRect), safe-area probe, drawer open/close
   # Drawer probe on / at 390: hamburger click â†’ overlay z-[60] + modal z-[70] â†’ Esc â†’ Tab trap
   ```

**Screenshots saved (mobile):**
- `results/audit/screenshots/mobile/` â€” 66 files from `tmp-mobile.mjs` + pass-1:
  e.g. `root-mobile-390.png` + `root-mobile-390-full.png`, `about-mobile-390.png`, `products-mobile-390.png`, `products_workstations-mobile-390.png`, `contact-mobile-390.png`, `oostudio-mobile-390.png`, `ooplanner-mobile-390.png`, `admin-mobile-390.png`, `_drawer-open-390.png`
  Phone-tight mirrors: `root-mobile-360.png`, `products_workstations-mobile-360.png`, etc. (pattern `<slug>-mobile-{390|360}.png`)
- `results/ui-polish/pass-1/` â€” 17 phone images `home-phone.png`, `products-phone.png`, etc. (fullPage at 390)

**Overflow check:** `Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth` plus per-element `getBoundingClientRect().right > innerWidth + 6` scan (decor filters for marquee/carousel/sr-only).

**Touch target check:** measured every visible `a, button` (`getBoundingClientRect().w/h`), flagged `<44` on either axis (WCAG 2.5.5 AAA â€” 44Ã—44; stricter than AA's 24Ã—24 per `docs/governance/rules.md` quality target).

**Safe-area:** scanned computed style `paddingBottom.includes("safe-area")` + inline style + class, and measured `#mobile-nav-drawer` `getComputedStyle(paddingBottom)` + `pt-[env(safe-area-inset-top,0px)]` source check.

---

## Findings

### [P1] M-01 â€” Touch targets below 44 px on every marketing route (footer/social + carousel dots + product pills)

**Priority:** P1 (fails WCAG 2.5.5 AAA 44Ã—44 target; some also breach AA 24Ã—24 but AAA is the stated bar in `docs/governance/rules.md` Â§ Quality targets)
**Evidence (measured `wÃ—h` at 390Ã—844, `isMobile:true, hasTouch:true`):**
- `/` â†’ `small=22/57` â€” samples: `BUTTON "" 32Ã—8` + `8Ã—8` + `8Ã—8` (carousel dots), `A "Privacy policy" 101Ã—17` (footer link), `A "+91 90310â€¦" 358Ã—34` (footer phone â€” height 34 <44), `sales@oando.co.in 358Ã—34`. Full samples in `scripts/tmp-mobile.mjs` log.
- `/products/workstations/` â†’ `small=22/56` at 390, `25/59` at 360 â€” worst offender: `BUTTON "Height Adjustable Se" 168Ã—31`, `"Desking Series" 114Ã—31`, `"Panel Series" 100Ã—31` (filter pills below 44h). Also `A "Products Catalog" 316Ã—17` breadcrumb.
- `/contact` â†’ `small=21/36` â€” `A "Privacy policy" 288Ã—42` (height 42), `BUTTON "Send - we respond wi" 324Ã—27` (submit CTA inner label box â€” visual button is larger but measured label span is 27h), `A "Call +91â€¦" 261Ã—42`.
- Footer-social: every route shows two `A "" 36Ã—36` social icons below 44.
- App shells: `/oostudio` `small=53/53` â€” every toolbar button is `35Ã—23, 31Ã—23, 25Ã—23` (unit toggles mm/cm/m/in, Template 72Ã—30 still <44h); `/ooplanner` `small=2/52` â€” `"More" 33Ã—51` narrow, logo `116Ã—30` short.
**Screenshot:** `results/audit/screenshots/mobile/root-mobile-390.png` (footer), `root-mobile-360.png` (same), `products_workstations-mobile-390.png` (pills), `oostudio-mobile-390.png` (toolbar)
**Owner action:** Lift target boxes to `min-h-11 min-w-11` (44px) consistently â€” already used on drawer links (`drawerLinkClass` uses `min-h-11`) but missing on marketing pills, footer links, carousel dots, Studio toolbar chips, and the two 36Ã—36 social icons (`site/focss/site/components`).

### [P2] M-02 â€” No horizontal overflow at 360 px (pass)

**Priority:** P2 (positive)
**Evidence:**
- `tmp-mobile.mjs` â€” every phone route at both 390 and 360: `overflow=0` (e.g. `mobile-360 / overflow=0 h1=1`, `mobile-360 /products/workstations overflow=0`, `mobile-360 /contact overflow=0`). Same at 390: `mobile-390 / overflow=0` for all 17.
- `results/ui-polish/pass-1/audit-report.json` â€” `metrics.horizontalOverflow: false` with `scrollWidth: 390 clientWidth: 390` on every `phone` check (including `388` at `/products/workstations/phone` which passed).
**Screenshots:** `results/audit/screenshots/mobile/*-mobile-360.png` and `*-full.png` â€” no horizontal scroll bar at 360 or 390.

### [P2] M-03 â€” Safe-area inset declared on drawer but not verified on device

**Priority:** P2 (declaration present, runtime proof limited)
**Evidence:**
- Source: `site/components/site/MobileNavDrawer.tsx:243` â€” `className="... pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"` with fallbacks `0px` (correct). `Header` itself uses no safe-area insets (fixed `h-16 top-0`).
- Probe: `tmp-mobile.mjs` at 390 reported `safe=true` on `/` (global `hasSafe` scan found `safe-area` token), but `false` on `/about`, `/products`, `/contact`, etc. outside the open drawer (drawer not in DOM until triggered). After drawer open at 390, `drawerPaddingBottom` measured at `0px` in emulation (no real notch on 390 emulator â€” `env()` resolves to `0px`, fallback path). No evidence of breakage; just no device proof that `env()` inflates on iOS notch/Dynamic Island.
**Screenshot:** `results/audit/screenshots/mobile/_drawer-open-390.png` â€” drawer fills `92vw`, bottom padding looks correct at 0 + fallback.
**Owner action:** Keep as-is; add a real-device check (iPhone with home indicator) before claiming safe-area â€” see Deferred.

### [P3] M-04 â€” Hamburger reach + drawer behavior (pass, thumb-zone sound)

**Priority:** P3 (positive)
**Evidence:**
- Source: `site/components/site/Header.tsx:536-564` â€” hamburger `h-11 w-11 min-h-11 min-w-11 xl:hidden`, `aria-label Open/Close menu`, `aria-expanded`, `aria-controls="mobile-nav-drawer"`, `aria-haspopup="dialog"`, `touch-manipulation`, toggles `flushSync` to mount drawer before focus.
- Probe at 390: hamburger found and clicked, drawer opened at `w=~358 h=844 left=~32 top=0`, `z-[60]` overlay (`bg-black/80 backdrop-blur-sm`) + `z-[70]` modal stacked above `z-50` header (verified via `tmp-mobile.mjs` `DRAWER_OPEN { zOver: "60", zModal: "70", zHeader: "50", w: 358, ... }`). Thumb reach is bottom-half of screen? â€” button is at header `right:0 top:0`, still reachable one-hand at 390 (right thumb). Body scroll is locked while open (`MobileNavDrawer.tsx:94-101` â€” `document.body.style.overflow = "hidden"` + `html overflowX = "clip"`).
- Esc: `MobileNavDrawer.tsx:119-122` `if (e.key==="Escape") onClose()` â€” also tested: `Esc` dismissed drawer (`DRAWER_AFTER_ESC visible= false` in probe log).
- Focus trap: `MobileNavDrawer.tsx:124-139` â€” `Tab` loops `firstâ†”last` inside `drawerRef` (`focusable` query `a[href], button:not([disabled]), input, [tabindex]`).
**Screenshot:** `results/audit/screenshots/mobile/_drawer-open-390.png` (full drawer at 390), plus per-route `*-mobile-390*.png` with closed state (hamburger visible top-right at 390).

### [P3] M-05 â€” Current mobile chrome documented (pre-Phase-1 state, not a failure)

**Evidence:**
- Marketing chrome at `<1280` is `SiteHeader` hamburger + `MobileNavDrawer` (508 LOC, `Dialog/Modal/ModalOverlay` from `react-aria-components`, `z-[60]/[70]`). This is the live contract â€” see `site/components/site/Header.tsx:181-188` resize handler and `MobileNavDrawer.tsx:77-508`.
- Pre-Phase-1 states explicitly in audit spec and confirmed on disk:
  - Planner: canvas-first at phone (no mobile-reflow pass yet); toolbar wraps but no sheet/panel reflow â€” not filed as blocker in this audit, flagged as Deferred.
  - Studio: mobile shell gap (known none) â€” `/oostudio` renders but `53/53` touch targets <44 (M-01) and canvas/toolbar are not thumb-optimized; spec says "Studio mobile shell gap (known none)".
- Comparison to `agent-reports/audit/Mobile app shell for oando.co.md` (2026-08-07 draft) â€” the drawer/filed states have since landed; desktop header z/locking matches this audit's measurements.

### [P2] M-06 â€” Planner canvas + app shells at phone (functional, ergonomics deferred)

**Priority:** P2 (no crash, poor ergonomics)
**Evidence:**
- `mobile-390 /ooplanner status=200 overflow=0 small=2/52` â€” rail + dockview shell renders but most controls are desktop-sized (small only `116Ã—30` logo, `33Ã—51` More bar â€” remainder are â‰¥44 because dockview buttons are larger). No overflow.
- `mobile-390 /ooplanner/projects status=200 overflow=0 small=1/2` â€” list view renders.
- `mobile-390 /oostudio status=200 small=53/53` â€” Studio is the outlier: every chip <44 (see M-01); canvas itself is not measured for pointerâ†’paint, just that it does not overflow at 390.
**Screenshot:** `results/audit/screenshots/mobile/oostudio-mobile-390.png`, `ooplanner-mobile-390.png`, `ooplanner_projects-mobile-390.png`

### [P2] M-07 â€” `env(safe-area-inset-bottom)` on page chrome (no regression)

**Priority:** P2
**Evidence:** No marketing page outside the drawer uses `env(safe-area-*)` intentionally â€” body/footer are not inset (correct for non-app shell). Drawer insets via `pt/pb-[env(...)]` only. No evidence of content clipped by home indicator at 390-full screenshots (footer links sit above bottom edge). Real-device verification still needed (see Deferred).

### [P2] M-08 â€” Tablet (820Ã—1180) â€” probe incomplete, no failure claimed

**Priority:** P2
**Evidence:** Tableau pass was queued in `scripts/tmp-mobile.mjs` as `{name:"tablet-820", w:820, h:1180}` but the run hit the 300s timeout during the 360 pass (the dev server stayed up â€” `UP 200` post-check) and tablet data was not collected. The tablet dir `results/audit/screenshots/tablet/` was created with directory marker `tablet/` existing on disk but 0 images (`Count 0` at 12:57Z). No claim made.
**Deferred:** Re-run tablet pass standalone (one viewport, sequential, longer timeout) and capture hero + nav collapse at 820 vs 1024 vs 1280.

---

## Deferred

- Tablet 820Ã—1180 full pass (hero, nav collapse, drawer at 820) â€” timed out mid-run; re-run isolated.
- Real-device safe-area check (iOS with home indicator / Android gesture nav).
- Thumb-zone heatmap / scroll depth on long pages (`/products`, `/clients`) â€” not probed.
- Planner gesture handling (pan/pinch on mobile canvas) â€” out of scope for this pass.
- Reduced-motion `prefers-reduced-motion` on drawer/hero â€” not probed.

---

## Changed files

None (audit only).

---

## Blockers â€” proposed Failures.md rows (do NOT edit Failures.md)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| `AUDIT-M-01-touch-44` | P1 | 18â€“25 interactive targets per marketing route measure <44Ã—44 at 390/360 (footer + social 36Ã—36 + carousel dots 8Ã—8/32Ã—8 + product pills 31h); Studio 53/53 <44 | `scripts/tmp-mobile.mjs` logs: e.g. `/` small=22/57 `BUTTON "" 32Ã—8`, `A 36Ã—36 Ã—2`, `358Ã—34 <44h`; `/products/workstations` `168Ã—31 pillars`; `/oostudio` `35Ã—23 mm/cm` chips; screenshots `root-mobile-390.png`, `products_workstations-mobile-390.png`, `oostudio-mobile-390.png` | Enforce `min-h-11 min-w-11` on all `a/button` below 768; specifically: footer social â†’ 44, carousel dots â†’ 44, product filter pills â†’ `min-h-11`, Studio unit toggles â†’ `min-h-11` |
| `AUDIT-M-06-planner-mobile-ergonomics` | P2 | Planner/Studio canvas-first at phone â€” functional but not thumb-optimized (known pre-Phase-1) | `mobile-390 /ooplanner overflow=0` but desktop chrome reused; `Mobile app shell for oando.co.md` draft gap confirmed; `oostudio 53/53 <44` | Deferred â€” include in Phase C after M-01; no blocker today (spec says "known none") |
| `AUDIT-M-08-tablet-820-incomplete` | P2 | Tablet 820Ã—1180 probe incomplete (timeout before capture) | `results/audit/screenshots/tablet/` count 0 at 12:57Z; `tmp-mobile.mjs` timed out after 360 pass | Re-run tablet standalone before sign-off |

