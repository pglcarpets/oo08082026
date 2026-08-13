# 04 — Security Audit

## Overview

- **Track:** 04 — Security (proxy/edge, CSRF, auth gating, rate limiting, env, security headers, CSP, secrets, migrations/RLS)
- **Scope:** `site/proxy.ts`, `site/lib/security/{csrf,csrfConstants}.ts`, `site/features/shared/api/withAuth.ts`, `site/lib/rateLimit.ts`, `site/lib/auth/{session,roles,devAuthBypass}.ts`, `site/lib/env.server.ts`, security headers, migrations under `site/platform/supabase/migrations{,.admin}/`, runtime probes of primary + admin + API routes.
- **Date:** 2026-08-12
- **Auditor:** Agent B (Phase A). Audit only — no source files edited.
- **Live server state:** `GET /api/dev/auth-bypass-status` → `{"bypassEnabled":false,"nodeEnv":"development","flagSet":true}`. So `DEV_AUTH_BYPASS` is set but **not** to `"1"` → `isDevAuthBypassEnabled()` returns false → auth gates run for real and persistence is Supabase mode. This is a stricter-than-dev-bypass posture and does not weaken the findings below; where dev bypass would mask a behavior it is called out.

## Method

### Source files inspected (file:line)

- `site/proxy.ts` — `MAINTENANCE_OFFLINE_PAGE_PREFIXES=["/admin"]` (15), `GUEST_PRODUCT_SURFACE_PREFIXES` (18), `CANVAS_HEAVY_PREFIXES` (24), `MAINTENANCE_MUTATION_ALLOW_API_PREFIXES=["/api/log-error"]` (31), `MEMBER_ONLY_WRITE_PREFIXES` (40–46), `MEMBER_ONLY_WRITE_SEGMENTS` (52–59), `isProtectedPath` excludes `/portal/guest` + retired admin studio (213–235), `hasSessionAuthCookies` (241–248), `applySecurityHeaders` (255–266), `buildContentSecurityPolicy` (155–175), matcher (440–453).
- `site/lib/security/csrf.ts` — `generateCsrfToken` (randomUUID), `validateCsrfToken` (timingSafeEqual, 30–38), `setCsrfTokenCookie` (httpOnly+secure(prod)+sameSite strict+24h, 44–53), `validateCsrfRequest` (66–76).
- `site/lib/security/csrfConstants.ts` — `CSRF_COOKIE_NAME="csrf-token"`, `CSRF_HEADER_NAME="x-csrf-token"`, `CSRF_REJECTION_HEADER_NAME="x-csrf-rejected"`.
- `site/features/shared/api/withAuth.ts` — order: `enforceRateLimit` → CSRF (POST/PUT/PATCH/DELETE iff `requireCsrf && !isDevAuthBypassEnabled`) → `resolveAuthContext` → handler; `ApiError` envelope + `CSRF_REJECTION_HEADER_NAME` on reject (lines ~120–180).
- `site/lib/rateLimit.ts` — in-memory `Map` (cap 10k, sliding window), `createSupabaseRateLimitBackend` (`rate_limits` table), `hasDistributedRateLimit`, `isAiScopedRateLimitKey` **fail-closed in prod** when AI-scoped and no distributed backend (lines 100–112).
- `site/lib/env.server.ts` — `@t3-oss/env-nextjs` + `zod`, `server-only`, `resolveCloudflarePair` (intact pair logic, 70–110).
- `site/lib/auth/devAuthBypass.ts` — `isDevAuthBypassEnabled` = `DEV_AUTH_BYPASS==="1" && NODE_ENV!=="production"` (35–42).
- `site/app/api/_lib/gitUser.ts`, `site/app/api/exports/route.ts`, `site/app/api/_lib/exportsStore.ts` — see 09.

### Commands run (evidence under `results/audit/security/`)

