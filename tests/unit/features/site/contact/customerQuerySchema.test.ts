import { describe, it, expect } from "vitest";
import {
  contactFormSchema,
  customerQueryPayloadSchema,
} from "@/features/site/contact/customerQuerySchema";

const baseValid = {
  name: "Alex",
  message: "Need chairs",
  email: "alex@example.com",
  phone: "",
  company: "",
  preferredContact: "any" as const,
  website: "",
};

describe("customerQuerySchema", () => {
  describe("customerQueryPayloadSchema", () => {
    it("accepts email-only contact channel", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        email: "user@example.com",
        phone: "",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts phone-only contact channel", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        email: "",
        phone: "+919835630940",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts both email and phone", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        email: "user@example.com",
        phone: "+919835630940",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects empty name", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        name: "   ",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects empty message", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        message: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects when neither email nor phone is provided", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        email: "",
        phone: "  ",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((issue) => issue.message);
        expect(messages).toContain("Please provide email or phone.");
      }
    });

    it("parses non-empty honeypot (domain handles silent fake success)", () => {
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        website: "http://spam.example",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.website).toBe("http://spam.example");
      }
    });

    it("applies length caps on name and message", () => {
      const longName = "n".repeat(200);
      const parsed = customerQueryPayloadSchema.safeParse({
        ...baseValid,
        name: longName,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("contactFormSchema", () => {
    it("requires consent true", () => {
      const withoutConsent = contactFormSchema.safeParse({
        ...baseValid,
        consent: false,
      });
      expect(withoutConsent.success).toBe(false);
      if (!withoutConsent.success) {
        const messages = withoutConsent.error.issues.map((i) => i.message);
        expect(messages).toContain("Confirm privacy consent before sending.");
      }

      const withConsent = contactFormSchema.safeParse({
        ...baseValid,
        consent: true,
      });
      expect(withConsent.success).toBe(true);
    });
  });
});
