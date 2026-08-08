import { describe, it, expect } from "vitest";
import {
  catalogProductIdFromSlug,
  normalizeCatalogProductId,
  normalizeUuid,
} from "@/lib/uuid/normalizeUuid";

describe("normalizeUuid", () => {
  it("accepts lowercase UUID strings", () => {
    const id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    expect(normalizeUuid(id)).toBe(id);
    expect(normalizeUuid(id.toUpperCase())).toBe(id);
  });

  it("rejects slug-like ids", () => {
    expect(normalizeUuid("oando-workstations--deskpro")).toBeUndefined();
  });

  it("derives stable UUID from slug", () => {
    const a = catalogProductIdFromSlug("oando-workstations--deskpro");
    const b = catalogProductIdFromSlug("oando-workstations--deskpro");
    expect(a).toBe(b);
    expect(normalizeUuid(a)).toBe(a);
  });

  it("prefers existing UUID over slug hash", () => {
    const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    expect(normalizeCatalogProductId(uuid, "any-slug")).toBe(uuid);
    expect(normalizeCatalogProductId("bad-id", "any-slug")).toBe(catalogProductIdFromSlug("any-slug"));
  });
});