| Command | Exit | Result |
|---|---|---|
| `pnpm run check:launch` | 0 | `validate-launch-env` workstationOk; `scan_secrets` → **No likely secrets found**; `db_test_connection` → Products connected (catalog_products=157) + Planner/Auth connected (oando_plans=2 rows). `check-launch.txt` |
| `pnpm run scan:boundaries` | 0 | 939 files, 221 owned, 624 edges, **0 cross-product edges**. `scan-boundaries.txt` |
| `pnpm run check:governance` | 0 | `P2_csp_unsafe_inline=2`, `P4_migration_no_rollback=42` (at/below baseline). `check-governance.txt` |
| `pnpm run lint` | 0 | oxlint clean (warnings only: react-hooks deps, 1 a11y noninteractive-role). `lint.txt` |
| `pnpm run test:audit:api-routes` | 0 | see 09 |
| `pnpm run test:audit:eslint-disable` | 0 | see 09 |

Migration rollback count (manual): 54 SQL files total, **12 have `-- rollback`, 42 do not** — matches the ratcheted baseline of 42 (no new migration without rollback).

### Runtime probes (curl/Invoke-WebRequest, `http://localhost:3000`)

| Probe | Result |
|---|---|
| `HEAD /` | 200; headers present: `content-security-policy`, `x-content-type-options:nosniff`, `x-frame-options:SAMEORIGIN`, `referrer-policy:strict-origin-when-cross-origin`, `permissions-policy:camera=(),microphone=(),geolocation=(self)`, `strict-transport-security:max-age=31536000; includeSubDomains; preload`, `cross-origin-opener-policy:same-origin-allow-popups`, `cross-origin-resource-policy:same-site` |
| `POST /api/exports/` (empty, no cookies) | **403** `"Authentication required. Guest users cannot perform save, import, export, publish, or share actions."` (proxy edge gate — `MEMBER_ONLY_WRITE_SEGMENTS` contains `exports`) |
| `GET /api/csrf/` | 200 `{"token":"7ee95c99-…"}` (issues `csrf-token` cookie) |
| `GET /api/dev/auth-bypass-status/` | 200 `{"bypassEnabled":false,"nodeEnv":"development","flagSet":true}` |
| `GET /api/git-user/` | **200 `{"email":"pglcarpets@gmail.com","name":"pglcarpets"}`** |
| `GET /api/health/` | 200 `{"ok":true}` |

## Findings

### [P1] 4.1 — `POST /api/exports` has no handler-level auth, no CSRF, no rate limit, and writes to disk with no mode-gating

`site/app/api/exports/route.ts:15` exports `async function POST(request)` with **no `withAuth` wrapper** — no rate limit, no `requireCsrf`/`validateCsrfRequest`, no `resolveAuthContext`. The handler calls `writeBytes(path.join(EXPORTS_DIR, exportId), raw)` (`exportsStore.ts:41` → raw `fs.writeFile`), and `exportsStore.ts` imports **no** mode selector — it writes to `process.cwd()/site/platform/shared/data/exports/` unconditionally.

- **CSRF:** the proxy edge (`proxy.ts:391–406`) blocks *unauthenticated* mutations to `/api/exports` (verified: 403 with no cookies). But an **authenticated** victim's browser (carrying `sb-*auth-token` cookies) passes the edge cookie-existence check and reaches a handler with no CSRF check → CSRF on a member-only write surface. Violates governance **K10** (mutating API routes enforce CSRF) and the proxy.ts own comment ("Handler-layer withAuth(member/admin) is the real gate").
- **Rate limit:** none. Violates the rate-limit expectation for member-only-write surfaces.
- **Raw disk write in prod path:** `exportsStore` has no `getXxxMode()` gate; production runs a read-only filesystem (AGENTS.md §5) → `fs.writeFile` throws → 500. This is the exact anti-pattern AGENTS.md §5/§7 and `site/server/Studio/studioStore.ts` warn against (the furniture path correctly uses `writeFurnitureItem` → `getFurnitureCatalogMode`).
- **Audit coverage gap:** `scripts/general/audit-api-route-safety.mjs` classifies `exports` as surface `"other"` and only enforces CSRF/rate-limit on admin/planner/plans/site-form/site-public surfaces (see 09 finding 9.2). So this route is *not* certified by the "ok" audit result.

