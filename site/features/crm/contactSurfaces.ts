const ROUTES_WITH_CONTACT_TEASER = new Set([
  "/",
  "/about",
  "/career",
  "/downloads",
  "/planning",
  "/privacy",
  "/products",
  "/clients",
  "/refund-and-return-policy",
  "/service",
  "/showrooms",
  "/solutions",
  "/sustainability",
  "/terms",
  "/trusted-by",
]);

const ROUTE_PREFIXES_WITH_DEDICATED_CONTACT_SURFACE = [
  "/products/",
] as const;

const ROUTES_SUPPRESSING_FLOATING_QUICK_CONTACT = new Set([
  "/compare",
  "/contact",
  "/downloads",
  "/planning",
  "/quote-cart",
]);

function matchesDedicatedContactPrefix(pathname: string) {
  return ROUTE_PREFIXES_WITH_DEDICATED_CONTACT_SURFACE.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

export function routeHasContactTeaser(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return ROUTES_WITH_CONTACT_TEASER.has(pathname) || matchesDedicatedContactPrefix(pathname);
}

export function routeSuppressesFloatingQuickContact(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return ROUTES_SUPPRESSING_FLOATING_QUICK_CONTACT.has(pathname);
}
