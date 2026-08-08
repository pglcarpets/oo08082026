import path from "node:path";

import { resolveSitePackageRoot } from "./sitePackageRoot";

export function resolveWorkspaceRoot(): string {
  return path.resolve(resolveSitePackageRoot(), "..");
}

/**
 * Operational admin catalog metadata (lifecycle manifest, audit log).
 * Not product descriptors — lives under repo-root results/, gitignored.
 */
export const ADMIN_CATALOG_OPS_DIR_DEFAULT = path.join(
  resolveWorkspaceRoot(),
  "results",
  "admin",
  "catalog-ops",
);