**Evidence:** `site/app/api/exports/route.ts:15-43`; `site/app/api/_lib/exportsStore.ts:11,38,41,76`; runtime 403 (edge) above; `scripts/general/audit-api-route-safety.mjs` `classifySurface` returns `"other"` for `exports`.
**Owner action:** Wrap `POST` in `withAuth(handler, { role:"member", rateLimitScope:"exports:post", rateLimit:20, requireCsrf:true })`, route writes through a mode-aware store (Supabase storage in prod), or gate the whole route to dev-only. Add `exports` to the audit script's enforced surfaces.

### [P2] 4.2 — `GET /api/git-user` leaks git committer identity with no auth / no rate limit

`site/app/api/git-user/route.ts:3` is `export async function GET()` — no `withAuth`, no rate limit, no CSRF (GET, so CSRF N/A). It calls `readGitUserIdentity()` (`gitUser.ts`) which runs `git config user.email` / `user.name` (via `execFile` with **array args** — no shell injection) and falls back to `GIT_USER_EMAIL`/`GIT_USER_NAME` env. Live probe returned a **real personal email** `pglcarpets@gmail.com` and name `pglcarpets` to an anonymous caller.

- Information disclosure of developer identity to any visitor.
- `execFile("git", ["config", key], …)` is safe from injection (args array, fixed keys) — no code-exec finding; the issue is the unauthenticated exposure, not the call mechanism.

