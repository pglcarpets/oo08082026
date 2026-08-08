import { describe, it, expect, vi } from "vitest";
import {
  serializeFabricCanvas,
  serializeFabricCanvasJson,
  STUDIO_FABRIC_OBJECT_PROPS,
} from "@/lib/Studio/studioFabricSerialize";

describe("studioFabricSerialize (Fabric v7)", () => {
  it("uses toObject with custom props (not toJSON with args)", () => {
    const toObject = vi.fn(() => ({
      version: "6",
      objects: [{ type: "rect", data: { kind: "shape" } }],
    }));
    const toJSON = vi.fn(() => ({ version: "6", objects: [] }));
    const canvas = { toObject, toJSON };

    const json = serializeFabricCanvas(canvas as never, STUDIO_FABRIC_OBJECT_PROPS);
    expect(toObject).toHaveBeenCalledWith([...STUDIO_FABRIC_OBJECT_PROPS]);
    expect(toJSON).not.toHaveBeenCalled();
    expect((json.objects as unknown[])[0]).toMatchObject({ data: { kind: "shape" } });

    const text = serializeFabricCanvasJson(canvas as never);
    expect(text).toContain('"kind":"shape"');
  });
});
