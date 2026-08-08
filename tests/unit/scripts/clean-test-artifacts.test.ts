// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { describe, expect, it } from "vitest";

import {
  STALE_ROOT_FILES,
  cleanStaleRootArtifacts,
  listStaleRootArtifacts,
} from "../../../scripts/clean-test-artifacts.mjs";

describe("clean-test-artifacts", () => {
  it("lists fixed stale root files and scratch_* patterns", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-test-artifacts-"));
    try {
      for (const name of STALE_ROOT_FILES) {
        fs.writeFileSync(path.join(tmp, name), "stale");
      }
      fs.writeFileSync(path.join(tmp, "scratch_agent.txt"), "scratch");
      fs.mkdirSync(path.join(tmp, "test-results"));

      const hits = listStaleRootArtifacts(tmp).map((hit) => path.basename(hit));
      expect(hits).toEqual(
        expect.arrayContaining([
          ...STALE_ROOT_FILES,
          "scratch_agent.txt",
          "test-results",
        ]),
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("removes stale root artifacts when not in dry-run mode", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-test-artifacts-"));
    try {
      fs.writeFileSync(path.join(tmp, "tsc-errors.txt"), "stale");
      fs.writeFileSync(path.join(tmp, "scratch_note.txt"), "scratch");

      const { removed } = cleanStaleRootArtifacts(tmp);
      expect(removed.map((hit) => path.basename(hit))).toEqual(
        expect.arrayContaining(["tsc-errors.txt", "scratch_note.txt"]),
      );
      expect(listStaleRootArtifacts(tmp)).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
