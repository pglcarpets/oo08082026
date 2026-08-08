import { SITE_URL } from "@/lib/siteUrl";

export type RouteClassification =
  | "public"
  | "protected"
  | "redirect"
  | "not-found"
  | "removed";

export interface SiteRouteMeta {
  route: string;
  classification: RouteClassification;
  audience: string;
  intent: string;
  owner: string;
  canonicalUrl: string;
  primaryAction: string;
  indexable: boolean;
  notes?: string;
}

/** Same production/env host as robots, sitemap, and page metadata. */
const SITE_BASE = SITE_URL.replace(/\/+$/, "");

function canonicalFor(route: string): string {
  const normalized = route.endsWith("/") ? route : `${route}/`;
  return `${SITE_BASE}${normalized}`;
}

export const SITE_ROUTE_CLASSIFICATION: SiteRouteMeta[] = [
  {
    route: "/",
    classification: "public",
    audience: "Public visitor",
    intent: "Brand entry, headline value proposition, primary CTAs",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/"),
    primaryAction: "Explore products",
    indexable: true,
  },
  {
    route: "/products",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Browse the full office-furniture catalog",
    owner: "Site",
    canonicalUrl: canonicalFor("/products"),
    primaryAction: "Open a product category",
    indexable: true,
  },
  {
    route: "/products/[category]",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "List products within a catalog category",
    owner: "Site",
    canonicalUrl: canonicalFor("/products/[category]"),
    primaryAction: "Open a product",
    indexable: true,
  },
  {
    route: "/products/[category]/[product]",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Product detail, specs, gallery, and enquiry",
    owner: "Site",
    canonicalUrl: canonicalFor("/products/[category]/[product]"),
    primaryAction: "Request a quote",
    indexable: true,
  },
  {
    route: "/products/category/[slug]",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Legacy category alias → /products/:category/ (or hard 404 if slug unknown)",
    owner: "Site",
    canonicalUrl: canonicalFor("/products/[category]"),
    primaryAction: "Redirect to canonical category",
    indexable: false,
    notes:
      "next.config permanent redirect + page permanentRedirect/notFound; never indexable shell.",
  },
  {
    route: "/solutions",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Workspace planning approach and solution sets",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/solutions"),
    primaryAction: "Open a solution",
    indexable: true,
  },
  {
    route: "/solutions/[category]",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Solution set detail for a sector or space type",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/solutions/[category]"),
    primaryAction: "Talk to planning team",
    indexable: true,
  },
  {
    route: "/planning",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Explain workspace planning service",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/planning"),
    primaryAction: "Request a survey",
    indexable: true,
  },
  {
    route: "/planner",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Workspace planner marketing landing",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/planner"),
    primaryAction: "Launch planner",
    indexable: true,
  },
  {
    route: "/planner/help",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Planner help center and FAQ",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/planner/help"),
    primaryAction: "Read help",
    indexable: true,
  },
  {
    route: "/planner/features",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Planner features hub",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/planner/features"),
    primaryAction: "Browse features",
    indexable: true,
  },
  {
    route: "/planner/features/[slug]",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Individual planner feature detail",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/planner/features/[slug]"),
    primaryAction: "Try feature",
    indexable: true,
  },
  {
    route: "/contact",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Enquiry capture",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/contact"),
    primaryAction: "Submit enquiry",
    indexable: true,
  },
  {
    route: "/about",
    classification: "public",
    audience: "Public visitor",
    intent: "Company story and credentials",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/about"),
    primaryAction: "Meet the team",
    indexable: true,
  },
  {
    route: "/downloads",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Resource desk: catalogs, technical sheets, references",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/downloads"),
    primaryAction: "Download a catalog",
    indexable: true,
  },
  {
    route: "/brochure",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Legacy brochure path redirected to /downloads/",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/downloads"),
    primaryAction: "Redirect to downloads",
    indexable: false,
    notes: "Redirects to /downloads/; next.config permanent 308 only (no page shell).",
  },
  {
    route: "/download-brochure",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Legacy brochure download path redirected to /downloads/",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/downloads"),
    primaryAction: "Redirect to downloads",
    indexable: false,
    notes: "Redirects to /downloads/; next.config permanent 308 only (no page shell).",
  },
  {
    route: "/career",
    classification: "public",
    audience: "Public candidate",
    intent: "Open roles and hiring",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/career"),
    primaryAction: "Apply for a role",
    indexable: true,
  },
  {
    route: "/news",
    classification: "redirect",
    audience: "Public visitor",
    intent: "Retired hollow newsroom → /about",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/about"),
    primaryAction: "Redirect to about",
    indexable: false,
    notes: "Retired newsroom; next.config permanent 308 to /about/ (no page shell).",
  },
  {
    route: "/gallery",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Duplicate delivery gallery → /clients",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/clients"),
    primaryAction: "Redirect to clients",
    indexable: false,
    notes: "Clients is the single proof photo surface; next.config permanent 308 only.",
  },
  {
    route: "/compare",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Side-by-side product comparison",
    owner: "Site",
    canonicalUrl: canonicalFor("/compare"),
    primaryAction: "Add a product to compare",
    indexable: true,
  },
  {
    route: "/trusted-by",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Client proof and scale",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/trusted-by"),
    primaryAction: "View clients",
    indexable: true,
  },
  {
    route: "/showrooms",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Showroom locations and visits",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/showrooms"),
    primaryAction: "Plan a visit",
    indexable: true,
  },
  {
    route: "/portfolio",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Legacy portfolio URL → /clients",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/clients"),
    primaryAction: "Redirect to clients",
    indexable: false,
    notes: "Executed-work photos consolidated on /clients; next.config permanent 308 only.",
  },
  {
    route: "/service",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "After-sales and support services",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/service"),
    primaryAction: "Open a service request",
    indexable: true,
  },
  {
    route: "/sitemap",
    classification: "public",
    audience: "Public visitor",
    intent: "HTML sitemap of public marketing and planner launch routes",
    owner: "Site",
    canonicalUrl: canonicalFor("/sitemap"),
    primaryAction: "Open a listed route",
    indexable: true,
  },
  {
    route: "/support-ivr",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Retired visual IVR → /service",
    owner: "Ops",
    canonicalUrl: canonicalFor("/service"),
    primaryAction: "Redirect to service",
    indexable: false,
    notes: "Service + Contact are the real support lanes; next.config permanent 308 only.",
  },
  {
    route: "/templates",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Retired template library stub → /products",
    owner: "Site",
    canonicalUrl: canonicalFor("/products"),
    primaryAction: "Redirect to products",
    indexable: false,
    notes: "Retired template library; hard 308 via next.config only (no page.tsx — config redirect wins).",
  },
  {
    route: "/choose-product",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Guided product selection (auth or guest mode)",
    owner: "Site",
    canonicalUrl: canonicalFor("/choose-product"),
    primaryAction: "Start product picker",
    indexable: false,
    notes: "Auth/guest workspace entry; noindex utility.",
  },
  {
    route: "/privacy",
    classification: "public",
    audience: "Public visitor",
    intent: "Privacy policy",
    owner: "Ops",
    canonicalUrl: canonicalFor("/privacy"),
    primaryAction: "Read policy",
    indexable: true,
  },
  {
    route: "/terms",
    classification: "public",
    audience: "Public visitor",
    intent: "Terms of use",
    owner: "Ops",
    canonicalUrl: canonicalFor("/terms"),
    primaryAction: "Read terms",
    indexable: true,
  },
  {
    route: "/imprint",
    classification: "redirect",
    audience: "Public visitor",
    intent: "Legacy imprint path redirected to /terms/?section=imprint (company identity on terms page)",
    owner: "Ops",
    canonicalUrl: canonicalFor("/terms"),
    primaryAction: "Redirect to terms imprint section",
    indexable: false,
    notes: "Owner decision: company identity on /terms#imprint or /terms/?section=imprint; next.config permanent 308 only.",
  },
  {
    route: "/refund-and-return-policy",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Refund and return policy",
    owner: "Ops",
    canonicalUrl: canonicalFor("/refund-and-return-policy"),
    primaryAction: "Read policy",
    indexable: true,
  },
  {
    route: "/sustainability",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Sustainability commitments",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/sustainability"),
    primaryAction: "Read commitments",
    indexable: true,
  },
  {
    route: "/social",
    classification: "redirect",
    audience: "Public visitor",
    intent: "Retired synthetic social feed → /clients",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/clients"),
    primaryAction: "Redirect to clients",
    indexable: false,
    notes: "Not a live social integration; next.config permanent 308 only.",
  },
  {
    route: "/clients",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Photography-forward portfolio of executed client work",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/clients"),
    primaryAction: "Browse installation photos",
    indexable: true,
  },
  {
    route: "/projects",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Legacy projects URL → /clients",
    owner: "Marketing",
    canonicalUrl: canonicalFor("/clients"),
    primaryAction: "Redirect to clients",
    indexable: false,
    notes: "Renamed to /clients; next.config permanent 308 only.",
  },
  {
    route: "/tracking",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "No live logistics system → /service",
    owner: "Ops",
    canonicalUrl: canonicalFor("/service"),
    primaryAction: "Redirect to service",
    indexable: false,
    notes: "Truthful after-sales path is /service and /contact; next.config permanent 308 only.",
  },
  {
    route: "/repo-store",
    classification: "redirect",
    audience: "Internal / ops",
    intent: "Retired internal audit UI → /",
    owner: "Ops",
    canonicalUrl: canonicalFor("/"),
    primaryAction: "Redirect home",
    indexable: false,
    notes: "App route deleted; next.config permanent redirect to /.",
  },
  {
    route: "/access",
    classification: "public",
    audience: "Public / returning customer",
    intent: "Sign-in or guest planner entry (auth gate)",
    owner: "Site",
    canonicalUrl: canonicalFor("/access"),
    primaryAction: "Sign in",
    indexable: false,
    notes: "Auth entry utility; noindex. Not an accessibility tools page.",
  },
  {
    route: "/quote-cart",
    classification: "public",
    audience: "Public visitor / buyer",
    intent: "Quote cart and list builder",
    owner: "Site",
    canonicalUrl: canonicalFor("/quote-cart"),
    primaryAction: "Submit quote request",
    indexable: false,
    notes: "Cart/utility state page; noindex.",
  },
  {
    route: "/catalog",
    classification: "redirect",
    audience: "Public visitor",
    intent: "Legacy catalog path redirected to /downloads/",
    owner: "Site",
    canonicalUrl: canonicalFor("/downloads"),
    primaryAction: "Redirect to downloads",
    indexable: false,
    notes: "Permanent 308 to /downloads/ via next.config only (no page shell).",
  },
  {
    route: "/portal",
    classification: "protected",
    audience: "Authenticated customer",
    intent: "Customer portal home",
    owner: "Site",
    canonicalUrl: canonicalFor("/portal"),
    primaryAction: "Open dashboard",
    indexable: false,
    notes: "Behind auth proxy/guard; not indexable.",
  },
  {
    route: "/portal/[id]",
    classification: "protected",
    audience: "Authenticated customer",
    intent: "Single project/plan workspace in portal",
    owner: "Site",
    canonicalUrl: canonicalFor("/portal/[id]"),
    primaryAction: "Open project",
    indexable: false,
    notes: "Behind auth proxy/guard; not indexable.",
  },
  {
    route: "/portal/guest",
    classification: "protected",
    audience: "Guest session",
    intent: "Guest portal entry",
    owner: "Site",
    canonicalUrl: canonicalFor("/portal/guest"),
    primaryAction: "Open guest workspace",
    indexable: false,
    notes: "Behind auth proxy/guard; not indexable.",
  },
  {
    route: "/portal/guest/view/[id]",
    classification: "protected",
    audience: "Guest session",
    intent: "Read-only guest view of a shared plan",
    owner: "Site",
    canonicalUrl: canonicalFor("/portal/guest/view/[id]"),
    primaryAction: "View shared plan",
    indexable: false,
    notes: "Behind auth proxy/guard; not indexable.",
  },
  {
    route: "/portal/svg-catalog",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Retired portal SVG catalog → /products",
    owner: "Site",
    canonicalUrl: canonicalFor("/products"),
    primaryAction: "Redirect to products",
    indexable: false,
    notes:
      "Phase 7 Stage B: routes deleted; next.config permanent 308 + proxy redirect to /products/ (no page shell).",
  },
  {
    route: "/portal/svg-catalog/[slug]",
    classification: "redirect",
    audience: "Public visitor / buyer",
    intent: "Retired portal SVG catalog detail → /products",
    owner: "Site",
    canonicalUrl: canonicalFor("/products"),
    primaryAction: "Redirect to products",
    indexable: false,
    notes:
      "Phase 7 Stage B: routes deleted; next.config permanent 308 + proxy redirect to /products/ (no page shell).",
  },
  {
    route: "/dashboard",
    classification: "protected",
    audience: "Authenticated customer",
    intent: "Customer dashboard",
    owner: "Site",
    canonicalUrl: canonicalFor("/dashboard"),
    primaryAction: "Open dashboard",
    indexable: false,
    notes: "Behind auth proxy/guard; not indexable.",
  },
  {
    route: "/login",
    classification: "redirect",
    audience: "Public / returning customer",
    intent: "Legacy auth alias → /access (canonical sign-in)",
    owner: "Site",
    canonicalUrl: canonicalFor("/access"),
    primaryAction: "Redirect to access",
    indexable: false,
    notes:
      "app/(site)/login/page.tsx redirects to /access?next=…; keep /login in robots disallow for bookmarks.",
  },
  {
    route: "/_not-found",
    classification: "not-found",
    audience: "Public visitor",
    intent: "Global not-found fallback",
    owner: "Site",
    canonicalUrl: canonicalFor("/_not-found"),
    primaryAction: "Return home",
    indexable: false,
    notes: "app/(site)/not-found.tsx fallback; no canonical index.",
  },
];

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

