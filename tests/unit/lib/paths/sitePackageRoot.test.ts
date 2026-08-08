/**
 * Name-mirror coverage for lib/paths/sitePackageRoot.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLOCK_DESCRIPTORS_DIR_SEGMENT,
  resolveBlockDescriptorsDir,
  resolvePublicDir,
  resolveSitePackageRoot,
} from "@/lib/paths/sitePackageRoot";

function normalizePathSeps(p: string): string {
  return p.replace(/\\/g, "/");
}

describe("resolveSitePackageRoot", () => {
  it("resolves a directory that contains features/planner", () => {
    const root = resolveSitePackageRoot();
    expect(existsSync(path.join(root, "features", "planner"))).toBe(true);
  });
});

describe("resolveBlockDescriptorsDir", () => {
  it("ends with inventory/descriptors", () => {
    const resolved = normalizePathSeps(resolveBlockDescriptorsDir());
    expect(resolved.endsWith("inventory/descriptors")).toBe(true);
  });

  it("exports the legacy segment constant", () => {
    expect(BLOCK_DESCRIPTORS_DIR_SEGMENT).toBe("inventory/descriptors");
  });
});

describe("resolvePublicDir", () => {
  it("points at the site package public directory", () => {
    const publicDir = resolvePublicDir();
    expect(normalizePathSeps(publicDir).endsWith("/public")).toBe(true);
    expect(existsSync(publicDir)).toBe(true);
  });
});
