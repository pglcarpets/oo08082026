import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { BLOCK_DESCRIPTORS_DIR_DEFAULT } from "@/lib/catalog/svg/svgBlockDescriptorLoader";
import {
  resolveBlockDescriptorsDir,
  resolveSitePackageRoot,
} from "@/lib/paths/sitePackageRoot";

/** Normalize path separators so Windows/posix assertions stay stable. */
function normalizePathSeps(p: string): string {
  return p.replace(/\\/g, "/");
}

describe("resolveBlockDescriptorsDir — canonical inventory path", () => {
  it("ends with inventory/descriptors (normalized path seps)", () => {
    const resolved = normalizePathSeps(resolveBlockDescriptorsDir());
    expect(resolved.endsWith("inventory/descriptors")).toBe(true);
  });

  it("does not contain path segment block-descriptors", () => {
    const resolved = normalizePathSeps(resolveBlockDescriptorsDir());
    const segments = resolved.split("/").filter(Boolean);
    expect(segments).not.toContain("block-descriptors");
  });

  it("BLOCK_DESCRIPTORS_DIR_DEFAULT equals resolveBlockDescriptorsDir()", () => {
    expect(BLOCK_DESCRIPTORS_DIR_DEFAULT).toBe(resolveBlockDescriptorsDir());
  });

  it("legacy site/block-descriptors directory does not exist", () => {
    const siteRoot = resolveSitePackageRoot();
    const legacyDir = path.join(siteRoot, "block-descriptors");
    expect(existsSync(legacyDir)).toBe(false);
  });
});