function segmentize(route: string): string[] {
  return route.split("/").filter((segment) => segment.length > 0);
}

function concretePathToSegments(path: string): string[] {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return trimmed.split("/").filter((segment) => segment.length > 0);
}

function patternMatches(pattern: string, path: string): boolean {
  const patternSegments = segmentize(pattern);
  const pathSegments = concretePathToSegments(path);
  if (patternSegments.length !== pathSegments.length) {
    return false;
  }
  for (let i = 0; i < patternSegments.length; i++) {
    if (isDynamicSegment(patternSegments[i])) {
      continue;
    }
    if (patternSegments[i] !== pathSegments[i]) {
      return false;
    }
  }
  return true;
}

/** Count static (non-dynamic) segments — higher = more specific pattern. */
function staticSegmentCount(pattern: string): number {
  return segmentize(pattern).filter((segment) => !isDynamicSegment(segment)).length;
}

/**
 * Prefer longer paths, then more static segments so
 * `/products/category/[slug]` wins over `/products/[category]/[product]`
 * for `/products/category/seating`.
 */
const SORTED_CLASSIFICATION: SiteRouteMeta[] = [...SITE_ROUTE_CLASSIFICATION].sort((a, b) => {
  const lengthDelta = segmentize(b.route).length - segmentize(a.route).length;
  if (lengthDelta !== 0) {return lengthDelta;}
  return staticSegmentCount(b.route) - staticSegmentCount(a.route);
});

