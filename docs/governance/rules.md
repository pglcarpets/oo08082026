# Governance

**Live product shape:** forked Studio (`/oostudio`) + Planner (`/ooplanner`) with
dockview shells, plus residual marketing/admin under `site/app`. See
`docs/architecture/product-map.md` and `Failures.md`. Programme goal tables below may still
name prior Admin Product Studio journeys — treat **measured “Current” columns as
capture-time**, not proof for this checkout.

**Admin → Architecture docs:** external link to tech-docs SPA (dev **:3001**, prod subdomain). How-to: [`tech-docs-link.md`](./tech-docs-link.md).

**Binding on every phase.** A task not covered by a rule here is out of scope until a rule
is added. This document is the only place *programme* rules live; a programme rule stated
anywhere else and not here is not binding.

**This document does not stand alone.** `../../../Agents/*.md` (indexed at
`Agents/INDEX.md`) binds every session in this repository, programme or not — CSS lock
(`07-css.md`), test discipline (`02-testing.md`), failure recording
(`04-failures.md`), documentation bar (`05-documentation.md`). Where a rule here
restates one from `Agents/`, `Agents/` is the source; this file exists to make it
phase-enforceable, not to re-derive it. Where the two would conflict,
`Agents/01-standard.md`'s own top rule applies: user instruction wins, then stop and ask (E1) — the two
are not in conflict in practice, since E1 already defers to the owner before inferring
anything.

Established: 2026-07-28 · Applies from `3698209b`

Every rule carries an enforcement column. `AUTOMATED` names the command that fails on
violation. `MANUAL REVIEW` means no check exists and none is currently possible — those are
the gaps, listed together in §8 so they cannot hide.

---

## 1. Rules of engagement

These four bind the worker, not the code. They are not automatable and are not marked as
gaps — they are conditions of doing the work at all.

| ID | Rule |
|---|---|
| **E1 — Stop rule** | If a task is not covered by a rule in this document, or two rules conflict, stop and ask. Do not infer intent, do not pick a convention, do not proceed with a note explaining the assumption. |
| **E2 — Scope lock** | Work only on the current phase. No later-phase items. No opportunistic refactors, however small, however obviously correct. |
| **E3 — Evidence, not assertion** | A checklist item is complete only with attached evidence: command output, a CI run reference, or a before/after figure. Self-assertion is not evidence. "I verified this" is not evidence. |
| **E4 — Retire deliberately** | Removal is allowed, but it must be recoverable and it must be asked for. **Git history is the archive** for anything git tracks — files, scripts, dependencies, tests — so deleting them is fine once the owner approves; do not copy them into `.archive/` as well. `.archive/` is only for material that must stay browsable without git archaeology (superseded essays, retired index pages). **Database objects are the exception**: rows are not in git, so retire a table by moving it to the `archive` schema or by a migration with a working `-- rollback`, never a bare `drop table`. List what goes and wait for approval first. |

Two corollaries, both learned the hard way in this repository:

- **Never pipe a gate command into `tail` or `head`.** It masks the exit code. A
  non-compliant file was pushed on 2026-07-27 because `check:failures` was run through a
  pipe and its failure was invisible.
- **Report `verified`, `not tested` and `could-not-reproduce` as three different words.**

## 2. Status and reporting

| ID | Rule | Enforcement |
|---|---|---|
| **S1** | Live plan is **`plans/`** only: `README.md` + `1.md`–`6.md`. No flat `00`–`13` pile, no `cline/` subtree, no open-work file. | `AUTOMATED` — `check:plans-purity` (via `check:docs-all`) rejects any other file in that folder |
| **S2** | No unsolicited summary/analysis dumps. Findings go in `Failures.md` (not free-form report trees). | `AUTOMATED` — `pnpm run check:governance` |
| **S3** | Every unresolved blocker is in `Failures.md` with a repro command and an owning phase. Removed when fixed, not struck through. | `PARTIAL` — `check:failures` rejects resolution/history language only. Presence of a repro command and an owning phase is **not** checked |
| **S4** | Plan documents do not carry duplicated status. One ledger, one place. | `MANUAL REVIEW` |

No live `docs/audits/` tree. Blockers: root `Failures.md`. FOCSS token ratchet: `pnpm run check:style-tokens` + `config/quality/style-token-baseline.json`. Old dumps may exist under `.archive/docs/audits/` or git history only.

## 3. Styling — FOCSS + React Aria (product/admin)