**Evidence:** `site/app/api/git-user/route.ts`; `site/app/api/_lib/gitUser.ts:18`; runtime `GET /api/git-user/` → 200 with email.
**Owner action:** Gate behind `withAuth({ role:"admin" })` (it's a dev/ops convenience) or remove from public API; at minimum add a rate limit and return only when `NODE_ENV!=="production"`.

### [P3] 4.3 — `GET /api/dev/auth-bypass-status` exposes internal bypass state to anonymous callers

`/api/dev/auth-bypass-status/` returns `{"bypassEnabled":false,"nodeEnv":"development","flagSet":true}` with no auth. It discloses whether the dev-bypass flag is set and the Node environment to any caller. Low impact in isolation (values are not secrets), but it is an unauthenticated dev/ops introspection endpoint reachable from the public API surface; in a production deploy it would still answer (with `bypassEnabled:false`).

**Evidence:** runtime `GET /api/dev/auth-bypass-status/` → 200.
**Owner action:** Gate behind admin auth, or short-circuit to 404 when `NODE_ENV==="production"`.

### [P2] 4.4 — Production CSP permits `'unsafe-inline'` in `script-src` (standing ratcheted debt)

`buildContentSecurityPolicy` (`proxy.ts:155–175`) always includes `'unsafe-inline'` in `script-src` (both the canvas-heavy and non-canvas branches). `'unsafe-eval'` is correctly scoped to `/ooplanner`, `/oostudio` + dev only (`allowsUnsafeEval`, lines 136–141). This is the governance **P2** known breach, ratcheted at `P2_csp_unsafe_inline=2` (baseline 2, `check:governance` PASS at baseline — i.e. **not a new regression** but standing accepted debt). governance §9 item 5 records it explicitly.

**Evidence:** `site/proxy.ts:158–160`; `results/audit/security/check-governance.txt` (`P2_csp_unsafe_inline=2`); `docs/governance/rules.md` §9 item 5.
**Owner action:** Convert inline scripts to nonce/hashed `script-src` to lower the ratchet below 2 (owner-approved remediation; ratchet forbids *increasing* only).

## Verified-correct (no finding)

- **All 5 security headers present at runtime** (`HEAD /`): `X-Content-Type-Options:nosniff`, `X-Frame-Options:SAMEORIGIN`, `Referrer-Policy:strict-origin-when-cross-origin`, `Permissions-Policy:camera=(),microphone=(),geolocation=(self)`, `Strict-Transport-Security:max-age=31536000; includeSubDomains; preload`, plus `COOP:same-origin-allow-popups`, `CORP:same-site`, full CSP. Matches governance P3 expectation (MANUAL REVIEW) — verified live.
- **CSRF double-submit PASS:** `csrf-token` cookie is `httpOnly`, `secure` in prod, `sameSite=strict`, 24h; `validateCsrfToken` uses `timingSafeEqual`; rejection sets `x-csrf-rejected`; `GET /api/csrf` issues a fresh token (verified 200). `withAuth` enforces CSRF on POST/PUT/PATCH/DELETE when `requireCsrf` (and skips only when `isDevAuthBypassEnabled()` — which is false here).
- **Dev-bypass safety PASS:** `isDevAuthBypassEnabled` hard-returns false when `NODE_ENV==="production"` (`devAuthBypass.ts:38-40`); `DEV_AUTH_BYPASS_ALLOW_PRODUCTION` has zero code references (dead, per OPERATIONS_RUNBOOK). Cannot leak to prod.
- **`dangerouslySetInnerHTML` PASS:** every occurrence across the site is inside a JSON-LD `<script type="application/ld+json">` and routed through `sanitizeJsonForScript` (verified on `ComparePageView`, `ClientsPageView`, `career/page`, `(site)/layout`, plus all `page.tsx` JSON-LD blocks). No raw user HTML injection.
- **No `eval`/`new Function`/shell-string `exec`** in `site/`. The only `child_process` use is `execFile("git", ["config", …])` with array args (no injection).
- **Secrets PASS:** `check:launch` → "No likely secrets found." No committed secrets.
- **Migration rollback ratchet PASS:** `P4_migration_no_rollback=42` at baseline (12 of 54 have `-- rollback`; the 42 without are the ratcheted baseline — no new migration lacks rollback). Both DBs RLS-enabled per `docs/database/schema.md` (not re-introspected here; deferred).
- **Both DBs reachable:** `check:launch` connected Products (catalog_products=157) and Planner/Auth (oando_plans=2). Live-DB tests are not silently skipping in this environment.
- **`env.server.ts` PASS:** `server-only`, `@t3-oss/env-nextjs`+`zod`, `skipValidation:false`, Cloudflare pair kept intact.

## Deferred

- **RLS policy + grant presence** per table not re-introspected (relies on `docs/database/schema.md` 2026-08-01 introspection). Follow-up: `pnpm run ops db:advisors` + read each migration's `grant`/`policy`.
- **`/api/files/*` GET readers** (`/api/files/exports/[filename]`, `/api/files/furniture/[filename]`, `/api/files/projects/[filename]`, `/api/files/uploads/[filename]`) not individually probed for path-traversal — `safeFilename` exists (`studioStore.ts:182`) but per-route coverage not verified.
- **Server-side session validation depth** — proxy does cookie *existence* only; `getOptionalUser()` does the real Supabase call at layout time. A forged `sb-…auth-token` cookie shape would pass the edge but fail `getUser()`. Not exploited end-to-end here (would need a live session).
- **`DEV_AUTH_BYPASS_ALLOW_PRODUCTION` removal** from `.env.local` (OPERATIONS_RUNBOOK says remove if present) — env file not inspected.

## Changed files

None (audit only).

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|-------------|
| SEC-1 | P1 | `POST /api/exports` has no withAuth/CSRF/rate-limit and raw disk write (no mode-gating); edge cookie-check is the only gate | `site/app/api/exports/route.ts:15`; `exportsStore.ts:11,41`; runtime 403 (edge only); audit script classifies `exports` as `other` (skipped) | Wrap in `withAuth({role:"member",requireCsrf:true,rateLimitScope:"exports:post"})`; route writes through a mode-aware store |
| SEC-2 | P2 | `GET /api/git-user` leaks git committer email/name with no auth/rate-limit | runtime `GET /api/git-user/` → 200 `{"email":"pglcarpets@gmail.com",…}`; `git-user/route.ts:3` | Gate behind admin auth or dev-only |
| SEC-3 | P3 | `GET /api/dev/auth-bypass-status` exposes bypass/nodeEnv state unauthenticated | runtime 200 `{"bypassEnabled":false,"nodeEnv":"development","flagSet":true}` | Admin-gate or 404 in production |
| SEC-4 | P2 | Production CSP `script-src` permits `'unsafe-inline'` (ratcheted P2=2, standing debt) | `proxy.ts:158-160`; `check-governance.txt` `P2_csp_unsafe_inline=2` | Move inline scripts to nonce/hash to lower ratchet |
