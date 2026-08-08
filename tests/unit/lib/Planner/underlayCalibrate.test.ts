import { describe, it, expect } from "vitest";
import {
  completeUnderlayPick,
  scaleFactorFromKnownWidth,
  startUnderlayPick,
  UNDERLAY_KNOWN_WIDTH_5M_MM,
  isSupportedFloorPlanImage,
} from "@/lib/Planner/underlayCalibrate";

describe("underlayCalibrate", () => {
  it("computes mm per image px from two points + known length", () => {
    const s1 = startUnderlayPick(5000);
    const mid = completeUnderlayPick(s1, { x: 0, y: 0 });
    expect(mid.kind).toBe("need-second");
    if (mid.kind !== "need-second") return;
    const done = completeUnderlayPick(mid.session, { x: 1000, y: 0 });
    expect(done.kind).toBe("complete");
    if (done.kind === "complete") {
      expect(done.mmPerPx).toBe(5);
    }
  });

  it("5 m width preset maps image width", () => {
    const factor = scaleFactorFromKnownWidth({
      imageWidthPx: 2000,
      knownWidthMm: UNDERLAY_KNOWN_WIDTH_5M_MM,
    });
    expect(factor).toBe(UNDERLAY_KNOWN_WIDTH_5M_MM / 2000);
  });

  it("accepts common image types", () => {
    expect(isSupportedFloorPlanImage({ name: "a.png", type: "image/png" })).toBe(true);
    expect(isSupportedFloorPlanImage({ name: "a.txt", type: "text/plain" })).toBe(false);
  });
});
