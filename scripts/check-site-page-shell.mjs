#!/usr/bin/env node
/**
 * Site page shell check — marketing routes must use HomeMarketingLayout / HomeCatalogLayout.
 */
import fs from "node:fs";
import path from "node:path";
import {
  collectPageSources,
  deriveSiteRoutePath,
  findSitePagePath,
  walkSitePageFiles,
} from "./lib/siteUiRouteSources.mjs";
import { REPO_ROOT, SITE_PACKAGE_ROOT } from "./lib/repoRoot.mjs";

const siteRoot = SITE_PACKAGE_ROOT;
const appDir = path.join(siteRoot, "app");
const matrixFile = path.join(REPO_ROOT, "results", "site-ui", "route-matrix.csv");

const EXEMPT_DIALECTS = new Set([
  "redirect",
  "offline",
  "workspace",
  "feature-delegated",
]);

const WORKSPACE_PATHS = new Set([
  "/access",
  "/choose-product",
  "/dashboard",
  "/login",
  "/portal",
]);

const SHELL_LAYOUT_RE = /<(HomeMarketingLayout|HomeCatalogLayout)\b/;
const LEGACY_SCHEME_WRAPPER_RE =
  /className="[^"]*scheme-page[^"]*flex min-h-screen flex-col items-center/;

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (inQuotes) {
        if (char === '"' && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function isWorkspacePath(routePath) {
  if (WORKSPACE_PATHS.has(routePath)) return true;
  return [...WORKSPACE_PATHS].some(
    (prefix) => routePath.startsWith(`${prefix}/`) || routePath === prefix,
  );
}

function main() {
  if (!fs.existsSync(matrixFile)) {
    process.stderr.write(
      "check-site-page-shell: missing route-matrix.csv — run site-ui:matrix\n",
    );
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(matrixFile, "utf8"));
  const failures = [];

  for (const row of rows) {
    if (row.layout_root !== "site") continue;
    if (EXEMPT_DIALECTS.has(row.dialect) || isWorkspacePath(row.path)) continue;

    const pagePath = findSitePagePath(appDir, row.path);
    if (!pagePath) {
      failures.push({ path: row.path, issue: "missing page.tsx for (site) route" });
      continue;
    }

    const source = collectPageSources(siteRoot, pagePath);

    // Redirect-only pages never render a marketing shell (next/navigation).
    if (/\b(?:permanentRedirect|redirect)\s*\(/.test(source) && !SHELL_LAYOUT_RE.test(source)) {
      continue;
    }

    if (row.dialect === "scheme-page") {
      failures.push({ path: row.path, issue: "matrix dialect=scheme-page (migration backlog)" });
    }

    if (LEGACY_SCHEME_WRAPPER_RE.test(source)) {
      failures.push({ path: row.path, issue: "legacy scheme-page outer wrapper" });
    }

    if (!SHELL_LAYOUT_RE.test(source)) {
      failures.push({
        path: row.path,
        issue: "missing HomeMarketingLayout or HomeCatalogLayout",
      });
    }
  }

  for (const pagePath of walkSitePageFiles(appDir)) {
    const routePath = deriveSiteRoutePath(appDir, pagePath);
    if (isWorkspacePath(routePath)) continue;

    const source = collectPageSources(siteRoot, pagePath);
    if (LEGACY_SCHEME_WRAPPER_RE.test(source)) {
      failures.push({
        path: routePath,
        issue: "legacy scheme-page outer wrapper (page scan)",
      });
    }
  }

  if (failures.length > 0) {
    process.stderr.write(`check-site-page-shell: ${failures.length} issue(s)\n`);
    for (const failure of failures) {
      process.stderr.write(`  ${failure.path} — ${failure.issue}\n`);
    }
    process.exit(1);
  }

  const siteRows = rows.filter((row) => row.layout_root === "site");
  const checked = siteRows.filter(
    (row) => !EXEMPT_DIALECTS.has(row.dialect) && !isWorkspacePath(row.path),
  ).length;

  process.stdout.write(
    `check-site-page-shell: ok (${checked} marketing routes; matrix ${siteRows.length} site rows)\n`,
  );
}

main();
