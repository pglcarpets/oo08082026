import { describe, it, expect } from "vitest";
import {
  defaultProjectSetup,
  projectSetupSchema,
} from "@/lib/Planner/projectSetup/projectSetupSchema";

describe("projectSetupSchema", () => {
  it("accepts defaults", () => {
    const d = defaultProjectSetup();
    expect(d.projectName).toBe("Untitled Plan");
    expect(d.roomWidthMm).toBeGreaterThan(0);
  });

  it("rejects zero dimensions", () => {
    expect(
      projectSetupSchema.safeParse({
        projectName: "x",
        roomWidthMm: 0,
        roomDepthMm: 1000,
      }).success,
    ).toBe(false);
  });
});
