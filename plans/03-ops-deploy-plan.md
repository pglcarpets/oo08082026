# Operations & deploy plan — vertical slices

**AUDITED:** 2026-08-08 · **Owner:** Vercel, Cloudflare Worker, DNS, production smoke.  
**Related:** [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · [`Failures.md`](../Failures.md) · [`03-ops-deploy-plan.md`](./03-ops-deploy-plan.md).

---

## DONE slices

### OPS-S02 — Worker origin drift

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S02 |
| **Seam** | `node scripts/general/check-worker-origin.mjs` exit code |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | `node scripts/general/check-worker-origin.mjs` → `OK` exit 0 (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

### OPS-S03 — Apex categories API

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S03 |
| **Seam** | `SEAM-OPS-CURL` — `GET https://oando.co.in/api/categories/` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | `curl.exe -s https://oando.co.in/api/categories/` returns JSON with category keys (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

### OPS-S07 — Apex Planner worker header

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S07 |
| **Seam** | `curl.exe -sI https://oando.co.in/ooplanner/` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | Response includes `x-oando-proxy: cloudflare-worker` |
| **Depends on** | OPS-S02 |
| **Status** | DONE |

### OPS-S08 — Apex catalog asset HEAD

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S08 |
| **Seam** | `curl.exe -sI https://oando.co.in/assets/catalog/...` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | `results/asset-cutover/smoke-report.json` apex HEAD 200 + worker header |
| **Depends on** | TST-S11 |
| **Status** | DONE |

### OPS-S06 — Lockfile pnpm 11.20.0 (P1-4)

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S06 |
| **Seam** | `pnpm-lock.yaml` + `package.json` `packageManager` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Reported mismatch `lockfileVersion: '9.0'` vs `pnpm@11.20.0` |
| **Green** | Verify install — no regen required |
| **Evidence** | `pnpm@11.20.0` + `pnpm install --frozen-lockfile` exit 0 (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

---

## OPEN slices

### OPS-S01 — F3 docs DNS (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S01 |
| **Seam** | `SEAM-OPS-CURL` — `curl.exe -sI https://docs.oando.co.in` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `Resolve-DnsName docs.oando.co.in` → NXDOMAIN; curl fails resolve |
| **Green** | Cloudflare CNAME `docs` → tech-docs host (proxied); curl returns 200 |
| **Evidence** | `results/deploy/docs-dns.txt` with DNS + curl output; remove F3 from `Failures.md` |
| **Depends on** | — |
| **Status** | OPEN — `Failures.md` F3 |

### OPS-S04 — Vercel prebuilt + static CSS 200 (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S04 |
| **Seam** | `npx vercel deploy --prod --prebuilt` then `curl.exe -sI https://oostudiooplanner.vercel.app/_next/static/css/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Prebuilt deploy fails OR static CSS returns 404 |
| **Green** | `pnpm run build:site` exit 0; prebuilt deploy success; CSS 200 on Vercel + apex |
| **Evidence** | `results/deploy/vercel-static.txt` with status codes |
| **Depends on** | TST-S09 |
| **Status** | OPEN — remote-build verified 2026-08-08; prebuilt path OPEN |

### OPS-S05 — Vercel token rotation (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | OPS-S05 |
| **Seam** | Vercel dashboard token lifecycle (no token in git tree) |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Grep repo for exposed token pattern in docs |
| **Green** | Revoke old token; store in vault / Vercel env only |
| **Evidence** | Owner sign-off note in `results/deploy/token-rotation.txt` |
| **Depends on** | — |
| **Status** | OPEN — security owner action |

---

## Key paths

| Item | Path |
|------|------|
| Worker | `workers/oando-worker-proxy/` |
| Vercel | `vercel.json` |
| Build | `pnpm run build:site` |
| Ops list | `pnpm run ops list` |

*Remove F-rows only after curl evidence in `results/deploy/`.*
