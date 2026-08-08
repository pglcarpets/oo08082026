/**
 * Find scripts that reference missing packages, feature dirs, dead routes,
 * or other archive-class patterns. Also scans repo-root scripts/.
 *
 * Usage: node scripts/AsNeeded/_audit-stale-scripts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve monorepo root from scripts/AsNeeded/ (two hops up).
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const siteRoot = path.join(monorepoRoot, "site");
const repoRoot = monorepoRoot;
const scriptsDir = path.join(siteRoot, "scripts");
const rootScriptsDir = path.join(repoRoot, "scripts");
// Root workspace package owns deps (site/ may not have its own package.json).
const pkgPath = fs.existsSync(path.join(siteRoot, "package.json"))
  ? path.join(siteRoot, "package.json")
  : path.join(monorepoRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

function walk(dir, pred, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "__goldens__", "_fixtures"].includes(entry.name)) continue;
      walk(abs, pred, out);
    } else if (pred(entry.name)) out.push(abs);
  }
  return out;
}

function walkPages(appDir) {
  const routes = new Set();
  function walkInner(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walkInner(abs);
      else if (entry.name === "page.tsx") {
        const rel = path.relative(appDir, abs).replace(/\\/g, "/");
        const segs = rel
          .split("/")
          .filter((s) => s !== "page.tsx" && !(s.startsWith("(") && s.endsWith(")")));
        let route = `/${segs.join("/")}`.replace(/\/+/g, "/") || "/";
        if (route.length > 1 && route.endsWith("/")) route = route.slice(0, -1);
        routes.add(route || "/");
      }
    }
  }
  walkInner(appDir);
  return routes;
}

const routes = walkPages(path.join(siteRoot, "app"));
const routeExists = (r) => routes.has(r);

const featureChecks = {
  "features/planner/tldraw": fs.existsSync(path.join(siteRoot, "features/planner/tldraw")),
  "features/planner/workspace": fs.existsSync(path.join(siteRoot, "features/planner/workspace")),
  "features/buddy-planner": fs.existsSync(path.join(siteRoot, "features/buddy-planner")),
  "features/oando-planner": fs.existsSync(path.join(siteRoot, "features/oando-planner")),
  "features/ops-portal": fs.existsSync(path.join(siteRoot, "features/ops-portal")),
  "lib/configurator": fs.existsSync(path.join(siteRoot, "lib/configurator")),
  "public/tldraw-assets": fs.existsSync(path.join(siteRoot, "public/tldraw-assets")),
  "inventory/descriptors": fs.existsSync(path.join(siteRoot, "inventory", "descriptors")),
  "lib/db.ts": fs.existsSync(path.join(siteRoot, "lib/db.ts")),
};

const packageChecks = {
  tldraw: Boolean(deps.tldraw || deps["@tldraw/tldraw"]),
  konva: Boolean(deps.konva || deps["react-konva"]),
  "nova-act": Boolean(deps["nova-act"]),
  fabric: Boolean(deps.fabric),
  three: Boolean(deps.three),
  "@playwright/test": Boolean(deps["@playwright/test"]),
  "ts-morph": Boolean(deps["ts-morph"]),
};

const scriptPred = (name) =>
  /\.(mjs|js|ts|cjs|py|ps1)$/.test(name) &&
  !name.startsWith("_audit") &&
  !name.startsWith("_tmp");

const siteScriptFiles = walk(scriptsDir, scriptPred);
const rootScriptFiles = walk(rootScriptsDir, scriptPred);

/** Routes that must not be treated as live product pages (redirects only). */
const hardDeadRoutes = [
  "/configurator/guest",
  "/buddy-planner",
  "/buddy-planner/editor",
  "/buddy-planner/guest",
];

/** Doc/redirect tables may still mention these intentionally. */
const intentionalLegacyRouteScripts = new Set([
  "scripts/generate-route-classification.mjs",
  "../scripts/generate-route-classification.mjs",
]);

/** @type {Array<{file:string, class:string, issues:string[]}>} */
const findings = [];

/**
 * @param {string} abs
 * @param {"site"|"root"} scope
 */
