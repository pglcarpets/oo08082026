import localFont from "next/font/local";

/**
 * Site faces (aligned with .archive/css FOCSS dual-font model).
 * Layout mounts `.variable` on <html>; @theme maps:
 *   --font-display → --font-cisco-sans
 *   --font-sans    → --font-helvetica-neue (+ cisco fallback)
 * Never list system Helvetica/Arial in next/font fallback arrays.
 */

export const ciscoSans = localFont({
  src: [
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-Thin.ttf",
      weight: "250",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-ThinOblique.ttf",
      weight: "250",
      style: "italic",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-ExtraLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-ExtraLightOblique.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-Oblique.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/cisco-sans/CiscoSans-BoldOblique.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-cisco-sans",
  display: "swap",
  fallback: ["sans-serif"],
});

export const helveticaNeue = localFont({
  src: [
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Roman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/assets/others/fonts/helvetica-neue/HelveticaNeue-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
  fallback: ["sans-serif"],
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
