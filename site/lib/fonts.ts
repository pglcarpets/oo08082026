import localFont from "next/font/local";

/**
 * Site faces (aligned with .archive/css FOCSS dual-font model).
 * Layout mounts `.variable` on <html>; @theme maps:
 *   --font-display → --font-cisco-sans
 *   --font-sans    → --font-helvetica-neue (+ cisco fallback)
 * Never list system Helvetica/Arial in next/font fallback arrays.
 *
 * Critical path is intentionally thin: woff2 + 2–3 weights only.
 * Extra light/italic/condensed masters stay on disk for design tools, not the web font payload.
 */

export const ciscoSans = localFont({
  src: [
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cisco-sans",
  display: "swap",
  fallback: ["sans-serif"],
  preload: true,
});

export const helveticaNeue = localFont({
  src: [
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Roman.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
  fallback: ["sans-serif"],
  preload: true,
});

const HELVETICA_NEUE_FALLBACK = "Helvetica Neue, sans-serif";

/**
 * Resolve the loaded Helvetica Neue family for canvas / Fabric text.
 * next/font hashes the family name into `--font-helvetica-neue` on `<html>`.
 */
export function resolveLoadedSansFamily(): string {
  if (typeof document === "undefined") {
    return HELVETICA_NEUE_FALLBACK;
  }
  const fromVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-helvetica-neue")
    .trim();
  return fromVar || HELVETICA_NEUE_FALLBACK;
}

/** First family name only (Fabric short `fontFamily`). */
export function resolveLoadedSansFamilyShort(): string {
  const full = resolveLoadedSansFamily();
  const first = full.split(",")[0]?.trim();
  return first && first.length > 0 ? first.replace(/^["']|["']$/g, "") : "Helvetica Neue";
}
