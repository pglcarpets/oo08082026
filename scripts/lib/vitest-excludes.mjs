import fs from "node:fs";
import path from "node:path";

/**
 * Read test file excludes from vitest.config.ts (single source of truth).
 * @param {string} repoRoot
 * @returns {{ exact: string[], globs: string[] }}
 */
/**
 * @param {string} repoRoot Monorepo root (or legacy site root — both resolved).
 */
export function loadVitestTestExcludes(repoRoot) {
  const candidates = [
    path.join(repoRoot, "tests", "vitest.config.ts"),
    path.join(repoRoot, "vitest.config.ts"),
    path.join(repoRoot, "..", "tests", "vitest.config.ts"),
  ];
  const configPath = candidates.find((p) => fs.existsSync(p));
  if (!configPath) {
    return { exact: [], globs: [] };
  }
  const text = fs.readFileSync(configPath, "utf8");
  const sharedPath = path.join(path.dirname(configPath), "vitest.shared.ts");
  const scanText = fs.existsSync(sharedPath)
    ? fs.readFileSync(sharedPath, "utf8")
    : text;

  /** @param {string} source @param {string} name */
  function collectNamedArrayStrings(source, name) {
    const block = source.match(
      new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`),
    );
    if (!block) return [];
    return [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  }

  // Default suite = COMMON + tech-docs lane exclude (DEFAULT is spread-only).
  let items = [
    ...collectNamedArrayStrings(scanText, "VITEST_COMMON_EXCLUDE"),
    ...collectNamedArrayStrings(scanText, "VITEST_TECH_DOCS_EXCLUDE"),
  ];
  if (items.length === 0) {
    const inline = text.match(/test:\s*\{[\s\S]*?exclude:\s*\[([\s\S]*?)\]/);
    if (inline) {
      items = [...inline[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
    }
  }

  const testItems = items.filter(
    (s) =>
      s.startsWith("tests/") ||
      s.startsWith("../tests/") ||
      s.includes("/tests/"),
  );
  return {
    exact: testItems.filter((s) => !s.includes("*")),
    globs: testItems.filter((s) => s.includes("*")),
  };
}
