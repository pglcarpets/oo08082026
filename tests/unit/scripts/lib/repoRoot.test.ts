// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  REPO_ROOT,
  SITE_PACKAGE_ROOT,
  resolveRepoRootFromCwd,
} from "@/scripts/lib/repoRoot";

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const scriptsLibDir = path.resolve(thisDir, "../../../../scripts/lib");

describe("repoRoot.ts (name-mirror)", () => {
  it("exports absolute SITE_PACKAGE_ROOT and REPO_ROOT linked by one parent hop", () => {
    expect(path.isAbsolute(SITE_PACKAGE_ROOT)).toBe(true);
    expect(path.isAbsolute(REPO_ROOT)).toBe(true);
    expect(path.normalize(REPO_ROOT)).toBe(
      path.normalize(path.resolve(SITE_PACKAGE_ROOT, "..")),
    );
    // Source uses dirname(import.meta.url)+".."; vitest may resolve meta URL under
    // scripts/lib or a transformed path, so accept either live root.
    expect(["site", "scripts"]).toContain(path.basename(SITE_PACKAGE_ROOT));
    expect(SITE_PACKAGE_ROOT.replace(/\\/g, "/")).toMatch(/\/site(?:\/scripts)?$/);
    expect(fs.existsSync(path.join(scriptsLibDir, "repoRoot.ts"))).toBe(true);
  });

  it("resolveRepoRootFromCwd peels a site/ cwd", () => {
    expect(path.normalize(resolveRepoRootFromCwd(SITE_PACKAGE_ROOT))).toBe(
      path.normalize(REPO_ROOT),
    );
    expect(path.normalize(resolveRepoRootFromCwd(REPO_ROOT))).toBe(path.normalize(REPO_ROOT));
  });
});
