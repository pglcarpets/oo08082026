import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockTrack = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

import {
  trackSiteCtaClick,
  trackPlannerLaunchClicked,
  trackSiteSearchSubmitted,
  trackSitePageView,
  emitSiteEvent,
  flushAnalyticsAfterConsent,
  _trackCompareToggled,
  _trackQuoteCartAdded,
  _trackContactSubmission,
} from "@/lib/analytics/siteEvents";
import {
  CONSENT_ACCEPTED,
  CONSENT_COOKIE,
  CONSENT_REJECTED,
} from "@/lib/consent";
import { clearConversionDedupe } from "@/lib/analytics/conversionContract";
import {
  _clearSiteEventQueueForTests,
  _queuedSiteEventCountForTests,
} from "@/lib/analytics/eventQueue";

describe("siteEvents", () => {
  beforeEach(() => {
    mockTrack.mockClear();
    clearConversionDedupe();
    _clearSiteEventQueueForTests();
    // Mark transport ready (va as function — real Vercel shape)
    vi.stubGlobal("window", {
      va: vi.fn(),
      vaq: [],
    });
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    clearConversionDedupe();
    _clearSiteEventQueueForTests();
  });

  it("CTA: no emit before consent; queues until accept", () => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    trackSiteCtaClick({
      href: "/contact",
      label: "Contact",
      pathname: "/home",
      surface: "hero",
    });
    expect(mockTrack).not.toHaveBeenCalled();
    expect(_queuedSiteEventCountForTests()).toBe(1);

    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    flushAnalyticsAfterConsent();
    expect(mockTrack).toHaveBeenCalledWith("contact_cta_clicked", {
      href: "/contact",
      label: "Contact",
      pathname: "/home",
      surface: "hero",
    });
  });

  it("PAGE_VIEW: no emit before consent; queues until accept", () => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    trackSitePageView({ pathname: "/about", locale: "en" });
    expect(mockTrack).not.toHaveBeenCalled();
    expect(_queuedSiteEventCountForTests()).toBe(1);

    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    flushAnalyticsAfterConsent();
    expect(mockTrack).toHaveBeenCalledWith(
      "page_view",
      expect.objectContaining({ pathname: "/about", locale: "en" }),
    );
  });

  it("PLANNER_ENTRY: no emit before consent; queues launch + entry until accept", () => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    trackPlannerLaunchClicked({
      sourcePage: "/home",
      surface: "hero",
      productSlug: "chair",
      categoryId: "seating",
    });
    expect(mockTrack).not.toHaveBeenCalled();
    // planner_launch_clicked + planner_entry
    expect(_queuedSiteEventCountForTests()).toBe(2);

    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    flushAnalyticsAfterConsent();
    expect(mockTrack).toHaveBeenCalledWith(
      "planner_launch_clicked",
      expect.objectContaining({
        pathname: "/home",
        surface: "hero",
        productSlug: "chair",
        categoryId: "seating",
      }),
    );
    expect(mockTrack).toHaveBeenCalledWith(
      "planner_entry",
      expect.objectContaining({
        sourcePage: "/home",
        locale: "en",
      }),
    );
  });

  it("does not queue after reject", () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}; path=/`;
    trackSiteCtaClick({
      href: "/contact",
      label: "Contact",
      pathname: "/home",
      surface: "hero",
    });
    trackSitePageView({ pathname: "/about", locale: "en" });
    expect(mockTrack).not.toHaveBeenCalled();
    expect(_queuedSiteEventCountForTests()).toBe(0);
  });

  it("emits events correctly based on href category", () => {
    trackSiteCtaClick({
      href: "/downloads/pdf",
      label: "Download",
      pathname: "/home",
      surface: "hero",
    });
    expect(mockTrack).toHaveBeenCalledWith("resource_desk_clicked", {
      href: "/downloads/pdf",
      label: "Download",
      pathname: "/home",
      surface: "hero",
    });

    trackSiteCtaClick({
      href: "https://wa.me/something",
      label: "WhatsApp",
      pathname: "/home",
      surface: "hero",
    });
    expect(mockTrack).toHaveBeenCalledWith("whatsapp_contact_clicked", {
      href: "https://wa.me/something",
      label: "WhatsApp",
      pathname: "/home",
      surface: "hero",
    });
  });

  it("tracks launch, search, compare, quote and contact events", () => {
    trackPlannerLaunchClicked({
      sourcePage: "/home",
      surface: "hero",
      productSlug: "chair",
      categoryId: "seating",
    });
    expect(mockTrack).toHaveBeenCalledWith(
      "planner_launch_clicked",
      expect.objectContaining({
        pathname: "/home",
        surface: "hero",
        productSlug: "chair",
        categoryId: "seating",
      }),
    );

    trackSiteSearchSubmitted({
      pathname: "/",
      surface: "header",
      queryLength: 3,
      destination: "/products",
    });
    expect(mockTrack).toHaveBeenCalledWith(
      "site_search_submitted",
      expect.objectContaining({ surface: "header", queryLength: 3 }),
    );

    _trackCompareToggled({
      pathname: "/compare",
      surface: "dock",
      categoryId: "seating",
      productId: "p1",
      nextState: "added",
    });
    _trackQuoteCartAdded({
      pathname: "/products",
      surface: "pdp",
      productId: "p1",
    });
    _trackContactSubmission({
      pathname: "/contact",
      surface: "form",
      source: "home",
      status: "success",
    });
    expect(mockTrack).toHaveBeenCalledWith(
      "contact_submission",
      expect.objectContaining({ status: "success" }),
    );
  });

  it("page view uses conversion contract path", () => {
    trackSitePageView({ pathname: "/about", locale: "en" });
    expect(mockTrack).toHaveBeenCalledWith(
      "page_view",
      expect.objectContaining({ pathname: "/about", locale: "en" }),
    );
  });

  it("flushes queue after consent", () => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
    emitSiteEvent("queued_event", { x: 1 });
    expect(mockTrack).not.toHaveBeenCalled();
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    flushAnalyticsAfterConsent();
    expect(mockTrack).toHaveBeenCalledWith("queued_event", { x: 1 });
  });
});
