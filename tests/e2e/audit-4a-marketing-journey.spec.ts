/**
 * Phase 4a audit script (temporary, evidence-gathering only — not a permanent gate).
 * Drives real interactions against the marketing homepage `/` at http://localhost:3000
 * and captures screenshots + DOM-state dumps + a click log, so every ledger finding is
 * backed by an interacted journey, not a probe. Mirrors the 3a audit-script pattern.
 * Evidence: E:\results\marketing\audit-4a\
 */
import { test, expect, type Page } from "@playwright/test";
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
    path.join(EVIDENCE, "click-log.txt"),
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

function attachConsoleTap(page: Page, bucket: string[]) {
  page.on("console", (msg) => {
    if (msg.type() === "error") bucket.push(`console.error: ${msg.text().slice(0, 300)}`);
  });
  page.on("pageerror", (err) => bucket.push(`pageerror: ${String(err).slice(0, 300)}`));
}

test("1. above the fold @1280 — 5-second test, CTA clarity, header", async ({ page }) => {
  const errors: string[] = [];
  attachConsoleTap(page, errors);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });
  logClick("goto / and wait for hero");

  const h1 = page.locator("h1").first();
  const h1Text = (await h1.innerText()).replace(/\s+/g, " ").trim();
  const h1Box = await h1.boundingBox();

  // CTA inventory inside the hero
  const heroCtas = page.locator("#home-hero a[href]");
  const ctaRows: string[] = [];
  const n = await heroCtas.count();
  for (let i = 0; i < n; i++) {
    const a = heroCtas.nth(i);
    const href = await a.getAttribute("href");
    const text = ((await a.innerText()) || "").replace(/\s+/g, " ").trim();
    const box = await a.boundingBox();
    ctaRows.push(`hero CTA ${i + 1}: "${text}" -> ${href} box=${JSON.stringify(box)}`);
  }

  // Header nav + search discoverability
  const header = page.locator("header").first();
  const headerLinks = await header.locator("a[href]").allInnerTexts();
  const searchControls = await page
    .locator(
      'header [aria-label*="search" i], header input[type="search"], header [role="searchbox"], header button:has-text("Search")',
    )
    .count();
  const assistantLauncher = await page
    .getByRole("button", { name: "Open AI chatbot" })
    .count();

  await shot(page, "01-hero-1280.png");
  dump("01-above-fold-dom.txt", [
    `h1 text: "${h1Text}"`,
    `h1 box: ${JSON.stringify(h1Box)}`,
    `h1 prominent (height>=40px): ${h1Box ? h1Box.height >= 40 : "n/a"}`,
    "",
    ...ctaRows,
    `hero CTA count: ${n}`,
    "",
    `header nav link texts: ${JSON.stringify(headerLinks.map((t) => t.trim()).filter(Boolean))}`,
    `header search controls found: ${searchControls}`,
    `assistant launcher present: ${assistantLauncher > 0}`,
    "",
    ...errors,
  ]);
});

test("2. CTA destination truth — click-through + redirect chains", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });

  // Interacted journey: click the primary hero CTA and record the redirect chain.
  const redirects: string[] = [];
  page.on("request", (req) => {
    if (req.isNavigationRequest() && req.redirectedFrom()) {
      redirects.push(`${req.redirectedFrom()?.url()} -> ${req.url()}`);
    }
  });
  const browseCta = page.locator('#home-hero a[href="/products/"]').first();

  const browseVisible = await browseCta.isVisible().catch(() => false);
  let landed = "n/a";
  if (browseVisible) {
    await browseCta.click();
    logClick('hero: click "Browse products" (href=/products)');
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    landed = page.url();
  }

  // Destination truth for the other CTA/nav hrefs (status + first redirect hop).
  // Prefer trailing-slash form (trailingSlash:true) — slashless hops 308 and flaked with ERR_ABORTED.
  const hrefs = ["/planner/", "/planner/help/", "/products/", "/clients/", "/trusted-by/", "/contact/", "/planning/", "/ooplanner/"];
  const rows: string[] = [];
  for (const href of hrefs) {
    const res = await request.get(href, { maxRedirects: 0 }).catch(() => null);
    if (!res) {
      rows.push(`${href}: request failed`);
      continue;
    }
    const status = res.status();
    const location = res.headers()["location"] ?? "";
    rows.push(`${href}: ${status}${location ? ` -> Location: ${location}` : ""}`);
  }

  dump("02-cta-destinations.txt", [
    `browse products CTA visible: ${browseVisible}`,
    `landed URL after click: ${landed}`,
    `navigation redirect hops seen: ${redirects.length}`,
    ...redirects,
    "",
    "href status truth (maxRedirects: 0):",
    ...rows,
  ]);
  await shot(page, "02-primary-cta-landing.png");
});

