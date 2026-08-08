/**
 * UI contract lint — anti-drift for current scheme (MODULE-UI-CONTRACT).
 * Strict: pnpm run lint:ui:strict
 *
 * Surfaces:
 * - open3d TSX: no Tailwind utilities (CSS modules + tokens only)
 * - open3d CSS modules: no raw hex
 * - admin + planner + site marketing: no raw Tailwind palette (slate/blue/zinc/gray/emerald)
 * - site marketing TSX: no bg-white (use semantic surfaces — ecru paper bar)
 * - planner CSS: no raw hex/rgb literals outside the token source
 * - product zones TSX: no legacy .admin-btn (use shadcn Button)
 * - site design TSX: .btn-primary / MarketingCtaLink allowed; no shadcn imports (warn)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const SITE_ROOT = fileURLToPath(new URL("../../site", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FOCSS_ROOT = join(REPO_ROOT, "site", "focss");
const HAS_FOCSS = statSync(FOCSS_ROOT, { throwIfNoEntry: false })?.isDirectory() ?? false;
const WARN_ONLY = !process.argv.includes("--strict") && process.env.LINT_UI_STRICT !== "1";

const violations = [];

/** Avoid matching "translate" (contains letters s-l-a-t-e). */
const RAW_PALETTE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:slate|blue|zinc|gray|emerald|neutral|stone)-(?:\d{2,3}|black|white)\b/;

const PURE_WHITE_BG = /\bbg-white\b/;

const LEGACY_BUTTON_CLASS = /\badmin-btn\b/;

const SITE_SHADCN_IMPORT =
  /from\s+["']@\/components\/ui\/(Button|Input|Label|Checkbox|Switch|Select|Textarea|Dialog|Sheet|Popover|DropdownMenu|Tabs|Tooltip|Sonner|Form)["']/;

const PLANNER_TAILWIND_UTIL =
  /className=["'`][^"'`]*\b(?:bg|text|border|p-|m-|flex|grid|gap-|px-|py-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-|w-|h-|min-h-|max-h-|rounded|shadow)-/;

/** Paths exempt from marketing surface rules (generated shadcn, design kit reference). */
function relPath(filePath) {
  return relative(SITE_ROOT, filePath).replaceAll("\\", "/");
}

export function isMarketingLintExempt(filePath) {
  const rel = relPath(filePath);
  return rel.startsWith("components/ui/") || rel.includes("features/admin/design-kit/");
}

/** Paths treated as Product (Admin/Product Studio + Planner workspace/editor). */
function isProductZonePath(rel) {
  return (
    rel.startsWith("app/admin/") ||
    rel.startsWith("features/admin/") ||
    rel.includes("features/planner/workspace") ||
    rel.startsWith("app/planner/(workspace)/") ||
    rel.startsWith("features/planner/editor/") ||
    rel.startsWith("features/planner/ui/")
  );
}

export function isSiteDesignZone(filePath) {
  const rel = relPath(filePath);
  if (isMarketingLintExempt(filePath)) return false;
  if (isProductZonePath(rel)) return false;
  return (
    rel.startsWith("app/(site)/") ||
    rel.startsWith("features/site/") ||
    rel.startsWith("features/shared/") ||
    rel.startsWith("features/crm/") ||
    rel.startsWith("features/ops/") ||
    rel.startsWith("components/site/") ||
    rel.startsWith("components/home/") ||
    rel.startsWith("app/planner/(marketing)/") ||
    rel.startsWith("features/planner/landing/")
  );
}

export function isProductDesignZone(filePath) {
  const rel = relPath(filePath);
  if (isMarketingLintExempt(filePath)) return false;
  return isProductZonePath(rel);
}

function walk(dir, filter) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === "_archive") continue;
      entries.push(...walk(full, filter));
    } else if (filter(full)) {
      entries.push(full);
    }
  }
  return entries;
}

