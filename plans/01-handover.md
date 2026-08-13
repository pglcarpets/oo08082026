# Handover — session close

**AUDITED:** 2026-08-13 · **Scope:** registry recount after audit archive · Registry: [`00-README.md`](./00-README.md)

---

## Session closed — 2026-08-12

**Pushed:** `1157423` on `origin/main` (36 files, +795/−89). Vercel deploy triggered — **verify GA4 analytics fire after deploy** (CSP `connect-src` now allows `stats.g.doubleclick.net` etc.).

### Closed this session

| Slice | What |
|-------|------|
| TST-S22 | `/api/exports` gated (`withAuth` member + CSRF + rate-limit; 503 on prod read-only FS) — tests 5/5 |
| TST-S23 | `<html lang>` wired to resolved locale via `getHtmlLang` — layout tests 3/3 |
| TST-S24 | `/showrooms/` GSAP `removeChild` crash fixed (scroll-reveal gated on `motionReady`) — `showrooms-console-clean.spec.ts` pass |
| TST-S25 | `toolautosubmit` boolean → `""` string (Header + MobileNavDrawer) — console clean |
| TST-S26 | Hero CTA contrast → `--color-accent-strong` (4.91:1) — homepage axe WCAG2AA green |
| TST-S27 | Touch targets ≥44px (footer, carousel dots, filter pills, chips, breadcrumb) — `touch-targets.spec.ts` 2/2 |
| TST-S28 | Planner/Studio `aside role=toolbar` → `div` — `test:a11y` 3/3 green |
| TST-S31 / PX-S10 | `audit-api-route-safety.mjs` now enforces `other` surface (rate-limit on mutators, auth/allowlist on GETs) — audit ok |
| TST-S32 / PX-S07 | `/api/git-user` admin-gated — tests 4/4 |
| TST-S33 / PX-S08 | `/api/dev/auth-bypass-status` 404-in-prod + test |
| SITE-S20 | `LanguageSwitcher` `NEXT_LOCALE` cookie `; Secure` on HTTPS |
| — | CSP GA4 fix (proxy.ts `connect-src`) — **deploy pending** |
| — | Catalog image fix — 4 DB products (`60x30-modular`, `linear-workstation`, `deskpro-system`, `paper-tray`) pointed at existing deskpro assets; paper-tray asset added to `products/` |

### Plans expanded
02–09 all expanded with audit-derived slices (TST-S29–S34, OPS-S10–S12, DB-S11–S13, WRK-S15–S17, SITE-S19–S22, TECH-S07–S08, PX-S07–S11, CHK-S11–S12).

---

## Close checklist (HO-S01–S06) — all DONE 2026-08-09

| ID | Seam | Evidence |
|----|------|----------|
| HO-S01 | `pnpm run p0:unit` | `results/tests/vitest-p0-results.json` — 23 files / 146 tests |
| HO-S02 | `pnpm run check:docs-all` | exit 0 |
| HO-S03 | Plan `AUDITED` headers | all programme plans 2026-08-12 |
| HO-S04 | `check-plans-purity` | OK |
| HO-S05 | `activeBlockers.ts` ↔ Failures | zero active |
| HO-S06 | Registry ↔ this file | aligned — 90 DONE / 32 OPEN / 1 PARTIAL |

---

## Failures map

| ID | State |
|----|-------|
| F1–F4 | **DONE** — all closed |

**Zero active blockers** per [`Failures.md`](../Failures.md). Do not file the audit’s proposed Failures.md rows — leftover findings are plan OPEN IDs.

---

## OPEN by priority (next-session queue)

| Pri | Count | IDs |
|-----|-------|-----|
| **P1** | 5 | OPS-S05 (Vercel token lifecycle) · DB-S04 · DB-S05 · DB-S07 · DB-S08 |
| **P1 PARTIAL** | 1 | DB-S06 (contact query DB smoke) |
| **P2** | 16 | TST-S29 · TST-S30 · TST-S34 · TST-S35 (htmlLang fr/de/es `*-IN`) · OPS-S10 · OPS-S11 · DB-S11 · WRK-S15 · WRK-S16 · WRK-S17 · SITE-S19 · SITE-S22 · TECH-S07 · TECH-S08 · PX-S09 · PX-S11 |
| **P3** | 4 | OPS-S12 · DB-S12 · DB-S13 · SITE-S21 |
| **COST** | 7 | COST-S00–S06 (plan 10 — do not expand here) |
| **—** | 1 | DB-S10 |

---

## Next session

1. [`08-oo-start-checklist.md`](./08-oo-start-checklist.md) — CHK-S11 (audit summary, do not re-run Phase A) + CHK-S12
2. Remaining P1s only: **OPS-S05 · DB-S04 · DB-S05 · DB-S07 · DB-S08** (DB-S06 PARTIAL). P2 backlog is in [`00-README.md`](./00-README.md).
3. Suggested first P2 after P1s: **TST-S30 / TECH-S07** (stale tech-docs JSON) or **TST-S29 / TECH-S08** (default lane 17 red).
4. Close with HO-S01–S06 again

---

## Notes for tomorrow

- **Deploy verification is the top priority** (CSP/GA4 + catalog image paths need the new build live).
- Pre-existing red tests (not from this session): `page.test.tsx` + `clients/page.test.tsx` (broken suites), `check-plans-purity.test.ts` (stale expectation), `serviceRoleOnlyTables.db.test.ts` (live-DB drift) — see audit P2-6.
- Catalog images: the 4 fixed products point at `oando-workstations--deskpro` flat paths (200 on CDN + on disk). If dedicated product photos are wanted later, they're in `.tmp/products/` (60x30/linear/deskpro variants).

*Registry recount: 2026-08-13. Session close: 2026-08-12.*
