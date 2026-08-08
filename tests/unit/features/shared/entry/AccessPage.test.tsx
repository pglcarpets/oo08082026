/**
 * Name-mirror smoke: features/shared/entry/AccessPage
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AccessPage } from "@/features/shared/entry/AccessPage";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("AccessPage", () => {
  it("renders member and guest entry paths from props", () => {
    render(
      <AccessPage loginHref="/access/login" guestHref="/choose-product?guest=1" />,
    );
    expect(
      screen.getByRole("heading", { name: /Enter the workspace with intent/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue with member login/i }),
    ).toHaveAttribute("href", "/access/login");
    expect(screen.getByRole("link", { name: /Continue as guest/i })).toHaveAttribute(
      "href",
      "/choose-product?guest=1",
    );
  });

  it("wires the assistant open button", () => {
    const handler = vi.fn();
    window.addEventListener("oando-assistant:open", handler);
    render(<AccessPage loginHref="/login" guestHref="/guest" />);
    fireEvent.click(screen.getByRole("button", { name: /Ask AI which path fits/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("oando-assistant:open", handler);
  });
});