function checkSurfacePalette() {
  const roots = [
    join(SITE_ROOT, "app/admin"),
    join(SITE_ROOT, "features/admin"),
    join(SITE_ROOT, "features/planner"),
    join(SITE_ROOT, "app/planner"),
    join(SITE_ROOT, "app/(site)"),
    join(SITE_ROOT, "components"),
    join(SITE_ROOT, "features/site"),
    join(SITE_ROOT, "features/shared"),
    join(SITE_ROOT, "features/crm"),
    join(SITE_ROOT, "features/ops"),
  ];
  for (const root of roots) {
    const files = walk(root, (p) => p.endsWith(".tsx"));
    for (const file of files) {
      if (isMarketingLintExempt(file)) continue;
      const text = readFileSync(file, "utf8");
      if (RAW_PALETTE.test(text)) {
        violations.push(`${relative(SITE_ROOT, file)}: raw Tailwind palette class`);
      }
    }
  }
}

function checkMarketingPureWhite() {
  const roots = [
    join(SITE_ROOT, "app/(site)"),
    join(SITE_ROOT, "components"),
    join(SITE_ROOT, "features/site"),
    join(SITE_ROOT, "features/shared"),
    join(SITE_ROOT, "features/crm"),
    join(SITE_ROOT, "features/ops"),
    join(SITE_ROOT, "features/admin"),
    join(SITE_ROOT, "features/planner"),
  ];
  for (const root of roots) {
    const files = walk(root, (p) => p.endsWith(".tsx"));
    for (const file of files) {
      if (isMarketingLintExempt(file)) continue;
      const text = readFileSync(file, "utf8");
      if (PURE_WHITE_BG.test(text)) {
        violations.push(`${relative(SITE_ROOT, file)}: bg-white (use bg-background/bg-card per ecru paper bar)`);
      }
    }
  }
}

function checkLegacyButtonClassesInTsx() {
  const roots = [
    join(SITE_ROOT, "app/admin"),
    join(SITE_ROOT, "features/admin"),
    join(SITE_ROOT, "features/planner/workspace"),
    join(SITE_ROOT, "app/planner/(workspace)"),
    join(SITE_ROOT, "features/planner/editor"),
    join(SITE_ROOT, "features/planner/ui"),
  ];
  for (const root of roots) {
    const files = walk(root, (p) => p.endsWith(".tsx"));
    for (const file of files) {
      if (!isProductDesignZone(file)) continue;
      const text = readFileSync(file, "utf8");
      if (LEGACY_BUTTON_CLASS.test(text)) {
        violations.push(`${relPath(file)}: legacy admin-btn class (use components/ui/Button)`);
      }
    }
  }
}

function checkShadcnImportsInSiteDesign() {
  const roots = [
    join(SITE_ROOT, "app/(site)"),
    join(SITE_ROOT, "components/site"),
    join(SITE_ROOT, "components/home"),
    join(SITE_ROOT, "features/site"),
    join(SITE_ROOT, "features/shared"),
    join(SITE_ROOT, "app/planner/(marketing)"),
    join(SITE_ROOT, "features/planner/landing"),
  ];
  for (const root of roots) {
    const files = walk(root, (p) => p.endsWith(".tsx"));
    for (const file of files) {
      if (!isSiteDesignZone(file)) continue;
      const text = readFileSync(file, "utf8");
      if (SITE_SHADCN_IMPORT.test(text)) {
        violations.push(
          `${relPath(file)}: shadcn import in site design zone (use .btn-primary / marketing CSS)`,
        );
      }
    }
  }
}

function checkOpen3dTailwindInTsx() {
  const plannerDir = join(SITE_ROOT, "features/planner/workspace");
  const files = walk(plannerDir, (p) => p.endsWith(".tsx"));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (PLANNER_TAILWIND_UTIL.test(text)) {
      violations.push(`${relative(SITE_ROOT, file)}: Tailwind utility in open3d TSX`);
    }
  }
}

function checkPlannerCssRawColors() {
  const roots = [
    join(SITE_ROOT, "features/planner"),
    ...(HAS_FOCSS
      ? [
          join(FOCSS_ROOT, "planner/base"),
          join(FOCSS_ROOT, "planner/modules"),
        ]
      : []),
  ];
  const files = roots.flatMap((root) => walk(root, (p) => p.endsWith(".css")));
  const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (rawColorPattern.test(text)) {
      violations.push(`${relative(SITE_ROOT, file)}: raw color in planner CSS`);
    }
  }
}

