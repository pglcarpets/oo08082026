// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/check-i18n-key-parity.mjs");

describe("check-i18n-key-parity (name-mirror)", () => {
  it("exits 0 when locale message key trees match the parity manifest", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-i18n-key-parity: ok");
  });
});
