import { expect, type Page } from "@playwright/test";

/** Stabilize marketing pages before structural checks and screenshots. */
export async function prepareSiteUiCapture(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      .footer-logo-marquee,
      a[aria-label="Open WhatsApp quick contact"] {
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
}

export async function assertMarketingStructure(page: Page) {
  await expect(page.getByTestId("home-marketing-layout")).toBeVisible();
  await expect(page.locator('[class*="home-section"]').first()).toBeVisible();
  await expect(page.locator(".home-shell-xl").first()).toBeVisible();
}

export const SITE_UI_SCREENSHOT_OPTS = {
  maxDiffPixelRatio: 0.02,
  animations: "disabled" as const,
};
