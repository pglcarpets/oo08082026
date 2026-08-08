import path from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo root (contains `site/`, `tests/`, root `package.json`). */
export const WORKSPACE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Product package root (`site/`). */
export const SITE_ROOT = path.join(WORKSPACE_ROOT, "site");
