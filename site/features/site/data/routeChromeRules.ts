export type RouteChromeHeaderMode = "full" | "hidden";
export type RouteChromeFooterMode = "full" | "login-tools" | "hidden";

export interface RouteChromeMode {
  header: RouteChromeHeaderMode;
  footer: RouteChromeFooterMode;
}

function splitPathAndSearch(input: string | null): { pathname: string | null; search: string } {
  if (!input) {return { pathname: null, search: "" };}
  const queryIndex = input.indexOf("?");
  if (queryIndex === -1) {return { pathname: input, search: "" };}
  return { pathname: input.slice(0, queryIndex), search: input.slice(queryIndex + 1) };
}


function matchesPrefix(pathname: string | null, prefix: string): boolean {
  if (!pathname) {return false;}
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function matchesAnyPrefix(pathname: string | null, prefixes: string[]): boolean {
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

const LOGIN_PREFIXES = [
  "/login",
];

const CAD_PREFIXES = [
  "/ooplanner",
  "/planner/canvas",
  "/planner/guest",
  "/planner/open3d",
  "/planners",
];

/**
 * App shells without marketing chrome (no site header/footer).
 * Guest chooser `/choose-product` is NOT here — it is a pre-planner marketing
 * step and must show toolbar + footer.
 */
const WORKSPACE_PREFIXES = [
  "/access",
  "/dashboard",
  "/portal",
  "/admin",
];

function isCadRoute(pathname: string | null): boolean {
  if (!pathname) {return false;}
  return matchesAnyPrefix(pathname, CAD_PREFIXES);
}

function isLoginPath(pathname: string | null): boolean {
  return matchesAnyPrefix(pathname, LOGIN_PREFIXES);
}

function loginHasNextParam(search: string): boolean {
  if (!search) {return false;}
  return new URLSearchParams(search).has("next");
}

function isWorkspaceRoute(pathname: string | null): boolean {
  if (!pathname) {return false;}
  return matchesAnyPrefix(pathname, WORKSPACE_PREFIXES);
}

export function resolveRouteChromeMode(pathInput: string | null): RouteChromeMode {
  const { pathname, search } = splitPathAndSearch(pathInput);

  if (isLoginPath(pathname)) {
    if (loginHasNextParam(search)) {
      return { header: "full", footer: "login-tools" };
    }
    return { header: "hidden", footer: "login-tools" };
  }

  if (isCadRoute(pathname) || isWorkspaceRoute(pathname)) {
    return { header: "hidden", footer: "hidden" };
  }

  return { header: "full", footer: "full" };
}
