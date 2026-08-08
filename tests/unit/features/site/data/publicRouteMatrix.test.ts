/**
 * S2 public route matrix (unit): hard redirects, hard 404 classification,
 * no soft-404 commercial indexables, no public Admin nav.
 */
// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SITE_ROUTE_CLASSIFICATION,
  getRouteClassification,
} from "@/features/site/data/routeClassification";
import {
  SITE_CTA_LINKS,
  SITE_FOOTER_NAV,
  SITE_HEADER_MORE_LINKS,
  SITE_HEADER_PRIMARY_LINKS,
  SITE_NAV_FEATURED_CARDS,
  SITE_NAV_LINKS,
  SITE_NAV_SEARCH_FALLBACK_LINKS,
} from "@/features/site/data/navigation";

const monorepoRoot = path.resolve(__dirname, "../../../../..");
const nextConfigPath = path.join(monorepoRoot, "config/build/next.config.js");

/** Marketing redirect sources that must be permanent: true in next.config (→ 308). */
const HARD_PUBLIC_REDIRECT_SOURCES = [
  "/catalog",
  "/brochure",
  "/download-brochure",
  "/news",
  "/gallery",
  "/social",
  "/portfolio",
  "/projects",
  "/templates",
  "/login",
  "/imprint",
  "/support-ivr",
  "/tracking",
  "/products/category/:slug",
] as const;

describe("public route matrix — next.config hard redirects", () => {
  it("declares permanent:true for every public marketing redirect source", () => {
    const raw = fs.readFileSync(nextConfigPath, "utf8");
    for (const source of HARD_PUBLIC_REDIRECT_SOURCES) {
      // Each source block should set permanent: true nearby.
      const sourceIdx = raw.indexOf(`source: "${source}"`);
      expect(sourceIdx, `missing source ${source}`).toBeGreaterThanOrEqual(0);
      const window = raw.slice(sourceIdx, sourceIdx + 220);
      expect(window, `${source} must be permanent`).toMatch(/permanent:\s*true/);
    }
  });

  it("does not use URL fragments in imprint redirect destinations", () => {
    const raw = fs.readFileSync(nextConfigPath, "utf8");
    for (const source of ["/imprint", "/imprint/"] as const) {
      const sourceIdx = raw.indexOf(`source: "${source}"`);
      expect(sourceIdx, `missing source ${source}`).toBeGreaterThanOrEqual(0);
      const window = raw.slice(sourceIdx, sourceIdx + 160);
      const destinationMatch = window.match(/destination: "([^"]+)"/);
      expect(destinationMatch, `${source} destination`).not.toBeNull();
      const destination = destinationMatch?.[1] ?? "";
      expect(destination, "fragment redirects are unreliable over HTTP 308/301").not.toMatch(/#/);
      expect(destination).toBe("/terms/?section=imprint");
    }
  });

  it("routes /templates via next.config only (no shadow page module)", () => {
    const templatesPage = path.join(monorepoRoot, "site/app/(site)/templates/page.tsx");
    expect(fs.existsSync(templatesPage)).toBe(false);

    const raw = fs.readFileSync(nextConfigPath, "utf8");
    for (const source of ["/templates", "/templates/"] as const) {
      const sourceIdx = raw.indexOf(`source: "${source}"`);
      expect(sourceIdx, `missing source ${source}`).toBeGreaterThanOrEqual(0);
      const window = raw.slice(sourceIdx, sourceIdx + 160);
      const destinationMatch = window.match(/destination: "([^"]+)"/);
      expect(destinationMatch, `${source} destination`).not.toBeNull();
      expect(destinationMatch?.[1]).toBe("/products/");
    }
  });

  it("routes bare /login to /access/ in next.config (canonical sign-in)", () => {
    const raw = fs.readFileSync(nextConfigPath, "utf8");
    for (const source of ["/login", "/login/"] as const) {
      const sourceIdx = raw.indexOf(`source: "${source}"`);
      expect(sourceIdx, `missing source ${source}`).toBeGreaterThanOrEqual(0);
      const window = raw.slice(sourceIdx, sourceIdx + 160);
      const destinationMatch = window.match(/destination: "([^"]+)"/);
      expect(destinationMatch, `${source} destination`).not.toBeNull();
      expect(destinationMatch?.[1]).toBe("/access/");
    }
  });

  it("keeps config-only legacy marketing redirects free of shadow page modules", () => {
    const configOnlyRedirects = [
      "brochure",
      "catalog",
      "download-brochure",
      "gallery",
      "imprint",
      "news",
      "portfolio",
      "projects",
      "social",
      "support-ivr",
      "templates",
      "tracking",
    ] as const;
    for (const slug of configOnlyRedirects) {
      const pagePath = path.join(monorepoRoot, `site/app/(site)/${slug}/page.tsx`);
      expect(fs.existsSync(pagePath), `${slug} page stub should be removed`).toBe(false);
    }
  });

  it("keeps config-only admin legacy redirects free of shadow page modules", () => {
    const configOnlyAdminPages = [
      "site/app/admin/svg-editor/parametric/page.tsx",
      "site/app/admin/product-studio/parametric/page.tsx",
      "site/app/admin/svg-editor/[id]/page.tsx",
    ] as const;
    for (const rel of configOnlyAdminPages) {
      const pagePath = path.join(monorepoRoot, rel);
      expect(fs.existsSync(pagePath), `${rel} stub should be removed`).toBe(false);
    }
  });

  it("retires portal svg-catalog with permanent redirects and no page modules (Phase 7 Stage B)", () => {
    const catalogPage = path.join(
      monorepoRoot,
      "site/app/(site)/portal/svg-catalog/page.tsx",
    );
    const slugPage = path.join(
      monorepoRoot,
      "site/app/(site)/portal/svg-catalog/[slug]/page.tsx",
    );
    expect(fs.existsSync(catalogPage)).toBe(false);
    expect(fs.existsSync(slugPage)).toBe(false);

    const raw = fs.readFileSync(nextConfigPath, "utf8");
    for (const source of [
      "/portal/svg-catalog",
      "/portal/svg-catalog/",
      "/portal/svg-catalog/:slug",
      "/portal/svg-catalog/:slug/",
    ] as const) {
      const sourceIdx = raw.indexOf(`source: "${source}"`);
      expect(sourceIdx, `missing source ${source}`).toBeGreaterThanOrEqual(0);
      const window = raw.slice(sourceIdx, sourceIdx + 200);
      expect(window, `${source} must be permanent`).toMatch(/permanent:\s*true/);
      expect(window).toMatch(/destination:\s*"\/products\/"/);
    }
  });

  it("retains redirect shims that add behavior next.config cannot express", () => {
    expect(fs.existsSync(path.join(monorepoRoot, "site/app/(site)/login/page.tsx"))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(monorepoRoot, "site/app/(site)/products/category/[slug]/page.tsx")),
    ).toBe(true);
    // Product Studio retired → live Furniture Studio app route (config 308 from /admin/svg-editor)
    expect(fs.existsSync(path.join(monorepoRoot, "site/app/oostudio/page.tsx"))).toBe(
      true,
    );
  });
});

