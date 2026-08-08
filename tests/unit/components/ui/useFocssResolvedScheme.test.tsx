import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useFocssResolvedScheme } from "@/components/ui/useFocssResolvedScheme";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-color-scheme");
});

describe("useFocssResolvedScheme", () => {
  it("returns light by default", () => {
    const { result } = renderHook(() => useFocssResolvedScheme());
    expect(result.current).toBe("light");
  });

  it("returns dark when FOCSS marks html.dark", () => {
    document.documentElement.classList.add("dark");
    const { result } = renderHook(() => useFocssResolvedScheme());
    expect(result.current).toBe("dark");
  });

  it("returns dark when data-color-scheme is dark", () => {
    document.documentElement.setAttribute("data-color-scheme", "dark");
    const { result } = renderHook(() => useFocssResolvedScheme());
    expect(result.current).toBe("dark");
  });

  it("reacts when the FOCSS class changes", async () => {
    const { result } = renderHook(() => useFocssResolvedScheme());
    expect(result.current).toBe("light");

    await act(async () => {
      document.documentElement.classList.add("dark");
      await Promise.resolve();
    });
    expect(result.current).toBe("dark");
  });

  it("stops observing after unmount", () => {
    const { unmount } = renderHook(() => useFocssResolvedScheme());
    expect(() => unmount()).not.toThrow();

    act(() => {
      document.documentElement.classList.add("dark");
    });
  });
});
