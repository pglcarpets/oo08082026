import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectPageSources as collectSourcesFromLib } from "./lib/siteUiRouteSources.mjs";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot.mjs";

const siteRoot = SITE_PACKAGE_ROOT;
const appDir = path.join(siteRoot, "app");
const outFile = path.join(REPO_ROOT, "results", "site-ui", "route-matrix.csv");

const GOLDEN_PATHS = new Set(["/", "/solutions"]);

const WORKSPACE_PATH_PREFIXES = [
  "/dashboard",
  "/portal",
  "/access",
  "/choose-product",
  "/login",
];

const CATALOG_PATH_PREFIXES = ["/catalog", "/products", "/quote-cart", "/compare"];

const LEGAL_PATH_PREFIXES = [
  "/privacy",
  "/terms",
  "/imprint",
  "/refund-and-return-policy",
  "/support-ivr",
];

function walkPageFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkPageFiles(abs, out);
    else if (entry.name === "page.tsx") out.push(abs);
  }
  return out;
}

function deriveRoutePath(filePath) {
  const rel = path.relative(appDir, filePath).replace(/\\/g, "/");
  const segments = rel.split("/").filter((segment) => segment !== "page.tsx");
  const cleaned = segments
    .filter((segment) => !segment.startsWith("(") || !segment.endsWith(")"))
    .map((segment) => (segment.startsWith("[") && segment.endsWith("]") ? segment : segment));
  return `/${cleaned.join("/")}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function deriveLayoutRoot(filePath) {
  const rel = path.relative(appDir, filePath).replace(/\\/g, "/");
  if (rel.startsWith("(site)/")) return "site";
  if (rel.startsWith("planner/(marketing)/")) return "planner";
  if (rel.startsWith("offline/")) return "offline";
  if (rel.startsWith("planner/")) return "planner";
  return "other";
}

function shouldIncludeRoute(filePath) {
  const layoutRoot = deriveLayoutRoot(filePath);
  return layoutRoot === "site" || layoutRoot === "planner" || layoutRoot === "offline";
}

function countMatches(source, pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function detectCopySource(source) {
  const hasHomepage = /@\/lib\/site-data\/homepage/.test(source);
  const hasRouteCopy = /@\/lib\/site-data\/routeCopy/.test(source);
  const hasInlineCopy =
    /const\s+[A-Z][A-Z0-9_]*\s*=\s*\[/.test(source) ||
    /const\s+[A-Z][A-Z0-9_]*\s*:\s*Record</.test(source);

  if (hasHomepage && !hasRouteCopy) return "homepage.ts";
  if (hasRouteCopy && !hasHomepage) return "routeCopy.ts";
  if (hasHomepage && hasRouteCopy) return "mixed";
  if (hasInlineCopy) return "inline";
  return "inline";
}

function detectSignals(routePath, layoutRoot, source) {
  // permanentRedirect() and redirect() both count as redirect-only shells.
  const redirectCallMatch = source.match(/\b(?:permanentRedirect|redirect)\s*\(/);
  const isRedirect =
    Boolean(redirectCallMatch) &&
    !/<[A-Z]/.test(source.slice(0, redirectCallMatch.index).slice(-80));
  const featureDelegated = /@\/features\//.test(source) && countMatches(source, /home-section--/g) === 0;

  const hasMarketingLayout = /<HomeMarketingLayout\b/.test(source);
  const hasCatalogLayout = /<HomeCatalogLayout\b/.test(source);

  const overflowWrapper =
    /className="[^"]*overflow-x-hidden/.test(source) || hasMarketingLayout || hasCatalogLayout;
  const schemePageWrapper =
    /className="[^"]*scheme-page/.test(source) && !hasMarketingLayout && !hasCatalogLayout;

  const homepageHero = /<HomepageHero\b/.test(source);
  const hero = /<Hero\b/.test(source);

  const homeSectionCount = countMatches(source, /home-section--/g);
  const shellCardCount = countMatches(source, /shell-card/g);
  const homeShellCount = countMatches(source, /home-shell-xl/g);
  const containerCount = countMatches(source, /className="container px-6/g);

  const homepageComponents =
    routePath === "/" || (countMatches(source, /@\/components\/home\//g) >= 3 && homeSectionCount === 0);

  let wrapper = "other";
  if (overflowWrapper) wrapper = "overflow-x-hidden";
  else if (schemePageWrapper) wrapper = "scheme-page";

  let heroKind = "none";
  if (homepageHero) heroKind = "HomepageHero";
  else if (hero) heroKind = "Hero";

  const isLegalRoute =
    LEGAL_PATH_PREFIXES.some(
      (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
    ) || /legal-cookie-table|legal-aside-divider/.test(source);

  let sections = "other";
  if (homepageComponents && homeSectionCount === 0) sections = "homepage-components";
  else if (homeSectionCount > 0 && shellCardCount === 0) sections = "home-section--*";
  else if (homeSectionCount > 0 && shellCardCount > 0) sections = "mixed";
  else if (isLegalRoute && shellCardCount > 0) sections = "shell-card";
  else if (shellCardCount >= 3 && homeSectionCount === 0) sections = "shell-card";
  else if (shellCardCount > 0 || /scheme-panel|scheme-section-soft/.test(source)) sections = "mixed";

  let container = "other";
  if (homeShellCount > 0) container = "home-shell-xl";
  else if (/contact-shell/.test(source)) container = "contact-shell";
  else if (/shell-container/.test(source)) container = "shell-container";
  else if (containerCount > 0) container = "container px-6";

  const isWorkspace =
    WORKSPACE_PATH_PREFIXES.some(
      (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
    ) || /DashboardClient|AccessForm/.test(source);

  const isCatalog = CATALOG_PATH_PREFIXES.some(
    (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
  );

  let dialect = "other";
  if (routePath === "/") dialect = "homepage";
  else if (layoutRoot === "offline") dialect = "offline";
  else if (
    isRedirect &&
    !/<[A-Z][A-Za-z]+/.test(
      source.replace(/(?:permanentRedirect|redirect)\s*\([^)]*\)/g, ""),
    )
  ) {
    dialect = "redirect";
  } else if (featureDelegated && layoutRoot === "planner") dialect = "feature-delegated";
  else if (isWorkspace) dialect = "workspace";
  else if (isCatalog) dialect = "catalog-product";
  else if (hasMarketingLayout || hasCatalogLayout) {
    if (routePath === "/") dialect = "homepage";
    else if (isCatalog) dialect = "catalog-product";
    else dialect = "solutions-like";
    if (homeSectionCount > 0 || hasMarketingLayout) {
      sections = homeSectionCount > 0 ? "home-section--*" : sections;
    }
    if (homeShellCount > 0) container = "home-shell-xl";
  } else if (
    wrapper === "overflow-x-hidden" &&
    homeSectionCount > 0 &&
    homeShellCount > 0
  ) {
    dialect = "solutions-like";
    if (sections === "mixed") sections = "home-section--*";
  } else if (wrapper === "scheme-page" && sections === "shell-card") dialect = "legal-shell";
  else if (wrapper === "scheme-page") dialect = "scheme-page";
  else if (wrapper === "overflow-x-hidden") dialect = "mixed";

  const homepageFidelity = scoreFidelity({
    routePath,
    dialect,
    wrapper,
    heroKind,
    sections,
    container,
  });

  const homepageGap = describeGap({
    routePath,
    dialect,
    wrapper,
    heroKind,
    sections,
    container,
  });

  return {
    path: routePath,
    homepage_gap: homepageGap,
    homepage_fidelity: homepageFidelity,
    dialect,
    wrapper,
    hero: heroKind,
    sections,
    container,
    copy_source: detectCopySource(source),
    layout_root: layoutRoot,
  };
}

function scoreFidelity({ routePath, dialect, wrapper, heroKind, sections, container }) {
  if (routePath === "/") return 5;
  if (dialect === "solutions-like") return 5;
  if (dialect === "redirect" || dialect === "offline" || dialect === "workspace") return 0;
  if (dialect === "feature-delegated" || dialect === "catalog-product") return 1;

  let score = 0;
  if (wrapper === "overflow-x-hidden") score += 1;
  if (heroKind === "Hero" || heroKind === "HomepageHero") score += 1;
  if (sections === "home-section--*" || sections === "homepage-components") score += 1;
  if (container === "home-shell-xl") score += 1;
  if (dialect === "homepage" || dialect === "solutions-like") score += 1;

  if (dialect === "legal-shell") return Math.min(score, 1);
  if (dialect === "scheme-page") return Math.min(score, 2);
  return Math.min(score, 4);
}

function describeGap({ routePath, dialect, wrapper, heroKind, sections, container }) {
  if (GOLDEN_PATHS.has(routePath)) {
    return routePath === "/" ? "golden homepage reference" : "golden inner-page reference (Hero + home-section--*)";
  }
  if (dialect === "solutions-like" || dialect === "homepage") return "matches target";
  if (dialect === "redirect") return "redirect-only route; no marketing shell";
  if (dialect === "offline") return "offline error shell; out of marketing scope";
  if (dialect === "workspace" || dialect === "catalog-product") {
    return "workspace/catalog lane; not homepage marketing";
  }
  if (dialect === "feature-delegated") return "delegates to feature module layout";

  const gaps = [];
  if (wrapper !== "overflow-x-hidden") gaps.push(`wrapper=${wrapper}`);
  if (heroKind === "none") gaps.push("missing Hero");
  if (sections !== "home-section--*") gaps.push(`sections=${sections}`);
  if (container !== "home-shell-xl") gaps.push(`container=${container}`);
  return gaps.length ? gaps.join("; ") : "minor drift";
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildRows() {
  const pageFiles = walkPageFiles(appDir).filter(shouldIncludeRoute);
  const byPath = new Map();

  for (const pagePath of pageFiles) {
    const routePath = deriveRoutePath(pagePath);
    const layoutRoot = deriveLayoutRoot(pagePath);
    const source = collectSourcesFromLib(siteRoot, pagePath);
    const existing = byPath.get(routePath);
    if (existing) {
      existing.source = `${existing.source}\n${source}`;
      if (pagePath.includes("(marketing)/")) existing.layoutRoot = layoutRoot;
    } else {
      byPath.set(routePath, { routePath, layoutRoot, source, pagePath });
    }
  }

  return [...byPath.values()]
    .sort((left, right) => left.routePath.localeCompare(right.routePath))
    .map(({ routePath, layoutRoot, source }) => detectSignals(routePath, layoutRoot, source));
}

function renderCsv(rows) {
  const columns = [
    "path",
    "homepage_gap",
    "homepage_fidelity",
    "dialect",
    "wrapper",
    "hero",
    "sections",
    "container",
    "copy_source",
    "layout_root",
  ];
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function summarize(rows) {
  const siteRows = rows.filter((row) => row.layout_root === "site");
  const legalShell = siteRows.filter((row) => row.dialect === "legal-shell").length;
  const schemePage = siteRows.filter((row) => row.dialect === "scheme-page").length;
  const solutionsLike = siteRows.filter((row) => row.dialect === "solutions-like").length;
  const golden = rows.filter((row) => GOLDEN_PATHS.has(row.path));

  return {
    total: rows.length,
    site: siteRows.length,
    legalShell,
    schemePage,
    migrationBacklog: legalShell + schemePage,
    solutionsLike,
    golden: golden.map((row) => row.path),
  };
}

function main() {
  const rows = buildRows();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, renderCsv(rows), "utf8");

  const summary = summarize(rows);
  console.log(`Wrote ${path.relative(siteRoot, outFile)} (${rows.length} routes)`);
  console.log(
    `(site) routes: ${summary.site}; solutions-like: ${summary.solutionsLike}; legal-shell: ${summary.legalShell}; scheme-page: ${summary.schemePage}; migration backlog: ${summary.migrationBacklog}`,
  );
  console.log(`Golden rows: ${summary.golden.join(", ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
