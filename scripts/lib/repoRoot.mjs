import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsLibDir = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (parent of `scripts/` and `site/`). */
export const REPO_ROOT = path.resolve(scriptsLibDir, "..", "..");

/** Product package root (`site/`). */
export const SITE_PACKAGE_ROOT = path.join(REPO_ROOT, "site");

/** Repo root when `process.cwd()` may be `site/` or repo root. */
export function resolveRepoRootFromCwd(cwd = process.cwd()) {
  return path.basename(cwd) === "site" ? path.resolve(cwd, "..") : cwd;
}
