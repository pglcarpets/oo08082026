import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccessPage } from "@/features/shared/entry/AccessPage";

describe("AccessPage", () => {
  it("renders member and guest entry paths with assistant help", () => {
    const handler = vi.fn();
    window.addEventListener("oando-assistant:open", handler);

    render(<AccessPage loginHref="/login?next=/choose-product" guestHref="/guest" />);

    expect(
      screen.getByRole("heading", { name: "Enter the workspace with intent." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue with member login/i })).toHaveAttribute(
      "href",
      "/login?next=/choose-product",
    );
    expect(screen.getByRole("link", { name: /Continue as guest/i })).toHaveAttribute(
      "href",
      "/guest",
    );

    fireEvent.click(screen.getByRole("button", { name: "Ask AI which path fits" }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("oando-assistant:open", handler);
  });
});