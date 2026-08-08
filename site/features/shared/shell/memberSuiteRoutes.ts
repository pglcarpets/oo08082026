import { PRODUCT_SUITE } from "@/features/site/data/productSuite";

/** Canonical member-suite paths — route contract aliases where applicable. */
export const MEMBER_SUITE_ROUTES = {
  dashboard: PRODUCT_SUITE.shared.routes.dashboard,
  chooseProduct: PRODUCT_SUITE.shared.routes.chooser,
  portal: PRODUCT_SUITE.planner.routes.portal,
  plannerCanvas: PRODUCT_SUITE.planner.routes.canvas,
} as const;

export type MemberSuiteNavLink = {
  label: string;
  href: string;
  isActive: (pathname: string | null) => boolean;
};

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

function pathMatchesPrefix(pathname: string | null, prefix: string): boolean {
  if (!pathname) {
    return false;
  }
  const normalized = normalizePath(pathname);
  const base = normalizePath(prefix);
  return normalized === base || normalized.startsWith(`${base}/`);
}

/** Legacy dashboard alias retained for bookmarks and redirects. */
export function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname || isPortalRoute(pathname)) {
    return false;
  }
  return (
    pathMatchesPrefix(pathname, MEMBER_SUITE_ROUTES.dashboard) ||
    pathname === "/oando-planner/dashboard" ||
    pathname === "/oando-planner/dashboard/"
  );
}

export function isPortalRoute(pathname: string | null): boolean {
  return pathMatchesPrefix(pathname, MEMBER_SUITE_ROUTES.portal);
}

export function isChooseProductRoute(pathname: string | null): boolean {
  return pathMatchesPrefix(pathname, MEMBER_SUITE_ROUTES.chooseProduct);
}

/** Canvas alias, live /ooplanner app, and project deep links. */
export function isPlannerRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return (
    pathMatchesPrefix(pathname, MEMBER_SUITE_ROUTES.plannerCanvas) ||
    pathMatchesPrefix(pathname, "/ooplanner") ||
    pathMatchesPrefix(pathname, "/planner/canvas") ||
    pathMatchesPrefix(pathname, "/planner/guest") ||
    pathMatchesPrefix(pathname, "/planner/projects") ||
    pathMatchesPrefix(pathname, "/oando-planner/canvas")
  );
}

export function memberSuitePlannerProjectHref(planId: string): string {
  return `/planner/projects/${encodeURIComponent(planId)}`;
}

export function getMemberSuiteNavLinks(): readonly MemberSuiteNavLink[] {
  return [
    {
      label: "Dashboard",
      href: MEMBER_SUITE_ROUTES.dashboard,
      isActive: isDashboardRoute,
    },
    {
      label: "Choose Product",
      href: MEMBER_SUITE_ROUTES.chooseProduct,
      isActive: isChooseProductRoute,
    },
    {
      label: "Portal",
      href: MEMBER_SUITE_ROUTES.portal,
      isActive: isPortalRoute,
    },
    {
      label: "Planner",
      href: MEMBER_SUITE_ROUTES.plannerCanvas,
      isActive: isPlannerRoute,
    },
  ] as const;
}
