import { describe, it, expect, vi } from "vitest";
import {
  serializeFabricCanvas,
  serializeFabricCanvasJson,
  PLANNER_FABRIC_OBJECT_PROPS,
} from "@/lib/Planner/plannerFabricSerialize";

describe("plannerFabricSerialize (Fabric v7)", () => {
  it("uses toObject with custom props", () => {
    const toObject = vi.fn(() => ({
      objects: [{ type: "line", data: { kind: "wall", id: "w1" } }],
    }));
    const canvas = { toObject };
    const json = serializeFabricCanvas(canvas as never);
    expect(toObject).toHaveBeenCalledWith([...PLANNER_FABRIC_OBJECT_PROPS]);
    expect(serializeFabricCanvasJson(canvas as never)).toContain("wall");
    expect(json.objects).toHaveLength(1);
  });
});
