/**
 * Name-mirror coverage for lib/siteViewport.
 */
import { describe, expect, it } from "vitest";
import { SITE_VIEWPORT } from "@/lib/siteViewport";

describe("SITE_VIEWPORT", () => {
  it("sets device-width initial scale for mobile browsers", () => {
    expect(SITE_VIEWPORT.width).toBe("device-width");
    expect(SITE_VIEWPORT.initialScale).toBe(1);
  });

  it("provides light and dark themeColor chrome tokens", () => {
    expect(Array.isArray(SITE_VIEWPORT.themeColor)).toBe(true);
    const colors = SITE_VIEWPORT.themeColor as Array<{
      media: string;
      color: string;
    }>;
    expect(colors).toEqual(
      expect.arrayContaining([
        {
          media: "(prefers-color-scheme: light)",
          color: "var(--color-white-50)",
        },
        {
          media: "(prefers-color-scheme: dark)",
          color: "var(--color-dark-midnight-blue-950)",
        },
      ]),
    );
  });
});
