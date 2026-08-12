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
  "scripts/general/check-plans-purity.mjs",
);

const ROOT_PLANS = [
  "sample-plan.md",
];

/** Layout pinned by check:plans-purity: flat Markdown plans with no retired names. */
function makeFixture(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-plans-purity-"));
  const planRoot = path.join(tmp, "plans");
  fs.mkdirSync(planRoot, { recursive: true });
  fs.writeFileSync(path.join(planRoot, "README.md"), "# root\n");
  for (const doc of ROOT_PLANS) {
    fs.writeFileSync(path.join(planRoot, doc), `# ${doc}\n`);
  }
  return tmp;
}

function run(tmp: string) {
  return execFileSync(process.execPath, [scriptPath], {
    cwd: monorepoRoot,
    encoding: "utf8",
    env: { ...process.env, PLANS_PURITY_ROOT: tmp },
  });
}

function runExpectFail(tmp: string): string {
  try {
    run(tmp);
  } catch (error) {
    const err = error as { status?: number; stderr?: string; stdout?: string };
    expect(err.status).toBe(1);
    return `${err.stderr ?? ""}${err.stdout ?? ""}`;
  }
  throw new Error("expected script to fail");
}

describe("check-plans-purity", () => {
  it("passes when plans/ is absent (retired programme tree)", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-plans-purity-absent-"));
    try {
      expect(run(tmp)).toContain("no plans/ directory");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("accepts README + six root programme plans", () => {
    const tmp = makeFixture();
    try {
      expect(run(tmp)).toContain("check:plans-purity OK");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("fails when README.md is missing", () => {
    const tmp = makeFixture();
    try {
      fs.rmSync(path.join(tmp, "plans", "README.md"));
      expect(runExpectFail(tmp)).toContain("missing: plans/README.md");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects an extra root plan doc", () => {
    const tmp = makeFixture();
    try {
      fs.writeFileSync(
        path.join(tmp, "plans", "predeploy.md"),
        "# predeploy\n",
      );
      expect(runExpectFail(tmp)).toContain(
        "unexpected plan doc: plans/predeploy.md",
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects programme subfolders", () => {
    const tmp = makeFixture();
    try {
      const planRoot = path.join(tmp, "plans");
      fs.mkdirSync(path.join(planRoot, "ui-polish"), { recursive: true });
      fs.writeFileSync(path.join(planRoot, "ui-polish", "README.md"), "# ui-polish\n");
      expect(runExpectFail(tmp)).toContain(
        "unexpected plan subfolder: plans/ui-polish/",
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects retired plan doc names in nested paths", () => {
    const tmp = makeFixture();
    try {
      fs.writeFileSync(path.join(tmp, "plans", "FEATURES.md"), "# features\n");
      expect(runExpectFail(tmp)).toContain(
        "retired plan doc name: plans/FEATURES.md",
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects non-Markdown clutter under plans/", () => {
    const tmp = makeFixture();
    try {
      fs.writeFileSync(path.join(tmp, "plans", "notes.txt"), "scratch\n");
      expect(runExpectFail(tmp)).toContain(
        "unexpected non-Markdown file: plans/notes.txt",
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
