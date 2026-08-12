import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const protectedDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(protectedDir, "../..");
const siteRoot = path.join(repoRoot, "site");
const apiDir = path.join(siteRoot, "app", "api");
// Generated dump only — live inventory is hand-maintained `docs/architecture/routes.md`.
const outFile = path.join(repoRoot, "results", "tooling", "routes-api.generated.md");

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const NOTES = `## Notes

- **Auth:** Most user routes use Supabase session cookies via \`createServerClient()\`. Admin routes use \`withAuth({ role: "admin" })\`.
- **CSRF:** \`POST /api/plans\` and \`PUT\`/\`DELETE /api/plans/[id]\` require CSRF (\`GET /api/csrf\` first). Other mutating routes may also set \`requireCsrf: true\`.
- **Admin catalog:** Canonical HTTP is \`/api/admin/catalogs/{type}\` (\`standard\` | \`configurator\`). Legacy \`/api/admin/catalog\`, \`planner-catalog\`, and \`configurator-catalog\` shims are removed.`;

function walkRouteFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkRouteFiles(abs, out);
    else if (entry.name === "route.ts") out.push(abs);
  }
  return out;
}

function deriveApiPath(filePath) {
  const rel = path.relative(path.join(siteRoot, "app"), filePath).replace(/\\/g, "/");
  const segments = rel.split("/").filter((segment) => segment !== "route.ts");
  return `/${segments.join("/")}`;
}

function extractMethodsFromHeader(source) {
  const header = source.match(/\/\*\*([\s\S]*?)\*\//);
  if (!header) return [];
  const apiLine = header[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .find((line) => /\/api\//.test(line));
  if (!apiLine) return [];
  return HTTP_METHODS.filter((method) => new RegExp(`\\b${method}\\b`).test(apiLine));
}

function extractMethods(source) {
  const methods = new Set();
  for (const method of HTTP_METHODS) {
    const fnRe = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`);
    const constRe = new RegExp(`export\\s+const\\s+${method}\\s*=`);
    if (fnRe.test(source) || constRe.test(source)) methods.add(method);
  }
  for (const method of extractMethodsFromHeader(source)) methods.add(method);
  return HTTP_METHODS.filter((method) => methods.has(method));
}

function extractFileHeaderComment(source) {
  const header = source.match(/\/\*\*([\s\S]*?)\*\//);
  return header?.[1] ?? "";
}

function extractDeprecationNote(source) {
  const header = extractFileHeaderComment(source);
  if (!header) return "";
  const preferred = header.match(/@deprecated\s+Use\s+`([^`]+)`\s+instead/i);
  if (preferred) return ` *(deprecated shim → ${preferred[1]})*`;
  if (/@deprecated/i.test(header)) return " *(deprecated)*";
  return "";
}

function extractRetiredNote(source) {
  const header = extractFileHeaderComment(source);
  if (!header) return "";
  if (!/\bendpoint\b[^]*\bretired\b/i.test(header)) return "";
  const preferred = header.match(/Canonical conversion is\s+`?([^`.]+)`?/i);
  if (preferred) return ` *(retired → ${preferred[1].trim()})*`;
  return " *(retired)*";
}

function catalogTypeHint(routePath) {
  if (routePath !== "/api/admin/catalogs/[type]") return "";
  return " — `type`: `standard`, `configurator`";
}

function buildRows() {
  const rows = [];
  for (const filePath of walkRouteFiles(apiDir)) {
    const source = fs.readFileSync(filePath, "utf8");
    const methods = extractMethods(source);
    if (!methods.length) continue;
    const routePath = deriveApiPath(filePath);
    const suffix = extractDeprecationNote(source) || extractRetiredNote(source);
    const typeHint = catalogTypeHint(routePath);
    rows.push({
      methods: methods.join(", "),
      display: `\`${routePath}\`${typeHint}${suffix}`,
    });
  }
  rows.sort((left, right) => left.display.localeCompare(right.display));
  return rows;
}

function renderMarkdown(rows) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    "# API route index",
    "",
    "**Scope:** API handlers only — `site/app/api/**/route.ts`. **Pages:** see Pages section in this file (or regenerate pages inventory separately). Package map: [`product-map.md`](./product-map.md).",
    "",
    `Generated ${today}. Regenerate: \`pnpm run docs:sync:routes\` (repo root).`,
    "",
    "| Methods | Path |",
    "|---------|------|",
    ...rows.map((row) => `| ${row.methods} | ${row.display} |`),
    "",
    NOTES,
    "",
  ];
  return `${lines.join("\n")}`;
}

const rows = buildRows();
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, renderMarkdown(rows), "utf8");
console.log(`Wrote ${path.relative(repoRoot, outFile)} (${rows.length} routes)`);
