# Phase 4a ledger — Marketing `/` interactive audit

**Date:** 2026-08-02 · **Method:** real Playwright interaction at `http://localhost:3000`, viewports 1920×1080, 1280×800, 390×844, 320×700.  
**Audit scripts:** `tests/e2e/audit-4a-marketing-journey.spec.ts` + `tests/e2e/audit-4a-marketing-pages.spec.ts` — 12 cases, all pass.  
**Evidence:** `D:\results\marketing\audit-4a\`  
**Status:** partial fixes applied; ledger updated 2026-08-06.

---

## Findings

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Assistant launcher appears off-canvas / not reachable at 390px | Major | Open |
| 2 | Assistant header text overflows at 390px | Major | Open |
| 3 | `/trusted-by` route intermittently aborts (`ERR_ABORTED`) | Major | Open |
| 4 | Hero preload `imageSrc` mismatches rendered LCP size | Major | ✅ Fixed: `HomepageHero.tsx` sizes updated to responsive breakpoints. |
| 5 | React hydration mismatch on `/contact` | Major | Open |
| 6 | Two homepage sections render with empty heading | Minor | Open |
| 7 | 23 of 48 images never load after full scroll | Minor | Open |
| 8 | Hero "Trusted by" card exposes 90-character link name | Minor | Open |
| 9 | Duplicate labels in tab order | Nit | Open |
| 10 | Submitted enquiry notifies nobody | Major | Open |
| 11 | Enter does not send in assistant composer | Minor | ✅ Fixed: `UnifiedAssistant.tsx` now submits on plain `Enter`, Shift+Enter for newline. |

## Checked and found sound

- Responsive: 0px document overflow at all tested widths.
- Touch targets: 0 under 44px at 390px.
- 1920 layout: hero 660px of fold, copy column 808px, 10 visible CTAs, no overflow.
- Contact form: disabled when empty, POST 200, confirms with reference id.
- Images: 48 images, 0 broken, 0 missing `alt`.
- Keyboard: 25 tab stops, `focusVisible` on every stop.
- Redirects: all marketing hrefs resolve with one 308 → 200 hop.
- Compare empty state honest: "Products selected: 0/4".

## Housekeeping

Test 9 submits a real enquiry. Query reference from the audited run: `e7048dda-720b-4914-a34f-c81e08d98a5e` — delete from `/admin/customer-queries` if still present.

## Sign-off

Ledger not owner-signed. Proposed blocker+major fix set: #1–#5.