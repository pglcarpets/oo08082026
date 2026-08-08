// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  monorepoRoot,
  "scripts/AsNeeded/verify-focss-imports.mjs",
);

/** Fixture uses a local package CSS import (not a product dep). */
function makeFixture(): { root: string; importedFile: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "verify-focss-imports-"));
  const focssRoot = path.join(root, "site", "focss");
  const importedFile = path.join(
    root,
    "node_modules",
    "tw-animate-css",
    "dist",
    "tw-animate.css",
  );

  fs.mkdirSync(path.dirname(importedFile), { recursive: true });
  fs.writeFileSync(
    path.join(root, "node_modules", "tw-animate-css", "package.json"),
    JSON.stringify({ exports: { "./dist/tw-animate.css": "./dist/tw-animate.css" } }),
  );
  fs.writeFileSync(importedFile, "/* fixture */\n");
  fs.mkdirSync(focssRoot, { recursive: true });
  fs.writeFileSync(
    path.join(focssRoot, "entry.css"),
    '@import url("tw-animate-css/dist/tw-animate.css");\n',
  );

  return { root, importedFile };
}

function run(root: string): string {
  return execFileSync(process.execPath, [scriptPath], {
    cwd: monorepoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FOCSS_IMPORT_ROOT: root },
  });
}

function runExpectFail(root: string): string {
  try {
    run(root);
  } catch (error) {
    const result = error as { status?: number; stderr?: string; stdout?: string };
    expect(result.status).toBe(1);
    return `${result.stderr ?? ""}${result.stdout ?? ""}`;
  }
  throw new Error("expected script to fail");
}

describe("verify-focss-imports", () => {
  it("verifies that package CSS imports resolve to an actual file", () => {
    const fixture = makeFixture();
    try {
      expect(run(fixture.root)).toContain("verify-focss-imports: ok");

      fs.rmSync(fixture.importedFile);
      expect(runExpectFail(fixture.root)).toMatch(
        /site[\\/]focss[\\/]entry\.css: cannot resolve tw-animate-css\/dist\/tw-animate\.css/,
      );
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
