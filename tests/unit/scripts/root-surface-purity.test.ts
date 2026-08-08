// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  MAX_EXTRA_ROOT_MD,
  OPTIONAL_ROOT_MD,
  PINNED_ROOT_MD,
  findRootSurfaceViolations,
} from "../../../scripts/general/root-surface-purity.mjs";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function makeRootFixture(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "root-surface-"));
  for (const name of PINNED_ROOT_MD) {
    fs.writeFileSync(path.join(tmp, name), `# ${name}\n`);
  }
  fs.writeFileSync(path.join(tmp, "vitest.config.ts"), "export default {}\n");
  return tmp;
}

describe("root-surface-purity", () => {
  it("accepts pinned Markdown plus at most two extras", () => {
    const tmp = makeRootFixture();
    try {
      fs.writeFileSync(path.join(tmp, "handoff.md"), "# handoff\n");
      fs.writeFileSync(path.join(tmp, "01-handover.md"), "# handover\n");
      expect(findRootSurfaceViolations(tmp)).toEqual([]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("treats optional root Markdown as non-extras when listed", () => {
    const tmp = makeRootFixture();
    try {
      fs.writeFileSync(path.join(tmp, "handoff.md"), "# handoff\n");
      fs.writeFileSync(path.join(tmp, "01-handover.md"), "# handover\n");
      expect(findRootSurfaceViolations(tmp)).toEqual([]);
      expect(OPTIONAL_ROOT_MD.size).toBe(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it(`fails when more than ${MAX_EXTRA_ROOT_MD} extra root Markdown files exist`, () => {
    const tmp = makeRootFixture();
    try {
      fs.writeFileSync(path.join(tmp, "handoff.md"), "# handoff\n");
      fs.writeFileSync(path.join(tmp, "01-handover.md"), "# handover\n");
      fs.writeFileSync(path.join(tmp, "notes.md"), "# notes\n");
      fs.writeFileSync(
        path.join(tmp, "security_best_practices_report.md"),
        "# report\n",
      );
      const violations = findRootSurfaceViolations(tmp);
      expect(violations.some((v) => v.includes("too many extra root Markdown"))).toBe(
        true,
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("fails on stray root scripts outside the allow-list", () => {
    const tmp = makeRootFixture();
    try {
      fs.writeFileSync(path.join(tmp, "audit-env-once.mjs"), "console.log(1)\n");
      const violations = findRootSurfaceViolations(tmp);
      expect(violations.some((v) => v.includes("FORBIDDEN root script: audit-env-once.mjs"))).toBe(
        true,
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("live repo root currently has at most three extras or reports them", () => {
    const violations = findRootSurfaceViolations(monorepoRoot);
    const extraMd = violations.filter((v) => v.includes("too many extra root Markdown"));
    const strayScripts = violations.filter((v) => v.includes("FORBIDDEN root script"));
    expect(strayScripts).toEqual([]);
    expect(extraMd.length === 0 || extraMd.length === 1).toBe(true);
  });
});
