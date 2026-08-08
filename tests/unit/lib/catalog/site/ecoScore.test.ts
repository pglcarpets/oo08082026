import { describe, expect, it } from "vitest";

import {
  LEGACY_PLACEHOLDER_ECO_SCORE,
  resolveDisplayEcoScore,
} from "@/lib/catalog/site/ecoScore";

describe("ecoScore", () => {
  it("treats legacy placeholder 5 as missing", () => {
    expect(resolveDisplayEcoScore({ specs: { sustainability_score: 5 } })).toBeUndefined();
    expect(resolveDisplayEcoScore({ metadata: { sustainabilityScore: 5 } })).toBeUndefined();
  });

  it("returns audited scores", () => {
    expect(resolveDisplayEcoScore({ specs: { sustainability_score: 8 } })).toBe(8);
    expect(resolveDisplayEcoScore({ metadata: { sustainabilityScore: 7 } })).toBe(7);
  });

  it("prefers specs over metadata", () => {
    expect(
      resolveDisplayEcoScore({
        specs: { sustainability_score: 9 },
        metadata: { sustainabilityScore: 6 },
      }),
    ).toBe(9);
  });

  it("documents placeholder constant", () => {
    expect(LEGACY_PLACEHOLDER_ECO_SCORE).toBe(5);
  });
});