| ID | Rule | Enforcement |
|---|---|---|
| **C1** | FOCSS import direction, fences and module graph hold. No cycles. | `AUTOMATED` — `pnpm run verify:focss` |
| **C2** | The UI contract scheme freeze holds. | `AUTOMATED` — `node scripts/general/lint-ui-contract.mjs --strict` |
| **C3** | No raw hex, `rgb()` or `rgba()` outside the token layer. Colour comes from a token. | `AUTOMATED` — `pnpm run check:style-tokens` (ratchet vs `config/quality/style-token-baseline.json`) |
| **C4** | No raw `px` literal in a class string or inline style. Size comes from the scale. | `AUTOMATED` — same check |
| **C5** | No Tailwind arbitrary value where a scale step or token exists. Layout-shape arbitraries (`fr`, `vh`, `aspect`, `minmax`) are permitted. | `AUTOMATED` — same check |
| **C6** | Framework state selectors (`data-[state=…]`, `aria-[…]`, `group-has-[…]`) used as idiom are not false-positive token hits. | `AUTOMATED` — exclusion inside the C3–C5 check |
| **C7** | Controls under `site/components/ui/` consume tokens; they do not define palette values. | `AUTOMATED` — C3–C5 on that path |
| **C8** | Every composer class name in source has a matching CSS rule. | `AUTOMATED` — `pnpm run check:composer-styles` |
| **C9** | Do not edit `site/app/css/core/locked/**`. | `MANUAL REVIEW` |
| **C10** | Renderer-literal exceptions (Satori image routes) are declared, not discovered. | `AUTOMATED` — allowlist in the C3–C5 check; 12 findings excluded by it |

C3–C5 run as a **per-file ratchet** (§7) against `config/quality/style-token-baseline.json` —
fails when debt **increases**, not on pre-existing totals. Re-measure with `pnpm run check:style-tokens`.

**Stop-drift + correction plan** (allowed/forbidden, verification, phased remediation):
[`focss-stop-drift.md`](./focss-stop-drift.md).

## 4. Dependencies

| ID | Rule | Enforcement |
|---|---|---|
| **D1** | No dependency is added, removed or upgraded without owner approval. | `MANUAL REVIEW` |
| **D2** | `pnpm exec`, never `npx`. `npx` resolves outside the lockfile. Count drifts — trust `pnpm run check:governance` (baseline ratchets down only). | `AUTOMATED` — `pnpm run check:governance` |
| **D3** | Overrides live in `pnpm-workspace.yaml`. The `overrides` block in `package.json` is not read by pnpm and must not be relied on. | `AUTOMATED` — same check. **Currently 0** — no `overrides` block in `package.json` |
| **D4** | No duplicate-capability dependencies without a recorded rationale. | `MANUAL REVIEW` |
| **D5** | Every binary a script invokes is declared. `pwsh`, `python` and `vercel` are currently undeclared. | `MANUAL REVIEW` — not built |
| **D6** | No gate-reachable script may require `pwsh` or `python`. CI runs `ubuntu-latest`. | `AUTOMATED` — same check. **Currently 0** |
| **D7** | Critical and high CVEs are triaged before a phase closes. | `AUTOMATED` — `pnpm audit`. Measured 2026-08-01: **0 critical, 4 high**, 2 moderate, 1 low |

## 5. Code

| ID | Rule | Enforcement |
|---|---|---|
| **K1** | No new `eslint-disable` outside allowlists. Primary lint is **oxlint** via `pnpm run lint` (`site` → `tests` → `tech-docs-generator` → `scripts` → `config`). Residual disable-comment audit: `test:audit:eslint-disable`. | `AUTOMATED` — `pnpm run lint` · `pnpm run test:audit:eslint-disable` |
| **K2** | `pnpm run typecheck` and `pnpm run typecheck:tests` exit 0. | `AUTOMATED`. Re-run after install — residual missing modules may still fail |
| **K3** | `pnpm run build` exits 0. | `AUTOMATED`. Requires install + Next config completeness |
| **K4** | No skipped and no hollow tests. | `AUTOMATED` — `test:audit:gate-skips`, `test:audit:hollow` |
| **K5** | Coverage thresholds are never lowered to make a run green. | `MANUAL REVIEW` |
| **K6** | Never weaken a threshold to make a test green. A failing honest number beats a passing adjusted one. | `MANUAL REVIEW` |
| **K7** | The failing assertion is written before the fix. | `MANUAL REVIEW` |
| **K8** | Route files stay thin; domain logic lives under `features/`. | `MANUAL REVIEW` |
| **K9** | API route modules export only recognised handlers. | `AUTOMATED` — `pnpm run build` |
| **K10** | Mutating API routes enforce CSRF. | `AUTOMATED` — `pnpm run test:audit:api-routes` |

## 6. Security and data

