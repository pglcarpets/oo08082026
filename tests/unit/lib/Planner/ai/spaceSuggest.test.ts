import { describe, it, expect } from "vitest";
import { heuristicSpaceSuggest, parseSpaceSuggestJson } from "@/lib/Planner/ai/spaceSuggest";
import { planPlacements } from "@/lib/Planner/ai/applySuggestedLayout";
import { validateLayoutSchema } from "@/lib/Planner/ai/validateLayoutSchema";

describe("spaceSuggest", () => {
  it("heuristic produces valid layout", () => {
    const result = heuristicSpaceSuggest({ seatTarget: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.layout.items.length).toBe(4);
    const ops = planPlacements(result.layout, {
      "desk-a": { widthMm: 1200, depthMm: 600, name: "Desk A" },
    });
    expect(ops).toHaveLength(4);
  });

  it("skips unknown catalog ids", () => {
    const layout = validateLayoutSchema({
      room: { widthMm: 8000, depthMm: 6000 },
      items: [
        { catalogId: "desk-a", xMm: 1000, yMm: 1000, rotationDeg: 0 },
        { catalogId: "nope", xMm: 0, yMm: 0, rotationDeg: 0 },
      ],
    });
    expect(layout.ok).toBe(true);
    if (!layout.ok) return;
    const ops = planPlacements(layout.layout, {
      "desk-a": { widthMm: 1200, depthMm: 600, name: "Desk A" },
    });
    expect(ops).toHaveLength(1);
  });

  it("parseSpaceSuggestJson rejects garbage", () => {
    expect(parseSpaceSuggestJson("not-json").ok).toBe(false);
  });
});
