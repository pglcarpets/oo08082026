import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThemeAdmin } from "@/lib/theme/useThemeAdmin";
import { browserApiFetch } from "@/lib/api/browserApi";

vi.mock("@/lib/api/browserApi", () => ({
  browserApiFetch: vi.fn(),
  apiPath: vi.fn((path) => path),
}));

describe("useThemeAdmin Hook", () => {
  const globalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = globalFetch;
  });

  it("should load presets on mount", async () => {
    const mockData = {
      presets: [
        { id: "theme-1", name: "Theme 1", description: "Desc 1", tokenCount: 5, isActive: true },
        { id: "theme-2", name: "Theme 2", description: "Desc 2", tokenCount: 8, isActive: false },
      ],
      activeThemeId: "theme-1",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useThemeAdmin());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.presets).toEqual(mockData.presets);
    expect(result.current.activeThemeId).toBe("theme-1");
    expect(result.current.error).toBeNull();
  });

  it("should handle error on mount if fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useThemeAdmin());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("HTTP 500");
  });

  it("should switch theme successfully", async () => {
    const initialData = {
      presets: [
        { id: "theme-1", name: "Theme 1", description: "Desc 1", tokenCount: 5, isActive: true },
        { id: "theme-2", name: "Theme 2", description: "Desc 2", tokenCount: 8, isActive: false },
      ],
      activeThemeId: "theme-1",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => initialData,
    });

    vi.mocked(browserApiFetch).mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    const { result } = renderHook(() => useThemeAdmin());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.switchTheme("theme-2");
    });

    expect(success).toBe(true);
    expect(result.current.activeThemeId).toBe("theme-2");
    expect(result.current.presets[0].isActive).toBe(false);
    expect(result.current.presets[1].isActive).toBe(true);
    expect(browserApiFetch).toHaveBeenCalledWith("/api/theme/manage/", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ presetId: "theme-2" }),
    }));
  });

  it("should set error if switch theme fails", async () => {
    const initialData = {
      presets: [
        { id: "theme-1", name: "Theme 1", description: "Desc 1", tokenCount: 5, isActive: true },
      ],
      activeThemeId: "theme-1",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => initialData,
    });

    vi.mocked(browserApiFetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid preset" }), { status: 400 }),
    );

    const { result } = renderHook(() => useThemeAdmin());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.switchTheme("invalid-theme");
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Invalid preset");
  });
});