function checkNoLucideInSite() {
  const roots = [
    join(SITE_ROOT, "features"),
    join(SITE_ROOT, "app"),
    join(SITE_ROOT, "components"),
    join(SITE_ROOT, "lib"),
  ];
  for (const root of roots) {
    const files = walk(root, (p) => /\.(tsx|ts)$/.test(p));
    for (const file of files) {
      if (file.includes(`${join("features", "planner", "_archive")}`)) continue;
      const text = readFileSync(file, "utf8");
      if (text.includes("lucide-react")) {
        violations.push(`${relative(SITE_ROOT, file)}: lucide-react forbidden (Phosphor only)`);
      }
    }
  }
}

/**
 * FOCSS block class + Tailwind LAYOUT utility on the same element (R30).
 *
 * The shared token layer stays legal — `bg-card`, `text-muted-foreground` and
 * friends are how FOCSS variables reach a shadcn primitive. Layout is different:
 * when one element takes its `display` from a stylesheet and its `gap` from an
 * attribute, neither file is the answer to "why does this look like that".
 */
// Whole tokens only: `flex` is a utility, but the `flex` inside
// `product-studio-flex-frame` is part of a FOCSS block name.
const FOCSS_BLOCK_CLASS =
  /^(?:shape-composer|product-studio-|planner-|admin-page|admin-panel|admin-toolbar)[\w-]*$/;
const TAILWIND_LAYOUT_UTILITY =
  /^(?:flex|grid|inline-flex|inline-grid|flex-row|flex-col|flex-wrap|flex-1|flex-auto|flex-none|gap(?:-[xy])?-[\w.[\]/-]+|items-[\w-]+|justify-[\w-]+|[wh]-[\w.[\]/-]+|size-[\w.[\]/-]+|(?:min|max)-[wh]-[\w.[\]/-]+|[pm][xytblrse]?-[\w.[\]/-]+|absolute|relative|fixed|sticky)$/;

/** Returns the offending utility, or null when the element has one owner. */
export function mixedLayoutOwnership(className) {
  const tokens = className.split(/\s+/).filter(Boolean);
  if (!tokens.some((token) => FOCSS_BLOCK_CLASS.test(token))) return null;
  return tokens.find((token) => TAILWIND_LAYOUT_UTILITY.test(token)) ?? null;
}

function checkLayoutOwnership() {
  const roots = [
    join(SITE_ROOT, "features/admin/product-studio"),
    join(SITE_ROOT, "app/admin/product-studio"),
  ];
  for (const root of roots) {
    for (const file of walk(root, (p) => p.endsWith(".tsx"))) {
      const text = readFileSync(file, "utf8");
      for (const [, value] of text.matchAll(/className\s*=\s*"([^"]*)"/g)) {
        const utility = mixedLayoutOwnership(value);
        if (!utility) continue;
        violations.push(
          `${relative(SITE_ROOT, file)}: FOCSS block class and Tailwind layout utility "${utility}" on one element (R30)`,
        );
      }
    }
  }
}

function main() {
  checkSurfacePalette();
  checkMarketingPureWhite();
  checkLegacyButtonClassesInTsx();
  checkShadcnImportsInSiteDesign();
  checkOpen3dTailwindInTsx();
  checkPlannerCssRawColors();
  checkNoLucideInSite();
  checkLayoutOwnership();

  if (violations.length === 0) {
    console.log("lint-ui-contract: ok (scheme freeze)");
    process.exit(0);
  }

  const header = WARN_ONLY
    ? "lint-ui-contract: warnings (set LINT_UI_STRICT=1 or --strict to fail)"
    : "lint-ui-contract: failed";

  console.error(`${header}\n${violations.map((v) => `  - ${v}`).join("\n")}`);
  process.exit(WARN_ONLY ? 0 : 1);
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main();
}
