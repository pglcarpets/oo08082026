/**
 * Name-mirror: features/site/data/proof
 */

import { describe, expect, it } from "vitest";
import { TRUSTED_BY_CLIENTS, TRUSTED_BY_STATS } from "@/features/site/data/proof";

describe("TRUSTED_BY_STATS", () => {
  it("shows experience and client scale KPIs", () => {
    expect(TRUSTED_BY_STATS).toHaveLength(4);
    expect(TRUSTED_BY_STATS.some((s) => /years/i.test(s.label))).toBe(true);
    expect(TRUSTED_BY_STATS.some((s) => /projects/i.test(s.label))).toBe(true);
    for (const stat of TRUSTED_BY_STATS) {
      expect(stat.value.length).toBeGreaterThan(0);
      expect(stat.label.length).toBeGreaterThan(0);
    }
  });

  it("does not claim a separate inflated corporate-client census", () => {
    // Same 120+ floor as projects is fine only when labelled as selected orgs.
    const orgStat = TRUSTED_BY_STATS.find((s) => /organisation/i.test(s.label));
    expect(orgStat).toBeDefined();
    expect(orgStat?.label).toMatch(/selected organisations/i);
    expect(TRUSTED_BY_STATS.some((s) => /corporate clients/i.test(s.label))).toBe(
      false,
    );
  });
});

describe("TRUSTED_BY_CLIENTS", () => {
  it("lists unique client names with sectors", () => {
    const names = TRUSTED_BY_CLIENTS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(TRUSTED_BY_CLIENTS.length).toBeGreaterThan(20);
    for (const client of TRUSTED_BY_CLIENTS) {
      expect(client.sector.length).toBeGreaterThan(0);
    }
    const titan = TRUSTED_BY_CLIENTS.find((c) => c.name === "Titan");
    expect(titan?.location).toMatch(/Patna/i);
  });

  it("has a logo file mapping for every roster client", async () => {
    const { trustedByClientsMissingLogos } = await import(
      "@/features/site/data/proof"
    );
    expect(trustedByClientsMissingLogos()).toEqual([]);
  });
});
