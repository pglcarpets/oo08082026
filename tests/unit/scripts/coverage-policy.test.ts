// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  COVERAGE_GATE,
  COVERAGE_GATE_ADMIN,
  COVERAGE_GATE_PLANNER,
  COVERAGE_GATE_SITE,
  COVERAGE_INVENTORY_ASPIRATION,
  coverageReadmeForAgents,
  fileStatusVsGate,
  isHighMassFile,
  isLargeBucket,
} from "../../../scripts/coverage-policy.mjs";

describe("coverage-policy (name-mirror)", () => {
  it("exposes 95% floors for planner, site, and admin gates", () => {
    for (const gate of [COVERAGE_GATE_PLANNER, COVERAGE_GATE_SITE, COVERAGE_GATE_ADMIN]) {
      expect(gate.statements).toBe(95);
      expect(gate.branches).toBe(95);
      expect(gate.functions).toBe(95);
      expect(gate.lines).toBe(95);
    }
    expect(COVERAGE_GATE_SITE.profile).toBe("site");
    expect(COVERAGE_GATE).toBe(COVERAGE_GATE_SITE);
  });

  it("marks inventory aspiration at the same 95% quality bar", () => {
    expect(COVERAGE_INVENTORY_ASPIRATION.statements).toBe(95);
    expect(COVERAGE_INVENTORY_ASPIRATION.profile).toBe("planner-inventory");
  });

  it("classifies pct against gate", () => {
    expect(fileStatusVsGate(96, "lines", "site")).toContain("PASS");
    expect(fileStatusVsGate(50, "lines", "site")).toContain("PARTIAL");
    expect(fileStatusVsGate(10, "lines", "site")).toContain("LOW");
    expect(fileStatusVsGate(0, "lines", "site")).toContain("FAIL");
    expect(fileStatusVsGate(95, "lines", "planner")).toContain("PASS");
    expect(fileStatusVsGate(70, "lines", "planner")).toContain("PARTIAL");
  });

  it("detects high-mass and large-bucket shares", () => {
    expect(isHighMassFile(100, 10000, 0.01)).toBe(true);
    expect(isHighMassFile(50, 10000, 0.01)).toBe(false);
    expect(isHighMassFile(1, 0)).toBe(false);
    expect(isLargeBucket(500, 10000, 0.05)).toBe(true);
    expect(isLargeBucket(100, 10000, 0.05)).toBe(false);
  });

  it("returns agent coverage readme text", () => {
    const text = coverageReadmeForAgents();
    expect(text).toContain("Gate files");
    expect(text).toContain("95/95/95/95");
  });
});
