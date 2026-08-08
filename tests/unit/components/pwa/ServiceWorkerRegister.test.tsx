import { setNodeEnv } from "@/tests/helpers/setNodeEnv";
/**
 * Name-mirror: components/pwa/ServiceWorkerRegister
 * Integration coverage also lives under tests/integration/components/pwa/.
 */
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let registerMock: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { register: registerMock },
    });
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setNodeEnv(originalNodeEnv);
  });

  it("renders nothing", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container.firstChild).toBeNull();
  });

  it("does not register or bind load when NODE_ENV is not production", () => {
    setNodeEnv("test");
    const { unmount } = render(<ServiceWorkerRegister />);

    expect(registerMock).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("load", expect.any(Function));
    unmount();
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith("load", expect.any(Function));
  });

  it("removes inherited service workers in development", async () => {
    setNodeEnv("development");
    const unregisterMock = vi.fn().mockResolvedValue(true);
    const getRegistrationsMock = vi.fn().mockResolvedValue([{ unregister: unregisterMock }]);
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { getRegistrations: getRegistrationsMock, register: registerMock },
    });

    render(<ServiceWorkerRegister />);

    await Promise.resolve();
    await Promise.resolve();
    expect(getRegistrationsMock).toHaveBeenCalledOnce();
    expect(unregisterMock).toHaveBeenCalledOnce();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("registers /sw.js on window load in production", () => {
    setNodeEnv("production");
    render(<ServiceWorkerRegister />);

    const loadHandler = addEventListenerSpy.mock.calls.find(
      (call: unknown[]) => call[0] === "load",
    )?.[1] as ((...args: unknown[]) => void) | undefined;

    expect(loadHandler).toBeTypeOf("function");
    loadHandler?.();
    expect(registerMock).toHaveBeenCalledWith("/sw.js");
  });

  it("removes the load listener on unmount in production", () => {
    setNodeEnv("production");
    const { unmount } = render(<ServiceWorkerRegister />);

    const loadHandler = addEventListenerSpy.mock.calls.find(
      (call: unknown[]) => call[0] === "load",
    )?.[1];

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("load", loadHandler);
  });

  it("warns when service worker registration rejects", async () => {
    setNodeEnv("production");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerMock.mockRejectedValueOnce(new Error("sw down"));

    render(<ServiceWorkerRegister />);
    const loadHandler = addEventListenerSpy.mock.calls.find(
      (call: unknown[]) => call[0] === "load",
    )?.[1] as ((...args: unknown[]) => void) | undefined;
    loadHandler?.();

    await Promise.resolve();
    expect(warnSpy).toHaveBeenCalledWith(
      "[sw] registration failed:",
      expect.any(Error),
    );
  });

  it("does not register when navigator.serviceWorker is missing", () => {
    setNodeEnv("production");
    // Omit the key entirely — `"serviceWorker" in navigator` must be false.
    vi.stubGlobal("navigator", {
      userAgent: "test",
    });

    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    expect(registerMock).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("load", expect.any(Function));
  });
});
