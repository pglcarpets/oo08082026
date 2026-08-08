import type { ComponentProps, ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdvancedBot } from "@/features/site/assistant/AdvancedBot";

vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      onClick,
      className,
    }: ComponentProps<"button">) => (
      <button onClick={onClick} className={className} data-testid="launcher">
        {children}
      </button>
    ),
    div: ({ children, className }: ComponentProps<"div">) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => children,
}));

vi.mock("@/features/site/data/contact", () => ({
  buildMailtoHref: vi.fn(() => "mailto:mock"),
  buildWhatsAppHref: vi.fn(() => "https://wa.me/mock"),
}));

describe("AdvancedBot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("can open and close the bot", () => {
    render(<AdvancedBot />);

    const launcher = screen.getByTestId("launcher");
    fireEvent.click(launcher);

    expect(screen.getByText("WhatsApp Project Assistant")).toBeDefined();

    const closeBtn = screen.getByTitle("Close chat assistant");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("WhatsApp Project Assistant")).toBeNull();
  });

  it("can navigate through steps", () => {
    render(<AdvancedBot />);

    fireEvent.click(screen.getByTestId("launcher"));

    fireEvent.click(screen.getByText("Workstations"));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("Roughly how many seats or units do you need?")).toBeDefined();
    const input = screen.getByPlaceholderText("e.g. 12 workstations, 30 chairs");
    fireEvent.change(input, { target: { value: "10 seats" } });

    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("Tell us about your company and project timing.")).toBeDefined();
  });
});
