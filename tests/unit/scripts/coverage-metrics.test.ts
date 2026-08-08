// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  addMetrics,
  dualRollupFromFinal,
  emptyMetrics,
  fileCounts,
  finalizeMetrics,
  lineCounts,
  pct,
} from "../../../scripts/coverage-metrics.mjs";

describe("coverage-metrics (name-mirror)", () => {
  it("computes pct with one decimal", () => {
    expect(pct(1, 2)).toBe(50);
    expect(pct(1, 3)).toBe(33.3);
    expect(pct(0, 0)).toBe(0);
  });

  it("prefers direct line map when present", () => {
    expect(lineCounts({ l: { 1: 1, 2: 0, 3: 2 } })).toEqual({
      covered: 2,
      total: 3,
    });
  });

  it("derives lines from statementMap when l is missing", () => {
    const cov = {
      s: { "0": 1, "1": 0, "2": 1 },
      statementMap: {
        "0": { start: { line: 10 } },
        "1": { start: { line: 11 } },
        "2": { start: { line: 10 } },
      },
    };
    expect(lineCounts(cov)).toEqual({ covered: 1, total: 2 });
  });

  it("aggregates statement, function, branch, and line counts", () => {
    const cov = {
      s: { "0": 1, "1": 0 },
      f: { "0": 2, "1": 0 },
      b: { "0": [1, 0], "1": [0] },
      l: { 1: 1, 2: 0 },
    };
    expect(fileCounts(cov)).toEqual({
      stmtCovered: 1,
      stmtTotal: 2,
      fnCovered: 1,
      fnTotal: 2,
      brCovered: 1,
      brTotal: 3,
      lineCovered: 1,
      lineTotal: 2,
    });
  });

  it("adds and finalizes metric buckets", () => {
    const bucket = emptyMetrics();
    addMetrics(bucket, {
      s: { "0": 1, "1": 0 },
      f: { "0": 1 },
      b: { "0": [1] },
      l: { 1: 1, 2: 0 },
    });
    finalizeMetrics(bucket);
    expect(bucket.statements).toEqual({ covered: 1, total: 2, pct: 50 });
    expect(bucket.functions.pct).toBe(100);
    expect(bucket.lines.pct).toBe(50);
  });

  it("splits dual rollup into full vs touched files", () => {
    const rollup = dualRollupFromFinal({
      "/a.ts": { s: { "0": 1 }, f: {}, b: {}, l: { 1: 1 } },
      "/b.ts": { s: { "0": 0 }, f: {}, b: {}, l: { 1: 0 } },
    });
    expect(rollup.filesFull).toBe(2);
    expect(rollup.filesTouched).toBe(1);
    expect(rollup.filesZero).toBe(1);
    expect(rollup.full.statements.total).toBe(2);
    expect(rollup.touched.statements.total).toBe(1);
    expect(rollup.touched.statements.pct).toBe(100);
  });
});
