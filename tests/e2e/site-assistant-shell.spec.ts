import { expect, test } from "@playwright/test";

test.describe("site assistant shell", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "oando_cookie_consent",
        value: "accepted",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);
  });

  test("homepage exposes AI chatbot launcher and panel", async ({ page }) => {
    await page.goto("/");
    await page.locator("#home-hero").waitFor({ state: "visible" });

    await page.getByRole("button", { name: "Open AI chatbot" }).click();
    await expect(page.getByRole("dialog", { name: "AI chatbot" })).toBeVisible();
    await expect(page.getByLabel("Assistant conversation")).toBeVisible();
  });

  test("products catalog page loads category grid links", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("heading", { level: 1, name: /Built to\s*Perform/i }).waitFor();
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({ timeout: 20_000 });
  });
});

/** SITE-S08 / SITE-S09 — mobile shell at phone width (390×844). */
test.describe("site assistant shell @390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "oando_cookie_consent",
        value: "accepted",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);
  });

  test("launcher stays on-canvas and sheet header does not overflow", async ({ page }) => {
    await page.goto("/");
    await page.locator("#home-hero").waitFor({ state: "visible" });

    const launcher = page.getByRole("button", { name: "Workspace assistant" });
    await launcher.waitFor({ state: "visible", timeout: 20_000 });

    const fabMetrics = await launcher.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return {
        fullyIn:
          r.width > 0 &&
          r.height > 0 &&
          r.left >= -1 &&
          r.top >= -1 &&
          r.right <= vw + 1 &&
          r.bottom <= vh + 1,
        right: Math.round(r.right),
        left: Math.round(r.left),
        bottom: Math.round(r.bottom),
        vw,
        vh,
      };
    });
    expect(fabMetrics.fullyIn, `FAB off-canvas: ${JSON.stringify(fabMetrics)}`).toBe(true);

    await launcher.click();
    await page.locator(".assistant-launcher-action--primary").click();

    const dialog = page.getByRole("dialog", { name: "AI chatbot" });
    await expect(dialog).toBeVisible();

    const headerMetrics = await dialog.locator(".assistant-sheet__header").evaluate((header) => {
      const brand = header.querySelector(".assistant-sheet__brand");
      const close = header.querySelector(".assistant-sheet__close");
      const title = header.querySelector(".assistant-sheet__title");
      const sub = header.querySelector(".assistant-sheet__subtitle");
      const vw = window.innerWidth;
      const hr = header.getBoundingClientRect();
      const br = brand?.getBoundingClientRect();
      const cr = close?.getBoundingClientRect();
      return {
        headerOverflowX: header.scrollWidth - header.clientWidth,
        headerRight: Math.round(hr.right),
        vw,
        brandOverlapsClose: Boolean(
          br && cr && br.right > cr.left + 2,
        ),
        closeFullyIn: Boolean(
          cr && cr.left >= 0 && cr.right <= vw + 1,
        ),
        titleEllipsis: title
          ? getComputedStyle(title).textOverflow === "ellipsis"
          : false,
        subEllipsis: sub
          ? getComputedStyle(sub).textOverflow === "ellipsis"
          : false,
      };
    });

    expect(
      headerMetrics.headerOverflowX,
      `header scrolls horizontally: ${JSON.stringify(headerMetrics)}`,
    ).toBeLessThanOrEqual(1);
    expect(headerMetrics.headerRight, "header wider than viewport").toBeLessThanOrEqual(
      headerMetrics.vw + 1,
    );
    expect(headerMetrics.brandOverlapsClose, "title stack overlaps close").toBe(false);
    expect(headerMetrics.closeFullyIn, "close button off-canvas").toBe(true);
    expect(headerMetrics.titleEllipsis).toBe(true);
    expect(headerMetrics.subEllipsis).toBe(true);
  });
});