export function getRouteClassification(route: string): SiteRouteMeta | undefined {
  const normalized = route.split("?")[0] ?? route;
  return SORTED_CLASSIFICATION.find((meta) => patternMatches(meta.route, normalized));
}

export const PUBLIC_INDEXABLE_ROUTES: string[] = SITE_ROUTE_CLASSIFICATION.filter(
  (meta) => meta.classification === "public" && meta.indexable,
).map((meta) => meta.route);

/** Concrete marketing paths for sitemap generation (no dynamic segments). */
export const PUBLIC_INDEXABLE_STATIC_PATHS: string[] = PUBLIC_INDEXABLE_ROUTES.filter(
  (route) => !route.includes("["),
);

/** Planner marketing routes under `(site)` — concrete sitemap paths (no dynamic segments). */
export const PLANNER_MARKETING_SITEMAP_PATHS = [
  "/planner",
  "/planner/help",
  "/planner/features",
  "/planner/features/measure",
  "/planner/features/catalog",
  "/planner/features/3d-view",
  "/planner/features/ai-assist",
  "/planner/features/export",
] as const;

/**
 * Solution category ids — single source for sitemap paths and
 * `app/(site)/solutions/[category]/page.tsx` (hard-404 unknown slugs).
 */
export const SOLUTION_CATEGORY_IDS = [
  "seating",
  "workstations",
  "tables",
  "storages",
  "soft-seating",
  "education",
] as const;

export type SolutionCategoryId = (typeof SOLUTION_CATEGORY_IDS)[number];

/** Concrete solution category paths for sitemap generation. */
export const SOLUTION_CATEGORY_SITEMAP_PATHS = SOLUTION_CATEGORY_IDS.map(
  (id) => `/solutions/${id}` as const,
);

export const ROBOTS_DISALLOW_PREFIXES = [
  "/api/",
  "/admin/",
  "/crm/",
  "/ops/",
  "/portal/",
  "/dashboard/",
  "/login/",
  "/access/",
  "/repo-store/",
  "/quote-cart/",
  "/tracking/",
  "/choose-product/",
  "/support-ivr/",
  "/offline/",
  // App shells — also noindex via metadata; robots deny is defense in depth.
  "/oostudio/",
  "/ooplanner/",
] as const;
