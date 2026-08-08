import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/check-homepage-dialect.mjs");

describe("check-homepage-dialect", () => {
  it("exits 0 in default error mode when marketing routes are clean", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-homepage-dialect: ok (error)");
  });

  it("allows warn override via SITE_UI_DIALECT_MODE=warn", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
      env: { ...process.env, SITE_UI_DIALECT_MODE: "warn" },
    });
    expect(output).toContain("check-homepage-dialect: ok (warn)");
  });
});