test("3. hero media, LCP, fonts, bundle weight @1280", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    // @ts-expect-error window bag
    window.__lcp = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LargestContentfulPaint[]) {
        const img = entry.element instanceof HTMLImageElement ? entry.element : null;
        // @ts-expect-error window bag
        window.__lcp.push({
          startTime: Math.round(entry.startTime),
          tag: entry.element?.tagName,
          id: entry.element?.id ?? "",
          src: img?.currentSrc ?? img?.src ?? "",
          size: entry.size,
        });
      }

    }).observe({ type: "largest-contentful-paint", buffered: true });

  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(4000); // let LCP settle without interacting

  const perf = await page.evaluate(() => {
    // @ts-expect-error window bag
    const lcp = window.__lcp ?? [];
    const last = lcp[lcp.length - 1] ?? null;
    const scripts = performance
      .getEntriesByType("resource")
      .filter((r) => (r as PerformanceResourceTiming).initiatorType === "script") as PerformanceResourceTiming[];
    const jsBytes = scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0);
    const preloadLinks = Array.from(
      document.querySelectorAll('link[rel="preload"]'),
    ).map((l) => `${l.getAttribute("as")}:${l.getAttribute("href") ?? l.getAttribute("imagesrcset")?.slice(0, 60)}`);
    const heroImg = document.querySelector("#home-hero img") as HTMLImageElement | null;
    const fontFaces = Array.from(document.fonts).map((f) => `${f.family} ${f.status}`);
    return {
      lcpLast: last,
      lcpEntries: lcp.length,
      scriptCount: scripts.length,
      jsTransferKB: Math.round(jsBytes / 1024),
      preloadLinks,
      heroImg: heroImg
        ? {
            src: heroImg.currentSrc.slice(0, 120),
            fetchPriority: heroImg.fetchPriority,
            loading: heroImg.loading,
            naturalWidth: heroImg.naturalWidth,
          }
        : null,
      bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 120),
      fontFaces: fontFaces.slice(0, 12),
    };
  });

  const belowFoldImgs = await page.evaluate(() => {
    const vh = window.innerHeight;
    const imgs = Array.from(document.querySelectorAll("img"));
    const below = imgs.filter((img) => img.getBoundingClientRect().top > vh);
    const eager = below.filter((img) => img.loading !== "lazy");
    return { total: imgs.length, belowFold: below.length, belowFoldEager: eager.length };
  });

  dump("03-performance-dom.txt", [
    `LCP (dev server, comparative only): ${JSON.stringify(perf.lcpLast)}`,
    `LCP entries seen: ${perf.lcpEntries}`,
    `hero img: ${JSON.stringify(perf.heroImg)}`,
    `preload links: ${JSON.stringify(perf.preloadLinks)}`,
    `body font-family: ${perf.bodyFont}`,
    `document.fonts: ${JSON.stringify(perf.fontFaces)}`,
    `scripts loaded: ${perf.scriptCount}, JS transfer (dev, unminified): ${perf.jsTransferKB} KB`,
    `images total: ${belowFoldImgs.total}, below-fold: ${belowFoldImgs.belowFold}, below-fold NOT lazy: ${belowFoldImgs.belowFoldEager}`,
  ]);
});

