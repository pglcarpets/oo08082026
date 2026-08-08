import { describe, it, expect } from "vitest";
import {
  SketchToPlanRequestSchema,
  buildSketchPlanFabricDraft,
  classifySketchConversionError,
  getSketchRecoveryMessage,
  normalizeSketchObjects,
  sketchObjectsToApplyPayload,
  SketchConversionError,
} from "@/lib/Planner/ai/sketchToPlanShared";

describe("sketchToPlanShared", () => {
  describe("SketchToPlanRequestSchema", () => {
    it("accepts png data url", () => {
      const parsed = SketchToPlanRequestSchema.safeParse({
        imageDataUrl: "data:image/png;base64,aaaa",
        fileName: "sketch.png",
        prompt: "office outline",
        includeRooms: true,
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects non-image data url", () => {
      const parsed = SketchToPlanRequestSchema.safeParse({
        imageDataUrl: "data:text/plain;base64,aaaa",
        fileName: "x.txt",
        prompt: "office",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("normalizeSketchObjects", () => {
    it("drops zero-length walls and reorders endpoints", () => {
      const out = normalizeSketchObjects([
        { type: "wall", x1: 1000, y1: 0, x2: 0, y2: 0 },
        { type: "wall", x1: 0, y1: 0, x2: 10, y2: 0 },
        { type: "room", left: 0, top: 0, width: 0, height: 100, label: "Bad" },
        { type: "room", left: 10, top: 20, width: 3000, height: 2000, label: "Office" },
      ]);
      expect(out).toEqual([
        { type: "wall", x1: 0, y1: 0, x2: 1000, y2: 0 },
        {
          type: "room",
          left: 10,
          top: 20,
          width: 3000,
          height: 2000,
          label: "Office",
        },
      ]);
    });
  });

  describe("sketchObjectsToApplyPayload", () => {
    it("maps walls and rooms to mm payload", () => {
      const payload = sketchObjectsToApplyPayload([
        { type: "wall", x1: 0, y1: 0, x2: 4000, y2: 0 },
        { type: "room", left: 100, top: 200, width: 3000, height: 2500 },
      ]);
      expect(payload.walls).toEqual([{ x1Mm: 0, y1Mm: 0, x2Mm: 4000, y2Mm: 0 }]);
      expect(payload.rooms[0]?.label).toBe("Room");
      expect(payload.rooms[0]?.widthMm).toBe(3000);
    });
  });

  describe("buildSketchPlanFabricDraft", () => {
    it("converts walls and rooms into fabric JSON", () => {
      const draftJson = buildSketchPlanFabricDraft(
        {
          objects: [
            { type: "wall", x1: 0, y1: 0, x2: 100, y2: 100 },
            { type: "room", left: 10, top: 10, width: 80, height: 80, label: "Office" },
          ],
          warnings: [],
        },
        { idFactory: () => "fixed-id" },
      );
      const draft = JSON.parse(draftJson) as {
        objects: Array<{ type: string; data?: { kind?: string; label?: string } }>;
      };
      expect(draft.objects).toHaveLength(2);
      expect(draft.objects[0]?.type).toBe("line");
      expect(draft.objects[0]?.data?.kind).toBe("wall");
      expect(draft.objects[1]?.type).toBe("rect");
      expect(draft.objects[1]?.data?.label).toBe("Office");
    });
  });

  describe("recovery helpers", () => {
    it("returns recovery messages", () => {
      expect(getSketchRecoveryMessage("missing_provider")).toContain("unavailable");
      expect(getSketchRecoveryMessage("timeout")).toContain("did not finish");
    });

    it("classifies errors", () => {
      const keep = new SketchConversionError("timeout", "a.png", "custom");
      expect(classifySketchConversionError(keep, "a.png")).toBe(keep);
      expect(classifySketchConversionError(new Error("timed out"), "a.png").reason).toBe(
        "timeout",
      );
      expect(
        classifySketchConversionError(new Error("provider credentials"), "a.png").reason,
      ).toBe("missing_provider");
    });
  });
});
