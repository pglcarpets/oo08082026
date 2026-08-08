# Operations & deploy plan — AUDITED 2026-08-08

**Status:** PARTIAL — Worker origin, apex catalog, and static CSS verified 2026-08-08; deploy used remote build (`--prebuilt` failed on `/admin/icon.png`); docs DNS still OPEN.
**Owner / when to use:** Anyone deploying to Vercel, Cloudflare Worker, or proving production smoke before closing F-rows in [`Failures.md`](../Failures.md).
**Related:** [`Failures.md`](../Failures.md) · [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · [`HANDOVER.md`](../HANDOVER.md) · [04-database-plan.md](./04-database-plan.md) · [02-testing-plan.md](./02-testing-plan.md) · `workers/oando-worker-proxy/` · `vercel.json`

---

## Goal

`oando.co.in` serves the current monorepo (`oostudiooplanner.vercel.app`), `/_next/static` assets return 200, and `docs.oando.co.in` resolves — proven with `curl` and browser at `http://localhost:3000` for local auth only (never `127.0.0.1`).

---

## Who does what

| Role | Responsibility |
|------|----------------|
| Infra owner | Cloudflare DNS (F3), Worker deploy, Vercel prebuilt deploy |
| Developer | Local `build:site`, gate checks before asking for deploy |
| Security | Rotate any exposed Vercel tokens; store secrets in `.env.local` / vault |

---

## Current state

| ID | Claim | Evidence 2026-08-08 | Verdict |
|----|-------|---------------------|---------|
| F1 | Worker proxies to correct Vercel origin | `wrangler.toml` `VERCEL_ORIGIN = https://oostudiooplanner.vercel.app`; curl `oando.co.in/ooplanner/` → 200, `x-oando-proxy: cloudflare-worker` | **VERIFIED** — `results/deploy/worker-headers.txt` |
| F2 | Catalog data on apex | `curl oando.co.in/api/categories/` returns category counts | **VERIFIED** — same artifact |
| F3 | `docs.oando.co.in` DNS | NXDOMAIN per [`Failures.md`](../Failures.md) F3 | **OPEN — owner CF action** |
| Static assets | `/_next/static/css/*.css` on prod | `results/deploy/vercel-static.txt`: remote-build deploy 2026-08-08 returned 200 for CSS; `--prebuilt` path blocked by duplicate admin icon (since fixed) | **VERIFIED — prebuilt still OPEN** |
| Exposed token | Vercel token in git history (`HANDOVER`) | Must rotate | **OPEN — security** |
| `ops check:worker-origin` | Drift check script | `results/deploy/worker-origin-check.log`: direct `node` invocation → exit 0 OK; `pnpm run ops` path-quoting bug on Windows | **SCRIPT VERIFIED — wrapper flaky** |
| Auth session tests | `session.test.ts` | 10/10 green after vitest env fix | **GREEN — see [02-testing-plan.md](./02-testing-plan.md)** |
| Full `gate` | Release chain | Not re-proven end-to-end in last session | **OPEN** |

---

## Step-by-step instructions

1. **Prove Worker live headers** (no deploy needed if already green)
   ```powershell
   curl.exe -sI https://oando.co.in/ooplanner/
   curl.exe -sI https://oostudiooplanner.vercel.app/ooplanner/
   ```
   **Expect:** apex shows `x-oando-proxy: cloudflare-worker`; both `x-matched-path: /ooplanner`. Save to `results/deploy/worker-headers.txt`. **If mismatch:** `wrangler deploy` from `workers/oando-worker-proxy/` with `VERCEL_ORIGIN` set.

2. **Prove catalog on apex**
   ```powershell
   curl.exe -s https://oando.co.in/api/categories/ | Select-String "seating"
   ```
   **Expect:** JSON with category counts. **If empty:** see [04-database-plan.md](./04-database-plan.md) seeding and F1 origin.

3. **Worker origin drift check**
   ```powershell
   node scripts/general/check-worker-origin.mjs
   ```
   **Expect:** exit 0, `OK`. **If `pnpm run ops check:worker-origin` fails on Windows:** use direct `node` invocation (known `run-ops.mjs` path-quoting issue).

4. **Vercel deploy** (owner — requires tokens)
   ```powershell
   pnpm run build:site
   npx vercel deploy --prod --prebuilt
   ```
   **Expect:** build exit 0; deploy succeeds.
   **If `--prebuilt` fails on admin lambda:** use remote build fallback (`npx vercel deploy --prod` without `--prebuilt`) as done 2026-08-08.
   Then prove static assets:
   ```powershell
   curl.exe -sI https://oostudiooplanner.vercel.app/_next/static/css/
   curl.exe -sI https://oando.co.in/_next/static/css/
   ```
   **Expect:** 200 (not 404). Save to `results/deploy/vercel-static.txt`.

5. **Docs DNS (F3)** — Cloudflare dashboard
   - Add CNAME `docs` → tech-docs host (proxied).
   ```powershell
   curl.exe -sI https://docs.oando.co.in
   ```
   **Expect:** 200 after DNS propagates. Remove F3 from [`Failures.md`](../Failures.md) only after proof.

6. **Rotate exposed Vercel token**
   - Revoke old token; set `VERCEL_TOKEN` / `VERCEL_API_TOKEN` in Vercel env + vault.
   - Scrub references from committed docs (do not commit new secrets).

7. **Auth + gate**
   ```powershell
   pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/auth/session.test.ts
   pnpm run gate
   ```

---

## Verification checklist

- [ ] `curl` apex `/ooplanner/` — 200 + `x-oando-proxy: cloudflare-worker`
- [ ] `curl` apex `/api/categories/` — non-empty JSON
- [ ] `node scripts/general/check-worker-origin.mjs` — exit 0
- [ ] `/_next/static/css/*` — 200 on Vercel origin and via apex
- [ ] `docs.oando.co.in` — resolves and returns 200 (closes F3)
- [ ] Vercel token rotated if previously exposed
- [ ] `pnpm run release:gate:fast` — exit 0 on deploy commit

---

## Open items

1. **P0:** Prove `--prebuilt` Vercel deploy works end-to-end (remote-build fallback already verified 2026-08-08).
2. **P0:** F3 — `docs.oando.co.in` CNAME in Cloudflare.
3. **P1:** Rotate exposed Vercel token from git history.
4. **P1:** Fix Windows `run-ops.mjs` path quoting so `pnpm run ops *` works reliably.
5. **P2:** Re-prove full `pnpm run gate` after deploy.

### Catalog assets note

Bulk catalog under `site/public/assets/catalog/**` is excluded via `.vercelignore`; runtime uses R2/CDN (`NEXT_PUBLIC_ASSET_BASE_URL`). See [04-database-plan.md](./04-database-plan.md) for cutover. Do not switch apex DNS until static 200 is proven.

---

## Key paths & commands

| Item | Path / command |
|------|----------------|
| Worker config | `workers/oando-worker-proxy/wrangler.toml` |
| Worker source | `workers/oando-worker-proxy/src/index.js` |
| Vercel config | `vercel.json`, `site/next.config.js` |
| Build site | `pnpm run build:site` |
| Ops CLI | `pnpm run ops list` |
| Worker origin check | `node scripts/general/check-worker-origin.mjs` |
| Fast gate | `pnpm run release:gate:fast` |
| Auth proxy | `site/proxy.ts` (`DEV_AUTH_BYPASS` off in prod) |

*Remove F-rows in [`Failures.md`](../Failures.md) only after curl/browser evidence. Blockers elsewhere: that file only.*
