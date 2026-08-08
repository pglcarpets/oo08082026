import { describe, it, expect } from "vitest";
import {
  SITE_CONTACT,
  SUPPORT_PHONE_DIGITS,
  SALES_PHONE_DIGITS,
  toTelHref,
  formatSitePostalAddress,
  buildMailtoHref,
  buildWhatsAppHref,
} from "@/features/site/data/contact";

describe("contact site-data helper", () => {
  it("should have correct contact constants", () => {
    expect(SITE_CONTACT.brandName).toBe("One&Only");
    expect(SUPPORT_PHONE_DIGITS).toBe("919031022875");
    expect(SALES_PHONE_DIGITS).toBe("919835630940");
  });

  describe("toTelHref", () => {
    it("should prepend tel:", () => {
      expect(toTelHref("1234567890")).toBe("tel:1234567890");
    });

    it("should strip spaces and keep leading +", () => {
      expect(toTelHref("+91 90310 22875")).toBe("tel:+919031022875");
    });
  });

  describe("formatSitePostalAddress", () => {
    it("should format address in lines", () => {
      const address = formatSitePostalAddress();
      expect(address).toContain("401, Jagat Trade Centre, Frazer Road");
      expect(address).toContain("Patna, Bihar 800001");
      expect(address).toContain("India");
    });
  });

  describe("buildMailtoHref", () => {
    it("should build simple mailto if no parameters are passed", () => {
      expect(buildMailtoHref()).toBe(`mailto:${SITE_CONTACT.salesEmail}`);
    });

    it("should build mailto with subject and body params", () => {
      const href = buildMailtoHref("hello", "world");
      expect(href).toContain(`mailto:${SITE_CONTACT.salesEmail}`);
      expect(href).toContain("subject=hello");
      expect(href).toContain("body=world");
    });
  });

  describe("buildWhatsAppHref", () => {
    it("should build WhatsApp URL with default phone", () => {
      const href = buildWhatsAppHref("hello there");
      expect(href).toBe(`https://wa.me/${SUPPORT_PHONE_DIGITS}?text=hello%20there`);
    });

    it("should build WhatsApp URL with custom phone", () => {
      const href = buildWhatsAppHref("hello", "919999999999");
      expect(href).toBe("https://wa.me/919999999999?text=hello");
    });
  });
});
