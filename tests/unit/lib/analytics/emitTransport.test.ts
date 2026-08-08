import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockVercelTrack = vi.fn();
vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => mockVercelTrack(...args),
}));

import {
  isAnalyticsTransportReady,
  sendAnalyticsEvent,
} from "@/lib/analytics/emitTransport";

describe("emitTransport", () => {
  beforeEach(() => {
    mockVercelTrack.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is not ready when va is missing", () => {
    vi.stubGlobal("window", {});
    expect(isAnalyticsTransportReady()).toBe(false);
  });

  it("is ready when va is a function (real Vercel shape)", () => {
    vi.stubGlobal("window", { va: vi.fn() });
    expect(isAnalyticsTransportReady()).toBe(true);
  });

  it("uses package track — not window.va.track", () => {
    const va = vi.fn();
    vi.stubGlobal("window", { va, vaq: [] });
    const ok = sendAnalyticsEvent("test_event", { a: 1 });
    expect(ok).toBe(true);
    expect(mockVercelTrack).toHaveBeenCalledWith("test_event", { a: 1 });
    // Must NOT require va.track object shape
    expect((va as { track?: unknown }).track).toBeUndefined();
  });
});
