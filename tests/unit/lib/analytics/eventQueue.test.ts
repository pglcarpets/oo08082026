import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockTrack = vi.fn();
vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

import {
  enqueueSiteEvent,
  flushSiteEventQueue,
  _clearSiteEventQueueForTests,
  _queuedSiteEventCountForTests,
} from "@/lib/analytics/eventQueue";
import {
  CONSENT_ACCEPTED,
  CONSENT_COOKIE,
  CONSENT_REJECTED,
} from "@/lib/consent";

describe("eventQueue", () => {
  beforeEach(() => {
    mockTrack.mockClear();
    _clearSiteEventQueueForTests();
    vi.stubGlobal("window", {
      va: vi.fn(),
      vaq: [],
      location: { protocol: "http:" },
    });
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
  });

  afterEach(() => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    _clearSiteEventQueueForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("never flushes without analytics consent", () => {
    enqueueSiteEvent("queued_a", { n: 1 });
    expect(_queuedSiteEventCountForTests()).toBe(1);
    expect(flushSiteEventQueue()).toBe(0);
    expect(mockTrack).not.toHaveBeenCalled();
    expect(_queuedSiteEventCountForTests()).toBe(1);
  });

  it("never flushes when consent is rejected", () => {
    enqueueSiteEvent("queued_b", { n: 2 });
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}; path=/`;
    expect(flushSiteEventQueue()).toBe(0);
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("flushes queued events only after accept", () => {
    enqueueSiteEvent("page_view", { pathname: "/", locale: "en" });
    enqueueSiteEvent("contact_cta_clicked", {
      href: "/contact",
      label: "Contact",
      pathname: "/",
      surface: "hero",
    });
    expect(mockTrack).not.toHaveBeenCalled();

    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    expect(flushSiteEventQueue()).toBe(2);
    expect(mockTrack).toHaveBeenCalledTimes(2);
    expect(mockTrack).toHaveBeenNthCalledWith(1, "page_view", {
      pathname: "/",
      locale: "en",
    });
    expect(mockTrack).toHaveBeenNthCalledWith(2, "contact_cta_clicked", {
      href: "/contact",
      label: "Contact",
      pathname: "/",
      surface: "hero",
    });
    expect(_queuedSiteEventCountForTests()).toBe(0);
  });

  it("re-queues when transport is not ready after accept", () => {
    enqueueSiteEvent("planner_entry", { sourcePage: "/", locale: "en" });
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    vi.stubGlobal("window", {
      location: { protocol: "http:" },
    });
    // vercel track runs but isAnalyticsTransportReady is false → send returns false
    expect(flushSiteEventQueue()).toBe(0);
    expect(_queuedSiteEventCountForTests()).toBe(1);
  });

  it("caps queue length at 40", () => {
    for (let i = 0; i < 45; i += 1) {
      enqueueSiteEvent(`evt_${i}`, { i });
    }
    expect(_queuedSiteEventCountForTests()).toBe(40);
  });
});
