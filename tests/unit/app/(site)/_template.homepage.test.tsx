import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

/**
 * Shared marketing-page contract checks for app/(site) routes.
 * Import and call `expectHomeMarketingShell(container)` after render.
 */
export function expectHomeMarketingShell(container: HTMLElement) {
  expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
  expect(container.querySelector(".scheme-page.flex.min-h-screen.flex-col.items-center")).toBeNull();
  const hasHomeSection = container.querySelector('[data-testid="home-section"]');
  const hasHomeShell = container.querySelector(".home-shell-xl");
  if (hasHomeSection === null) {
    expect(hasHomeShell).not.toBeNull();
    return;
  }
  expect(hasHomeSection).not.toBeNull();
}

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="ContactTeaser" />,
}));

describe("app/(site) marketing template", () => {
  it("exports expectHomeMarketingShell helper", () => {
    expect(typeof expectHomeMarketingShell).toBe("function");
  });
});
