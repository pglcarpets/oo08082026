# scripts/AsNeeded — allowlist

**Purpose:** One-shot / ad-hoc tools that are **not** on the product gate path.  
**Rule:** Only basenames listed here may live under `scripts/AsNeeded/`.

```powershell
node scripts/AsNeeded/<name>
```

## Allowlist (basenames)

| Basename | Kind | Notes |
|----------|------|--------|
| `_audit-stale-scripts.mjs` | audit | Find dead script refs |
| `_list-unwired-scripts.mjs` | audit | List scripts not in `package.json` |
| `_scan-circular-imports.mjs` | audit | Static import cycle scan |
| `audit-css-packages.mjs` | audit | Broken imports / unreferenced CSS |
| `verify-focss-imports.mjs` | verify | FOCSS import graph (`verify:focss`) |
| `verify-site-css.mjs` | verify | Site CSS package smoke (`verify:focss`) |
| `verify-focss-fences.mjs` | verify | FOCSS fence rules (`verify:focss`) |
| `verify-focss-module-imports.mjs` | verify | TSX → FOCSS module paths (`verify:focss`) |
| `verify-db-svg-matrix.mjs` | verify | DB/SVG matrix (`verify:db-svg`) |
| `verify-focss-structure.mjs` | verify | FOCSS folder structure (`verify:focss`) |

## Do **not** put here

- Anything in root `package.json` `scripts`
- `generate-svg.mjs` / `generate-svg/*`
- `scripts/general/*`
- Probe / one-shot diagnostics (do not reintroduce under root `scripts/` unless gated)

## Cleaned 2026-07-28

Deleted ~77 spent `probe-*` / `diag-*` / one-shot `verify-*` from this folder (pass3/pass4 waves, design/motion audits, media rescue, C4 diags). Not archived — owner instructed delete.

**Pass 2 (root):** deleted `scripts/fix_and_reseed.ts` (+ name-mirror test; dropped from `test:priority-7`) and gitignored `scripts/tsconfig.tsbuildinfo`.

**Pass 3 (2026-08-02):** deleted root one-shots (`live_openrouter_failover_stress`, `recovery-*`, `audit-hosted-runtime`, `audit-hardcoded-detail`, `audit-tsx-hardcoded`) and AsNeeded `copy-i18n-messages-from-20072026` / `probe-focss-browser-parity`. Kept coverage/SVG/e2e helpers that are imported or name-mirrored.
