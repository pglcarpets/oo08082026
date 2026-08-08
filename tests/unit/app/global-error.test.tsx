/**
 * Name-mirror: app/global-error.tsx — App Router root error boundary UI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import GlobalError from "@/app/global-error";

vi.mock("next/error", () => ({
  default: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="next-error" data-status-code={String(statusCode)}>
      Application error
    </div>
  ),
}));

describe("app/global-error.tsx", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  it("renders NextError with statusCode 0 (App Router has no HTTP status here)", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<GlobalError error={error} />);

    // happy-dom/RTL may hoist <html>/<body>; assert the error UI surface.
    const nextError = screen.getByTestId("next-error");
    expect(nextError).toBeInTheDocument();
    expect(nextError).toHaveAttribute("data-status-code", "0");
    expect(screen.getByText("Application error")).toBeInTheDocument();
  });

  it("logs digest on mount when present", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<GlobalError error={error} />);

    expect(console.error).toHaveBeenCalledWith("[global-error]", "abc123");
  });

  it("falls back to error message when digest is absent", () => {
    const error = new Error("plain failure");
    render(<GlobalError error={error} />);

    expect(console.error).toHaveBeenCalledWith(
      "[global-error]",
      "plain failure",
    );
  });
});
