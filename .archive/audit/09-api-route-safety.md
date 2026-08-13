# 09 — API Route Safety Audit

## Overview

- **Track:** 09 — API route safety (auth/CSRF/rate-limit coverage of `site/app/api/**/route.ts`, server actions, mode-aware vs raw disk writes, audit-script coverage).
- **Scope:** `site/app/api/**/route.ts` (65+ routes per `docs/architecture/routes.md`), `scripts/general/audit-api-route-safety.mjs`, `site/lib/safe-action.ts`, `site/features/admin/api/adminActionGuards.ts`, server actions under `site/features/**`, mode-aware write wrappers (`site/server/{Studio,Planner}/*Store.ts`, `site/lib/catalog/*Mode.ts`), legacy `site/data/storage/`.
- **Date:** 2026-08-12
- **Auditor:** Agent B (Phase A). Audit only — no source files edited.

## Method

### Source files inspected (file:line)

- `docs/architecture/routes.md` — 65+ route inventory; auth roles: admin→`withAuth(role:admin)`/`requireAdminSession`; `/api/Planner/projects*`→`member`; `/api/Planner/catalog|handoff` + `/api/Studio/furniture*`→`guest`; `goLive` admin-only.
- `scripts/general/audit-api-route-safety.mjs` — `CSRF_OPTIONAL={tracking,log-error,customer-queries,nav-search}` (41–46); `CSRF_REQUIRED_PREFIXES` (53–72); `PUBLIC_FORM_MUTATORS` (78–83); checks: `missing-admin-auth`, `missing-csrf`, `missing-csrf-rejection-header`, `csrf-wrong-error-code`, `missing-rate-limit` (admin/planner/plans only), `missing-public-rate-limit`, `planner-mutator-no-withAuth`/`-no-requireCsrf`. Rate-limit/auth **not enforced** for surface `"other"` (281–295).
- `site/features/shared/api/withAuth.ts` — `withAuth(handler,{role,rateLimitScope,rateLimit?,rateLimitWindowMs?,requireCsrf?})` → `enforceRateLimit` → CSRF (POST/PUT/PATCH/DELETE iff `requireCsrf && !isDevAuthBypassEnabled`) → `resolveAuthContext` → handler.
- `site/lib/safe-action.ts` — `actionClient = createSafeActionClient({handleServerError})`.
- `site/features/admin/api/adminActionGuards.ts` — `requireAdminAction()` (→`resolveAuthContext("admin")`), `assertActionRateLimit(scope,limit)`, `runAdminDomain(fn)`.
- `site/features/admin/catalog/catalogItemActions.ts:36-55` — `actionClient.inputSchema(ZodSchema).action(async({parsedInput})=>{ await requireAdminAction(); await assertActionRateLimit("admin-catalogs:post",20); return runAdminDomain(()=>createStandardCatalogItem(parsedInput)); })` — canonical admin-action pattern.
- `site/features/site/contact/submitContactAction.ts` — `actionClient.inputSchema(submitContactActionSchema).action(...)` → `createCustomerQuery(payload,{ip})`.
- `site/features/site/contact/createCustomerQuery.ts:109-110` — `if(!options.rateLimitAlreadyApplied) rateLimit(...)` — contact action rate-limits via this path.
- `site/server/Studio/studioStore.ts:218-228` — `writeFurnitureItem` gates `getFurnitureCatalogMode()` (disk in dev, Supabase in prod); raw `writeJson`/`writeBytes` are only reached through the mode-gated wrappers (196–279).
- `site/lib/catalog/furnitureCatalogMode.ts` — `getFurnitureCatalogMode` = `isDevAuthBypassEnabled(env) ? "disk" : "supabase"`.
- `site/app/api/Studio/furniture/route.ts` — GET `withAuth({role:"guest",rateLimitScope:"studio-furniture:get",rateLimit:60})`; POST `withAuth({role:"guest",rateLimitScope:"studio-furniture:post",rateLimit:30,requireCsrf:true})` → `writeFurnitureItem` (mode-gated).
- `site/app/api/exports/route.ts` + `site/app/api/_lib/exportsStore.ts` — see finding 9.1.
- `site/app/api/_lib/gitUser.ts` — `execFile("git",["config",key],…)` array args (no injection).

### Commands run (evidence under `results/audit/api-safety/`)

| Command | Exit | Result |
|---|---|---|
| `pnpm run test:audit:api-routes` | 0 | `scanned 56 route file(s), 33 mutator route(s)` → **ok**. `api-route-audit.txt` |
| `pnpm run test:audit:eslint-disable` | 0 | `audit-eslint-disable: ok`. `eslint-disable-audit.txt` |
| `pnpm run test:audit:hollow` | 0 | `audit-hollow-tests: ok`. `hollow-audit.txt` |
| `pnpm run test:audit:gate-skips` | 0 | `audit-gate-skips: ok`. `gate-skips-audit.txt` |
| `grep "data/storage"` in `site/` | — | **0 matches** (legacy storage path has zero code references) |
| `grep writeFileSync|fs\.write` in `site/` | — | hits in `server/{Studio,Planner}/*Store.ts` (mode-gated), `lib/catalog/{lifecycle,svg/descriptorPointer,persistBlockDescriptor}.ts` (descriptor dev path), `features/admin/pricing/priceBookFileStore.ts` (admin dev tooling), `app/api/_lib/exportsStore.ts` (NOT gated — see 9.1), `lib/ai/mastra/lanceVectorStore.ts` (mkdir only) |

