# Env extractor research — restore `.env.example` vs extend `extract-environment.mjs`

Research note for phase-1 green-gate ledger items **#5** (`data-loaders › deployment
and testing command sets`) and **#7** (`extractors › environment and database sources`),
both filed against `tech-docs-generator/scripts/extract-environment.mjs`
(`plans/1.md`; formerly `docs/plan/cline/phase-1-green-gate.md:102,104`). Evidence-first; no code was modified.

## Bottom line

- `.env.example` was **never populated** with active `NAME=` lines in this repo's git
  history — it was authored fully commented in the initial commit. No commit ever
  "stripped" active entries, so restoring them reverses no owner decision.
- The env extractor reads **only** `.env.example` active lines for names, then scans
  `site/` for usages of those names. With zero active lines it emits `[]`
  (`generated-documents/data/environment.json` is literally `[]`, 4 bytes).
- Every assertion the tests pin is satisfiable by **restoring active placeholder
  `NAME=` lines** in `.env.example` (empty values → "secret values absent" holds).
  Two of the pinned names (`NEXT_PUBLIC_SUPABASE_URL`, `OPENROUTER_API_KEY_PRIMARY`)
  are **not among the current comments** and must be added, not merely uncommented.
- Extending the extractor to read env-reader code (`site/lib/env.server.ts`) is
  **not required by any assertion**, and doing it *alone* would break the pinned
  record shape (`data-loaders.test.ts:96-97` demands `sourcePath: '.env.example'`,
  `sourceKind: 'env-example'`). It is defensible only as an addition *on top of*
  restored `.env.example` entries.

## 1. Git history of `.env.example` — never populated, never stripped

All commits touching the file (`git log --oneline -- .env.example`):

| Commit | Message (subject) | Change to `.env.example` |
|---|---|---|
| `2fba2c5` | "Initial commit — Fresh repository history for pglcarpets" | File **created** with all 5 entries commented: `# EMERGENT_LLM_KEY=`, `# ANTHROPIC_API_KEY=`, `# OPENAI_API_KEY=`, `# UNIVERSAL_KEY=` |
| `af21e4d` | "feat: port closeout, sketch-to-plan, a11y, templates, drop orphan UI deps" | Adds commented `# NEXT_PUBLIC_TECH_DOCS_URL=http://localhost:3001` |
| `ff54321` | "docs: rename docs map, slim plan, drop agent-reports" | Rewords the tech-docs comment; entry stays commented |
| `893ceb8` | "chore: stop tracking generated-documents; improve tech-docs inventory" | Adds commented `# NEXT_ADMIN_SUPABASE_URL=` and `# SUPABASE_ADMIN_SERVICE_ROLE_KEY=` |

`git log --follow -p -- .env.example` shows **no diff that ever removes an uncommented
`NAME=` line**, because none ever existed. The "intentionally stripped" hypothesis is
not supported: the file was born commented, and later commits only *added* commented
documentation. Current state: 20 lines, zero active `NAME=` (`.env.example:1-20`).

## 2. What the app genuinely reads (env readers)

