/**
 * Name-mirror: components/site/RouteChromeSuspense
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { RouteChromeSuspense } from "@/components/site/RouteChromeSuspense";

vi.mock("@/components/site/RouteChrome", () => ({
  RouteChrome: ({ position }: { position: "top" | "bottom" }) => (
    <div data-testid="route-chrome" data-position={position}>
      chrome-{position}
    </div>
  ),
}));

describe("RouteChromeSuspense", () => {
  it("renders RouteChrome with position top inside Suspense", () => {
    render(<RouteChromeSuspense position="top" />);

    const chrome = screen.getByTestId("route-chrome");
    expect(chrome).toHaveAttribute("data-position", "top");
    expect(chrome).toHaveTextContent("chrome-top");
  });

  it("renders RouteChrome with position bottom inside Suspense", () => {
    render(<RouteChromeSuspense position="bottom" />);

    const chrome = screen.getByTestId("route-chrome");
    expect(chrome).toHaveAttribute("data-position", "bottom");
    expect(chrome).toHaveTextContent("chrome-bottom");
  });
});