test("4. marketing sections walk — headings, images, alt text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("load");
  logClick("goto / for section walk");

  const sections = await page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll("main section, [class*='home-section']"));
    return secs.map((s, i) => {
      const h = s.querySelector("h2, h3");
      const imgs = Array.from(s.querySelectorAll("img"));
      const broken = imgs.filter((img) => img.complete && img.naturalWidth === 0).length;
      const noAlt = imgs.filter((img) => !img.hasAttribute("alt")).length;
      const emptyAltNonDecorative = imgs.filter(
        (img) => img.getAttribute("alt") === "" && !img.getAttribute("aria-hidden"),
      ).length;
      return `section ${i + 1}: heading="${(h?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60)}" imgs=${imgs.length} broken=${broken} noAltAttr=${noAlt} emptyAlt=${emptyAltNonDecorative}`;
    });
  });

  // Scroll the whole page like a reader, then capture full page.
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = () => {
        y += 600;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 60);
        else resolve();
      };
      step();
    });
  });
  logClick("scroll through all homepage sections");
  await page.waitForTimeout(800);
  await shot(page, "04-home-fullpage-1280.png", true);

  const totals = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return {
      total: imgs.length,
      broken: imgs.filter((img) => img.complete && img.naturalWidth === 0).length,
      notYetLoaded: imgs.filter((img) => !img.complete).length,
    };
  });

  dump("04-sections-dom.txt", [
    `sections found: ${sections.length}`,
    ...sections,
    "",
    `images after full scroll: total=${totals.total} broken=${totals.broken} notYetLoaded=${totals.notYetLoaded}`,
  ]);

  // Broken images and missing alt text are contract violations, not observations.
  expect(totals.broken, "no marketing image may fail to load").toBe(0);

  // The brand face must actually resolve. --font-sans pointed at --font-helvetica-neue
  // and --font-cisco-sans, neither of which is defined anywhere, so every marketing
  // page silently rendered in the browser's default sans-serif. Nothing caught it,
  // because no test ever read a *computed* font-family.
  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    h1: document.querySelector("h1")
      ? getComputedStyle(document.querySelector("h1") as Element).fontFamily
      : "",
  }));
  expect(fonts.body, `body font-family resolved to: ${fonts.body}`).toMatch(/Helvetica/i);
  expect(fonts.h1, `h1 font-family resolved to: ${fonts.h1}`).toMatch(/Cisco/i);
  const altGaps = sections.filter((s) => !/noAltAttr=0/.test(s) || !/emptyAlt=0/.test(s));
  expect(altGaps, `sections with missing/empty alt: ${JSON.stringify(altGaps)}`).toEqual([]);
  expect(sections.length, "homepage must render its marketing sections").toBeGreaterThan(0);
});

test("5. responsive matrix — 1920/1280/390/320, overflow, touch targets", async ({ page }) => {
  const rows: string[] = [];

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  await shot(page, "05-hero-1920.png");
  rows.push("1920x1080: screenshot 05-hero-1920.png");

  // 1920 is the owner's primary review width, so measure it rather than only
  // screenshotting it: does the hero still convert, and is the layout balanced or
  // does the copy column strand itself against a very wide viewport?
  const wide = await page.evaluate(() => {
    const vw = window.innerWidth;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
    };
    const ctas = Array.from(document.querySelectorAll("#home-hero a, #home-hero button"))
      .filter(visible)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${(el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 34)} ${Math.round(r.width)}x${Math.round(r.height)} @x=${Math.round(r.x)}`;
      });
    const hero = document.querySelector("#home-hero");
    const copy = document.querySelector(".home-hero__copy");
    const heroRect = hero?.getBoundingClientRect();
    const copyRect = copy?.getBoundingClientRect();
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.right > vw + 1) {
        offenders.push(`${el.tagName.toLowerCase()} right=${Math.round(r.right)}`);
        if (offenders.length >= 6) break;
      }
    }
    return {
      docOverflow: document.documentElement.scrollWidth - vw,
      offenders,
      ctaCount: ctas.length,
      ctas,
      heroHeight: heroRect ? Math.round(heroRect.height) : null,
      copyWidth: copyRect ? Math.round(copyRect.width) : null,
      copyShareOfViewport: copyRect ? Math.round((copyRect.width / vw) * 100) : null,
    };
  });
  rows.push(
    `1920x1080: scrollWidth overflow = ${wide.docOverflow}px`,
    `1920 overflow offenders: ${JSON.stringify(wide.offenders)}`,
    `1920 hero height = ${wide.heroHeight}px (viewport 1080)`,
    `1920 hero copy column = ${wide.copyWidth}px (${wide.copyShareOfViewport}% of viewport)`,
    `1920 visible hero CTAs = ${wide.ctaCount}`,
    ...wide.ctas.map((c) => `  1920 hero CTA: ${c}`),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  await shot(page, "05-hero-390.png");
  const overflow390 = await page.evaluate(() => {
    const vw = window.innerWidth;
    const docOverflow = document.documentElement.scrollWidth - vw;
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.right > vw + 1) {
        const id = el.id ? `#${el.id}` : "";
        const cls = (el.getAttribute("class") ?? "").split(" ").slice(0, 3).join(".");
        offenders.push(`${el.tagName.toLowerCase()}${id}${cls ? "." + cls : ""} right=${Math.round(r.right)}`);
        if (offenders.length >= 12) break;
      }
    }
    return { vw, docOverflow, offenders };
  });
  const targets390 = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("header a, header button, #home-hero a, #home-hero button"));
    const small = els.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return r.height < 44 || r.width < 44;
    });
    return {
      interactive: els.length,
      under44: small.length,
      examples: small.slice(0, 10).map((el) => {
        const r = el.getBoundingClientRect();
        return `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`;
      }),
    };
  });
  rows.push(
    `390x844: scrollWidth overflow = ${overflow390.docOverflow}px`,
    `390 offenders: ${JSON.stringify(overflow390.offenders)}`,
    `390 header/hero interactive: ${targets390.interactive}, under 44px: ${targets390.under44}`,
    ...targets390.examples.map((e) => `  small target: ${e}`),
  );

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });
  const overflow320 = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  await shot(page, "05-hero-320.png");
  rows.push(`320x700: scrollWidth overflow = ${overflow320}px`);

  dump("05-responsive-dom.txt", rows);

  // Assert, don't just record. Without these the case prints "ok" while the page
  // scrolls sideways on a phone or ships a hero with no call to action.
  expect(wide.docOverflow, "1920 must not scroll horizontally").toBeLessThanOrEqual(0);
  expect(overflow390.docOverflow, "390 must not scroll horizontally").toBeLessThanOrEqual(0);
  expect(overflow320, "320 must not scroll horizontally").toBeLessThanOrEqual(0);
  expect(wide.ctaCount, "1920 hero must expose at least one visible CTA").toBeGreaterThan(0);
  expect(
    targets390.under44,
    `390 touch targets under 44px: ${JSON.stringify(targets390.examples)}`,
  ).toBe(0);
});

