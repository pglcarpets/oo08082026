/**
 * Full-site responsive audit — mobile (375×812) + desktop (1920×1080).
 * Requires dev server at http://localhost:3000 (never 127.0.0.1).
 *
 * Output:
 *   results/responsive-audit/mobile/*.png
 *   results/responsive-audit/desktop/*.png
 *   results/responsive-audit/audit-results.json
 *
 * Run: node scripts/responsive-audit.mjs
 *
 * Session scratch scripts (narrower scope): scripts/tmp-*.mjs — not gated.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("results/responsive-audit-final");

const STATIC_MARKETING = [
  "/",
  "/products/",
  "/solutions/",
  "/planning/",
  "/contact/",
  "/about/",
  "/downloads/",
  "/career/",
  "/compare/",
  "/trusted-by/",
  "/showrooms/",
  "/service/",
  "/sitemap/",
  "/privacy/",
  "/terms/",
  "/refund-and-return-policy/",
  "/sustainability/",
  "/clients/",
  "/planner/",
  "/planner/help/",
  "/planner/features/",
  "/planner/features/measure/",
  "/planner/features/catalog/",
  "/planner/features/3d-view/",
  "/planner/features/ai-assist/",
  "/planner/features/export/",
  "/quote-cart/",
  "/access/",
  "/login/",
  "/dashboard/",
  "/portal/",
  "/portal/guest/",
  "/choose-product/",
  "/choose-product?mode=guest",
  "/offline/",
];

const DYNAMIC_SAMPLES = [
  "/products/seating/",
  "/products/workstations/",
  "/products/tables/",
  "/products/storages/",
  "/products/soft-seating/",
  "/products/education/",
  "/solutions/seating/",
  "/solutions/workstations/",
  "/solutions/tables/",
  "/solutions/storages/",
  "/solutions/soft-seating/",
  "/solutions/education/",
];

const APP_ROUTES = [
  "/ooplanner/",
  "/ooplanner/projects/",
  "/oostudio/",
];

const ADMIN_ROUTES = [
  "/admin/",
  "/admin/catalog/",
  "/admin/crm/",
  "/admin/crm/clients/",
  "/admin/crm/projects/",
  "/admin/crm/quotes/",
  "/admin/inventory/",
  "/admin/planner-catalog/",
  "/admin/customer-queries/",
  "/admin/analytics/",
  "/admin/settings/",
  "/admin/design-kit/",
  "/admin/workspace-catalog/",
  "/admin/themes/",
  "/admin/price-books/",
  "/admin/plans/",
  "/admin/features/",
];

const VIEWPORTS = {
  mobile: { width: 375, height: 812, label: "mobile", isMobile: true },
  desktop: { width: 1920, height: 1080, label: "desktop", isMobile: false },
};

async function discoverProductDetail() {
  try {
    const res = await fetch(`${BASE}/api/products/filter?category=seating&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.products?.[0] ?? data?.items?.[0];
    if (!item) return null;
    const slug = item.slug ?? item.id;
    const cat = item.category ?? "seating";
    return `/products/${cat}/${slug}/`;
  } catch {
    return null;
  }
}

async function discoverAdminPlanId() {
  try {
    const res = await fetch(`${BASE}/api/admin/plans?limit=1`);
    if (!res.ok) return "demo-plan";
    const data = await res.json();
    const plan = data?.plans?.[0];
    return plan?.id ?? plan?.planId ?? "demo-plan";
  } catch {
    return "demo-plan";
  }
}

function auditPage() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const docW = document.documentElement.scrollWidth;
  const bodyW = document.body.scrollWidth;
  const overflowPx = Math.max(docW, bodyW) - vw;

  const header =
    document.querySelector("header") ??
    document.querySelector('[role="banner"]') ??
    document.querySelector('[class*="site-header"]');
  const footer =
    document.querySelector("footer") ??
    document.querySelector('[role="contentinfo"]');
  const h1 = document.querySelector("h1");

  const isDecorOverflow = (el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    return /marquee|carousel|track|sr-only|visually-hidden|hidden|scroll|overflow|gradient|glow|shadow|accent|decoration|orb|blob|noise|grain|pattern/i.test(
      cls,
    );
  };

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (r.width < 2 || r.height < 2) return false;
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    return true;
  };

  const issues = [];

  if (overflowPx > 2) {
    let realOverflow = 0;
    for (const el of document.querySelectorAll("main *, header *, [role='main'] *")) {
      if (!isVisible(el) || isDecorOverflow(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 6 && r.left < vw - 20) realOverflow++;
    }
    if (realOverflow > 0) {
      issues.push(`horizontal overflow +${overflowPx}px (${realOverflow} els)`);
    }
  }

  const tiny = [];
  for (const el of document.querySelectorAll("main p, main span, main a, main button, main label, header a")) {
    if (!isVisible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs > 0 && fs < 11) {
      const t = (el.textContent ?? "").trim().slice(0, 40);
      if (t.length > 3) tiny.push(`${fs}px:"${t}"`);
    }
    if (tiny.length >= 3) break;
  }
  if (tiny.length) issues.push(`tiny text: ${tiny.join("; ")}`);

  const isAppShell =
    location.pathname.startsWith("/ooplanner") ||
    location.pathname.startsWith("/oostudio") ||
    location.pathname.startsWith("/admin");

  const isSuiteShell =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/portal") ||
    location.pathname.startsWith("/choose-product");

  if (!isAppShell && !isSuiteShell) {
    if (!header) issues.push("missing header/nav");
    if (!footer) issues.push("missing footer");
  }

  const isMarketingMobile = vw <= 480 && !isAppShell && !isSuiteShell;
  if (isMarketingMobile && header) {
    const navToggle =
      document.querySelector(
        '[aria-label*="menu" i], [aria-label*="navigation" i][aria-expanded], button[class*="hamburger"], button[class*="menu"], [data-testid*="menu"], .mobile-nav-toggle, .nav-toggle, button[aria-controls*="nav" i]',
      );
    if (!navToggle) {
      const navLinks = header.querySelectorAll("nav a, header [role='navigation'] a");
      let visibleCount = 0;
      for (const a of navLinks) {
        const r = a.getBoundingClientRect();
        const s = getComputedStyle(a);
        if (r.width > 0 && r.height > 0 && s.display !== "none") visibleCount++;
      }
      if (visibleCount > 8) issues.push("nav links crowded on mobile (no hamburger)");
    }
  }

  if (isSuiteShell && vw <= 480) {
    const nav = document.querySelector(".shell-global-nav__links");
    if (nav) {
      const links = [...nav.querySelectorAll("a")];
      const clipped = links.filter((a) => {
        const r = a.getBoundingClientRect();
        return r.right > vw + 4;
      });
      if (clipped.length > 0 && nav.scrollWidth <= nav.clientWidth + 2) {
        issues.push(`suite nav clipped (${clipped.length} links)`);
      }
    }
  }

  const ctas = [...document.querySelectorAll("a[class*='btn'], button[class*='btn'], .cta, [class*='cta']")].filter(
    (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < vh;
    },
  );
  if (vw <= 480 && ctas.length >= 2) {
    const row = ctas.slice(0, 4).filter((a) => {
      const r = a.getBoundingClientRect();
      return r.right > vw - 4;
    });
    if (row.length >= 2) issues.push("CTA row may overflow on mobile");
  }

  const hero =
    document.querySelector('[class*="hero"], [class*="Hero"], .route-hero, .editorial-hero') ??
    h1?.closest("section");
  if (
    !isAppShell &&
    !h1 &&
    !hero &&
    !isSuiteShell &&
    !location.pathname.startsWith("/login")
  ) {
    issues.push("no hero/h1 above fold");
  }

  const errText = document.body.innerText.slice(0, 800);
  if (
    /application error|something went wrong|internal server error/i.test(errText) &&
    !location.pathname.includes("404")
  ) {
    issues.push("error text visible");
  }

  return {
    path: location.pathname,
    search: location.search,
    title: document.title,
    overflowPx,
    hasHeader: !!header,
    hasFooter: !!footer,
    hasH1: !!h1,
    h1Text: h1?.textContent?.trim()?.slice(0, 60) ?? null,
    issues,
  };
}

await mkdir(OUT, { recursive: true });

const productDetail = await discoverProductDetail();
const planId = await discoverAdminPlanId();

const dynamicRoutes = [
  `/admin/plans/${planId}/`,
  `/admin/crm/projects/demo-project/`,
  `/ooplanner/projects/${planId}/`,
  `/portal/${planId}/`,
];

const routes = [
  ...new Set([
    ...STATIC_MARKETING,
    ...DYNAMIC_SAMPLES,
    ...APP_ROUTES,
    ...ADMIN_ROUTES,
    ...dynamicRoutes,
    ...(productDetail ? [productDetail] : []),
  ]),
];

const browser = await chromium.launch({ headless: true });
const allResults = [];

for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.isMobile ? 2 : 1,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  });
  const page = await context.newPage();

  for (const route of routes) {
    const url = `${BASE}${route}`;
    const slug = route.replace(/[?&=]/g, "_").replace(/\//g, "_").replace(/^_|_$/g, "") || "root";
    const entry = { route, viewport: vpKey, issues: [], status: null, error: null };

    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForTimeout(2200);
      entry.status = resp?.status() ?? null;

      const shotDir = path.join(OUT, vpKey);
      await mkdir(shotDir, { recursive: true });
      await page.screenshot({ path: path.join(shotDir, `${slug}-fold.png`), fullPage: false });

      await page.evaluate(() => window.scrollBy(0, Math.min(720, window.innerHeight * 0.85)));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(shotDir, `${slug}-scroll.png`), fullPage: false });
      await page.evaluate(() => window.scrollTo(0, 0));

      const audit = await page.evaluate(auditPage);
      entry.issues = audit.issues;
      entry.audit = audit;
      entry.finalPath = audit.path;
    } catch (err) {
      entry.error = String(err).slice(0, 200);
      entry.issues = ["navigation failed"];
    }

    allResults.push(entry);
    process.stderr.write(`${vpKey} ${route} ${entry.issues.length ? "ISSUES" : "OK"}\n`);
  }

  await context.close();
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  routes,
  results: allResults,
};
await writeFile(path.join(OUT, "audit-results.json"), JSON.stringify(summary, null, 2));

const okCount = routes.filter((r) => {
  const m = allResults.find((x) => x.route === r && x.viewport === "mobile");
  const d = allResults.find((x) => x.route === r && x.viewport === "desktop");
  return !(m?.issues?.length ?? 0) && !(d?.issues?.length ?? 0) && !m?.error && !d?.error;
}).length;

console.log(`---SUMMARY: ${routes.length} routes, ${okCount} fully OK---`);

console.log("---MOBILE---");
for (const r of routes) {
  const m = allResults.find((x) => x.route === r && x.viewport === "mobile");
  const status = m?.error || m?.issues?.length ? "Issues" : "OK";
  const top = m?.error ?? (m?.issues?.length ? m.issues.slice(0, 2).join("; ") : "—");
  console.log(`| ${r} | ${status} | ${top} |`);
}

console.log("---DESKTOP---");
for (const r of routes) {
  const d = allResults.find((x) => x.route === r && x.viewport === "desktop");
  const status = d?.error || d?.issues?.length ? "Issues" : "OK";
  const top = d?.error ?? (d?.issues?.length ? d.issues.slice(0, 2).join("; ") : "—");
  console.log(`| ${r} | ${status} | ${top} |`);
}

const offenders = routes.filter((r) => {
  const m = allResults.find((x) => x.route === r && x.viewport === "mobile");
  const d = allResults.find((x) => x.route === r && x.viewport === "desktop");
  return (m?.issues?.length ?? 0) > 0 || (d?.issues?.length ?? 0) > 0 || m?.error || d?.error;
});
console.log("---WORST---");
for (const r of offenders) {
  const m = allResults.find((x) => x.route === r && x.viewport === "mobile");
  const d = allResults.find((x) => x.route === r && x.viewport === "desktop");
  console.log(
    `${r}: mobile=[${m?.issues?.join("; ") ?? m?.error ?? "OK"}] desktop=[${d?.issues?.join("; ") ?? d?.error ?? "OK"}]`,
  );
}
