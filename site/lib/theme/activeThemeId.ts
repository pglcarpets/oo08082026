import "server-only";

type ThemeGlobal = typeof globalThis & { __oandoActiveThemeId?: string };

const themeGlobal = globalThis as ThemeGlobal;

/** Active UI theme preset id (shared by /api/theme/active and /api/theme/manage). */
export function getActiveThemeId(): string {
  return (
    themeGlobal.__oandoActiveThemeId?.trim() ||
    process.env.ACTIVE_THEME_ID?.trim() ||
    "premium-light"
  );
}

export function setActiveThemeId(themeId: string): void {
  themeGlobal.__oandoActiveThemeId = themeId.trim();
}