describe("public route matrix — classification honesty", () => {
  it("classifies known public hard-redirect paths as redirect + not indexable", () => {
    const samples: Array<{ path: string; classification: string }> = [
      { path: "/catalog", classification: "redirect" },
      { path: "/brochure", classification: "redirect" },
      { path: "/download-brochure", classification: "redirect" },
      { path: "/news", classification: "redirect" },
      { path: "/gallery", classification: "redirect" },
      { path: "/social", classification: "redirect" },
      { path: "/portfolio", classification: "redirect" },
      { path: "/projects", classification: "redirect" },
      { path: "/templates", classification: "redirect" },
      { path: "/imprint", classification: "redirect" },
      { path: "/support-ivr", classification: "redirect" },
      { path: "/tracking", classification: "redirect" },
      { path: "/products/category/seating", classification: "redirect" },
      { path: "/repo-store", classification: "redirect" },
      { path: "/login", classification: "redirect" },
      { path: "/portal/svg-catalog", classification: "redirect" },
      { path: "/portal/svg-catalog/side-table-001", classification: "redirect" },
    ];
    for (const sample of samples) {
      const meta = getRouteClassification(sample.path);
      expect(meta?.classification, sample.path).toBe(sample.classification);
      expect(meta?.indexable, sample.path).toBe(false);
    }
  });

  it("keeps commercial indexable routes public (not redirect shells)", () => {
    for (const route of [
      "/",
      "/products",
      "/solutions",
      "/about",
      "/contact",
      "/planning",
      "/clients",
      "/downloads",
    ]) {
      const meta = getRouteClassification(route);
      expect(meta?.classification, route).toBe("public");
      expect(meta?.indexable, route).toBe(true);
    }
  });

  it("never classifies /admin as a public indexable marketing route", () => {
    const admin = SITE_ROUTE_CLASSIFICATION.find((m) => m.route.startsWith("/admin"));
    // Admin is outside (site) classification table; if present it must not be public+indexable.
    if (admin) {
      expect(admin.classification === "public" && admin.indexable).toBe(false);
    }
    expect(getRouteClassification("/admin")).toBeUndefined();
  });
});

describe("public route matrix — nav data", () => {
  it("exposes no /admin href or Admin label in public nav surfaces", () => {
    const hrefs = [
      ...SITE_NAV_LINKS.map((l) => l.href),
      ...SITE_HEADER_PRIMARY_LINKS.map((l) => l.href),
      ...SITE_HEADER_MORE_LINKS.map((l) => l.href),
      ...SITE_CTA_LINKS.map((l) => l.href),
      ...SITE_NAV_FEATURED_CARDS.map((c) => c.href),
      ...SITE_NAV_SEARCH_FALLBACK_LINKS.map((l) => l.href),
      ...SITE_FOOTER_NAV.flatMap((s) => s.links.map((l) => l.href)),
    ];
    const labels = [
      ...SITE_NAV_LINKS.map((l) => l.label),
      ...SITE_CTA_LINKS.map((l) => l.label),
      ...SITE_NAV_SEARCH_FALLBACK_LINKS.map((l) => l.label),
      ...SITE_FOOTER_NAV.flatMap((s) => s.links.map((l) => l.label)),
    ];
    expect(hrefs.some((h) => /^\/admin(\/|$)/i.test(h))).toBe(false);
    expect(labels.some((l) => l.trim().toLowerCase() === "admin")).toBe(false);
  });
});
