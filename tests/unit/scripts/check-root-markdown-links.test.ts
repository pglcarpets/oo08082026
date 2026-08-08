// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/general/check-root-markdown-links.mjs");

describe("check-root-markdown-links (name-mirror)", () => {
  it("exits 0 when root doc-chain markdown links resolve on disk", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("root markdown links OK");
    expect(output).toMatch(/\d+ files checked/);
  });
});