Runtime probes (curl, `http://localhost:3000`): `POST /api/exports/` (no cookies) → **403** (edge); `GET /api/csrf/` → 200 token; `GET /api/git-user/` → 200 email leak; `GET /api/dev/auth-bypass-status/` → 200 `{bypassEnabled:false,…}`. (Detail in 04-security.)

## Findings

### [P1] 9.1 — `POST /api/exports` is a mutating route with no `withAuth`/CSRF/rate-limit and a raw (un-gated) disk write

`site/app/api/exports/route.ts:15` exports `async function POST(request)` with **no `withAuth`** — no rate limit, no `requireCsrf`/`validateCsrfRequest`, no role check. The body calls `writeBytes(path.join(EXPORTS_DIR, exportId), raw)` (`route.ts:41`) and `exportsStore.ts` performs a raw `fs.writeFile` to `process.cwd()/site/platform/shared/data/exports/` with **no mode selector imported** (`exportsStore.ts:1-18,76`) — unlike the furniture/planner paths which route through `writeFurnitureItem`/`getFurnitureCatalogMode`.

Violations:
- **K10 (mutating routes enforce CSRF):** no CSRF at the handler. The proxy edge (`proxy.ts` `MEMBER_ONLY_WRITE_SEGMENTS` includes `exports`) blocks *unauthenticated* POSTs (verified 403), but an authenticated victim's cookies pass the edge cookie-existence check and reach a CSRF-less handler → CSRF on a member-only-write surface.
- **Rate limit:** none.
- **Auth at handler:** none — relies solely on the edge cookie-existence check. `withAuth.ts` comment says "Handler-layer withAuth(member/admin) is the real gate; edge rejects early" — the gate is missing here.
- **Raw disk write in a prod-reachable path:** `exportsStore` has no `getXxxMode()` gate; production's read-only filesystem means `fs.writeFile` throws → 500 (AGENTS.md §5: "Route handlers must use mode-aware wrappers, never raw disk helpers").

**Evidence:** `site/app/api/exports/route.ts:15-43`; `site/app/api/_lib/exportsStore.ts:11,21,38,41,76`; runtime `POST /api/exports/` → 403 (edge only); `site/server/Studio/studioStore.ts:218-228` (the correct pattern, for contrast).
**Owner action:** `export const POST = withAuth(handler, { role:"member", rateLimitScope:"exports:post", rateLimit:20, requireCsrf:true })`, and route the write through a Supabase-storage mode-aware store (or make the route dev-only). Mirror the `studioStore.writeFurnitureItem` pattern.

### [P2] 9.2 — `audit-api-route-safety.mjs` reports `ok` but does not cover the `"other"` API surface (exports, git-user, dev-tools, files/*, etc.)

The audit script enforces CSRF only on paths matching `CSRF_REQUIRED_PREFIXES` (admin/planner/plans/Studio/theme-manage/customer-queries-manage/ai-advisor/audit/filter/generate-alt/configurator-smart-wizard) and rate limits only on admin/planner/plans + `PUBLIC_FORM_MUTATORS`. Everything else is classified `surface="other"` (`classifySurface`, lines 281–295) and **skipped** for both CSRF and rate-limit checks. So the headline `scanned 56 route file(s), 33 mutator route(s)` / `ok` certifies the admin/planner/plans/site-form surfaces **only**; it does **not** certify `exports`, `git-user`, `dev/auth-bypass-status`, `dev-tools/lighthouse`, `files/*`, `theme/active`, `business-stats`, `categories`, `features`, `products`, `nav-categories`, `health`, `csrf`, `git-user`.

This is why 9.1 was not caught by the gate. The audit is a ratchet over the surfaces it knows about; the `"other"` surface is an unaudited blind spot.

**Evidence:** `scripts/general/audit-api-route-safety.mjs:144-149` (`csrfRequiredForPath`), `277-295` (`classifySurface` returns `"other"`), `410-443` (rate-limit checks gated on admin/planner/plans/public-form only); `results/audit/api-safety/api-route-audit.txt` (`ok`).
**Owner action:** Extend the script to enforce rate-limit (and, for mutating methods, CSRF) on the `"other"` surface too, or add an explicit allowlist of intentionally-public `"other"` mutators with a documented rationale. At minimum, surface `exports` and `git-user` so they are not silently skipped.

### [P3] 9.3 — `GET /api/git-user` and `GET /api/dev/auth-bypass-status` are unauthenticated dev/ops endpoints on the public API surface

