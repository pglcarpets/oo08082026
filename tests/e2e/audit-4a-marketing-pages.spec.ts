/**
 * Phase 4a audit script (temporary, evidence-gathering only — not a permanent gate).
 * Interacted journeys through the secondary marketing pages reachable from `/`,
 * the contact form, and the assistant shell. Evidence: E:\results\marketing\audit-4a\
 */
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE = path.join(process.cwd(), "..", "results", "marketing", "audit-4a");

let clickLog: string[] = [];
function logClick(label: string) {
  clickLog.push(`${clickLog.length + 1}. ${label}`);
}
function dump(name: string, lines: (string | number | boolean | null | undefined)[]) {
  fs.writeFileSync(path.join(EVIDENCE, name), lines.map(String).join("\n"));
}
async function shot(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: path.join(EVIDENCE, name), fullPage });
}

// Not serial: each case does its own goto and shares no state, and under "serial" the
// first real assertion failure skips every case after it — one known defect would hide
// the rest of the audit. Independent cases mean the run reports every finding at once.
test.describe.configure({ mode: "default", timeout: 120_000 });

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  clickLog = [];
});
test.afterAll(() => {
  fs.writeFileSync(
    path.join(EVIDENCE, "click-log-pages.txt"),
    clickLog.join("\n") + `\n\nTotal clicks: ${clickLog.length}\n`,
  );
});
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

function tapConsole(page: Page, bucket: string[]) {
  page.on("console", (msg) => {
    if (msg.type() === "error") bucket.push(`console.error: ${msg.text().slice(0, 240)}`);
  });
  page.on("pageerror", (err) => bucket.push(`pageerror: ${String(err).slice(0, 240)}`));

}

test("7. products journey — hero CTA + header mega menu, listing, search/filter, category drill-in", async ({ page }) => {
  const errors: string[] = [];
  tapConsole(page, errors);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });

  // Interacted path A: hero "Browse products" CTA (href=/products/ — trailing slash, live DOM).
  const heroBrowse = page.locator('#home-hero a[href="/products/"]').first();
  const heroBrowseVisible = await heroBrowse.isVisible().catch(() => false);
  if (heroBrowseVisible) {
    await heroBrowse.click();
    logClick('hero: click "Browse products" CTA');
    await page.waitForLoadState("load");
  }
  const h1 = page.locator("h1").first();
  await h1.waitFor({ state: "visible", timeout: 20_000 });
  const h1Text = (await h1.innerText()).replace(/\s+/g, " ").trim();

  const cardLinks = page.locator('a[href^="/products/"]');
  await expect(cardLinks.first()).toBeVisible({ timeout: 20_000 });
  const cardCount = await cardLinks.count();

  // Search / filter interaction on the listing
  const searchInput = page
    .locator('input[type="search"], [role="searchbox"], input[placeholder*="earch"]')
    .first();
  const searchVisible = await searchInput.isVisible().catch(() => false);
  let afterSearch = -1;
  if (searchVisible) {
    await searchInput.fill("chair");
    logClick('products: type "chair" into listing search');
    await page.waitForTimeout(700);
    afterSearch = await cardLinks.count();
  }

  await shot(page, "07-products-listing.png");

  // Drill into the first category/product card
  const firstCard = cardLinks.first();
  const firstCardText = ((await firstCard.innerText()) || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const firstHref = await firstCard.getAttribute("href");
  await firstCard.click();
  logClick(`products: click first card "${firstCardText}" (${firstHref})`);
  await page.waitForLoadState("load");
  await page.waitForTimeout(1200);
  const destH1 = await page
    .locator("h1")
    .first()
    .innerText()
    .then((t) => t.replace(/\s+/g, " ").trim())
    .catch(() => "none");
  const imgs = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("img"));
    return {
      total: all.length,
      broken: all.filter((i) => i.complete && i.naturalWidth === 0).length,
    };
  });
  await shot(page, "07-products-destination.png");

  // Interacted path B: header "Products" button -> mega menu -> first category link.
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });
  const productsBtn = page.locator("header button", { hasText: "Products" }).first();
  const productsBtnVisible = await productsBtn.isVisible().catch(() => false);
  let megaRows: string[] = ["header Products button visible: false"];
  if (productsBtnVisible) {
    await productsBtn.click();
    logClick("header: click Products button (mega menu)");
    await page.waitForTimeout(600);
    await shot(page, "07-mega-menu.png");
    const mega = page.locator('[id*="mega" i], [class*="mega" i]').first();
    const megaVisible = await mega.isVisible().catch(() => false);
    const megaLinks = page.locator('[class*="mega" i] a[href^="/products/"]');
    const megaLinkCount = await megaLinks.count();
    megaRows = [
      `header Products button visible: true`,
      `mega menu visible after click: ${megaVisible}`,
      `mega menu /products/ links: ${megaLinkCount}`,
    ];
    if (megaLinkCount > 0) {
      const target = megaLinks.first();
      const targetText = ((await target.innerText()) || "").replace(/\s+/g, " ").trim().slice(0, 50);
      await target.click();
      logClick(`mega menu: click "${targetText}"`);
      await page.waitForLoadState("load");
      await page.waitForTimeout(800);
      megaRows.push(`landed after mega-menu click: ${page.url()}`);
    }
  }

  dump("07-products-dom.txt", [
    `hero Browse-products CTA visible: ${heroBrowseVisible}`,
    `listing h1: "${h1Text}"`,
    `product/category cards: ${cardCount}`,
    `search input visible: ${searchVisible}`,
    `cards after searching 'chair': ${afterSearch}`,
    `first card: "${firstCardText}" href=${firstHref}`,
    `landed URL: ${page.url()}`,
    `destination h1: "${destH1}"`,
    `destination images: total=${imgs.total} broken=${imgs.broken}`,
    "",
    ...megaRows,
    "",
    ...errors,
  ]);
});