function auditFile(abs, scope) {
  const relFromSite =
    scope === "site"
      ? path.relative(siteRoot, abs).replace(/\\/g, "/")
      : `../scripts/${path.basename(abs)}`;
  const relKey = scope === "site" ? relFromSite : `repo-scripts/${path.basename(abs)}`;
  const text = fs.readFileSync(abs, "utf8");
  const issues = [];
  let cls = "KEEP";

  // Package imports (real imports only — not prose)
  if (
    /from\s+['"]tldraw['"]|from\s+['"]@tldraw\/|require\(['"]tldraw|require\(['"]@tldraw/.test(
      text,
    ) &&
    !packageChecks.tldraw
  ) {
    issues.push("imports tldraw package (not in package.json)");
    cls = "ARCHIVE";
  }
  if (
    /from\s+['"]nova_act['"]|require\(['"]nova-act['"]\)|from\s+['"]nova-act['"]/.test(text) &&
    !packageChecks["nova-act"]
  ) {
    issues.push("imports nova-act (not in package.json)");
    cls = "ARCHIVE";
  }
  if (
    /from\s+['"]konva['"]|from\s+['"]react-konva['"]|require\(['"]konva['"]\)/.test(text) &&
    !packageChecks.konva
  ) {
    issues.push("imports konva (not in package.json)");
    cls = "ARCHIVE";
  }

  // Feature paths that no longer exist (code paths, not historical migration maps alone)
  if (
    /features\/planner\/tldraw\//.test(text) &&
    !featureChecks["features/planner/tldraw"]
  ) {
    issues.push("references features/planner/tldraw/ (missing)");
    if (cls !== "ARCHIVE") cls = "FIX";
  }
  if (
    /features\/buddy-planner\//.test(text) &&
    !featureChecks["features/buddy-planner"]
  ) {
    issues.push("references features/buddy-planner/ (missing)");
    if (cls !== "ARCHIVE") cls = "FIX";
  }
  if (
    /features\/oando-planner\//.test(text) &&
    !featureChecks["features/oando-planner"]
  ) {
    issues.push("references features/oando-planner/ (missing)");
    if (cls !== "ARCHIVE") cls = "FIX";
  }
  if (/features\/ops-portal\//.test(text) && !featureChecks["features/ops-portal"]) {
    issues.push("references features/ops-portal/ (missing)");
    if (cls !== "ARCHIVE") cls = "FIX";
  }

  // lib/configurator tree vs catalog path (avoid false positive on lib/catalog/configurator*)
  if (
    /@\/lib\/configurator\/|["']lib\/configurator\//.test(text) &&
    !featureChecks["lib/configurator"]
  ) {
    issues.push("references lib/configurator/ tree (missing)");
    if (cls !== "ARCHIVE") cls = "FIX";
  }

  // Required public tldraw-assets (not mere comments)
  if (
    /["']tldraw-assets\//.test(text) &&
    !featureChecks["public/tldraw-assets"]
  ) {
    issues.push("requires public/tldraw-assets path (missing)");
    if (cls !== "ARCHIVE") cls = "FIX";
  }

  // Dead product routes (skip intentional redirect docs)
  if (!intentionalLegacyRouteScripts.has(relFromSite)) {
    for (const r of hardDeadRoutes) {
      // only flag string literals that look like navigation targets
      const re = new RegExp(`["'\`]${r.replace(/\//g, "\\/")}["'\`]`);
      if (re.test(text) && !routeExists(r)) {
        issues.push(`hardcodes dead route ${r}`);
        if (cls !== "ARCHIVE") cls = "FIX";
      }
    }
  }

  // Dangerous / dead one-shots
  if (/expect\(page\)\.toBeDefined\(\)/.test(text) && /tests\/e2e/.test(text)) {
    issues.push("injects hollow expect(page).toBeDefined into e2e");
    cls = "ARCHIVE";
  }
  if (/lib\/db\.ts/.test(text) && !featureChecks["lib/db.ts"]) {
    issues.push("references lib/db.ts (missing; use platform/drizzle)");
    cls = "ARCHIVE";
  }
  if (/scrapeAfc|afcindia/i.test(text)) {
    issues.push("competitor scrape risk");
    cls = "ARCHIVE";
  }
  if (/e-Goodsites-oando-consolidated|D:\\\\worktrees|D:\\worktrees|D:\\\\OOFPLWeb|D:\\OOFPLWeb/.test(text)) {
    issues.push("hardcoded obsolete machine/project path");
    cls = "ARCHIVE";
  }

  if (issues.length) findings.push({ file: relKey, class: cls, issues: [...new Set(issues)] });
}

for (const abs of siteScriptFiles) auditFile(abs, "site");
for (const abs of rootScriptFiles) auditFile(abs, "root");

// package.json scripts pointing at missing files
const brokenNpm = [];
for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
  if (name.startsWith("//")) continue;
  for (const m of String(cmd).matchAll(/(?:node|tsx|npx tsx|python|pwsh[^\s]* -File)\s+(scripts\/[^\s"']+)/gi)) {
    const rel = m[1].replace(/\\/g, "/");
    // Scripts live at monorepo root; site/ may also host a scripts/ tree.
    if (
      !fs.existsSync(path.join(repoRoot, rel)) &&
      !fs.existsSync(path.join(siteRoot, rel))
    ) {
      brokenNpm.push({ name, rel });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  packages: packageChecks,
  featureDirs: featureChecks,
  samplePlannerRoutes: [...routes].filter((r) => r.includes("planner")).sort(),
  hardRoutesMissing: hardDeadRoutes.filter((r) => !routeExists(r)),
  findings,
  brokenNpmScripts: brokenNpm,
  summary: {
    siteScriptsScanned: siteScriptFiles.length,
    rootScriptsScanned: rootScriptFiles.length,
    scriptsWithIssues: findings.length,
    byClass: {
      ARCHIVE: findings.filter((f) => f.class === "ARCHIVE").length,
      FIX: findings.filter((f) => f.class === "FIX").length,
      KEEP: findings.filter((f) => f.class === "KEEP").length,
    },
  },
};

const outDir = path.join(repoRoot, "results", "site", "scripts-audit");
fs.mkdirSync(outDir, { recursive: true });
const outJson = path.join(outDir, "stale-scripts-audit.json");
const outMd = path.join(outDir, "STALE-SCRIPTS.md");
fs.writeFileSync(outJson, JSON.stringify(report, null, 2), "utf8");

const md = [
  "# Stale scripts audit",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Packages present?",
  "",
  ...Object.entries(packageChecks).map(([k, v]) => `- **${k}**: ${v ? "yes" : "**NO**"}`),
  "",
  "## Feature dirs present?",
  "",
  ...Object.entries(featureChecks).map(([k, v]) => `- **${k}**: ${v ? "yes" : "**MISSING**"}`),
  "",
  "## Dead hard-coded routes (no page.tsx)",
  "",
  ...report.hardRoutesMissing.map((r) => `- \`${r}\``),
  "",
  `## Scripts with issues (${findings.length} / site ${siteScriptFiles.length} + root ${rootScriptFiles.length})`,
  "",
  ...findings.flatMap((f) => [
    `### \`${f.file}\` — **${f.class}**`,
    ...f.issues.map((i) => `- ${i}`),
    "",
  ]),
  "## Broken package.json script targets",
  "",
  ...(brokenNpm.length
    ? brokenNpm.map((b) => `- \`${b.name}\` → missing \`${b.rel}\``)
    : ["- (none)"]),
  "",
  "## Notes",
  "",
  "- Fabric canvas-audit / debug-* scripts stay valid when **fabric** package is present.",
  "- `generate-route-classification.mjs` may list legacy redirects on purpose (not flagged).",
  "- Prefer **archive** over delete per AGENTS.md.",
  "- Sweep report: `results/site/scripts-audit/SCRIPTS-SWEEP-2026-07-09.md`",
  "",
].join("\n");

fs.writeFileSync(outMd, md, "utf8");
console.log(md);
console.log("\nWrote", outMd);