Both are GET (CSRF N/A) but have no auth and no rate limit and expose internal state (git identity / bypass-flag state). Cross-ref 04-security 4.2/4.3. Listed here because they are also "other"-surface routes the api-safety audit does not cover.

**Evidence:** runtime probes (04-security); `audit-api-route-safety.mjs` skips `"other"`.
**Owner action:** Admin-gate or dev-only-gate these endpoints; add to the audit's enforced set.

## Verified-correct (no finding)

- **Audit scripts green:** `test:audit:api-routes` (0 errors, 56 routes/33 mutators), `test:audit:eslint-disable` (0), `test:audit:hollow` (0), `test:audit:gate-skips` (0). No `eslint-disable` hiding a rule, no hollow tests, no gate skips.
- **Admin routes PASS:** the audit's `missing-admin-auth` check passed for all `admin/*` routes — every admin route file contains `withAuth(`/`requireAdminSession(`/`resolveAuthContext("admin")`/`role:"admin"`.
- **Planner/Studio mutating routes PASS:** `/api/Planner/projects*` uses `withAuth`+`requireCsrf:true` (member); `/api/Studio/furniture*` uses `withAuth({role:"guest",requireCsrf:true})`; `/api/plans*` uses `withAuth`+`requireCsrf`. The `planner-mutator-no-withAuth`/`-no-requireCsrf` checks passed.
- **CSRF rejection header + error code PASS:** no `missing-csrf-rejection-header` or `csrf-wrong-error-code` findings — CSRF reject paths set `x-csrf-rejected` and use `API_ERROR_CODES.CSRF_FAILED`.
- **Server actions PASS:** admin actions (`catalogItemActions.ts`) use `actionClient.inputSchema(Zod).action` + `requireAdminAction()` + `assertActionRateLimit()` + `runAdminDomain()` — zod validation + admin auth + rate limit. The contact action (`submitContactAction.ts`) uses zod + `createCustomerQuery` (which rate-limits unless `rateLimitAlreadyApplied`).
- **Mode-aware writes PASS:** `writeFurnitureItem` (`studioStore.ts:218`), `persistFurnitureAssets` (`:241`), `persistFurnitureUpload` (`:255`), and the planner equivalents all gate `getFurnitureCatalogMode()`/`getPlannerPersistenceMode()` — disk only under `DEV_AUTH_BYPASS==="1"` (non-prod), Supabase otherwise. Raw disk helpers (`writeJson`/`writeBytes`/`persistFurnitureFiles`) are only reached via the mode-gated wrappers or the dev seeder.
- **Legacy storage PASS:** `grep "data/storage"` in `site/` → **0 matches**. `site/data/storage/` has zero code references (per AGENTS.md §3 note and `product-map.md`).
- **No `eval`/`new Function`** in `site/`. `child_process.execFile` in `gitUser.ts` uses array args (no shell injection).
- **`dangerouslySetInnerHTML` PASS:** all occurrences are sanitized JSON-LD (see 04-security).

## Deferred

- **Per-route handler-by-handler CSRF/auth audit** of every `"other"` route (e.g., `files/*`, `theme/active`, `business-stats`, `nav-categories`, `products`, `categories`, `features`, `health`) — the audit script's matrix mode (`--matrix`) would enumerate these; only sampled here. Follow-up: `node scripts/general/audit-api-route-safety.mjs --matrix` and review the `surface=other` rows.
- **Path-traversal in `/api/files/[filename]` readers** — `safeFilename` exists (`studioStore.ts:182`) but per-route application not exhaustively verified.
- **`/api/files/exports/[filename]` serving the un-gated exports writes** — chained with 9.1; if 9.1 is fixed to a mode-aware store, the reader path changes too.
- **Live authenticated POST probes** — not run (would need a real Supabase session; dev bypass is off in this server). The CSRF gap in 9.1 is established by code reading + the edge-only 403, not by a successful authenticated CSRF exploit.

## Changed files

None (audit only).

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|-------------|
| API-1 | P1 | `POST /api/exports` has no withAuth/CSRF/rate-limit and a raw un-gated disk write | `site/app/api/exports/route.ts:15`; `exportsStore.ts:11,41,76` (no mode import); runtime 403 edge-only; `studioStore.ts:218` (correct pattern) | Wrap in `withAuth({role:"member",requireCsrf:true,rateLimitScope:"exports:post"})`; route write through mode-aware store |
| API-2 | P2 | `audit-api-route-safety.mjs` reports `ok` but skips the `"other"` surface (exports/git-user/dev-tools/files/*…) — blind spot masking API-1 | `audit-api-route-safety.mjs:144-149,277-295,410-443`; `api-route-audit.txt` | Extend enforcement to `"other"` surface or add documented allowlist |
| API-3 | P3 | `GET /api/git-user` and `GET /api/dev/auth-bypass-status` unauthenticated dev/ops endpoints on public surface | runtime probes (04-security); script skips `"other"` | Admin-gate or dev-only; add to enforced audit set |
