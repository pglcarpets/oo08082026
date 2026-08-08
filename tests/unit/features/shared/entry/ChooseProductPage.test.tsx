/**
 * Name-mirror: features/shared/entry/ChooseProductPage
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChooseProductPage } from "@/features/shared/entry/ChooseProductPage";

vi.mock("next/navigation", () => ({
  usePathname: () => "/choose-product",
  useSearchParams: () => new URLSearchParams(),
}));

describe("ChooseProductPage", () => {
  it("renders guest mode with guest canvas entry", () => {
    render(<ChooseProductPage guestMode authenticated={false} />);

    expect(screen.getByText("Guest session")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Start planning office furniture/i,
      }),
    ).toBeInTheDocument();
    const entry = screen.getByTestId("choose-product-planner-launch");
    expect(entry.getAttribute("href")).toContain("/ooplanner");
    expect(entry.getAttribute("href")).toContain("siteSource=");
    expect(screen.queryByRole("link", { name: "Open portal" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByRole("link", { name: "BOQ planning service" })).toHaveAttribute(
      "href",
      "/planning",
    );
  });

  it("renders member mode with canvas entry and portal link", () => {
    render(<ChooseProductPage guestMode={false} authenticated />);

    expect(screen.getByText("Signed-in session")).toBeInTheDocument();
    const entry = screen.getByTestId("choose-product-planner-launch");
    expect(entry.getAttribute("href")).toContain("/ooplanner");
    expect(entry.getAttribute("href")).toContain("siteSource=");
    expect(screen.getByRole("link", { name: "Open portal" })).toHaveAttribute(
      "href",
      "/portal",
    );
    expect(screen.getByRole("link", { name: "View planner overview" })).toHaveAttribute(
      "href",
      "/planner",
    );
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("shows sign-in path when neither guest nor authenticated", () => {
    render(<ChooseProductPage guestMode={false} authenticated={false} />);
    expect(screen.getByText("Sign-in required")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue as guest/i })).toHaveAttribute(
      "href",
      "/choose-product?mode=guest",
    );
  });
});
