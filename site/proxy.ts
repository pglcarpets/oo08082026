import { NextResponse, type NextRequest } from "next/server";
import { PLANNER_GUEST_COOKIE } from "./lib/auth/constants";
import { isDevAuthBypassEnabled } from "./lib/auth/devAuthBypass";
import { sanitizeNextPath } from "./lib/auth/plannerRedirect";
import { isMaintenanceReadonly } from "./lib/platform/maintenanceMode";

/** Canonical planner paths only — legacy /oando-planner/* 301 in next.config.js */
const PLANNER_GUEST_PATHS = ["/ooplanner", "/ooplanner/projects"];
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BLOCKED_PAGE_PREFIXES = ["/admin", "/crm", "/ops"];
/** Maintenance read-only: block mutating methods on these API prefixes. */
const BLOCKED_WRITE_API_PREFIXES = [
  "/api/plans",
  "/api/Planner",
  "/api/Studio",
  "/api/tracking",
  "/api/customer-queries",
  "/api/admin",
  "/api/theme",
  "/api/exports",
  "/api/filter",
  "/api/ai-advisor",
  "/api/audit",
  "/api/generate-alt",
  "/api/configurator",
];

/**
 * Member/account write surfaces — unauthenticated traffic must never hit these.
 * Fork disk APIs (`/api/Planner`, `/api/Studio`) stay guest-usable with handler
 * `withAuth({ role: "guest", requireCsrf: true })` + rate limits.
 */
export function isMemberOnlyWriteApi(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (p === "/api/plans" || p.startsWith("/api/plans/")) return true;
  if (p.startsWith("/api/admin")) return true;
  if (p.startsWith("/api/customer-queries/manage")) return true;
  if (p.startsWith("/api/theme/manage")) return true;
  // Substring markers used by residual/legacy mutators
  return (
    p.includes("/export") ||
    p.includes("/import") ||
    p.includes("/publish") ||
    p.includes("/share") ||
    p.includes("/persist")
  );
}

/** True when request looks like guest product traffic (no session). */
export function isGuestProductContext(
  pathname: string,
  hasPlannerGuestPass: boolean,
  referer: string | null,
): boolean {
  if (hasPlannerGuestPass) return true;
  const p = normalizePathname(pathname);
  if (p === "/ooplanner" || p.startsWith("/ooplanner/")) return true;
  if (p === "/oostudio" || p.startsWith("/oostudio/")) return true;
  const ref = referer ?? "";
  return (
    ref.includes("/ooplanner") ||
    ref.includes("/oostudio") ||
    ref.includes("/guest") ||
    ref.includes("/choose-product")
  );
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Fabric / WebGL planner surfaces require eval at runtime; Next.js dev (React Refresh) needs it on every route. */
function allowsUnsafeEval(pathname: string): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return isCanvasHeavyPath(pathname);
}

export function isCanvasHeavyPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  const prefixes = ["/ooplanner", "/oostudio", "/dashboard", "/portal", "/admin", "/crm", "/ops", "/catalog"];
  return prefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/** Trusted third-party script/beacon origins (verified need — see SiteAnalytics + docs/architecture/README.md quality targets). */
const CSP_VERCEL_ANALYTICS_ORIGINS =
  "https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live";

export function buildContentSecurityPolicy(pathname: string): string {
  const scriptSrc = allowsUnsafeEval(pathname)
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://esm.sh ${CSP_VERCEL_ANALYTICS_ORIGINS}`
    : `script-src 'self' 'unsafe-inline' blob: https://www.googletagmanager.com https://www.google-analytics.com https://esm.sh ${CSP_VERCEL_ANALYTICS_ORIGINS}`;

  return [
    "default-src 'self'",
    scriptSrc,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' data: https://fonts.googleapis.com https://unpkg.com https://esm.sh",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.tldraw.com https://unpkg.com https://esm.sh",
    `connect-src 'self' blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.openai.com https://openrouter.ai https://www.google-analytics.com https://unpkg.com https://cdn.tldraw.com https://esm.sh ${CSP_VERCEL_ANALYTICS_ORIGINS}`,
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}

export function isPlannerGuestAllowedPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return PLANNER_GUEST_PATHS.some((path) => {
    if (normalizedPathname === path) {return true;}
    if (path === "/ooplanner") {return false;}
    return normalizedPathname.startsWith(`${path}/`);
  });
}

