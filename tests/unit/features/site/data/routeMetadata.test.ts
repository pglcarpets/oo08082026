import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/site/data/seo", () => ({
  buildPageMetadata: vi.fn((siteUrl, data) => ({
    title: data.title,
    description: data.description,
    alternates: { canonical: `${siteUrl}${data.path}` },
    keywords: data.keywords,
  })),
}));

vi.mock("@/lib/siteUrl", () => ({
  SITE_URL: "https://mock-site-url.com",
}));

import {
  ABOUT_PAGE_METADATA,
  SOLUTIONS_PAGE_METADATA,
  CONTACT_PAGE_METADATA,
  SUSTAINABILITY_PAGE_METADATA,
  SERVICE_PAGE_METADATA,
  PLANNING_PAGE_METADATA,
  DOWNLOADS_PAGE_METADATA,
  PRIVACY_PAGE_METADATA,
  TERMS_PAGE_METADATA,
  COMPARE_PAGE_METADATA,
  QUOTE_CART_PAGE_METADATA,
  SHOWROOMS_PAGE_METADATA,
  CLIENTS_PAGE_METADATA,
  TRUSTED_BY_PAGE_METADATA,
  CAREER_PAGE_METADATA,
  PRODUCTS_PAGE_METADATA,
} from "@/features/site/data/routeMetadata";

describe("routeMetadata site-data", () => {
  it("should have correct metadata build outcomes", () => {
    expect(ABOUT_PAGE_METADATA.title).toMatch(/Office furniture|Steelcase|Featherlite|Humanscale/i);
    expect(ABOUT_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/about");

    expect(SOLUTIONS_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/solutions");
    expect(CONTACT_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/contact");
    expect(SUSTAINABILITY_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/sustainability");
    expect(SERVICE_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/service");
    expect(PLANNING_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/planning");
    expect(DOWNLOADS_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/downloads");
    expect(PRIVACY_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/privacy");
    expect(TERMS_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/terms");
    expect(COMPARE_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/compare");
    expect(QUOTE_CART_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/quote-cart");
    expect(SHOWROOMS_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/showrooms");
    expect(CLIENTS_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/clients");
    expect(TRUSTED_BY_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/trusted-by");
    expect(CAREER_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/career");
    expect(PRODUCTS_PAGE_METADATA.alternates?.canonical).toBe("https://mock-site-url.com/products");
  });
});
