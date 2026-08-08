import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/check-marketing-copy-source.mjs");

describe("check-marketing-copy-source", () => {
  it("exits 0 when wave1 i18n consumer files avoid routeCopy.ts", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-marketing-copy-source: ok");
  });
});
