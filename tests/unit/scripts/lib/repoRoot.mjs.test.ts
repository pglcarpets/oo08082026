// @vitest-environment node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  REPO_ROOT,
  SITE_PACKAGE_ROOT,
  resolveRepoRootFromCwd,
} from "../../../../scripts/lib/repoRoot.mjs";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const siteRoot = path.join(monorepoRoot, "site");

describe("repoRoot.mjs (name-mirror)", () => {
  it("resolves SITE_PACKAGE_ROOT to site/ and REPO_ROOT to monorepo root", () => {
    expect(path.normalize(SITE_PACKAGE_ROOT)).toBe(path.normalize(siteRoot));
    expect(path.normalize(REPO_ROOT)).toBe(path.normalize(monorepoRoot));
    expect(path.basename(SITE_PACKAGE_ROOT)).toBe("site");
  });

  it("resolveRepoRootFromCwd peels site/ cwd and leaves monorepo cwd", () => {
    expect(path.normalize(resolveRepoRootFromCwd(siteRoot))).toBe(
      path.normalize(monorepoRoot),
    );
    expect(path.normalize(resolveRepoRootFromCwd(monorepoRoot))).toBe(
      path.normalize(monorepoRoot),
    );
  });
});