- `site/lib/env.server.ts` — server-only schema (15 keys), lines 16-31:
  `OPENAI_API_KEY`, `OPENROUTER_API_KEY_PRIMARY`, `OPENROUTER_API_KEY_BACKUP`,
  `OPENROUTER_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `LANCE_DB_URI`,
  `PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL`, `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_S3_URL`, `CLOUDFLARE_ACCESS_KEY_ID`,
  `CLOUDFLARE_SECRET_ACCESS_KEY`; plus R2/typo alias reads at lines 62-94
  (`CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`,
  `CLOUDFLARE_S3_URL`, `CLOULD_ACCESS_KEY_ID`, `CLOULDFLARE_S3_SECRET_ACCESS_KEY`,
  `CLOOUDFLARE_SECRET_API_TOKEN`, `CLOUDFLARE_SECRET_API_TOKEN`,
  `CLOULDFLARE_S3_API_TOKEN`). Consumers use the exported `env.*` object, e.g.
  `site/lib/ai/mastra/providers.ts:66`, `providerFetch.ts:62`.
- `site/platform/supabase/env.ts` — public pair: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (lines 15-16, 32-33).
- `scripts/general/validate-launch-env.mjs:9-29` — required sets:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `PRODUCTS_DATABASE_URL`, `SUPABASE_AUTH_DATABASE_URL`.
- Root `.env.local` (the only `.env.local`; no `site/.env.local` exists) declares 41
  names — values deliberately not reproduced here. Names include the two pinned by
  tests (`NEXT_PUBLIC_SUPABASE_URL`, `OPENROUTER_API_KEY_PRIMARY`), plus
  `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`,
  `PRODUCTS_DATABASE_URL`, `CLOUDFLARE_*`, `RESEND_*`, `VERCEL_*`, `E2E_SUPABASE_*`,
  `DEV_AUTH_BYPASS*`, `ADMIN_TOKEN`, `OPS_PORTAL_*`, etc.
- Note: `site/lib/env.server.ts:8` says "Prefer `@/env`", but no `@/env` module or
  import exists in the tree — that comment is stale.

## 3. What `extract-environment.mjs` actually reads


## 4. What the tests and the plan assert

- `tests/tech-docs-generator/generator/extractors.test.ts:78-81` —
  `envRecords.some(r => r.name === 'NEXT_PUBLIC_SUPABASE_URL')` is true; and
  `OPENROUTER_API_KEY_PRIMARY` has `usages.length > 0`.
- `tests/tech-docs-generator/data-loaders.test.ts:69-71` —
  `environmentVariables.length > 0`, `deploymentCommands.length > 0`,
  `deploymentEnvironmentVariables.length > 0`.
- `data-loaders.test.ts:94-105` — the `OPENROUTER_API_KEY_PRIMARY` record must have
  `sourcePath: '.env.example'`, `sourceKind: 'env-example'`, and `usages` containing
  an entry with `sourceKind: 'env-reader'` and `sourcePointer: /^match at index /`.
  This pins the record shape the extractor already emits for names found in
  `.env.example`; it does not pin any env-reader file as a *name* source.
- `plans/1.md` appendix notes (formerly `docs/plan/cline/phase-1-appendix.md:73`) (section 4, solid-assertion guide):
  "Environment — `NEXT_PUBLIC_SUPABASE_URL` present; secret values absent."
- Failure evidence (raw): `results/tests/f1-step0-regen.out.txt:38` (extractors
  "extracts environment and database sources" ×) and `:124-133`
  (`data-loaders.test.ts:69` and `:71` — `expected 0 to be greater than 0`).
- `Failures.md:10` — F1 "tech-docs vitest lane fails (14 tests / 9 files)".

## 5. Verification: the commented names and the pinned names in `site/`

Run against the extractor's own three regexes over the live `site/` tree (node script,
temp dir, no repo writes):

- All 7 currently-commented names would collect usage matches if uncommented:
  `EMERGENT_LLM_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `UNIVERSAL_KEY` →
  `site/lib/Studio/studioAiLlm.ts`; `NEXT_PUBLIC_TECH_DOCS_URL` →
  `site/lib/admin/techDocsUrl.ts`; `NEXT_ADMIN_SUPABASE_URL` →
  `site/lib/Planner/handoff/createPlannerHandoff.ts`,
  `site/lib/Planner/plannerPersistenceMode.ts`, `site/platform/supabase/auth-admin.ts`;
  `SUPABASE_ADMIN_SERVICE_ROLE_KEY` → the two `site/lib/Planner/` files.
- The two **test-pinned** names also match in `site/`: `NEXT_PUBLIC_SUPABASE_URL` at
  `site/platform/supabase/env.ts:15,32`; `OPENROUTER_API_KEY_PRIMARY` at
  `site/lib/ai/mastra/providers.ts:66` and `providerFetch.ts:62` (as `env.*`).

## 6. Option analysis

