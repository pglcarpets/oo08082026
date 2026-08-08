import { describe, it, expect } from "vitest";
import {
  CATALOG_BLOCK_TOKEN_KEYS,
  UI_THEME_TOKEN_KEYS,
  stripCatalogTokens,
} from "@/lib/theme/catalogTokenKeys";

describe("catalogTokenKeys", () => {
  it("should have correct Sets and Arrays defined", () => {
    expect(CATALOG_BLOCK_TOKEN_KEYS.has("block-surface")).toBe(true);
    expect(CATALOG_BLOCK_TOKEN_KEYS.has("block-border")).toBe(false);

    expect(UI_THEME_TOKEN_KEYS).toContain("block-border");
    expect(UI_THEME_TOKEN_KEYS).not.toContain("block-surface");
  });

  describe("stripCatalogTokens", () => {
    it("should remove catalog tokens with or without leading dashes", () => {
      const tokens = {
        "--block-surface": "var(--color-white-50)",
        "--block-border": "var(--color-bronze-200)",
        "block-seat": "var(--color-black)",
        "block-text": "var(--color-bronze-900)",
      };

      const stripped = stripCatalogTokens(tokens);

      expect(stripped).toEqual({
        "--block-border": "var(--color-bronze-200)",
        "block-text": "var(--color-bronze-900)",
      });
    });

    it("should keep other random CSS variables", () => {
      const tokens = {
        "--my-custom-variable": "red",
        "--block-surface": "blue",
      };

      expect(stripCatalogTokens(tokens)).toEqual({
        "--my-custom-variable": "red",
      });
    });
  });
});
