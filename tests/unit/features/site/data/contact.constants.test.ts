import { describe, expect, it } from "vitest";
import {
  FOOTER_CONVERSION_PANEL,
  SALES_PHONE_DIGITS,
  SITE_CONTACT,
  SUPPORT_PHONE_DIGITS,
  buildMailtoHref,
  buildWhatsAppHref,
  toTelHref,
} from "@/features/site/data/contact";

describe("SITE_CONTACT", () => {
  it("has sales and support phone numbers", () => {
    expect(SITE_CONTACT.salesPhone).toMatch(/^\+91/);
    expect(SITE_CONTACT.supportPhone).toMatch(/^\+91/);
    expect(SITE_CONTACT.salesEmail).toContain("@");
  });

  it("address and geo are set for Patna", () => {
    expect(SITE_CONTACT.address.addressLocality).toBe("Patna");
    expect(SITE_CONTACT.address.addressRegion).toBe("Bihar");
    expect(SITE_CONTACT.geo.latitude).toBeGreaterThan(25);
    expect(SITE_CONTACT.geo.longitude).toBeGreaterThan(85);
  });

  it("social links include YouTube and Facebook", () => {
    expect(SITE_CONTACT.socialLinks).toHaveLength(2);
    expect(SITE_CONTACT.socialLinks.map((l) => l.id)).toEqual(["youtube", "facebook"]);
    for (const link of SITE_CONTACT.socialLinks) {
      expect(link.href).toMatch(/^https:\/\//);
    }
  });
});

describe("FOOTER_CONVERSION_PANEL", () => {
  it("routes to planning, downloads, and contact", () => {
    expect(FOOTER_CONVERSION_PANEL.actions).toHaveLength(3);
    const hrefs = FOOTER_CONVERSION_PANEL.actions.map((a) => a.href);
    expect(hrefs).toContain("/planning");
    expect(hrefs).toContain("/downloads");
    expect(hrefs).toContain("/contact");
    expect(FOOTER_CONVERSION_PANEL.highlights.length).toBeGreaterThanOrEqual(3);
  });
});

describe("contact href builders", () => {
  it("toTelHref prefixes phone with tel: and strips spaces", () => {
    expect(toTelHref(SITE_CONTACT.supportPhone)).toBe("tel:+919031022875");
  });

  it("buildMailtoHref returns base mailto without query when no params", () => {
    expect(buildMailtoHref()).toBe(`mailto:${SITE_CONTACT.salesEmail}`);
  });

  it("buildMailtoHref includes subject when provided", () => {
    const href = buildMailtoHref("Quote request");
    expect(href).toContain("mailto:");
    expect(href).toContain("subject=Quote");
  });

  it("buildMailtoHref includes body when provided", () => {
    const href = buildMailtoHref(undefined, "Need workstations for 40 users");
    expect(href).toContain("body=Need");
  });

  it("buildMailtoHref includes both subject and body", () => {
    const href = buildMailtoHref("Planning call", "Patna HQ rollout");
    expect(href).toContain("subject=Planning");
    expect(href).toContain("body=Patna");
  });

  it("buildWhatsAppHref uses default support digits", () => {
    const href = buildWhatsAppHref("Hello from test");
    expect(href).toBe(
      `https://wa.me/${SUPPORT_PHONE_DIGITS}?text=${encodeURIComponent("Hello from test")}`,
    );
  });

  it("buildWhatsAppHref accepts custom phone digits", () => {
    const href = buildWhatsAppHref("Sales enquiry", SALES_PHONE_DIGITS);
    expect(href).toContain(`https://wa.me/${SALES_PHONE_DIGITS}`);
    expect(href).toContain(encodeURIComponent("Sales enquiry"));
  });
});