test("8. solutions journey — listing + category", async ({ page }) => {
  const errors: string[] = [];
  tapConsole(page, errors);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/solutions");
  await page.waitForLoadState("load");
  const h1 = await page
    .locator("h1")
    .first()
    .innerText()
    .then((t) => t.replace(/\s+/g, " ").trim())
    .catch(() => "none");
  const links = page.locator('a[href^="/solutions/"]');
  const count = await links.count();
  let landed = "n/a";
  if (count > 0) {
    await links.first().click();
    logClick("solutions: click first solution category");
    await page.waitForLoadState("load");
    await page.waitForTimeout(800);
    landed = page.url();
  }
  await shot(page, "08-solutions.png");
  dump("08-solutions-dom.txt", [
    `solutions h1: "${h1}"`,
    `solution category links: ${count}`,
    `landed after first click: ${landed}`,
    "",
    ...errors,
  ]);
});

test("9. contact form — empty submit validation, then full submit", async ({ page }) => {
  const errors: string[] = [];
  tapConsole(page, errors);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/contact");
  await page.getByTestId("contact-page-form").waitFor({ state: "visible" });
  logClick("goto /contact");

  // Empty-form state — is the submit gated, and do users get told why?
  const submitBtn = page.getByTestId("contact-form-submit");
  const disabledOnEmpty = await submitBtn.isDisabled();
  logClick(`contact: empty-form submit disabled = ${disabledOnEmpty}`);
  const validationVisible = await page
    .locator('[role="alert"], [aria-invalid="true"], .text-danger, [id*="error" i]')
    .allInnerTexts()
    .then((t) => t.filter(Boolean).slice(0, 6));
  await shot(page, "09-contact-empty-submit.png");

  // Full submit with clearly-marked audit data.
  // Select by `name`, not `#id`: FormControl overwrites the explicit id={"name"} in
  // CustomerQueryForm.tsx with React's generated `_R_<hash>_-form-item`, so `#name`,
  // `#email` and `#message` never exist in the DOM. The label's `for` tracks the
  // generated id correctly, so this is a selector bug, not an accessibility defect.
  const form = page.getByTestId("contact-page-form");
  await form.locator('input[name="name"]').fill("AUDIT 4A TEST — ignore");
  await form.locator('input[name="email"]').fill("audit-4a@example.invalid");
  await form
    .locator('textarea[name="message"]')
    .fill("Phase 4a audit interaction. Not a real enquiry.");
  logClick("contact: fill name/email/message with audit marker");
  const consent = page.getByTestId("contact-form-consent");
  await consent.check();
  logClick("contact: check privacy consent");

  await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
  const responsePromise = page
    .waitForResponse((res) => res.request().method() === "POST", { timeout: 15_000 })
    .catch(() => null);
  await submitBtn.click();
  logClick("contact: submit filled form");
  const postRes = await responsePromise;
  await page.waitForTimeout(2000);
  await shot(page, "09-contact-after-submit.png");

  const feedback = await page.evaluate(() => {
    // Scope to the contact form's own success node. A bare `[role="status"]` query
    // matches the header search's live region first ("Search products. Type at least
    // two characters."), which reads as a success message and hides whether the form
    // actually confirmed the submission.
    const form = document.querySelector('[data-testid="contact-page-form"]');
    const scope: ParentNode = form?.closest("section") ?? form ?? document;
    const success =
      scope.querySelector(".contact-form-success") ??
      scope.querySelector('[role="status"], [class*="success" i], [data-testid*="success" i]');
    const err = document.querySelector("#contact-form-error");
    return {
      successText: success ? (success.textContent ?? "").trim().slice(0, 160) : null,
      errorText: err ? (err.textContent ?? "").trim().slice(0, 160) : null,
    };
  });

  dump("09-contact-dom.txt", [
    `submit disabled on empty form: ${disabledOnEmpty}`,
    `validation messages visible before any interaction: ${JSON.stringify(validationVisible)}`,
    `POST response: ${postRes ? `${postRes.status()} ${postRes.url().slice(0, 100)}` : "none captured"}`,
    `post-submit success feedback: ${JSON.stringify(feedback.successText)}`,
    `post-submit error feedback: ${JSON.stringify(feedback.errorText)}`,
    "",
    ...errors,
  ]);

  // A lead that silently fails to record is the worst outcome on this page, so the
  // confirmation is asserted rather than merely dumped.
  expect(postRes?.status(), "contact submit must return 2xx").toBeLessThan(400);
  expect(feedback.errorText, "contact submit must not surface an error").toBeNull();
  expect(
    feedback.successText ?? "",
    "contact submit must confirm with a reference id",
  ).toMatch(/reference/i);
  expect(disabledOnEmpty, "submit must be gated on an empty form").toBe(true);
  expect(validationVisible, "no validation errors before the user interacts").toEqual([]);
});

