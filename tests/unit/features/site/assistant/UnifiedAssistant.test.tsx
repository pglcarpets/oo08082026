import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { UnifiedAssistant } from "@/features/site/assistant/UnifiedAssistant";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/test-path",
}));

// Mock consent
vi.mock("@/lib/consent", () => ({
  hasConsentChoice: () => true,
}));

// Mock displayText
vi.mock("@/lib/displayText", () => ({
  sanitizeDisplayText: (text: string) => text,
}));

// Mock catalog categories
vi.mock("@/lib/catalog/site/categories", () => ({
  getCatalogProductHref: (category: string, key: string) => `/products/${category}/${key}`,
}));

describe("UnifiedAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width: 640px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders mobile launcher and opens chat open", async () => {
    render(<UnifiedAssistant />);
    await act(async () => {});

    const launcher = screen.getByLabelText("Open AI chatbot");
    expect(launcher).toBeDefined();

    fireEvent.click(launcher);
    expect(screen.getByLabelText("Close AI chatbot")).toBeDefined();
  });

  it("renders guided planner", async () => {
    render(<UnifiedAssistant />);

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("oando-assistant:open", { detail: { tab: "guided" } }),
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Guided planner")).toBeInTheDocument();
    });
  });
});