/**
 * Phase 7 Stage B: retired `/portal/svg-catalog` (routes deleted).
 * Proxy short-circuits with permanent redirect so auth never intercepts
 * inbound links before next.config 308 also applies for crawlers.
 */
const PORTAL_RETIRED_SVG_CATALOG_PREFIX = "/portal/svg-catalog";

/** Guest portal entry + shared guest plan view — no member session required. */
const PORTAL_PUBLIC_GUEST_PREFIX = "/portal/guest";

export function isRetiredPortalSvgCatalogPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return (
    normalizedPathname === PORTAL_RETIRED_SVG_CATALOG_PREFIX ||
    normalizedPathname.startsWith(`${PORTAL_RETIRED_SVG_CATALOG_PREFIX}/`)
  );
}

export function isPublicPortalGuestPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return (
    normalizedPathname === PORTAL_PUBLIC_GUEST_PREFIX ||
    normalizedPathname.startsWith(`${PORTAL_PUBLIC_GUEST_PREFIX}/`)
  );
}

export function isProtectedPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);

  // Guest portal shell must stay public so it never hangs behind auth/DB gates.
  if (isPublicPortalGuestPath(normalizedPathname)) {
    return false;
  }

  if (
    normalizedPathname === "/dashboard" ||
    normalizedPathname.startsWith("/dashboard/") ||
    normalizedPathname === "/portal" ||
    normalizedPathname.startsWith("/portal/") ||
    normalizedPathname === "/admin" ||
    normalizedPathname.startsWith("/admin/") ||
    normalizedPathname === "/crm" ||
    normalizedPathname.startsWith("/crm/") ||
    normalizedPathname === "/ops" ||
    normalizedPathname.startsWith("/ops/")
  ) {
    return true;
  }

  return false;
}

/** Fast edge check: Supabase SSR session cookies (and legacy Appwrite if present). */
export function hasSessionAuthCookies(
  cookies: Array<{ name: string; value: string }>,
): boolean {
  return cookies.some((cookie) => {
    const name = cookie.name;
    if (name.startsWith("a_session_")) {return true;}
    if (name.startsWith("sb-") && name.includes("auth-token")) {return true;}
    return false;
  });
}

function applyMaintenanceHeader(response: NextResponse) {
  response.headers.set("x-site-maintenance", "readonly");
  return response;
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(pathname));
  return response;
}

function finalizeResponse(
  response: NextResponse,
  pathname: string,
  maintenanceReadonly: boolean,
) {
  const finalized = maintenanceReadonly
    ? applyMaintenanceHeader(response)
    : response;
  return applySecurityHeaders(finalized, pathname);
}

