import { describe, expect, it } from "vitest";
import {
  CAREER_PAGE_COPY,
  CAREER_PAGE_JOBS,
  CATEGORY_ROUTE_COPY,
  COMPARE_ROUTE_COPY,
  CONTACT_FORM_CONTEXT_COPY,
  DOWNLOADS_PAGE_COPY,
  DOWNLOADS_RESOURCE_CATEGORIES,
  LEGAL_PAGE_COPY,
  PDP_ROUTE_COPY,
  PLANNING_PAGE_COPY,
  PLANNING_PAGE_DELIVERABLES,
  PLANNING_PAGE_STEPS,
  PRODUCTS_PAGE_COPY,
  CLIENTS_WORK,
  PROJECTS_PAGE_CLIENTS,
  QUOTE_CART_ROUTE_COPY,
  SHOWROOMS_CLIENTS,
  SHOWROOMS_HIGHLIGHTS,
  SHOWROOMS_PAGE_COPY,
  SOLUTIONS_PAGE_COPY,
  SUSTAINABILITY_PAGE_COPY,
} from "@/features/site/data/routeCopy";

describe("route copy — page heroes", () => {
  it("contact form context seeds compare and quote-cart flows", () => {
    expect(CONTACT_FORM_CONTEXT_COPY.quote.compare.requirement).toMatch(/compare/i);
    expect(CONTACT_FORM_CONTEXT_COPY.quote["quote-cart"].seededMessage).toMatch(/quote cart/i);
  });
});

describe("route copy — proof and portfolio", () => {
  it("projects client roster has unique names and valid sectors", () => {
    const names = PROJECTS_PAGE_CLIENTS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(PROJECTS_PAGE_CLIENTS.length).toBeGreaterThan(50);
    for (const client of PROJECTS_PAGE_CLIENTS) {
      expect(client.sector.trim().length).toBeGreaterThan(0);
    }
  });

  it("clients work roster uses stable folder naming", () => {
    expect(CLIENTS_WORK).toHaveLength(6);
    for (const client of CLIENTS_WORK) {
      expect(client.folder.trim().length).toBeGreaterThan(0);
      expect(client.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("route copy — marketing routes", () => {
  it("showrooms page links clients and highlights", () => {
    expect(SHOWROOMS_PAGE_COPY.clientsCta).toMatch(/client/i);
    expect(SHOWROOMS_CLIENTS).toContain("Titan");
    expect(SHOWROOMS_HIGHLIGHTS).toHaveLength(3);
  });

  it("solutions page includes delivery stats and planning CTA", () => {
    expect(SOLUTIONS_PAGE_COPY.stats).toHaveLength(4);
    expect(SOLUTIONS_PAGE_COPY.planningKicker).toMatch(/planning/i);
    expect(SOLUTIONS_PAGE_COPY.planningCtas).toHaveLength(3);
  });

  it("sustainability page documents eco-score without unsupported claims", () => {
    expect(SUSTAINABILITY_PAGE_COPY.introPoints.some((p) => /unsupported/i.test(p))).toBe(true);
    expect(SUSTAINABILITY_PAGE_COPY.pillars).toHaveLength(3);
    expect(SUSTAINABILITY_PAGE_COPY.ecoScoreItems).toHaveLength(3);
  });
});

describe("route copy — careers", () => {
  it("career page lists openings and support routing", () => {
    expect(CAREER_PAGE_JOBS).toHaveLength(4);
    expect(CAREER_PAGE_COPY.careersEmail).toContain("@");
    expect(CAREER_PAGE_COPY.processSteps).toHaveLength(3);
  });
});

describe("route copy — planning, service, downloads", () => {
  it("planning page defines steps and deliverables", () => {
    expect(PLANNING_PAGE_STEPS).toHaveLength(3);
    expect(PLANNING_PAGE_DELIVERABLES.length).toBeGreaterThanOrEqual(4);
    expect(PLANNING_PAGE_COPY.primaryCta).toMatch(/planning/i);
  });

  it("downloads resource desk lists three resource categories", () => {
    expect(DOWNLOADS_PAGE_COPY.heroTitle).toBe("Resource Desk");
    expect(DOWNLOADS_RESOURCE_CATEGORIES).toHaveLength(3);
    for (const category of DOWNLOADS_RESOURCE_CATEGORIES) {
      expect(category.href).toMatch(/^\//);
    }
  });
});

describe("route copy — legal and catalog routes", () => {
  it("legal pages cover privacy, terms, imprint, and refund", () => {
    expect(LEGAL_PAGE_COPY.privacy.title).toBe("Privacy Policy");
    expect(LEGAL_PAGE_COPY.terms.sections.length).toBeGreaterThanOrEqual(5);
    expect(LEGAL_PAGE_COPY.imprint.sections.some((s) => s.heading === "Contact")).toBe(true);
    expect(LEGAL_PAGE_COPY.refund.sections).toHaveLength(4);
  });

  it("products page copy includes pillar cards", () => {
    expect(PRODUCTS_PAGE_COPY.pillars).toHaveLength(3);
    expect(PRODUCTS_PAGE_COPY.headlineAccent).toMatch(/perform/i);
  });

  it("category, compare, quote cart, and PDP route copy expose UI labels", () => {
    expect(CATEGORY_ROUTE_COPY.compareActiveLabel).toContain("{count}");
    expect(CATEGORY_ROUTE_COPY.emptyCategoryTitle).toMatch(/no products|published/i);
    expect(CATEGORY_ROUTE_COPY.emptyCategoryPrimaryCta).toMatch(/categories/i);
    expect(CATEGORY_ROUTE_COPY.emptyCategorySecondaryCta).toMatch(/contact/i);
    expect(CATEGORY_ROUTE_COPY.offlinePrimaryCta).toMatch(/contact/i);
    expect(COMPARE_ROUTE_COPY.title).toBe("Compare selected workspace options");
    expect(COMPARE_ROUTE_COPY.bodyHeading).toBe("Specification review");
    expect(COMPARE_ROUTE_COPY.emptyTitle).toMatch(/empty|shortlist/i);
    expect(QUOTE_CART_ROUTE_COPY.summaryTitle).toBe("Request summary");
    expect(PDP_ROUTE_COPY.ctas.addToQuote).toBe("Add to Quote Cart");
    expect(PDP_ROUTE_COPY.summary.visualCoverage).toContain("{count}");
  });
});