| ID | Rule | Enforcement |
|---|---|---|
| **P1** | No secret is committed. Only `.env.example` is tracked. | `AUTOMATED` — `pnpm run scan:secrets`, secretlint |
| **P2** | `script-src` does not permit `'unsafe-inline'` in production when CSP is defined. Live CSP/security headers: **`site/proxy.ts`**. | `AUTOMATED` — `pnpm run check:governance` (+ unit coverage under `tests/unit/proxy.test.ts` when run) |
| **P3** | The five security headers stay set. | `MANUAL REVIEW` — not built |
| **P4** | Every migration has a `-- rollback` section. **9 of 51 do**; the 42 without are the ratcheted baseline. A new migration lacking one raises the count and fails the gate. | `AUTOMATED` — same check |
| **P5** | A backup is not proven until a restore has been exercised. | `MANUAL REVIEW` |
| **P6** | Results contain no secrets and no production customer data. | `MANUAL REVIEW` |

## 7. Ratchet rule

C3–C5, D2, P2 and P4 all have existing violations. Turning them on as blocking gates today
would make every build red and teach everyone to bypass the gate.

**They are enforced as a ratchet:** the baseline counts live in
`config/quality/governance-baseline.json` (and `style-token-baseline.json` for C3–C5),
and the check fails only when a count **increases**. Remediation lowers a baseline;
it never rises. A phase may not close with a higher count than it started with.

Re-baseline with `node scripts/general/check-governance.mjs --update`. That is a
deliberate act with owner approval, not a way past a red gate.

> The commit `3698209b` this section previously cited as the baseline point does
> not exist in this repository — `git cat-file` cannot resolve it. It appears to
> have come from a pre-fork checkout. The baseline JSON files are the real record.

This is the mechanism that satisfies "CI gates fail on new violations so drift can't be
reintroduced after remediation".

## 8. MANUAL REVIEW — the enforcement gaps

No automated check exists for these, and none is proposed. They are checked by a person or
not at all:

`S1` one status file per phase · `S4` duplicated status · `C9` locked CSS ·
`D1` dependency approval · `D4` duplicate capability · `D5` declared binaries ·
`K5` coverage floor · `K6` threshold weakening · `K7` test-first · `K8` route thinness ·
`P3` headers stay set · `P5` restore drill · `P6` result hygiene

Thirteen of thirty-three rules. Every other rule maps to a command that CI runs.

`D5` and `P3` were scoped for automation and **not built** — they are listed here rather
than left marked `AUTOMATED` against a check that does not exist.

## 9. Known breaches of this document at adoption

Recorded rather than quietly fixed, because §E1 applies to the governance document
itself. **Re-measured 2026-08-01** — several have since cleared:

1. **S2** — `scripts-inventory.md` was a report no step requested (archive/git only).
2. **C3, C4, C5** — token-bypass findings; re-measure with `pnpm run check:style-tokens`.
3. ~~**C8** — `check:composer-styles` fails.~~ **Clear 2026-08-01** — "no unstyled class, no dead rule".
4. ~~**K2** — `typecheck:tests` fails.~~ **Clear 2026-08-01.** `typecheck` and
   `typecheck:tests` both exit 0. **K3** (`build`) not re-measured — do not claim it.
5. **P2** — production CSP permits inline script.
6. **P4** — 42 of 51 migrations still have no rollback path. 9 now do; the 42
   are the ratcheted baseline.
7. **D2** — `npx` still used in scripts; count from `pnpm run check:governance` (ratchet). One historically inside the PR gate path — re-check before claiming clear.
8. ~~**The doc gates are enforced nowhere.**~~ **Fixed 2026-07-28.** The seven doc checks were reachable only through `pnpm run gate`, and no CI workflow ran `gate` — CI runs `release:gate:fast` and `release:gate` directly, so the entire documentation- and plan-integrity gate had never blocked a merge. They are now grouped as `check:docs-all` and appended to **both** CI chains, alongside `check:style-tokens` and `check:governance`. Verified by walking the workflow files: all nine are reachable, out of 49 CI-reachable scripts.

Item 8 was the most important line in this document. It is the one thing that made every
other rule optional.

`gate` is a thin alias for `release:gate:fast`. The full gate is `release:gate` (CI and local
operators use those two names; do not invent a third).

## 10. Programme goals

Eight goals. Each has a target, an instrument that produces it, and a current value. A goal
without a fresh measured value is **not measured** — never "probably fine". Derivation and
the external standard behind each number: [`benchmarks.md`](./benchmarks.md).

**“Current” column = 2026-07-28 capture** against a different tree shape. Re-measure before
using as ship evidence. Several instruments assume Admin Product Studio / FlexLayout paths
that are not present in the forked checkout.

