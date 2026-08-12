# OO Deep Audit Program — Overview (File 0 of 5)

**Status:** Plan, awaiting review. Audit execution starts immediately on approval — reports go to `agent-reports/audit/`.
**Date drafted:** 2026-08-11
**Repo:** `E:\oo08082026` (monorepo: `site/` Next 16 app + tech-docs-generator + tests + workers)
**Prior audits read:** `agent-reports/audit/Deep CI and live-site audit for oo08082026.md`, `Mobile app shell for oando.co.md`, `oo-deep-audit-v2.md`
**Authority:** user > live code + fresh commands > `AGENTS.md` > `docs/**`. Browser evidence on `http://localhost:3000` only (never `127.0.0.1`).

---

## 1. Objective

Conduct a deep, evidence-backed audit across 11 tracks covering the full product surface (marketing `(site)`, `/ooplanner`, `/oostudio`, `/admin/*`, `/portal/*`, `/dashboard`). Produce one Markdown report per track in `E:\oo08082026\agent-reports\audit\`. Audit only — no source changes. Blockers land in `Failures.md`.

## 2. The 11 audit tracks

| # | Track | Scope summary | Report file |
|---|-------|---------------|-------------|
| 1 | UI Desktop | desktop chrome, layout, panels, route-by-route ≥1280px | `01-ui-desktop.md` |
| 2 | UI Mobile | app shell, bottom tabs, canvas-first Planner/Studio <768px & <1280px | `02-ui-mobile.md` |
| 3 | SEO | robots, sitemap, per-route metadata, hreflang/i18n, canonicals, OG | `03-seo.md` |
| 4 | Security | CSRF, auth, rate limit, secrets scan, proxy, env, OWASP ASVS L2 | `04-security.md` |
| 5 | Database | 2 Supabase projects, migrations+rollbacks, RLS+policies+grants, types, persistence wrappers, dual-write | `05-database.md` |
| 6 | Lighthouse + perf | LCP/INP/CLS budgets, Core Web Vitals, SEO/PWA/A11y scores, bundle | `06-lighthouse.md` |
| 7 | Accessibility | WCAG 2.2 AA, axe, landmarks, focus, keyboard, color | `07-accessibility.md` |
| 8 | i18n | next-intl, key parity, LanguageSwitcher, locale exposure | `08-i18n.md` |
| 9 | API route safety | server actions, safe-action v8, route handlers, mode-aware writes | `09-api-route-safety.md` |
| 10 | Console + runtime | browser console errors, hydration, unhandled rejections | `10-console-runtime.md` |
| 11 | Visual regression + E2E | Playwright baselines, snapshot state, e2e gate coverage | `11-visual-regression-e2e.md` |

The "+5 others" beyond the six named (desktop UI, mobile UI, SEO, security, database, Lighthouse) are: **7 accessibility, 8 i18n, 9 API route safety, 10 console/runtime, 11 visual regression/E2E.**

## 3. Execution strategy — 3 agents

| Agent | Tracks | Why grouped | Wave |
|-------|--------|------------|------|
| **Agent A** | 1, 2, 7 (UI desktop, UI mobile, a11y) | All browser/Playwright, same viewport matrix + axe | 1 (parallel with B) |
| **Agent B** | 3, 4, 8, 9 (SEO, security, i18n, API safety) | Static + runtime; grep-heavy, low browser cost | 1 (parallel with A) |
| **Agent C** | 5, 6, 10, 11 (database, Lighthouse, console/runtime, VR/E2E) | DB introspection + Lighthouse run + browser console + Playwright | 2 (after A or B finishes) |

Each agent uses the `webapp-testing` skill (native Python Playwright via `scripts/with_server.py`) for browser evidence, writes reports directly into `E:\oo08082026\agent-reports\audit\`, records findings/severity/evidence, and does **not** edit source.

## 4. Report manifest (output contract)

All reports land in `E:\oo08082026\agent-reports\audit\`:
```
00-audit-summary.md          ← master summary (written last by me)
01-ui-desktop.md             ← Agent A
02-ui-mobile.md              ← Agent A
03-seo.md                    ← Agent B
04-security.md               ← Agent B
05-database.md               ← Agent C
06-lighthouse.md             ← Agent C
07-accessibility.md          ← Agent A
08-i18n.md                   ← Agent B
09-api-route-safety.md       ← Agent B
10-console-runtime.md        ← Agent C
11-visual-regression-e2e.md  ← Agent C
```

Each report skeleton: Overview · Method · Findings (numbered, P0–P3, with evidence) · Deferred · Changed files (`None` unless approved) · Blockers (proposed `Failures.md` rows).

## 5. Scope boundaries (taste)

- Audit only. No source edits, no migrations applied, no baselines updated.
- Browser work limited to `http://localhost:3000`, desktop + mobile viewports.
- Wait for fonts + `networkidle` before collecting metrics/screenshots.
- Reuse existing CSS/FOCSS classes and component props in repair recommendations.
- Do not mark blocked/unverified work complete; report actual evidence.

## 6. Gates the audit reports against

```
pnpm run scan:boundaries
pnpm run check:layout
pnpm run check:style-tokens
pnpm run check:governance
pnpm run gate            # release:gate:fast
pnpm run test            # BOTH lanes (default + tech-docs)
pnpm run release:gate    # full
```

## 7. Acceptance

- [ ] 11 track reports + 1 summary present in `agent-reports/audit/`.
- [ ] Every P0/P1 finding has evidence (command output, file:line, or screenshot).
- [ ] `00-audit-summary.md` cross-references all tracks and lists proposed `Failures.md` rows.
- [ ] `git status` clean (no source changes) unless a fix is explicitly approved post-review.
