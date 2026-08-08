/**
 * Name-mirror coverage for lib/theme/schema.
 */
import { describe, expect, it } from "vitest";
import {
  blockThemePayloadSchema,
  blockThemeSchema,
} from "@/lib/theme/schema";

describe("blockThemePayloadSchema", () => {
  it("accepts a flat string token dictionary", () => {
    const parsed = blockThemePayloadSchema.parse({
      "--color-primary": "#123456",
      "--surface-page": "white",
    });
    expect(parsed["--color-primary"]).toBe("#123456");
  });

  it("rejects non-string token values", () => {
    const result = blockThemePayloadSchema.safeParse({
      "--color-primary": 12,
    });
    expect(result.success).toBe(false);
  });
});

describe("blockThemeSchema", () => {
  it("accepts a full theme row with optional timestamps", () => {
    const parsed = blockThemeSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Premium Light",
      payload_jsonb: { "--color-primary": "#0a66c2" },
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });
    expect(parsed.is_active).toBe(true);
    expect(parsed.name).toBe("Premium Light");
  });

  it("rejects invalid uuid ids", () => {
    const result = blockThemeSchema.safeParse({
      id: "not-a-uuid",
      name: "Bad",
      payload_jsonb: {},
      is_active: false,
    });
    expect(result.success).toBe(false);
  });
});
