import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIntersectionObserver.lastInstance = this;
  }

  static lastInstance: MockIntersectionObserver | null = null;
}

const TestComponent = ({ threshold }: { threshold?: number }) => {
  const { ref, isVisible } = useInViewOnce(threshold);
  return (
    <div ref={ref} data-testid="target">
      {isVisible ? "Visible" : "Not Visible"}
    </div>
  );
};

describe("useInViewOnce", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    MockIntersectionObserver.lastInstance = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should start as not visible and observe the element", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("target").textContent).toBe("Not Visible");
    expect(MockIntersectionObserver.lastInstance).not.toBeNull();
    expect(MockIntersectionObserver.lastInstance?.observe).toHaveBeenCalled();
  });

  it("should set visible and disconnect observer when intersecting", () => {
    render(<TestComponent threshold={0.5} />);
    expect(screen.getByTestId("target").textContent).toBe("Not Visible");

    const observerInstance = MockIntersectionObserver.lastInstance!;
    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    act(() => {
      observerInstance.callback([entry], observerInstance);
    });

    expect(screen.getByTestId("target").textContent).toBe("Visible");
    expect(observerInstance.disconnect).toHaveBeenCalled();
  });

  it("should disconnect observer on unmount", () => {
    const { unmount } = render(<TestComponent />);
    const observerInstance = MockIntersectionObserver.lastInstance!;
    unmount();
    expect(observerInstance.disconnect).toHaveBeenCalled();
  });
});
