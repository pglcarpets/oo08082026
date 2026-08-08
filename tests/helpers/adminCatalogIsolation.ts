/**
 * Admin A0 — test helpers for catalog write isolation.
 * Never write committed inventory/descriptors or public/svg-catalog.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  assertCatalogWriteAllowed,
  isCanonicalCatalogPath,
  isWithinDir,
  resolveCanonicalDescriptorDir,
  resolveCanonicalSvgCatalogDir,
  type AssertCatalogWriteOptions,
} from "@/features/admin/product-studio/storage/catalogWriteIsolation";
import { resolveSitePackageRoot } from "@/lib/paths/sitePackageRoot";

export {
  assertCatalogWriteAllowed,
  isCanonicalCatalogPath,
  isWithinDir,
  resolveCanonicalDescriptorDir,
  resolveCanonicalSvgCatalogDir,
};

export type IsolatedAdminInventoryRoot = {
  readonly root: string;
  readonly descriptorDir: string;
  readonly svgCatalogDir: string;
  cleanup(): void;
};

/** Create a temp inventory tree: `{root}/descriptors` + `{root}/svg-catalog`. */
export function createIsolatedAdminInventoryRoot(
  prefix = "oando-admin-catalog-",
): IsolatedAdminInventoryRoot {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  const descriptorDir = path.join(root, "descriptors");
  const svgCatalogDir = path.join(root, "svg-catalog");
  mkdirSync(descriptorDir, { recursive: true });
  mkdirSync(svgCatalogDir, { recursive: true });
  assertCatalogWriteAllowed(descriptorDir);
  assertCatalogWriteAllowed(svgCatalogDir);
  return {
    root,
    descriptorDir,
    svgCatalogDir,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

export function sha256File(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export type CanonicalCatalogSnapshot = {
  readonly descriptorDir: string;
  readonly svgCatalogDir: string;
  readonly files: Readonly<Record<string, string>>;
};

/** Snapshot sha256 of every regular file under committed catalog dirs. */
export function snapshotCanonicalCatalog(): CanonicalCatalogSnapshot {
  const descriptorDir = resolveCanonicalDescriptorDir();
  const svgCatalogDir = resolveCanonicalSvgCatalogDir();
  const files: Record<string, string> = {};

  const walk = (dir: string, label: string): void => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full, `${label}/${name}`);
        continue;
      }
      if (!st.isFile()) continue;
      files[`${label}/${name}`] = sha256File(full);
    }
  };

  walk(descriptorDir, "descriptors");
  walk(svgCatalogDir, "svg-catalog");
  return { descriptorDir, svgCatalogDir, files };
}

export function assertCanonicalCatalogUnchanged(
  before: CanonicalCatalogSnapshot,
): void {
  const after = snapshotCanonicalCatalog();
  const beforeKeys = Object.keys(before.files).sort();
  const afterKeys = Object.keys(after.files).sort();
  if (beforeKeys.length !== afterKeys.length) {
    throw new Error(
      `Canonical catalog file count changed: before=${beforeKeys.length} after=${afterKeys.length}`,
    );
  }
  for (const key of beforeKeys) {
    if (before.files[key] !== after.files[key]) {
      throw new Error(`Canonical catalog mutated at ${key}`);
    }
  }
}

/**
 * Assert a write path is not committed catalog (always force — for helpers).
 */
export function requireIsolatedCatalogWritePath(
  targetPath: string,
  options: AssertCatalogWriteOptions = { force: true },
): void {
  assertCatalogWriteAllowed(targetPath, options);
}

/** Site package root used by path resolution. */
export function adminSitePackageRoot(): string {
  return resolveSitePackageRoot();
}
