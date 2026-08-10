import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const ROOT = process.cwd();
const DATE = new Date().toISOString().slice(0, 10);
const OUTPUT_DIR = path.join(ROOT, "results", "ui-audit", DATE);
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");
const ROUTES = [
  "/",
  "/products/",
  "/solutions/",
  "/clients/",
  "/about/",
  "/contact/",
  "/planning/",
  "/downloads/",
  "/service/",
  "/showrooms/",
  "/trusted-by/",
];
const VIEWPORTS = [
  { label: "390x844", width: 390, height: 844 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "1280x800", width: 1280, height: 800 },
];

const routeSlug = (route) => route.replace(/^\//, "home").replaceAll("/", "-") || "home";
const viewportSlug = (label) => label.replace("x", "-");
const evidencePath = (route, viewport, state = "page") =>
  path.join(SCREENSHOT_DIR, `${routeSlug(route)}-${viewportSlug(viewport.label)}-${state}.png`);

function pushIssue(issues, severity, issue, evidence, fix = "") {
  issues.push({ severity, issue, evidence, fix, status: "OPEN" });
}

async function collectPage(page, route, viewport) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const failedImages = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !/favicon|navigation/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (!/ERR_ABORTED|NS_BINDING_ABORTED/i.test(request.failure()?.errorText ?? "")) {
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? "unknown" });
    }
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const request = response.request();
    if (request.resourceType() === "image") {
      failedImages.push({ url: response.url(), status: response.status() });
    }
    if (new URL(response.url()).hostname === "localhost") {
      failedRequests.push({ url: response.url(), status: response.status() });
    }
  });

  const issues = [];
  let httpStatus = 0;
  let navigationError = "";
  try {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    httpStatus = response?.status() ?? 0;
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
  } catch (error) {
    navigationError = String(error);
    pushIssue(issues, "P0", "Route did not load", navigationError);
  }

  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    };
    const rectData = (element) => {
      const rect = element.getBoundingClientRect();
      return { left: Math.round(rect.left), right: Math.round(rect.right), top: Math.round(rect.top), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) };
    };
    const html = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const textElements = [...document.querySelectorAll("h1,h2,h3,p,a,button,label")].filter(visible);
    const clipped = textElements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -2 || rect.right > viewportWidth + 2;
      })
      .slice(0, 12)
      .map((element) => ({ text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100), selector: element.tagName.toLowerCase(), rect: rectData(element) }));
    const emptyHeadings = [...document.querySelectorAll("h1,h2,h3")]
      .filter((element) => !element.textContent?.trim())
      .map((element) => element.tagName.toLowerCase());
    const controls = [...document.querySelectorAll("button,select,input,textarea,a")].filter(visible);
    const smallControls = controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .slice(0, 20)
      .map((element) => ({ text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 70), tag: element.tagName.toLowerCase(), rect: rectData(element) }));
    const hero = document.querySelector("[data-testid$='hero'], #home-hero, [class*='hero']");
    const heroText = hero ? [...hero.querySelectorAll("h1,h2,p")].filter(visible).map((element) => ({ text: (element.textContent ?? "").trim().slice(0, 100), color: getComputedStyle(element).color, opacity: getComputedStyle(element).opacity })) : [];
    const form = document.querySelector("form");
    const formStyle = form ? getComputedStyle(form) : null;
    const motionCandidates = [...document.querySelectorAll("main h1,main h2,main h3,main form,[data-testid$='hero']")].filter(visible);
    const stuckMotion = motionCandidates
      .map((element) => ({ element: element.tagName.toLowerCase(), opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform }))
      .filter((item) => item.opacity !== "1" || (item.transform !== "none" && item.transform !== "matrix(1, 0, 0, 1, 0, 0)"));
    const imageRequests = performance.getEntriesByType("resource")
      .filter((entry) => entry.initiatorType === "img")
      .map((entry) => entry.name)
      .filter((url) => url.includes("/_next/image"));
    return {
      viewportWidth,
      scrollWidth: Math.max(html.scrollWidth, body.scrollWidth),
      horizontalOverflow: Math.max(html.scrollWidth, body.scrollWidth) > viewportWidth + 2,
      headings: [...document.querySelectorAll("h1,h2,h3")].map((element) => ({ tag: element.tagName.toLowerCase(), text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120) })),
      emptyHeadings,
      clipped,
      smallControls,
      primaryCtas: [...document.querySelectorAll("main a,main button")].filter(visible).slice(0, 12).map(rectData),
      heroText,
      heroPresent: Boolean(hero && visible(hero)),
      form: form ? { present: true, opacity: formStyle.opacity, visibility: formStyle.visibility, background: formStyle.backgroundColor, rect: rectData(form) } : { present: false },
      stuckMotion,
      nextImageCount: imageRequests.length,
      nextImageRequests: imageRequests.slice(0, 20),
      chrome: {
        header: Boolean(document.querySelector("header")),
        footer: Boolean(document.querySelector("footer")),
        locale: document.querySelectorAll('select[aria-label="Select Language"],#locale-switcher').length,
        signIn: [...document.querySelectorAll("a")].filter(visible).some((element) => /sign in|log in/i.test(element.textContent ?? "")),
        search: Boolean(document.querySelector('[aria-label*="search" i],input[type="search"]')),
        fab: Boolean(document.querySelector('[aria-label*="WhatsApp" i],[aria-label*="quick contact" i]')),
      },
    };
  });

  if (httpStatus >= 400) pushIssue(issues, "P0", `HTTP ${httpStatus}`, route);
  if (metrics.horizontalOverflow) pushIssue(issues, "P0", `Horizontal overflow ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`, "document scrollWidth");
  if (metrics.emptyHeadings.length) pushIssue(issues, "P1", `Empty heading elements: ${metrics.emptyHeadings.join(", ")}`, "heading inventory");
  if (metrics.clipped.length) pushIssue(issues, "P1", `Visible text/control clipping detected (${metrics.clipped.length})`, "clipped elements");
  if (route === "/contact/" && viewport.label === "390x844" && (!metrics.form.present || metrics.form.opacity !== "1" || metrics.form.visibility !== "visible")) {
    pushIssue(issues, "P0", "Contact form is not fully visible and opaque", "contact form computed style", "site contact CSS");
  }
  if (metrics.stuckMotion.length) pushIssue(issues, "P1", `Potential stuck opacity/transform state (${metrics.stuckMotion.length})`, "motion candidates");
  if (consoleErrors.length || pageErrors.length) pushIssue(issues, "P1", `Console/page errors: ${consoleErrors.length + pageErrors.length}`, "console and pageerror listeners");
  if (failedImages.length) pushIssue(issues, "P1", `Failed images: ${failedImages.length}`, "image responses");

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  const screenshot = evidencePath(route, viewport);
  await page.screenshot({ path: screenshot, fullPage: true });
  return { route, viewport: viewport.label, httpStatus, navigationError, metrics, consoleErrors, pageErrors, failedRequests, failedImages, screenshot: path.relative(ROOT, screenshot), issues };
}

