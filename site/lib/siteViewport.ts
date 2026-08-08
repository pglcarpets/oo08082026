import type { Viewport } from "next";

/** Shared mobile viewport + browser chrome colors (matches --surface-page tokens). */
export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "var(--color-white-50)" },
    { media: "(prefers-color-scheme: dark)", color: "var(--color-dark-midnight-blue-950)" },
  ],
};
