import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  callPlannerAdvisor,
  mapLegacyAdvisorUiContext,
  PLANNER_ADVISOR_API_PATH,
  PlannerAdvisorClientError,
} from "@/lib/ai/mastra/client";
import { browserApiFetch } from "@/lib/api/browserApi";

vi.mock("@/lib/api/browserApi", () => ({
  browserApiFetch: vi.fn(),
}));

describe("plannerAdvisorClient", () => {
  beforeEach(() => {
    vi.mocked(browserApiFetch).mockReset();
  });

  it("maps legacy UI context to planner advisor context", () => {
    expect(
      mapLegacyAdvisorUiContext({
        plannerType: "planner",
        teamSize: 12,
        roomArea: 900,
        currentElements: 4,
      }),
    ).toEqual({
      planner: "unified",
      seatCount: 12,
      floorAreaSqFt: 900,
      currentShapeCount: 4,
    });
  });

  it("calls planner ai-advisor with chat payload", async () => {
    vi.mocked(browserApiFetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          content: "Try a bench layout.",
          provider: "gemini",
        }),
    } as Response);

    const result = await callPlannerAdvisor({
      mode: "chat",
      messages: [{ role: "user", content: "layout tips" }],
      context: { planner: "unified", seatCount: 8 },
    });

    expect(browserApiFetch).toHaveBeenCalledWith(
      PLANNER_ADVISOR_API_PATH,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          mode: "chat",
          messages: [{ role: "user", content: "layout tips" }],
          context: { planner: "unified", seatCount: 8 },
        }),
      }),
    );
    expect(result.content).toBe("Try a bench layout.");
    expect(result.provider).toBe("gemini");
  });

  it("throws PlannerAdvisorClientError on HTTP failure", async () => {
    vi.mocked(browserApiFetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: { message: "AI unavailable" } }),
    } as Response);

    await expect(
      callPlannerAdvisor({
        mode: "chat",
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toBeInstanceOf(PlannerAdvisorClientError);
  });
});
