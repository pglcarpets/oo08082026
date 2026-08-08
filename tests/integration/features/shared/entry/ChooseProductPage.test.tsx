import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChooseProductPage } from "@/features/shared/entry/ChooseProductPage";

vi.mock("next/navigation", () => ({
  usePathname: () => "/choose-product",
  useSearchParams: () => new URLSearchParams(),
}));

describe("ChooseProductPage", () => {
  it("renders guest mode with the guest canvas entry link", () => {
    render(<ChooseProductPage guestMode authenticated={false} />);

    expect(screen.getByText("Guest session")).toBeInTheDocument();
    const entry = screen.getByTestId("choose-product-planner-launch");
    expect(entry).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/ooplanner(\?|$)/),
    );
    expect(entry.getAttribute("href")).toContain("siteSource=");
    expect(screen.queryByRole("link", { name: "Open portal" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("renders member mode with authenticated portal link", () => {
    render(<ChooseProductPage guestMode={false} authenticated />);

    expect(screen.getByText("Signed-in session")).toBeInTheDocument();
    const entry = screen.getByTestId("choose-product-planner-launch");
    expect(entry).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/ooplanner(\?|$)/),
    );
    expect(entry.getAttribute("href")).toContain("siteSource=");
    expect(screen.getByRole("link", { name: "Open portal" })).toHaveAttribute(
      "href",
      "/portal",
    );
    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("shows sign-in and guest options when not authenticated and not guest", () => {
    render(<ChooseProductPage guestMode={false} authenticated={false} />);

    expect(screen.getByText("Sign-in required")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue as guest/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open portal" })).not.toBeInTheDocument();
  });
});
