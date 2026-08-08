#!/usr/bin/env node
/**
 * Generates results/app-pages-inventory.csv with layer-wise path columns
 * and grouped dependencies.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORKSPACE_ROOT = path.resolve(ROOT, "..");
const APP = path.join(ROOT, "app");
const OUT = path.join(WORKSPACE_ROOT, "results", "app-pages-inventory.csv");
const OUT_TMP = path.join(WORKSPACE_ROOT, "results", "app-pages-inventory.generated.csv");
const LAYER_COUNT = 6;

const SEGMENTS = new Set(["admin", "api", "crm", "offline", "planner"]);

const EXCLUDED_PAGE_FILES = new Set([
  "app/(site)/download-brochure/page.tsx",
]);

/** @type {Map<string, string>} */
const priorSummary = new Map();
if (fs.existsSync(OUT)) {
  const lines = fs.readFileSync(OUT, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const fileIdx = headers.indexOf("file");
  const summaryIdx =
    headers.indexOf("summary") >= 0
      ? headers.indexOf("summary")
      : headers.indexOf("how_it_works");
  if (fileIdx >= 0 && summaryIdx >= 0) {
    for (const line of lines.slice(1)) {
      const cols = parseCsvLine(line);
      if (cols[fileIdx] && cols[summaryIdx]) {
        priorSummary.set(cols[fileIdx], cols[summaryIdx]);
      }
    }
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function walk(dir, matcher, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, matcher, acc);
    else if (matcher(name.name)) acc.push(full);
  }
  return acc;
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function relApp(p) {
  return toPosix(path.relative(ROOT, p));
}

function csvEscape(s) {
  const v = String(s ?? "");
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function fileArea(filePath) {
  const top = relApp(filePath).split("/")[1];
  if (top === "(site)") return "site";
  if (SEGMENTS.has(top)) return top;
  if (top === "ops") return "ops";
  return top;
}

function routeFromPage(filePath) {
  let seg = relApp(filePath).replace(/^app\//, "");
  seg = seg.replace(/\/page\.tsx$/, "");
  seg = seg.replace(/\([^)]+\)\//g, "").replace(/\([^)]+\)$/, "");
  if (!seg) return "/";
  return ("/" + seg.replace(/\[([^\]]+)\]/g, "[$1]")).replace(/\/+$/, "") || "/";
}

function routeFromApi(filePath) {
  return "/" + relApp(filePath).replace(/^app\//, "").replace(/\/route\.ts$/, "");
}

function pathLayers(relFile) {
  const parts = relFile.split("/");
  const root = parts[0] || "app";
  const file = parts[parts.length - 1] || "";
  const folders = parts.slice(1, -1);
  const layers = Array.from({ length: LAYER_COUNT }, (_, i) => folders[i] || "");
  return { root, layers, file, depth: folders.length };
}

function kindFromFile(filePath) {
  const base = path.basename(filePath);
  if (base === "page.tsx") return "page";
  if (base === "layout.tsx") return "layout";
  if (base.endsWith("route.ts")) return "api";
  return "component";
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function extractDependencies(content, kind) {
  const groups = {
    features: new Set(),
    components: new Set(),
    lib: new Set(),
    data: new Set(),
    platform: new Set(),
    css: new Set(),
    local: new Set(),
    next: new Set(),
  };
  const runtime = new Set();

  for (const m of content.matchAll(/^import\s+(?:type\s+)?(?:[\w*{}\s,]+)\s+from\s+['"]([^'"]+)['"]/gm)) {
    const imp = m[1];
    if (imp.startsWith("@/features/")) groups.features.add(imp.slice("@/features/".length));
    else if (imp.startsWith("@/components/")) groups.components.add(imp.slice("@/components/".length));
    else if (imp.startsWith("@/lib/")) groups.lib.add(imp.slice("@/lib/".length));
    else if (imp.startsWith("@/features/site/data/")) groups.data.add(imp.slice("@/features/site/data/".length));
    else if (imp.startsWith("@/platform/")) groups.platform.add(imp.slice("@/platform/".length));
    else if (imp.startsWith("@/app/css/")) groups.css.add(imp.slice("@/app/css/".length));
    else if (imp.startsWith("@/")) groups.lib.add(imp.slice(2));
    else if (imp === "next/navigation" || imp.startsWith("next/")) groups.next.add(imp);
    else if (imp.startsWith(".")) groups.local.add(imp);
  }

  const runtimePatterns = [
    ["getBusinessStats", "CRM stats API"],
    ["getCatalog", "Supabase catalog"],
    ["getProducts", "product catalog"],
    ["getProductByUrlKey", "product lookup"],
    ["supabase", "Supabase client"],
    ["requireAuthUser", "auth required"],
    ["requireAdminUser", "admin auth"],
    ["getOptionalUser", "optional auth"],
    ["getOptionalPlannerUser", "planner session"],
    ["loadPlannerDocumentFromStore", "planner DB read"],
    ["listPlannerDocumentsFromStore", "planner DB list"],
    ["savePlannerDocumentToStore", "planner DB write"],
    ["redirect(", "next redirect"],
    ["notFound(", "404"],
    ["generateStaticParams", "SSG paths"],
    ["withAuth", "API auth middleware"],
    ["validateCsrfRequest", "CSRF check"],
    ["rateLimit", "rate limiting"],
    ["useQuoteCart", "quote cart store"],
    ["browserApiFetch", "browser API client"],
    ["loadResultsSnapshot", "filesystem results"],
    ["fs.readdir", "filesystem read"],
    ["OpenAI", "OpenAI API"],
  ];
  for (const [pat, label] of runtimePatterns) {
    if (content.includes(pat)) runtime.add(label);
  }

  const lines = [];
  const pushGroup = (label, set) => {
    if (set.size) lines.push(`${label}: ${[...set].sort().join("; ")}`);
  };
  pushGroup("features", groups.features);
  pushGroup("components", groups.components);
  pushGroup("lib", groups.lib);
  pushGroup("data", groups.data);
  pushGroup("platform", groups.platform);
  pushGroup("css", groups.css);
  pushGroup("local", groups.local);
  pushGroup("next", groups.next);
  if (runtime.size) lines.push(`runtime: ${[...runtime].sort().join("; ")}`);
  if (kind === "api") {
    const methods = detectMethods(content);
    if (methods !== "—") lines.unshift(`http: ${methods}`);
  }
  return lines.join(" | ") || "—";
}

function detectMethods(content) {
  const methods = new Set();
  for (const m of content.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)) {
    methods.add(m[1]);
  }
  for (const m of content.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)/g)) {
    methods.add(m[1]);
  }
  return [...methods].sort().join("|") || "—";
}

function detectRender(content, kind) {
  if (kind === "api") return "route-handler";
  if (content.includes('"use client"')) return "client";
  return "server";
}

function detectAuth(content, area, kind) {
  if (kind === "api") {
    if (/role:\s*["']admin["']/.test(content) || /requireAdmin/.test(content)) return "admin";
    if (/withAuth/.test(content) && /guest/.test(content)) return "guest (rate-limited)";
    if (/withAuth/.test(content)) return "authenticated";
    if (/validateCsrfRequest/.test(content)) return "csrf + session";
    if (/rateLimit/.test(content)) return "public (rate-limited)";
    return "public";
  }
  if (content.includes("requireAdminUser")) return "required (admin)";
  if (content.includes('requireAuthUser') && content.includes('"crm"')) return "required (crm)";
  if (content.includes("requireAuthUser")) return "required";
  if (content.includes("getOptionalPlannerUser") || content.includes("guestMode")) return "optional (guest)";
  if (content.includes("redirect(") && content.includes("/access")) return "redirect to access";
  if (area === "admin") return "admin (layout)";
  return "public";
}

function detectCaching(content, kind) {
  if (content.includes('dynamic = "force-dynamic"') || content.includes("force-dynamic")) {
    return "force-dynamic";
  }
  if (content.includes("generateStaticParams")) return "SSG";
  if (kind === "api") return "dynamic";
  return "static";
}

function detectUiEntry(content, kind, filePath) {
  if (kind === "layout") return "layout shell";
  if (kind === "api") return detectMethods(content);
  const base = path.basename(filePath, ".tsx");
  if (kind === "component") return base;
  const m =
    content.match(/return <(\w+)/) ||
    content.match(/<(\w+PageView|\w+View|\w+Page|\w+Route)/);
  return m?.[1] || "inline JSX";
}

function summarize(rel, kind, content, route) {
  if (priorSummary.has(rel)) return priorSummary.get(rel);

  const manual = MANUAL[rel] || MANUAL[route];
  if (manual) return manual;

  if (content.includes("redirect(")) return "Redirects immediately; no primary UI.";
  if (content.includes("export { default }")) return "Re-exports another route module.";
  if (kind === "layout") return "Wraps child routes with shared providers, chrome, or auth.";
  if (kind === "api") return "HTTP handler; see route.ts for request/response contract.";
  return "See source for full behavior.";
}

const MANUAL = {
  "app/admin/layout.tsx":
    "Admin shell: requireAdminUser → CsrfBootstrap → AdminLayoutShell → children.",
  "app/crm/layout.tsx":
    "CRM html/body root: fonts, RouteChrome header/footer, QueryProvider, CsrfBootstrap.",
  "app/offline/layout.tsx": "Minimal html/body for PWA offline route.",
  "app/offline/ReloadButton.tsx": "Client reload button for offline recovery.",
  "app/planner/layout.tsx":
    "Planner root: i18n, ThemeProvider, QueryProvider, PWA, CsrfBootstrap, PlannerErrorBoundary.",
  "app/planner/(workspace)/layout.tsx":
    "Workspace layer: workspace.css, noindex, passthrough children.",
  "app/admin/themes/ThemeEditor.tsx":
    "Admin theme editor: Supabase block_themes + publish to /api/admin/themes/publish.",
  "app/ops/layout.tsx":
    "Ops html/body root: fonts, RouteChrome header/footer, QueryProvider, CsrfBootstrap.",
  "app/admin/inventory/page.tsx":
    "Admin route inventory. Server-reads results/app-pages-inventory.csv into AdminInventoryPageView.",
};

// Collect files
const tsxFiles = new Set();
for (const f of walk(APP, (n) => n === "page.tsx")) tsxFiles.add(f);
for (const seg of ["admin", "crm", "offline", "ops", "planner"]) {
  for (const f of walk(path.join(APP, seg), (n) => n.endsWith(".tsx"))) {
    if (!f.endsWith("page.tsx")) tsxFiles.add(f);
  }
}
const apiFiles = [...new Set(walk(path.join(APP, "api"), (n) => n === "route.ts"))].sort();

const rows = [];

function pushRow(filePath, kind) {
  const rel = relApp(filePath);
  if (EXCLUDED_PAGE_FILES.has(rel)) return;

  const content = readFile(filePath);
  const area = fileArea(filePath);
  const route = kind === "page" ? routeFromPage(filePath) : kind === "api" ? routeFromApi(filePath) : "—";
  const { root, layers, file, depth } = pathLayers(rel);

  rows.push({
    kind,
    route,
    root,
    layers,
    file,
    depth,
    area,
    render_mode: detectRender(content, kind),
    auth: detectAuth(content, area, kind),
    caching: detectCaching(content, kind),
    ui_entry: detectUiEntry(content, kind, filePath),
    dependencies: extractDependencies(content, kind),
    summary: summarize(rel, kind, content, route),
  });
}

for (const f of [...tsxFiles].sort((a, b) => relApp(a).localeCompare(relApp(b)))) {
  pushRow(f, kindFromFile(f));
}
for (const f of apiFiles) pushRow(f, "api");

rows.sort((a, b) => {
  const pathA = [a.root, ...a.layers, a.file].join("/");
  const pathB = [b.root, ...b.layers, b.file].join("/");
  return pathA.localeCompare(pathB);
});

const layerHeaders = Array.from({ length: LAYER_COUNT }, (_, i) => `layer_${i + 1}`);
const header = [
  "kind",
  "url_route",
  "root",
  ...layerHeaders,
  "file",
  "depth",
  "area",
  "render_mode",
  "auth",
  "caching",
  "ui_entry",
  "dependencies",
  "summary",
].join(",");

const body = rows
  .map((r) =>
    [
      r.kind,
      r.route,
      r.root,
      ...r.layers,
      r.file,
      r.depth,
      r.area,
      r.render_mode,
      r.auth,
      r.caching,
      r.ui_entry,
      r.dependencies,
      r.summary,
    ]
      .map(csvEscape)
      .join(","),
  )
  .join("\n");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
try {
  fs.writeFileSync(OUT, `${header}\n${body}\n`, "utf8");
  console.log(`Wrote ${rows.length} rows to ${OUT}`);
} catch (err) {
  if (err?.code === "EBUSY") {
    fs.writeFileSync(OUT_TMP, `${header}\n${body}\n`, "utf8");
    console.warn(`Locked; wrote ${OUT_TMP}`);
  } else throw err;
}

const byArea = {};
for (const r of rows) byArea[r.area] = (byArea[r.area] || 0) + 1;
console.log("By area:", byArea);