test("10. assistant shell — open, message round-trip, failure state, close", async ({ page }) => {
  const errors: string[] = [];
  tapConsole(page, errors);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });

  // The assistant is mounted through DynamicBotWrapper (lazy import), so it is not in
  // the DOM at the moment the hero becomes visible. Checking isVisible() immediately
  // reports "no launcher" for what is really just a chunk still in flight — wait for
  // it, and let the timeout be the real answer.
  const launcher = page.getByRole("button", { name: "Open AI chatbot" });
  await launcher.waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
  const launcherVisible = await launcher.isVisible().catch(() => false);
  let opened = false;
  let reply = "n/a";
  let closedByEscape = "n/a";
  let convoBefore = "";
  let errorShown = "";

  if (launcherVisible) {
    await launcher.click();
    logClick("assistant: click launcher");
    const dialog = page.getByRole("dialog", { name: "AI chatbot" });
    opened = await dialog.isVisible().catch(() => false);
    await shot(page, "10-assistant-open.png");

    if (opened) {
      const input = dialog.locator("textarea, input[type='text']").first();
      const inputVisible = await input.isVisible().catch(() => false);
      if (inputVisible) {
        convoBefore = (
          (await page.getByLabel("Assistant conversation").innerText().catch(() => "")) || ""
        )
          .replace(/\s+/g, " ")
          .trim();
        await input.fill("Do you have ergonomic chairs?");
        logClick("assistant: type question");
        // The composer is a <textarea> inside a form, so Enter inserts a newline and
        // never submits — a real user clicks Send. Pressing Enter here made the
        // assistant look unresponsive when nothing had actually been sent.
        // (That Enter does not send is a UX finding in its own right, not a bug.)
        await dialog.getByRole("button", { name: /send/i }).first().click();
        logClick("assistant: click Send");
        // wait for a reply bubble / loading state to resolve
        await page.waitForTimeout(6000);
        const convo = page.getByLabel("Assistant conversation");
        reply = ((await convo.innerText()) || "").replace(/\s+/g, " ").trim().slice(0, 400);
        errorShown = (
          (await dialog
            .locator('[aria-live="polite"], .text-danger')
            .first()
            .innerText()
            .catch(() => "")) || ""
        )
          .replace(/\s+/g, " ")
          .trim();
        await shot(page, "10-assistant-after-send.png");
      } else {
        reply = "no input visible inside dialog";
      }

      await page.keyboard.press("Escape");
      logClick("assistant: press Escape");
      await page.waitForTimeout(500);
      closedByEscape = String(await dialog.isVisible().catch(() => false));
      if ((await dialog.isVisible().catch(() => false)) === true) {
        const closeBtn = dialog.getByRole("button", { name: /close/i }).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          logClick("assistant: click close button");
        }
      }
    }
  }

  dump("10-assistant-dom.txt", [
    `launcher visible: ${launcherVisible}`,
    `dialog opened: ${opened}`,
    `conversation content after send: "${reply}"`,
    `dialog still visible after Escape: ${closedByEscape}`,
    "",
    ...errors,
  ]);

  // This case previously recorded all four of these and passed regardless — it
  // reported the assistant as unreachable, then as unresponsive, and still printed
  // "ok". These are the contract; a broken assistant must fail the run.
  expect(launcherVisible, "assistant launcher must be reachable on /").toBe(true);
  expect(opened, "clicking the launcher must open the assistant dialog").toBe(true);
  expect(
    closedByEscape,
    "Escape must close the assistant dialog (WAI-ARIA dialog contract)",
  ).toBe("false");
  // The greeting is present before sending, so the greeting alone proves nothing:
  // require the conversation to actually grow, and to show the user's own turn.
  // Asserting the conversation merely contains "ergonomic" would pass on the echo of
  // the user's own message — a hollow assertion. Require the app to actually respond:
  // either a new assistant turn beyond the greeting + echo, or a visible error. What
  // must never happen is silence.
  const sent = "Do you have ergonomic chairs?";
  const beyondEcho = reply.replace(convoBefore, "").replace(sent, "").trim();
  expect(
    beyondEcho.length > 0 || errorShown.length > 0,
    `assistant neither replied nor surfaced an error. Before: "${convoBefore}" | after: "${reply}" | error: "${errorShown}"`,
  ).toBe(true);
});

