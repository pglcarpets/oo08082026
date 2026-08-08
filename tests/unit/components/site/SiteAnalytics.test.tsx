import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { CONSENT_ACCEPTED, CONSENT_COOKIE, CONSENT_REJECTED } from "@/lib/consent";

const analyticsBeforeSend = vi.fn();
const speedBeforeSend = vi.fn();

vi.mock("@vercel/analytics/react", () => ({
  Analytics: ({
    beforeSend,
  }: {
    beforeSend?: (event: { type: string; url: string }) => unknown;
  }) => {
    if (beforeSend) analyticsBeforeSend.mockImplementation(beforeSend);
    return <div data-testid="vercel-analytics" />;
  },
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: ({
    beforeSend,
  }: {
    beforeSend?: (event: { type: string; url: string }) => unknown;
  }) => {
    if (beforeSend) speedBeforeSend.mockImplementation(beforeSend);
    return <div data-testid="vercel-speed-insights" />;
  },
}));

import { SiteAnalytics } from "@/components/site/SiteAnalytics";

describe("SiteAnalytics", () => {
  beforeEach(() => {
    analyticsBeforeSend.mockReset();
    speedBeforeSend.mockReset();
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
  });

  afterEach(() => {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
  });

  it("mounts Vercel Analytics and Speed Insights (required for window.va)", () => {
    const { getByTestId } = render(<SiteAnalytics />);
    expect(getByTestId("vercel-analytics")).toBeInTheDocument();
    expect(getByTestId("vercel-speed-insights")).toBeInTheDocument();
  });

  it("blocks automatic analytics/speed events before consent", () => {
    render(<SiteAnalytics />);
    const pageview = { type: "pageview", url: "https://example.com/" };
    const vital = { type: "vital", url: "https://example.com/" };

    expect(analyticsBeforeSend(pageview)).toBeNull();
    expect(speedBeforeSend(vital)).toBeNull();
  });

  it("allows automatic analytics/speed events after accept", () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}; path=/`;
    render(<SiteAnalytics />);
    const pageview = { type: "pageview", url: "https://example.com/contact" };
    const vital = { type: "vital", url: "https://example.com/contact" };

    expect(analyticsBeforeSend(pageview)).toEqual(pageview);
    expect(speedBeforeSend(vital)).toEqual(vital);
  });

  it("blocks automatic events when visitor rejected non-essential cookies", () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}; path=/`;
    render(<SiteAnalytics />);
    const pageview = { type: "pageview", url: "https://example.com/" };

    expect(analyticsBeforeSend(pageview)).toBeNull();
    expect(speedBeforeSend(pageview)).toBeNull();
  });
});
