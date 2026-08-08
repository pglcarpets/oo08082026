import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GuestPortalPage from "@/app/(site)/portal/guest/page";

describe("app/(site)/portal/guest/page.tsx", () => {
  it("renders guest portal shell with sign-in and ooplanner entry", () => {
    render(<GuestPortalPage />);

    expect(screen.getByTestId("guest-portal-page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /browse without an account/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /open planner/i })).toHaveAttribute(
      "href",
      "/ooplanner",
    );
  });
});