async function interactionAudit(browser) {
  const results = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addCookies([{ name: "oando_cookie_consent", value: "accepted", domain: "localhost", path: "/", sameSite: "Lax" }]);
  const page = await context.newPage();
  const mobile = { name: "mobile menu → Products", route: "/", viewport: "390x844", status: "PASS", evidence: "" };
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: "Mobile primary navigation" });
    await nav.waitFor({ state: "visible" });
    await nav.getByRole("button", { name: "Products" }).click();
    await nav.getByRole("link", { name: "All Products", exact: true }).click();
    await page.waitForURL(/\/products\/?$/);
    mobile.evidence = path.relative(ROOT, evidencePath("interaction-mobile-menu", VIEWPORTS[0], "products"));
    await page.screenshot({ path: path.join(ROOT, mobile.evidence), fullPage: true });
  } catch (error) {
    mobile.status = `FAIL: ${String(error)}`;
  }
  results.push(mobile);
  await context.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  await desktopContext.addCookies([{ name: "oando_cookie_consent", value: "accepted", domain: "localhost", path: "/", sameSite: "Lax" }]);
  const desktopPage = await desktopContext.newPage();
  const desktop = { name: "desktop chrome interactions", route: "/", viewport: "1280x800", status: "PASS", evidence: "" };
  try {
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await desktopPage.getByRole("button", { name: "Products" }).hover();
    await desktopPage.locator("#products-mega-menu").waitFor({ state: "visible" });
    await desktopPage.locator("#locale-switcher").scrollIntoViewIfNeeded();
    await desktopPage.locator("#locale-switcher").selectOption("hi");
    await desktopPage.waitForLoadState("domcontentloaded");
    await desktopPage.getByTestId("home-marketing-layout").waitFor({ state: "visible" });
    desktop.evidence = path.relative(ROOT, evidencePath("interaction-desktop-chrome", VIEWPORTS[2], "locale"));
    await desktopPage.screenshot({ path: path.join(ROOT, desktop.evidence), fullPage: false });
  } catch (error) {
    desktop.status = `FAIL: ${String(error)}`;
  }
  results.push(desktop);
  await desktopContext.close();

  const contactContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await contactContext.addCookies([{ name: "oando_cookie_consent", value: "accepted", domain: "localhost", path: "/", sameSite: "Lax" }]);
  const contactPage = await contactContext.newPage();
  const contact = { name: "contact empty-submit validation", route: "/contact/", viewport: "390x844", status: "PASS", evidence: "" };
  try {
    await contactPage.goto(`${BASE_URL}/contact/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const form = contactPage.getByTestId("contact-page-form");
    await form.scrollIntoViewIfNeeded();
    await contactPage.getByTestId("contact-form-submit").click();
    await contactPage.getByText(/Add name, message|required|consent/i).first().waitFor({ state: "visible" });
    contact.evidence = path.relative(ROOT, evidencePath("interaction-contact", VIEWPORTS[0], "validation"));
    await contactPage.screenshot({ path: path.join(ROOT, contact.evidence), fullPage: false });
  } catch (error) {
    contact.status = `FAIL: ${String(error)}`;
  }
  results.push(contact);
  await contactContext.close();
  return results;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const records = [];
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await context.addCookies([{ name: "oando_cookie_consent", value: "accepted", domain: "localhost", path: "/", sameSite: "Lax" }]);
    for (const route of ROUTES) {
      const page = await context.newPage();
      records.push(await collectPage(page, route, viewport));
      await page.close();
    }
    await context.close();
  }
  const interactions = await interactionAudit(browser);
  await browser.close();
  const data = { generatedAt: new Date().toISOString(), cwd: ROOT, baseUrl: BASE_URL, routes: ROUTES, viewports: VIEWPORTS, checks: records, interactions };
  await fs.writeFile(path.join(OUTPUT_DIR, "audit.json"), JSON.stringify(data, null, 2));
  const issueRows = records.flatMap((record) => record.issues.map((issue) => ({ route: record.route, viewport: record.viewport, ...issue })));
  const p0 = issueRows.filter((issue) => issue.severity === "P0");
  const p1 = issueRows.filter((issue) => issue.severity === "P1");
  const markdown = [
    `# Marketing UI audit — ${DATE}`,
    "",
    `- Command: \`node scripts/marketing-ui-audit.mjs\``,
    `- CWD: \`${ROOT}\``,
    `- Browser/base URL: Chromium / ${BASE_URL} only`,
    `- Scope: marketing routes only; ${ROUTES.length} routes × ${VIEWPORTS.length} viewports; reduced motion enabled`,
    `- Generated: ${data.generatedAt}`,
    "",
    "## Findings and repairs",
    "",
    "| Route | VP | Sev | Issue | Fix applied (file) | Status |",
    "|-------|----|-----|-------|--------------------|--------|",
    ...(issueRows.length ? issueRows.map((issue) => `| ${issue.route} | ${issue.viewport} | ${issue.severity} | ${issue.issue} | ${issue.fix || "—"} | ${issue.status} |`) : ["| — | — | — | No P0/P1 findings from automated checks | — | PASS |"]),
    "",
    `- P0 fixed / remaining: 0 fixed / ${p0.length} remaining before repair pass`,
    `- P1 fixed / remaining: 0 fixed / ${p1.length} remaining before repair pass`,
    "",
    "## Interaction checks",
    "",
    "| Journey | Route | VP | Status | Evidence |",
    "|---------|-------|----|--------|----------|",
    ...interactions.map((item) => `| ${item.name} | ${item.route} | ${item.viewport} | ${item.status} | ${item.evidence || "—"} |`),
    "",
    "## Browser evidence",
    "",
    `- Screenshots: ${records.length} route/viewport screenshots plus ${interactions.filter((item) => item.evidence).length} interaction screenshots under \`${path.relative(ROOT, SCREENSHOT_DIR)}\`.`,
    "- Console errors, page errors, failed local requests, failed images, heading inventory, clipping, tap-size samples, form opacity, motion state, and image request data are in `audit.json`.",
    "- Accessibility: automated structural checks are recorded by the existing site Axe suite separately; this harness records the route/viewport evidence matrix.",
    "",
    "## Not verified / blockers",
    "",
    "- External email delivery was not exercised; this is a non-mutating UI audit.",
    "- No Planner, Studio canvas, or admin routes were audited.",
    "- Automated contrast computation is limited to captured hero text color/visibility signals; human contrast review remains required for any flagged photo-scrim issue.",
    "",
    "## Files changed",
    "",
    "- `scripts/marketing-ui-audit.mjs`",
    "- `results/ui-audit/<date>/audit.json`",
    "- `results/ui-audit/<date>/report.md`",
  ].join("\n");
  await fs.writeFile(path.join(OUTPUT_DIR, "report.md"), markdown);
  console.log(JSON.stringify({ checks: records.length, interactions: interactions.length, issues: issueRows.length, p0: p0.length, p1: p1.length, output: path.relative(ROOT, OUTPUT_DIR) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