test("11. secondary pages spot-check — status, h1, images, chrome consistency", async ({ page }) => {
  const errors: string[] = [];
  tapConsole(page, errors);
  await page.setViewportSize({ width: 1280, height: 800 });

  // Canonical trailing-slash form. The site is trailingSlash:true — every internal
  // href carries the slash — so the slashless form 308-redirects on every hop, which
  // is both unfaithful to the real journey and a source of net::ERR_ABORTED flake
  // when a redirect lands while the previous navigation is still settling.
  const routes = [
    "/about/",
    "/career/",
    "/showrooms/",
    "/sustainability/",
    "/trusted-by/",
    "/clients/",
    "/compare/",
    "/choose-product/",
    "/downloads/",
    "/service/",
    "/planning/",
    "/privacy/",
    "/terms/",
  ];
  const rows: string[] = [];
  for (const route of routes) {
    const res = await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.waitForTimeout(400);
    const h1 = await page
      .locator("h1")
      .first()
      .innerText()
      .then((t) => t.replace(/\s+/g, " ").trim().slice(0, 60))
      .catch(() => "NONE");
    const state = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return {
        imgs: imgs.length,
        broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
        headerLinks: document.querySelectorAll("header a[href]").length,
        footerLinks: document.querySelectorAll("footer a[href]").length,
      };
    });
    rows.push(
      `${route}: status=${res?.status()} h1="${h1}" imgs=${state.imgs} broken=${state.broken} headerLinks=${state.headerLinks} footerLinks=${state.footerLinks}`,
    );
    if (["/compare", "/choose-product", "/clients"].includes(route)) {
      await shot(page, `11-${route.replace(/\//g, "")}.png`);
    }
  }
  dump("11-secondary-pages-dom.txt", [...rows, "", ...errors.slice(0, 10)]);

  // Every route in the list must actually serve, render an h1, and show no broken
  // image. Recording "status=500 h1=NONE" and passing is not a spot-check.
  const notOk = rows.filter((r) => !/status=200/.test(r));
  expect(notOk, `routes not returning 200: ${JSON.stringify(notOk)}`).toEqual([]);
  const noH1 = rows.filter((r) => /h1="NONE"/.test(r));
  expect(noH1, `routes with no h1: ${JSON.stringify(noH1)}`).toEqual([]);
  const brokenImgs = rows.filter((r) => !/broken=0/.test(r));
  expect(brokenImgs, `routes with broken images: ${JSON.stringify(brokenImgs)}`).toEqual([]);
});

test("12. compare page interaction — empty state honesty", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/compare");
  await page.waitForLoadState("load");
  await page.waitForTimeout(800);
  logClick("goto /compare");
  const bodyText = ((await page.locator("main").innerText()) || "").replace(/\s+/g, " ").trim().slice(0, 500);
  const interactive = await page
    .locator("main button, main select, main input")
    .count();
  await shot(page, "12-compare-state.png");
  dump("12-compare-dom.txt", [
    `main text (first 500): "${bodyText}"`,
    `interactive controls in main: ${interactive}`,
  ]);
});
