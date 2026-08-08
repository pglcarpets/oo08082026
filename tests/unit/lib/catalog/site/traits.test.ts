import { describe, expect, it } from "vitest";

import {
  hasVerifiedHeadrest,
  hasVerifiedHeightAdjustable,
} from "@/lib/catalog/site/traits";

describe("site catalog traits", () => {
  describe("hasVerifiedHeadrest", () => {
    it("returns false when metadata flag is not true", () => {
      expect(hasVerifiedHeadrest({ metadata: { hasHeadrest: false } })).toBe(false);
      expect(hasVerifiedHeadrest({ metadata: {} })).toBe(false);
      expect(hasVerifiedHeadrest({})).toBe(false);
    });

    it("returns false when flag is true but no headrest token in content", () => {
      expect(
        hasVerifiedHeadrest({
          name: "Task Chair",
          metadata: { hasHeadrest: true },
        }),
      ).toBe(false);
    });

    it("returns true when flag and headrest token match in name", () => {
      expect(
        hasVerifiedHeadrest({
          name: "Executive Chair with Headrest",
          metadata: { hasHeadrest: true },
        }),
      ).toBe(true);
    });

    it("detects head-rest and head rest variants", () => {
      expect(
        hasVerifiedHeadrest({
          description: "Includes adjustable head-rest support",
          metadata: { hasHeadrest: true },
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeadrest({
          specs: { "Head Rest": "Yes" },
          metadata: { hasHeadrest: true },
        }),
      ).toBe(true);
    });

    it("searches tags, features, and spec arrays", () => {
      expect(
        hasVerifiedHeadrest({
          metadata: {
            hasHeadrest: true,
            tags: ["ergonomic"],
            features: ["headrest adjustable"],
          },
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeadrest({
          metadata: { hasHeadrest: true },
          detailedInfo: { features: ["Built-in head rest"] },
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeadrest({
          metadata: { hasHeadrest: true },
          specs: { options: ["headrest", "lumbar"] },
        }),
      ).toBe(true);
    });

    it("handles numeric spec values", () => {
      expect(
        hasVerifiedHeadrest({
          metadata: { hasHeadrest: true },
          specs: { seatHeight: 450 },
        }),
      ).toBe(false);
    });
  });

  describe("hasVerifiedHeightAdjustable", () => {
    it("returns true when metadata flag is set", () => {
      expect(
        hasVerifiedHeightAdjustable({
          metadata: { isHeightAdjustable: true },
        }),
      ).toBe(true);
    });

    it("returns false when no flag and no matching tokens", () => {
      expect(hasVerifiedHeightAdjustable({ name: "Fixed Cafe Chair" })).toBe(false);
    });

    it("detects height-adjustable tokens in product text", () => {
      expect(
        hasVerifiedHeightAdjustable({
          name: "DeskPro Height Adjustable Workstation",
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeightAdjustable({
          description: "Sit/stand friendly desking",
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeightAdjustable({
          metadata: { subcategoryLabel: "Adjustable Height Series" },
        }),
      ).toBe(true);
    });

    it("searches metadata tags, features, and specs", () => {
      expect(
        hasVerifiedHeightAdjustable({
          metadata: { tags: ["height adjustable"] },
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeightAdjustable({
          detailedInfo: { features: ["Adjustable height mechanism"] },
        }),
      ).toBe(true);
      expect(
        hasVerifiedHeightAdjustable({
          specs: { mechanism: "height-adjustable gas lift" },
        }),
      ).toBe(true);
    });
  });
});