import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const trackSitePageView = vi.fn();
const usePathname = vi.fn(() => "/products");
const useSearchParams = vi.fn(() => new URLSearchParams("utm=1"));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackSitePageView: (...args: unknown[]) => trackSitePageView(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

import { SiteConversionTracker } from "@/components/site/SiteConversionTracker";

describe("SiteConversionTracker (name-mirror)", () => {
  beforeEach(() => {
    trackSitePageView.mockClear();
    usePathname.mockReturnValue("/products");
    useSearchParams.mockReturnValue(new URLSearchParams("utm=1"));
    Object.defineProperty(document.documentElement, "lang", {
      configurable: true,
      value: "en",
    });
  });

  it("emits a page_view once per distinct path+query", () => {
    const { rerender } = render(<SiteConversionTracker />);
    expect(trackSitePageView).toHaveBeenCalledTimes(1);
    expect(trackSitePageView.mock.calls[0]?.[0]).toMatchObject({
      pathname: "/products",
      locale: "en",
    });

    // Same path+query must not re-emit even if the component re-renders.
    rerender(<SiteConversionTracker />);
    expect(trackSitePageView).toHaveBeenCalledTimes(1);

    usePathname.mockReturnValue("/contact");
    useSearchParams.mockReturnValue(new URLSearchParams());
    rerender(<SiteConversionTracker />);
    expect(trackSitePageView).toHaveBeenCalledTimes(2);
    expect(trackSitePageView.mock.calls[1]?.[0]).toMatchObject({
      pathname: "/contact",
      locale: "en",
    });
  });

  it("renders no visible DOM (tracker-only mount)", () => {
    const { container } = render(<SiteConversionTracker />);
    expect(container).toBeEmptyDOMElement();
  });
});
