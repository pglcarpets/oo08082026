import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { ThemeProvider, useBlockTheme } from "@/lib/theme/ThemeProvider";

vi.mock("@/lib/theme/schema", () => ({
  blockThemePayloadSchema: {
    parse: vi.fn((val) => val),
  },
}));

const TestConsumer = () => {
  const { themeName, tokens, isLoading, error } = useBlockTheme();
  return (
    <div>
      <span data-testid="themeName">{themeName}</span>
      <span data-testid="loading">{isLoading ? "yes" : "no"}</span>
      <span data-testid="error">{error ? error.message : "none"}</span>
      <span data-testid="tokens">{tokens ? JSON.stringify(tokens) : "null"}</span>
    </div>
  );
};

describe("ThemeProvider Component", () => {
  const globalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    const style = document.getElementById("dynamic-block-theme");
    if (style) {
      style.remove();
    }
  });

  afterEach(() => {
    global.fetch = globalFetch;
  });

  it("should successfully fetch and inject remote theme styling", async () => {
    const mockThemeResponse = {
      name: "custom-brand-theme",
      payload_jsonb: {
        "block-accent": "#ff0000",
        "block-border": "var(--color-bronze-200)",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockThemeResponse,
    });

    await act(async () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
    });

    expect(screen.getByTestId("loading").textContent).toBe("no");
    expect(screen.getByTestId("themeName").textContent).toBe("custom-brand-theme");
    expect(screen.getByTestId("tokens").textContent).toContain("#ff0000");

    // Check style tag injection
    const styleTag = document.getElementById("dynamic-block-theme");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain("--block-accent: #ff0000;");
    expect(styleTag?.textContent).toContain("--block-border: var(--color-bronze-200);");
  });

  it("should fallback to local tokens if fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const fallback = { "block-accent": "#00ff00" };

    await act(async () => {
      render(
        <ThemeProvider fallbackTokens={fallback}>
          <TestConsumer />
        </ThemeProvider>
      );
    });

    expect(screen.getByTestId("loading").textContent).toBe("no");
    expect(screen.getByTestId("error").textContent).toBe("Failed to fetch active theme");
    expect(screen.getByTestId("themeName").textContent).toBe("local-fallback");
    expect(screen.getByTestId("tokens").textContent).toContain("#00ff00");

    const styleTag = document.getElementById("dynamic-block-theme");
    expect(styleTag?.textContent).toContain("--block-accent: #00ff00;");
  });
});
