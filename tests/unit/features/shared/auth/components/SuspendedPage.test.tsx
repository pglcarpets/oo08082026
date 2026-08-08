/**
 * Name-mirror: features/shared/auth/components/SuspendedPage
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SuspendedPage } from "@/features/shared/auth/components/SuspendedPage";

describe("SuspendedPage", () => {
  it("explains the suspension and links back to sign-in", () => {
    render(<SuspendedPage />);

    expect(
      screen.getByRole("heading", { name: "Your account is suspended" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/platform administrator has temporarily blocked sign-in/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