| ID | Goal | Target | Instrument | Current (2026-07-28 capture) |
|---|---|---|---|---|
| **G1** | Publish integrity | Identical ShapeDraft V2 input yields byte-identical PNG across 20 fixture renders; release identity never replaced on failure | `product-studio-png-cutover.spec.ts`, `P1.22` determinism fixtures | Cutover spec 8/8 (2026-07-25); determinism suite **not built** |
| **G2** | No dead capability | 0 registry-declared tools without a complete create → edit → persist → reload loop | Registry liveness assertion (`P2.8`), `check:product-icons` | **1 dead tool** — Planner Text: `runtimeToolFor("text")` returns `"select"` |
| **G3** | Accessibility | WCAG 2.2 AA, 0 unreviewed axe violations at 390/1440/1920, keyboard-complete journeys, NVDA task completion. **Exceeds AA** on target size (44×44 vs AA's 24×24) | `test:a11y`, `admin-product-studio-accessibility.spec.ts`, NVDA manual | **Not measured**; axe run blocked by B2 |
| **G4** | Interaction performance | INP ≤ 200 ms p75, LCP ≤ 2.5 s p75, CLS ≤ 0.1, pointer→paint ≤ 100 ms, frame ≤ 16.7 ms — at the 500-entity / 2 000-item caps | `P2.20` probes | **Not measured** |
| **G5** | Workspace ergonomics | Canvas ≥ 60 % of shell at every viewport; chrome overhead ≤ 40 %; no page-level scroll; scored benchmark **≥ 8.5/10** (raised from 6) | Layout/a11y Playwright until a dedicated ergonomics probe is restored (old `probe:w1.5-benchmark-admin` removed 2026-08-02) | 7.9/10 (2026-07-26, **predates `P1.23`–`P1.30`**); stored JSON pruned — **needs new instrument** |
| **G6** | Configurability without invariant loss | Every optional tool toggleable and reorderable; mandatory set provably non-disableable; 0 bytes of raw React Flow / FlexLayout / Zustand JSON in persistence | Registry invariant tests, persistence assertions | Schema and registry implemented; **storage absent** (B1) |
| **G7** | Delivery integrity | `pnpm run gate` exit 0; `typecheck:tests` exit 0; 0 skipped or hollow tests; admin publish-chain branch coverage > 90 % | `gate`, `test:audit:hollow`, `test:audit:gate-skips`, `test:coverage:admin` | Re-measure with fresh gate commands |
| **G8** | Commercial truth | BOQ invents 0 prices; every missing price explicit in UI and export; price-book version pinned per review | `P2.5` tests | **Not started** |

## 11. Evidence contract

Evidence is a stored artifact plus a command that regenerates it. A sentence in a Markdown
file is not evidence (E3).

| Evidence | Location |
|---|---|
| Baseline | `results/browser/admin-planner-upgrade/baseline/` |
| Product Studio browser runs | `results/browser/admin-planner-upgrade/product-studio/` |
| Planner browser runs | `results/browser/admin-planner-upgrade/planner/` |
| Site handoff | `results/browser/admin-planner-upgrade/site-handoff/` |
| Accessibility and NVDA | `results/browser/admin-planner-upgrade/accessibility/` |
| Performance | `results/browser/admin-planner-upgrade/performance/` |
| Final owner journey | `results/browser/admin-planner-upgrade/final/` |
| Test reports | `results/tests/` |
| Active blockers | `Failures.md` |

Only `baseline/` exists. Creating a directory is part of the work that fills it.

Each browser evidence folder records route, viewport, active config revision, fixture,
timestamp, commit SHA, console and network summary, and test or trace identity.

## 12. Definition of done

All eight goals in §10 hold with fresh measured values, and:

- [ ] Every phase in `phase1/`, `phase2/`, `phase3/` is signed off against its exit gate.
- [ ] Every goal G1–G8 has a measured value meeting or exceeding its target.
- [ ] Every bar in [`benchmarks.md`](./benchmarks.md) is met, exceeded, or has a recorded owner-accepted deviation.
- [ ] `Failures.md` contains every unresolved blocker and no resolved one.
- [ ] `pnpm run gate` and `pnpm run check:layout` exit 0.
- [ ] Stored results contain no secrets and no production customer data.

The 32 locked decisions in [`charter.md`](./charter.md) hold throughout. Breaking
one is a programme change, not an implementation choice.

## 13. Related

- Goals and targets: `benchmarks.md`
- Blockers: `../../Failures.md`
- FOCSS / custom CSS stop-drift: `focss-stop-drift.md`
- Loop this document is executed under: plan → implement → verify → gate (see `Agents/INDEX.md`)
- Plan: `../../plans/README.md` · blockers: `../../Failures.md`