test("6. keyboard walk — tab order, skip link, focus visibility, mega menu", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator("#home-hero").waitFor({ state: "visible" });
  logClick("goto / for keyboard walk");

  // This case is named "skip link" and never checked for one. There wasn't one: the
  // first tab stop was the logo, so bypassing ~22 header stops was impossible.
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      href: el.getAttribute("href"),
      text: (el.textContent ?? "").trim(),
      visibleOnFocus: r.left >= 0 && r.top >= 0 && r.width > 0 && r.height > 0,
    };
  });
  expect(skip?.href, `first tab stop was: ${JSON.stringify(skip)}`).toBe("#main-content");
  expect(skip?.visibleOnFocus, "skip link must become visible when focused").toBe(true);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  const seq: string[] = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return "body";
      const style = getComputedStyle(el);
      const outlined = style.outlineStyle !== "none" || style.boxShadow !== "none";
      const testId = el.getAttribute("data-testid");
      const aria = el.getAttribute("aria-label");
      const text = (el.textContent ?? "").trim().slice(0, 40);
      return `${el.tagName.toLowerCase()}${testId ? `[testid=${testId}]` : ""}${aria ? `[aria="${aria}"]` : ""} "${text}" focusVisible=${outlined}`;
    });
    seq.push(`Tab ${i + 1}: ${info}`);
  }
  await shot(page, "06-keyboard-focus.png");

  // Mega menu: hover + keyboard open attempt on the Products nav item
  const productsNav = page.locator('header a[href="/products"], header button:has-text("Products")').first();
  await productsNav.hover();
  logClick("header: hover Products nav item");
  await page.waitForTimeout(500);
  const megaOnHover = await page
    .locator('[id*="mega" i], [class*="mega" i], [data-state="open"]')
    .first()
    .isVisible()
    .catch(() => false);
  await shot(page, "06-mega-hover.png");

  seq.push("", `mega menu visible after hover: ${megaOnHover}`);
  dump("06-keyboard-tab-order.txt", seq);

  // A keyboard user must be able to see where they are. Recording focusVisible and
  // passing regardless is how an invisible focus ring ships.
  const noFocusRing = seq.filter((s) => s.includes("focusVisible=false"));
  expect(noFocusRing, `tab stops with no visible focus ring: ${JSON.stringify(noFocusRing)}`).toEqual([]);
  expect(seq.filter((s) => s.endsWith('"body"')).length, "tab order must not fall through to body").toBe(0);
  expect(megaOnHover, "Products mega menu must open on hover").toBe(true);
});
