/**
 * Scan site/app pages + route classification.
 * Writes results/tooling only — live inventory is docs/architecture/routes.md.
 * Run from repo root: node scripts/generate-route-classification.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(repoRoot, "site");
const appDir = path.join(siteRoot, "app");
const classificationPath = path.join(
  siteRoot,
  "features/site/data/routeClassification.ts",
);
const nextConfigPath = path.join(repoRoot, "config/build/next.config.js");
const outPath = path.join(repoRoot, "results", "tooling", "routes-pages.generated.md");

const LEGACY_PLANNER_REDIRECTS = [
  ["/oando-planner", "/ooplanner/"],
  ["/oando-planner/canvas", "/ooplanner/"],
  ["/oando-planner/guest", "/ooplanner/"],
  ["/oando-planner/:path*", "/ooplanner/"],
  // Note: `/buddy-planner/*` removed 2026-08-07 — never existed in `config/build/next.config.js`.
];

function walk(dir, matcher, base = appDir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, matcher, base));
    else if (matcher(full)) out.push(path.relative(base, full).replace(/\\/g, "/"));
  }
  return out.sort();
}

function routeFromPage(relative) {
  const segments = relative
    .replace(/\/page\.(tsx|ts|jsx|js)$/, "")
    .split("/")
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  const url = "/" + segments.join("/");
  return url === "/" ? "/" : url.replace(/\/+/g, "/");
}

function bucket(url) {
  if (url.startsWith("/planner")) return "planner";
  if (url.startsWith("/admin")) return "admin";
  if (url.startsWith("/crm")) return "crm";
  if (url.startsWith("/ops")) return "ops";
  return "site";
}

function urlMatchesRoute(url, routePattern) {
  const urlSegs = url.split("/").filter(Boolean);
  const routeSegs = routePattern.split("/").filter(Boolean);
  if (urlSegs.length !== routeSegs.length) return false;
  return routeSegs.every((seg, i) => seg.startsWith("[") || seg === urlSegs[i]);
}

function routeToNextSource(route) {
  return route
    .replace(/\[slug\]/g, ":slug")
    .replace(/\[id\]/g, ":id")
    .replace(/\[category\]/g, ":category")
    .replace(/\[product\]/g, ":product");
}

function parseRouteClassification(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const entries = [];
  for (const block of raw.matchAll(
    /\{\s*route:\s*"([^"]+)"[\s\S]*?classification:\s*"([^"]+)"/g,
  )) {
    entries.push({ route: block[1], classification: block[2] });
  }
  return entries;
}

function parseNextConfigRedirects(configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  const map = new Map();
  for (const match of raw.matchAll(
    /source:\s*"([^"]+)"[\s\S]*?destination:\s*"([^"]+)"[\s\S]*?permanent:\s*true/g,
  )) {
    const source = match[1];
    if (source.endsWith("/") && source !== "/") continue;
    map.set(source, match[2]);
  }
  return map;
}

function wiringLabel(route, pageUrls, nextRedirects) {
  const hasPage = pageUrls.some((url) => urlMatchesRoute(url, route));
  const hasNext = nextRedirects.has(routeToNextSource(route));
  if (hasNext && hasPage) return "next.config + page stub";
  if (hasNext) return "next.config only";
  if (hasPage) return "page stub only";
  return "classified redirect";
}

function isAdminRedirectStub(url) {
  return (
    url === "/admin/svg-editor" ||
    url.startsWith("/admin/svg-editor/") ||
    url === "/admin/product-studio/parametric"
  );
}

function listLines(items) {
  return items.map(({ url, file }) => `- \`${url}\` → \`${file}\``);
}

function redirectTableRows(redirects, pageUrls, nextRedirects) {
  return redirects.map(({ route }) => {
    const destination = nextRedirects.get(routeToNextSource(route)) ?? "—";
    const wiring = wiringLabel(route, pageUrls, nextRedirects);
    return `| \`${route}\` | \`${destination}\` | ${wiring} |`;
  });
}

const pageMatcher = (f) => /[/\\]page\.(tsx|ts|jsx|js)$/.test(f);
const pages = walk(appDir, pageMatcher);
const classified = parseRouteClassification(classificationPath);
const redirectRoutes = classified.filter((r) => r.classification === "redirect");
const nextRedirects = parseNextConfigRedirects(nextConfigPath);

const redirectRoutePatterns = new Set(redirectRoutes.map((r) => r.route));
const pageUrls = pages.map(routeFromPage);

const byBucket = { planner: [], site: [], admin: [], crm: [], ops: [] };
for (const p of pages) {
  const url = routeFromPage(p);
  const entry = { url, file: `app/${p}` };
  const b = bucket(url);

  if (b === "site" && [...redirectRoutePatterns].some((r) => urlMatchesRoute(url, r))) {
    continue;
  }
  if (b === "admin" && isAdminRedirectStub(url)) {
    continue;
  }

  byBucket[b].push(entry);
}

const siteMarketingRedirects = redirectRoutes
  .filter(
    (r) =>
      !r.route.startsWith("/admin") &&
      !r.route.startsWith("/planner") &&
      !r.route.startsWith("/crm") &&
      !r.route.startsWith("/ops"),
  )
  .sort((a, b) => a.route.localeCompare(b.route));

const adminLegacyRedirects = [...nextRedirects.entries()]
  .filter(([source]) => source.startsWith("/admin"))
  .sort(([a], [b]) => a.localeCompare(b));

const lines = [
  "# Page route classification",
  "",
  "**Scope:** live `site/app/**/page.tsx` modules plus classified marketing/admin redirects.",
  "**APIs:** [`routes.md`](./routes.md) § API. Package map: [`product-map.md`](./product-map.md). Plans: [`plans/README.md`](../../plans/README.md).",
  "",
  `*Generated: ${new Date().toISOString().slice(0, 10)} — \`node scripts/generate-route-classification.mjs\` (repo root).*`,
  "",
  "Canonical planner: **`/planner/**`**. Legacy `/oando-planner/**` → planner (`config/build/next.config.js`).",
  "Redirect authority: `site/features/site/data/routeClassification.ts` + `config/build/next.config.js`.",
  "",
  "## Planner (live)",
  "",
  ...listLines(byBucket.planner),
  "",
  "## Site — live pages (`app/(site)/`)",
  "",
  ...listLines(byBucket.site),
  "",
  "## Site marketing redirects",
  "",
  "Permanent 308 sources. Not listed as live pages above.",
  "",
  "| Route | Destination | Wiring |",
  "| --- | --- | --- |",
  ...redirectTableRows(siteMarketingRedirects, pageUrls, nextRedirects),
  "",
  "## Admin / CRM / Ops (live)",
  "",
  ...listLines([...byBucket.admin, ...byBucket.crm, ...byBucket.ops]),
  "",
  "## Admin legacy redirects",
  "",
  "| Source | Destination |",
  "| --- | --- |",
  ...adminLegacyRedirects.map(([src, dest]) => `| \`${src}\` | \`${dest}\` |`),
  "",
  "## Legacy planner redirects (301)",
  "",
  ...LEGACY_PLANNER_REDIRECTS.map(([src, dest]) => `- \`${src}\` → \`${dest}\``),
  "",
  "Contract: `site/platform/route-contract.json`.",
  "",
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