**A — Restore active `NAME=` lines in `.env.example` (empty placeholder values).**
Satisfies every assertion as written: `extractors.test.ts:78-81`, `data-loaders.test.ts:69-71,94-105`.
Empty values keep "secret values absent" (appendix `:73`). Must **add**
`NEXT_PUBLIC_SUPABASE_URL=` and `OPENROUTER_API_KEY_PRIMARY=` — uncommenting the
existing seven comments alone would not satisfy `extractors.test.ts:78` or
`data-loaders.test.ts:94-105`, since neither name is currently commented in the file.
Zero extractor changes; matches the ledger's "fix location" (`phase-1-green-gate.md:102,104`)
without touching test contracts.

**B — Extend the extractor to read env-reader code only.**
Fails the pinned shape: a record sourced from `site/lib/env.server.ts` would carry
`sourceKind: 'env-reader'`, contradicting `data-loaders.test.ts:96-97`
(`sourcePath: '.env.example'`, `sourceKind: 'env-example'`) unless the test is also
changed; and `NEXT_PUBLIC_SUPABASE_URL` is absent from `env.server.ts`, so
`extractors.test.ts:78` would still fail unless the extractor also reads
`site/platform/supabase/env.ts` and `scripts/general/validate-launch-env.mjs`.
Option B alone therefore means editing the pinned assertions — the opposite of the
tests' stated intent.

**C — Both: restore `.env.example` entries (primary) and extend the extractor to
harvest env-reader names (secondary).**
Restoration is what the assertions demand. An extractor extension matches the
appendix's source list (`.env.example`, env readers — `phase-1-appendix.md:19,43`) and
`model.mjs:573` precedent, but is unneeded for green; if added, `.env.example`
entries must remain the record source (merge order) to keep `data-loaders.test.ts:96-97` green.

## 7. Recommendation

**Do Option A; treat Option C's extractor extension as optional follow-up, never
Option B alone.** Primary evidence: (1) no git commit ever populated or stripped
`.env.example` (section 1), so restoration is not a revert of an owner decision;
(2) every pinned assertion names `.env.example` as the record source with
`sourceKind: 'env-example'` (`data-loaders.test.ts:96-97`); (3) both pinned names
already have live `site/` usage matches, so restored entries will carry
`env-reader` usages immediately (section 5); (4) the appendix's "secret values
absent" guide is honored by empty placeholder values (appendix `:73`).

## Citations

- `.env.example` history: `2fba2c5`, `af21e4d`, `ff54321`, `893ceb8` (git log --follow -p).
- Extractor: `tech-docs-generator/scripts/extract-environment.mjs:38-54,56-85,87-115`.
- Env readers: `site/lib/env.server.ts:16-31,62-94`; `site/platform/supabase/env.ts:15-16,30-35`;
  `scripts/general/validate-launch-env.mjs:9-29`.
- Tests: `tests/tech-docs-generator/generator/extractors.test.ts:78-81`;
  `tests/tech-docs-generator/data-loaders.test.ts:69-71,94-105`.
- Plan: `plans/1.md` (formerly `docs/plan/cline/phase-1-green-gate.md:102,104`);
  `plans/1.md` appendix (formerly `docs/plan/cline/phase-1-appendix.md:19,43,73`).
- Failure log: `results/tests/f1-step0-regen.out.txt:38,124-133`; `Failures.md:10`.
- Generated output: `generated-documents/data/environment.json` (`[]`, 4 bytes);
  `generated-documents/` is gitignored and disposable (`phase-1-appendix.md:47`).

- Names come **only** from `.env.example` active lines: regex
  `/^([A-Z0-9_.-]+)=/` at `extract-environment.mjs:43` — a line starting with `#`
  never matches, so all current entries are invisible to it (`collectEnvNamesFromExample`,
  lines 38-54). `extractEnvironmentRecords` then scans **only** `site/`
  (`walkFiles(path.join(repoRoot, 'site'))`, line 91) for `process.env.NAME`,
  `process.env['NAME']`, or `env.NAME` occurrences (lines 56-85).
- Net effect: zero active lines → zero envNames → `environment.json = []` (confirmed:
  `generated-documents/data/environment.json` is 4 bytes, content `[]`).
- For contrast, `model.mjs:572-573` already cites `scripts/general/validate-launch-env.mjs`
  ('env-validator') and `site/lib/env.server.ts` ('env-reader') as **coverage-model
  evidence** — but that is a separate path from `extract-environment.mjs`.
