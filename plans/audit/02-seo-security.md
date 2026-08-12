# SEO + Security Audit (File 2 of 5)

**Tracks:** 3 (SEO), 4 (Security)
**Agent:** B
**Report outputs:** `agent-reports/audit/03-seo.md`, `agent-reports/audit/04-security.md`

---

## Track 3 — SEO

### Scope
- `site/app/(site)/robots.ts` (recent `sitemapHost` change — verify host correctness).
- `sitemap.ts` / sitemap index; route coverage; lastmod sanity.
- Per-route `metadata`/`generateMetadata`: title, description, canonical, openGraph, twitter, robots meta.
- hreflang / `alternates.languages` (next-intl locales).
- OG images (existence, dimensions, `og:image`, `og:image:alt`).
- Structured data (JSON-LD) if any.
- `route-contract.json` and `site/proxy.ts` redirects/rewrites affecting SEO.
- Heading hierarchy (one h1 per page).
- Rendered HTML vs client-only content (Next 16 SSR/RSC).

### Method
- Static: grep `export const metadata`, `generateMetadata`, `alternates`, `openGraph`.
- Runtime: `curl -sI http://localhost:3000/robots.txt`, `/sitemap.xml`, per-route `view-source`.
- Playwright: per route capture `<head>` (title, meta, link rel canonical/alternate/hreflang, OG tags).
- Verify robots allows primary routes, blocks `/admin/*`, `/portal/*` etc. as intended.

### Findings checklist
- Missing/empty/duplicate title or description.
- Missing canonical.
- hreflang locale set vs actual supported locales (`site/i18n`).
- OG image missing or wrong dimensions.
- sitemap missing primary routes or including admin.
- robots disallow set correctness; `sitemapHost` resolves to production host.
- Multiple h1 or missing h1.
- Noindex on routes that should be indexed, or indexed on routes that shouldn't.

## Track 4 — Security

### Scope
- CSRF: `site/lib/security/csrf.ts`, `tests/unit/lib/security/csrf.test.ts`, `/api/csrf`.
- Auth: `site/lib/auth/`, `devAuthBypass`, `withAuth`, session handling, `@supabase/ssr`.
- Rate limit: `site/lib/rateLimit.ts`.
- Secrets: `scripts/general/scan_secrets.mjs`, `check:launch` (validate-launch-env).
- Proxy: `site/proxy.ts`, `route-contract.json` — open redirects, rewrites.
- Env: `.env.local`, `site/.env.local`, `@t3-oss/env-nextjs` schema.
- Server actions: `next-safe-action` v8 usage; `withAuth`/safe-action middleware.
- Route handlers: `/api/*` — auth, input validation (zod), mode-aware writes.
- OWASP ASVS L2 spot checks: injection, XSS, SSRF, IDOR, broken access, security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Headers via `next.config.ts` + middleware.

### Method
- Static: grep for `dangerouslySetInnerHTML`, raw SQL, `eval`, `exec`, unsanitized user input.
- `pnpm run check:launch` (validate-launch-env + scan_secrets + db connection).
- `pnpm run scan:boundaries` (fork isolation as a security boundary).
- Curl primary + admin routes without auth → expect redirects/401.
- Inspect security headers: `curl -sI http://localhost:3000/`.
- Server actions: grep `action(`, `metadataAction`, safe-action `wrap`.
- Migration safety: every migration has `-- rollback` (`pnpm run check:governance` ratchets `P4_migration_no_rollback` baseline 42).
- RLS: migrations include `policy` + `grant` (Supabase requires both).

### Findings checklist
- Missing CSRF on a mutating route.
- Auth bypass in non-dev env.
- Rate limit absent on auth/contact/search endpoints.
- Secret leaked to client bundle (env not prefixed `NEXT_PUBLIC_` but imported client-side, or vice versa).
- Open redirect in `proxy.ts`.
- Missing security headers.
- Server action without `withAuth` or input validation.
- Route handler writing to disk in prod (mode-aware wrapper bypass).
- Migration missing `-- rollback`.
- RLS policy without grant.

## Evidence requirements
- Command output for `scan_secrets`, `check:launch`, `scan:boundaries`, `check:governance`.
- `curl -sI` header dumps.
- file:line for each finding.

## Out of scope
- Penetration testing beyond local static + runtime spot checks.
- Source edits (propose, don't apply).

## Acceptance
- [ ] `03-seo.md`, `04-security.md` written.
- [ ] Each P0/P1 has command output or file:line.
- [ ] No source changes.
