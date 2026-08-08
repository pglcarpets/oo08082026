// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  monorepoRoot,
  "scripts/general/check-test-layout.mjs",
);

describe("check-test-layout (name-mirror)", () => {
  it("exits 0 when co-located tests are absent under site/ scan roots", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-test-layout-"));
    try {
      for (const root of [
        "site/app",
        "site/components",
        "site/features",
        "site/lib",
        "site/platform",
        "site/i18n",
      ]) {
        fs.mkdirSync(path.join(tmp, root), { recursive: true });
      }
      fs.writeFileSync(
        path.join(tmp, "site/app", "page.tsx"),
        "export default function Page() { return null; }\n",
      );
      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: monorepoRoot,
        encoding: "utf8",
        env: { ...process.env, MONOREPO_ROOT: tmp },
      });
      expect(output).toContain("test layout OK");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("exits 1 when a co-located test file is present under site/", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-test-layout-bad-"));
    try {
      fs.mkdirSync(path.join(tmp, "site/lib"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "site/lib", "util.test.ts"), "export {};\n");
      let failed = false;
      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: monorepoRoot,
          encoding: "utf8",
          env: { ...process.env, MONOREPO_ROOT: tmp },
        });
      } catch (error) {
        failed = true;
        const err = error as {
          status?: number;
          stderr?: string;
          stdout?: string;
        };
        expect(err.status).toBe(1);
        stderr = `${err.stderr ?? ""}${err.stdout ?? ""}`;
      }
      expect(failed).toBe(true);
      expect(stderr).toContain("Co-located tests found");
      expect(stderr.replaceAll("\\", "/")).toContain("site/lib/util.test.ts");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
