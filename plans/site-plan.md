# Site plan — marketing, i18n, UI polish — AUDITED 2026-08-08

**Status:** PARTIAL — member suite landings claimed 2026-08-06; marketing bugs, responsive audit, and full gate OPEN.
**Owner / when to use:** Anyone changing marketing `(site)` routes, i18n, member suite shell, or cross-route FOCSS polish.
**Related:** [workspaces-plan.md](./workspaces-plan.md) (track C2) · [testing-plan.md](./testing-plan.md) (`audit-4a`) · [database-plan.md](./database-plan.md) (asset cutover Phase 09) · [`Agents/07-css.md`](../Agents/07-css.md) · `site/focss/site/` · `agent-reports/marketing-ledger.md`

---

## Goal

One brand across marketing and member suite: Cisco Sans display, Helvetica Neue body, FOCSS tokens, responsive 320–1920, locale-aware homepage where `next-intl` is wired — with `pnpm run gate` green and `responsive-audit.mjs` passing on the same commit.

---

## Who does what

| Role | Responsibility |
|------|----------------|
| Marketing owner | `(site)` pages, `audit-4a`, ledger in `agent-reports/marketing-ledger.md` |
| i18n owner | `home.*` keys, locale switch e2e, hardcoded string grep |
| Member suite owner | Tracks A–B shell and portal CSS |
| Workspace UI | Track C2 — delegate to [workspaces-plan.md](./workspaces-plan.md) |

---

## Current state

| Area | Status | Notes |
|------|--------|-------|
| Marketing `/` | **OPEN** | Assistant @390, hydration, `/trusted-by` per marketing ledger |
| i18n `home.*` | **PARTIAL** | `next-intl` wired; e2e locale switch missing |
| Desktop UI (1920) | **PARTIAL** | Tokens claimed; `responsive-audit` not re-run |
| Mobile UI (390) | **PARTIAL** | Planner canvas fixed in workspaces; marketing #1/#2 open |
| Member suite A1–A8 | **CLAIMED** | Not re-proven 2026-08-08 |
| Portal CSS B1–B4 | **CLAIMED** | `shell-portal.css`, FOCSS registered |
| Track C1/C2/C3 | **OPEN** | Marketing polish, workspace chrome, admin tokens |
| Track C4, D1–D2 | **DONE** | Portal/legal; header decomposition |
| Track E1–E4 | **GREEN on 2026-08-07** | Re-run on release |
| Track E5–E6 | **OPEN** | `responsive-audit`, full `gate` |

### Locked constraints

| Rule | Detail |
|------|--------|
| Typography | Cisco Sans display, Helvetica Neue body |
| CSS | FOCSS zones + tokens — [`Agents/07-css.md`](../Agents/07-css.md) |
| Forks | Studio ↔ Planner never import each other |
| Browser | `http://localhost:3000` only (never `127.0.0.1`) |

---

## Step-by-step instructions

1. **Start dev server**
   ```powershell
   pnpm dev
   ```
   Open `http://localhost:3000` — verify marketing home and member entry routes load.

2. **FOCSS + layout gates**
   ```powershell
   pnpm run verify:focss
   pnpm run check:layout
   pnpm run scan:boundaries
   pnpm run lint
   ```
   **Expect:** all exit 0. **If `verify:focss` fails:** fix token/zone violations under `site/focss/`.

3. **Responsive audit** (all breakpoints)
   ```powershell
   node scripts/responsive-audit.mjs
   ```
   **Expect:** pass at 1920, 1280, 390, 320. **If fail:** note route + viewport in `results/site/responsive-audit.txt`.

4. **Marketing Playwright**
   ```powershell
   pnpm exec playwright test -c config/build/playwright.config.ts `
     tests/e2e/audit-4a-marketing-journey.spec.ts
   ```
   Cross-check failures against `agent-reports/marketing-ledger.md`.

5. **i18n parity check**
   ```powershell
   Select-String -Path site/components/site, site/app/(site) -Pattern "home\." -Recurse
   Select-String -Path site/components/site, site/app/(site) -Pattern '"[A-Z][a-z]+ [a-z]+"' -Recurse | Select-Object -First 20
   ```
   **Expect:** user-facing strings use `next-intl` keys where wired; document gaps as OPEN.

6. **Track C — per-route polish**
   - **C1:** Marketing `(site)` pages — page-by-page FOCSS.
   - **C2:** Planner + Studio chrome — coordinate with [workspaces-plan.md](./workspaces-plan.md).
   - **C3:** Admin `AdminLayoutShell` token parity.
   - **C5:** Close ledger when C1–C3 land.

7. **Full gate**
   ```powershell
   pnpm run gate
   ```
   See [testing-plan.md](./testing-plan.md) for lane details.

---

## Verification checklist

- [ ] `pnpm run verify:focss` — 141+ stylesheets OK
- [ ] `pnpm run check:layout` — exit 0
- [ ] `node scripts/responsive-audit.mjs` — all breakpoints
- [ ] `audit-4a-marketing-journey.spec.ts` — green
- [ ] i18n — no new hardcoded homepage strings without keys
- [ ] Member suite routes load (`/ooplanner` entry, portal/dashboard layouts)
- [ ] Track C1–C3 — owner sign-off or OPEN list updated
- [ ] `pnpm run gate` — exit 0 on release commit

---

## Open items

1. **P0:** `responsive-audit.mjs` + `audit-4a` with dated artifacts.
2. **P1:** Marketing assistant @390 and hydration issues (ledger).
3. **P1:** i18n e2e locale switch; grep hardcoded strings.
4. **P1:** Re-prove member suite landings (A1–A8) — claimed not verified 2026-08-08.
5. **P2:** Track C1 marketing FOCSS page-by-page.
6. **P2:** Track C2 workspace chrome ([workspaces-plan.md](./workspaces-plan.md)).
7. **P2:** Track C3 admin token parity.
8. **P2:** Asset cutover Phase 09 (`home.*` i18n) — [database-plan.md](./database-plan.md).

---

## Key paths & commands

| Item | Path / command |
|------|----------------|
| Marketing app | `site/app/(site)/` |
| Site components | `site/components/site/` |
| FOCSS site zone | `site/focss/site/` |
| Member routes | `site/features/site/memberSuiteRoutes.ts` |
| Member shell | `site/components/site/MemberSuiteShell` |
| Portal CSS | `site/focss/site/shell-portal.css` |
| Marketing ledger | `agent-reports/marketing-ledger.md` |
| Dev server | `pnpm dev` → `http://localhost:3000` |
| CSS verify | `pnpm run verify:focss` |
| Responsive audit | `node scripts/responsive-audit.mjs` |
| Full gate | `pnpm run gate` |

*Blockers: [`Failures.md`](../Failures.md) only.*
