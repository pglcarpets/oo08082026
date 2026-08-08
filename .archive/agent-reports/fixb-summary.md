# Fix B summary — phase 1 green gate (F1 resolved)

**Date:** 2026-08-01 · **Home:** `agent-reports/` (owner rule)
**Result:** F1 removed from `Failures.md`; phase 1 marked done in `plans/1.md` (formerly `docs/plan/cline/README.md`).

## Acceptance evidence (fresh command output)

Two consecutive clean-state runs (wipe `generated-documents/`, then `pnpm run test`):

| Run | Default lane | Tech-docs lane |
|-----|--------------|----------------|
| #1 (`results/tests/fixb-clean1.out.txt`) | 560 files / **2759 passed** | 20 files / **103 passed** |
| #2 (`results/tests/fixb-clean2.out.txt`) | 560 files / **2759 passed** | 20 files / **103 passed** |

Focused gates: `pnpm run lint` → **0 errors** (9 pre-existing warnings) · `pnpm run typecheck:tests` → green (exit 0).
Pass-2 residue (`results/tests/f1-step0-regen.out.txt`): 14 failed / 9 files → **0 failed** after Fix B.
Durations: default lane ~287s; tech-docs lane ~404-414s (run #2 of the lane faster — fresh machine state).

## Fixes applied (smallest sound change, named cause)

| # | Fix | Named cause | File(s) |
|---|-----|-------------|---------|
| A | Lane regenerates before asserting (pre-existing, applied 2026-08-01) | `test` script never regenerated gitignored JSON | `scripts/run-full-vitest.mjs` |
| 1 | Nav ids scoped per section | `id:'product-surfaces'` declared twice | `tech-docs-generator/src/data/navigation.ts:17,41` |
| 2 | Dependency facts assert live manifest + installed `next` | Frozen literal `^16.2.11`; live is `16.3.0-preview.10` | `tests/tech-docs-generator/generator/extractors.test.ts:24-40` |
| 3 | Route/API pins re-anchored to live tree | `site/app/planner/(marketing)/page.tsx` and `/api/planner/ai-advisor` no longer exist | `extractors.test.ts:59-70` → `/ooplanner`, `/api/ai-advisor` |
| 4 | Feature slugs re-anchored to live surface set | Extractor now emits auth gates/roles + 6 surfaces, not the old 5 slugs | `extractors.test.ts:97-100` |
| 5 | `.env.example` gains active placeholder entries | Zero active `NAME=` lines → `environment.json` = `[]` | `.env.example` (+`NEXT_PUBLIC_SUPABASE_URL=`, `OPENROUTER_API_KEY_PRIMARY=`) |
| 6 | `databaseData`/`overviewData`/`testingData` filters use `sourcePath === 'package.json'` | Stale `packageName === 'oando'` (real root name `ooplanner-oostudio`) | `src/data/{databaseData,overviewData,testingData}.ts` |
| 7 | Branch-coverage test re-anchored to `techStack` behavior | Mock pinned unsorted category order + `'requested unknown'` string the code never emits | `tests/tech-docs-generator/data-branch-coverage.test.ts:95-103` |
| 8 | `--surface-canvas` mapped in the renderer shell | Theme-alignment REQUIRED_ALIASES unmet | `tech-docs-generator/src/index.css` (`.docs-canvas`) |
| 9 | `productSurfaces.ts` allowlisted in hardcoding guard | Hand-curated surface inventory flagged as module-level arrays | `tech-docs-generator/scripts/uiOnly-allowlist.json` |
| 10 | `.github/dependabot.yml` added (addition — owner call default) | Dependabot records asserted; config did not exist | `.github/dependabot.yml` (npm, weekly, limit 10, ignore majors, minor-and-patch group) |
| 11 | Three heavy model-build tests: timeout 30s → 60s | `buildGeneratorModel` takes ~31-33s under the serial lane; lane config already allows 120s | `domain-extractors.test.ts`, `source-coverage-contract.test.ts`, `source-policy.test.ts` |

## Sequencing

Fix A/B landed before acceptance; C1 (snapshot seam, Tech Stack slice) is the next planned work as the opening item of **phase 5 Track 1** — see `agent-reports/c1-snapshot-seam-plan.md`. F2 (live DBs ahead of deploy) is untouched — sequencing note only.
