import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAiAdvisor } from "@/lib/ai/useAiAdvisor";
import { browserApiFetch } from "@/lib/api/browserApi";

vi.mock("@/lib/api/browserApi", () => ({
  browserApiFetch: vi.fn(),
}));

describe("useAiAdvisor", () => {
  beforeEach(() => {
    vi.mocked(browserApiFetch).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to planner ai-advisor and updates state on success", async () => {
    vi.mocked(browserApiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, content: "Hello there!" }),
    } as Response);

    const { result } = renderHook(() =>
      useAiAdvisor({
        context: { plannerType: "oando", teamSize: 8, roomArea: 1200, currentElements: 3 },
      }),
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);

    let promise: Promise<void> | undefined;
    act(() => {
      promise = result.current.sendMessage("Hi");
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.messages[0].content).toBe("Hi");
    expect(result.current.messages[0].role).toBe("user");

    await act(async () => {
      await promise;
    });

    expect(browserApiFetch).toHaveBeenCalledWith(
      "/api/planner/ai-advisor",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = JSON.parse(String(vi.mocked(browserApiFetch).mock.calls[0]?.[1]?.body ?? "{}")) as {
      mode?: string;
      context?: Record<string, unknown>;
    };
    expect(body.mode).toBe("chat");
    expect(body.context).toEqual({
      planner: "oando",
      seatCount: 8,
      floorAreaSqFt: 1200,
      currentShapeCount: 3,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toBe("Hello there!");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.error).toBeNull();
  });

  it("handles error response correctly", async () => {
    vi.mocked(browserApiFetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          success: false,
          error: { message: "Failed to connect" },
        }),
    } as Response);

    const { result } = renderHook(() => useAiAdvisor());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Failed to connect");
  });

  it("fails when advisor returns empty content", async () => {
    vi.mocked(browserApiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, content: "   " }),
    } as Response);

    const { result } = renderHook(() => useAiAdvisor());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.error).toBe("Advisor returned empty content");
    expect(result.current.messages).toHaveLength(1);
  });
});
