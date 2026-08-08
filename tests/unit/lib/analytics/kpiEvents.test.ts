import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockTrack = vi.fn();
vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

import {
  trackKpiRendered,
  trackKpiFallbackUsed,
  trackKpiMismatchDetected,
  compareKpiField,
} from "@/lib/analytics/kpiEvents";
import {
  CONSENT_ACCEPTED,
  CONSENT_COOKIE,
  CONSENT_REJECTED,
} from "@/lib/consent";
import {
  _clearSiteEventQueueForTests,
  _queuedSiteEventCountForTests,
} from "@/lib/analytics/eventQueue";

describe("kpiEvents", () => {
  beforeEach(() => {
    mockTrack.mockClear();
    _clearSiteEventQueueForTests();
    vi.stubGlobal("window", {
      va: vi.fn(),
      vaq: [],
    });
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
  });

  afterEach(() => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    _clearSiteEventQueueForTests();
  });

  it("does not emit without analytics consent", () => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    trackKpiRendered({ asOfDate: "2026-06-26", source: "supabase" });
    expect(mockTrack).not.toHaveBeenCalled();
    expect(_queuedSiteEventCountForTests()).toBe(1);
  });

  it("does not emit or queue when consent is rejected", () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}; path=/`;
    trackKpiRendered({ asOfDate: "2026-06-26", source: "supabase" });
    expect(mockTrack).not.toHaveBeenCalled();
    expect(_queuedSiteEventCountForTests()).toBe(0);
  });

  it("calls track when trackKpiRendered is called", () => {
    trackKpiRendered({ asOfDate: "2026-06-26", source: "supabase" });
    expect(mockTrack).toHaveBeenCalledWith("kpi_rendered", {
      asOfDate: "2026-06-26",
      source: "supabase",
    });
  });

  it("calls track when trackKpiFallbackUsed is called", () => {
    trackKpiFallbackUsed({ source: "safe-default" });
    expect(mockTrack).toHaveBeenCalledWith("kpi_fallback_used", {
      source: "safe-default",
    });
  });

  it("calls track when trackKpiMismatchDetected is called", () => {
    trackKpiMismatchDetected({
      page: "/home",
      field: "projects",
      expected: 10,
      actual: 8,
    });
    expect(mockTrack).toHaveBeenCalledWith("kpi_mismatch_detected", {
      page: "/home",
      field: "projects",
      expected: 10,
      actual: 8,
    });
  });

  it("compareKpiField emits only on mismatch", () => {
    compareKpiField("/home", "projects", 10, 10);
    expect(mockTrack).not.toHaveBeenCalled();
    compareKpiField("/home", "projects", 8, 10);
    expect(mockTrack).toHaveBeenCalled();
  });
});
