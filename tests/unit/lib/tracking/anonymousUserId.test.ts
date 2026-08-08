import { describe, it, expect } from "vitest";
import { createAnonymousUserId, normalizeAnonymousUserId } from "@/lib/tracking/anonymousUserId";

describe("anonymousUserId utilities", () => {
  describe("createAnonymousUserId", () => {
    it("should generate a valid anonymous user ID starting with anon_", () => {
      const id = createAnonymousUserId();
      expect(id.startsWith("anon_")).toBe(true);
      expect(id.length).toBeGreaterThan(16);
    });
  });

  describe("normalizeAnonymousUserId", () => {
    it("should return empty string for non-strings", () => {
      expect(normalizeAnonymousUserId(null)).toBe("");
      expect(normalizeAnonymousUserId(undefined)).toBe("");
      expect(normalizeAnonymousUserId(123)).toBe("");
    });

    it("should return the same ID if it is already valid", () => {
      const validId = "anon_1234567890abcdefg";
      expect(normalizeAnonymousUserId(validId)).toBe(validId);
    });

    it("should normalize legacy user_ IDs to anon_ prefix", () => {
      const legacyId = "user_12345678";
      expect(normalizeAnonymousUserId(legacyId)).toBe("anon_12345678");
    });

    it("should return empty string for invalid patterns", () => {
      expect(normalizeAnonymousUserId("random_string")).toBe("");
      expect(normalizeAnonymousUserId("anon_")).toBe(""); // too short
    });
  });
});
