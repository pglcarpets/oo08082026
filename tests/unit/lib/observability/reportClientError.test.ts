import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportClientError, type ClientErrorReport } from "@/lib/observability/reportClientError";

describe("reportClientError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("logs a structured record for a full payload", () => {
    const payload: ClientErrorReport = {
      label: "react-error",
      message: "Something broke",
      stack: "Error: foo\n at bar",
      componentStack: "in Component",
      url: "https://example.com/page",
      userAgent: "TestAgent/1.0",
    };

    reportClientError(payload);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logged = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged.label).toBe("react-error");
    expect(logged.message).toBe("Something broke");
    expect(logged.url).toBe("https://example.com/page");
    expect(logged.userAgent).toBe("TestAgent/1.0");
    expect(logged.stack).toBe("Error: foo at bar");
    expect(logged.componentStack).toBe("in Component");
    expect(typeof logged.capturedAt).toBe("string");
  });

  it("applies defaults for missing fields and trims whitespace/newlines", () => {
    const payload: ClientErrorReport = {
      message: "  Line1\nLine2\tLine3  ",
      url: "  https://x.com  ",
      stack: undefined,
    };

    reportClientError(payload);

    const logged = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged.label).toBe("client");
    expect(logged.message).toBe("Line1 Line2 Line3");
    expect(logged.url).toBe("https://x.com");
    expect(logged.stack).toBe("No stack trace provided");
    expect(logged.componentStack).toBeUndefined();
  });

  it("truncates long fields to their limits", () => {
    const longMessage = "x".repeat(3000);
    const longStack = "s".repeat(7000);
    const longUrl = "u".repeat(2000);

    reportClientError({
      message: longMessage,
      stack: longStack,
      url: longUrl,
    });

    const logged = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
    expect((logged.message as string).length).toBe(2000);
    expect((logged.stack as string).length).toBe(6000);
    expect((logged.url as string).length).toBe(1024);
  });

  it("handles empty and minimal payloads gracefully", () => {
    reportClientError({});

    const logged = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged.label).toBe("client");
    expect(logged.message).toBe("Unknown error");
    expect(logged.url).toBe("Unknown URL");
    expect(logged.userAgent).toBe("Unknown UserAgent");
    expect(logged.stack).toBe("No stack trace provided");
  });

  it("preserves componentStack only when provided", () => {
    reportClientError({ componentStack: "   multi\nline   " });

    const logged = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(logged.componentStack).toBe("multi line");
  });
});
