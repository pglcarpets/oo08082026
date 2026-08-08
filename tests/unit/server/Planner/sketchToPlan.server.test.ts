import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequestProviderText = vi.hoisted(() => vi.fn());
const mockResolveProviderChain = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/mastra", () => ({
  resolveProviderChain: mockResolveProviderChain,
  requestProviderText: mockRequestProviderText,
}));

import {
  parseSketchResponse,
  requestSketchToPlan,
} from "@/server/Planner/sketchToPlan.server";

describe("sketchToPlan.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseSketchResponse", () => {
    it("extracts JSON from surrounding text and normalizes walls", () => {
      const raw = `Here you go:\n${JSON.stringify({
        objects: [{ type: "wall", x1: 500, y1: 0, x2: 0, y2: 0 }],
        warnings: [],
      })}`;
      const parsed = parseSketchResponse(raw);
      expect(parsed?.objects).toEqual([
        { type: "wall", x1: 0, y1: 0, x2: 500, y2: 0 },
      ]);
    });

    it("returns null on garbage", () => {
      expect(parseSketchResponse("not json")).toBeNull();
    });
  });

  describe("requestSketchToPlan", () => {
    it("throws missing_provider when chain empty", async () => {
      mockResolveProviderChain.mockReturnValue([]);
      await expect(
        requestSketchToPlan({
          imageDataUrl: "data:image/png;base64,aa",
          fileName: "sketch.png",
          prompt: "office",
          includeRooms: true,
        }),
      ).rejects.toThrow(/unavailable/i);
    });

    it("parses provider JSON into walls", async () => {
      mockResolveProviderChain.mockReturnValue([
        { provider: "gemini", apiKey: "k", baseURL: "u", model: "m" },
      ]);
      mockRequestProviderText.mockResolvedValue(
        JSON.stringify({
          objects: [{ type: "wall", x1: 0, y1: 0, x2: 4000, y2: 0 }],
          warnings: [],
        }),
      );
      const result = await requestSketchToPlan({
        imageDataUrl: "data:image/png;base64,aa",
        fileName: "sketch.png",
        prompt: "office",
        includeRooms: true,
      });
      expect(result.objects).toHaveLength(1);
      expect(result.objects[0]?.type).toBe("wall");
    });

    it("throws low_confidence when warnings say so", async () => {
      mockResolveProviderChain.mockReturnValue([
        { provider: "gemini", apiKey: "k", baseURL: "u", model: "m" },
      ]);
      mockRequestProviderText.mockResolvedValue(
        JSON.stringify({
          objects: [{ type: "wall", x1: 0, y1: 0, x2: 1000, y2: 0 }],
          warnings: ["low confidence layout conversion"],
        }),
      );
      await expect(
        requestSketchToPlan({
          imageDataUrl: "data:image/png;base64,aa",
          fileName: "sketch.png",
          prompt: "office",
          includeRooms: true,
        }),
      ).rejects.toThrow(/low confidence/i);
    });
  });
});
