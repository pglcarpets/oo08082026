/**
 * Name-mirror coverage for lib/theme/activeThemeId.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type ThemeGlobal = typeof globalThis & { __oandoActiveThemeId?: string };

describe("activeThemeId", () => {
  const originalEnv = { ...process.env };
  const themeGlobal = globalThis as ThemeGlobal;
  let previousThemeId: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    previousThemeId = themeGlobal.__oandoActiveThemeId;
    delete themeGlobal.__oandoActiveThemeId;
  });

  afterEach(() => {
    process.env = originalEnv;
    if (previousThemeId === undefined) {
      delete themeGlobal.__oandoActiveThemeId;
    } else {
      themeGlobal.__oandoActiveThemeId = previousThemeId;
    }
  });

  it("defaults to premium-light when no global or env is set", async () => {
    delete process.env.ACTIVE_THEME_ID;
    const { getActiveThemeId } = await import("@/lib/theme/activeThemeId");
    expect(getActiveThemeId()).toBe("premium-light");
  });

  it("reads ACTIVE_THEME_ID from the environment", async () => {
    process.env.ACTIVE_THEME_ID = "  executive-dark  ";
    const { getActiveThemeId } = await import("@/lib/theme/activeThemeId");
    expect(getActiveThemeId()).toBe("executive-dark");
  });

  it("prefers in-memory theme id set via setActiveThemeId", async () => {
    process.env.ACTIVE_THEME_ID = "from-env";
    const { getActiveThemeId, setActiveThemeId } = await import(
      "@/lib/theme/activeThemeId"
    );
    setActiveThemeId("  custom-theme  ");
    expect(getActiveThemeId()).toBe("custom-theme");
  });
});
