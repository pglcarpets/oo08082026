import fs from "node:fs";
import path from "node:path";

const PAGE_VIEW_IMPORT_RE =
  /import\s+\{[^}]*\b(\w+(?:PageView|PageClient|Viewer|Page))\b[^}]*\}\s+from\s+["']([^"']+)["']/g;

const SOLE_COMPONENT_RE =
  /return\s+(?:<(\w+)|(\w+)\s*\()/;

function resolveImportPath(siteRoot, pagePath, importPath) {
  if (importPath.startsWith("@/")) {
    const rel = importPath.slice(2).replace(/\\/g, "/");
    const candidates = [
      path.join(siteRoot, rel),
      path.join(siteRoot, `${rel}.tsx`),
      path.join(siteRoot, rel, "index.tsx"),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    return null;
  }

  if (importPath.startsWith(".")) {
    const baseDir = path.dirname(pagePath);
    const rel = importPath.replace(/\\/g, "/");
    const candidates = [
      path.join(baseDir, rel),
      path.join(baseDir, `${rel}.tsx`),
      path.join(baseDir, rel, "index.tsx"),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }

  return null;
}

export function resolveAlias(siteRoot, importPath) {
  return resolveImportPath(siteRoot, siteRoot, importPath);
}

function extractImportPath(pageSource, symbolName) {
  const importRe = new RegExp(
    `import\\s+(?:\\{[^}]*\\b${symbolName}\\b[^}]*\\}|${symbolName})\\s+from\\s+["']([^"']+)["']`,
  );
  const match = pageSource.match(importRe);
  return match?.[1] ?? null;
}

export function collectPageSources(siteRoot, pagePath) {
  const pageSource = fs.readFileSync(pagePath, "utf8");
  const sources = [pageSource];

  PAGE_VIEW_IMPORT_RE.lastIndex = 0;
  let viewMatch = PAGE_VIEW_IMPORT_RE.exec(pageSource);
  while (viewMatch) {
    const resolved = resolveImportPath(siteRoot, pagePath, viewMatch[2]);
    if (resolved) sources.push(fs.readFileSync(resolved, "utf8"));
    viewMatch = PAGE_VIEW_IMPORT_RE.exec(pageSource);
  }

  const soleMatch = pageSource.match(SOLE_COMPONENT_RE);
  const soleComponent = soleMatch?.[1] ?? soleMatch?.[2];
  if (soleComponent) {
    const importPath = extractImportPath(pageSource, soleComponent);
    const resolved = importPath ? resolveImportPath(siteRoot, pagePath, importPath) : null;
    if (resolved) sources.push(fs.readFileSync(resolved, "utf8"));
  }

  return sources.join("\n");
}

export function walkSitePageFiles(appDir) {
  const siteDir = path.join(appDir, "(site)");
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name === "page.tsx") files.push(abs);
    }
  }

  walk(siteDir);
  return files;
}

export function deriveSiteRoutePath(appDir, filePath) {
  const rel = path.relative(appDir, filePath).replace(/\\/g, "/");
  const segments = rel.split("/").filter((segment) => segment !== "page.tsx");
  const cleaned = segments.filter(
    (segment) => !(segment.startsWith("(") && segment.endsWith(")")),
  );
  return `/${cleaned.join("/")}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

export function findSitePagePath(appDir, routePath) {
  if (routePath === "/") {
    const home = path.join(appDir, "(site)", "page.tsx");
    return fs.existsSync(home) ? home : null;
  }
  const segments = routePath.split("/").filter(Boolean);
  const candidate = path.join(appDir, "(site)", ...segments, "page.tsx");
  return fs.existsSync(candidate) ? candidate : null;
}