/**
 * NEXT.JS 16 PROXY
 * Must be named 'proxy' and placed at the root of the project.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const devAuthBypass = isDevAuthBypassEnabled();
  // Workstation .env often copies prod maintenance=readonly; local dev bypass must
  // still reach /admin for catalog/CRM work (pnpm dev sets DEV_AUTH_BYPASS=1).
  const maintenanceReadonly = isMaintenanceReadonly() && !devAuthBypass;

  // Phase 7 Stage B — retired portal SVG catalog (no page modules remain).
  // Proxy short-circuits before the auth gate (default 307 via NextResponse).
  // Permanent 308 for crawlers is declared in next.config redirects.
  if (isRetiredPortalSvgCatalogPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/products/";
    url.search = "";
    return finalizeResponse(
      NextResponse.redirect(url),
      pathname,
      maintenanceReadonly,
    );
  }

  if (maintenanceReadonly) {
    if (BLOCKED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = "/offline";
      url.searchParams.set("reason", "maintenance");
      return finalizeResponse(NextResponse.redirect(url), pathname, true);
    }

    if (
      WRITE_METHODS.has(request.method) &&
      BLOCKED_WRITE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      return finalizeResponse(
        NextResponse.json(
          { error: "Service temporarily in read-only maintenance mode." },
          {
            status: 503,
            headers: { "Retry-After": "300" },
          },
        ),
        pathname,
        true,
      );
    }
  }

  const isProtected = isProtectedPath(pathname);
  const hasPlannerGuestPass = request.cookies.has(PLANNER_GUEST_COOKIE);
  const allowPlannerGuest = hasPlannerGuestPass && isPlannerGuestAllowedPath(pathname);

  // Fast cookie existence check — avoids network calls for anonymous traffic.
  // Session validation still happens in layouts via getOptionalUser().
  const hasAuthCookies = hasSessionAuthCookies(request.cookies.getAll());

  // Already authenticated (or local dev bypass): leave /access via real HTTP redirect.
  // Avoids Next's a11y-critical meta-refresh interstitial on document navigations.
  const accessPath = normalizePathname(pathname);
  if (accessPath === "/access" && (devAuthBypass || hasAuthCookies)) {
    const rawNext = request.nextUrl.searchParams.get("next");
    const dest = sanitizeNextPath(rawNext);
    const url = request.nextUrl.clone();
    url.pathname = dest;
    url.search = "";
    return finalizeResponse(
      NextResponse.redirect(url),
      pathname,
      maintenanceReadonly,
    );
  }

  // Short-circuit: If they have no auth cookies, are not a guest, and the route is protected -> Boot them immediately.
  // Dev bypass (DEV_AUTH_BYPASS=1, non-prod) skips this gate for local admin/P0.1 work.
  if (!devAuthBypass && !hasAuthCookies && !allowPlannerGuest && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/access";
    redirectUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return finalizeResponse(
      NextResponse.redirect(redirectUrl),
      pathname,
      maintenanceReadonly,
    );
  }

  // Defense-in-depth: member-only write APIs never for unauthenticated callers.
  // Handler-layer withAuth(member/admin) is the real gate; edge rejects early.
  // Guest product may still use /api/Planner + /api/Studio (handler CSRF + rate limit).
  if (!devAuthBypass && !hasAuthCookies) {
    const isMutationMethod = WRITE_METHODS.has(request.method);
    const isServerAction = request.headers.has("next-action");
    const referer = request.headers.get("referer");
    const guestCtx = isGuestProductContext(pathname, hasPlannerGuestPass, referer);

    if (isMutationMethod && isMemberOnlyWriteApi(pathname)) {
      const response = NextResponse.json(
        {
          error:
            "Authentication required. Guest users cannot perform save, import, export, publish, or share actions.",
        },
        { status: 403 },
      );
      return finalizeResponse(response, pathname, maintenanceReadonly);
    }

    // Block server actions from guest product surfaces (page POSTs with next-action).
    if (
      guestCtx &&
      isMutationMethod &&
      isServerAction &&
      (allowPlannerGuest ||
        pathname.startsWith("/ooplanner") ||
        pathname.startsWith("/oostudio"))
    ) {
      const response = NextResponse.json(
        {
          error:
            "Guest users cannot perform save, import, export, publish, or share actions.",
        },
        { status: 403 },
      );
      return finalizeResponse(response, pathname, maintenanceReadonly);
    }
  }

  // The actual session validation is handled by getOptionalUser() in session.ts
  // at the page/layout level. The edge proxy just does a fast cookie existence check.
  
  // Locale selection is prefixless and handled by i18n/request.ts.
  const response = NextResponse.next({ request });

  // ── Security Headers ──────────────────────────────────────────────────────
  return finalizeResponse(response, pathname, maintenanceReadonly);
}

export const config = {
  matcher: [
    // i18n locale-prefixed paths and the root, handled by the next-intl layer.
    "/",
    "/(hi|fr|de|es)/:path*",
    "/api/:path*",
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets (images, fonts, etc.)
     * - API routes are matched separately via `/api/:path*` above
     */
    "/((?!_next|_vercel|api|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)",
  ],
};
