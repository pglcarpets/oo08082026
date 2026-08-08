import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

const TestComponent = () => {
  const isOnline = useOnlineStatus();
  return <div data-testid="status">{isOnline ? "Online" : "Offline"}</div>;
};

describe("useOnlineStatus", () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      configurable: true,
    });
  });

  it("should initialize with navigator.onLine value", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    render(<TestComponent />);
    expect(screen.getByTestId("status").textContent).toBe("Online");
  });

  it("should initialize with false if navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    render(<TestComponent />);
    expect(screen.getByTestId("status").textContent).toBe("Offline");
  });

  it("should respond to online and offline events", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    render(<TestComponent />);
    expect(screen.getByTestId("status").textContent).toBe("Online");

    // Dispatch offline event
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByTestId("status").textContent).toBe("Offline");

    // Dispatch online event
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByTestId("status").textContent).toBe("Online");
  });
});
