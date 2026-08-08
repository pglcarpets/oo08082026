import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/check-site-page-shell.mjs");

describe("check-site-page-shell", () => {
  it("exits 0 when marketing routes use HomeMarketingLayout or HomeCatalogLayout", () => {
    execFileSync(process.execPath, [path.join(siteRoot, "scripts/generate-site-ui-route-matrix.mjs")], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-site-page-shell: ok");
  });
});
