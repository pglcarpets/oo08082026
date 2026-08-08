import { describe, it, expect, beforeEach } from "vitest";
import { verifyThemeRuntime, verifyThemeComputedTokens } from "@/lib/theme/verifyThemeRuntime";

describe("verifyThemeRuntime utilities", () => {
  beforeEach(() => {
    const existing = document.getElementById("dynamic-block-theme");
    if (existing) {
      existing.remove();
    }
  });

  describe("verifyThemeRuntime", () => {
    it("should fail if style tag is missing", () => {
      const result = verifyThemeRuntime();
      expect(result.passed).toBe(false);
      expect(result.styleTagExists).toBe(false);
      expect(result.errors).toContain("Style tag #dynamic-block-theme not found in document.head");
    });

    it("should fail if style tag is empty", () => {
      const style = document.createElement("style");
      style.id = "dynamic-block-theme";
      document.head.appendChild(style);

      const result = verifyThemeRuntime();
      expect(result.passed).toBe(false);
      expect(result.styleTagExists).toBe(true);
      expect(result.tokenCount).toBe(0);
      expect(result.errors).toContain("Style tag exists but contains no CSS variables");
    });

    it("should fail if style tag lacks required tokens", () => {
      const style = document.createElement("style");
      style.id = "dynamic-block-theme";
      style.textContent = `
        :root {
          --block-custom-token: #ff0;
        }
      `;
      document.head.appendChild(style);

      const result = verifyThemeRuntime();
      expect(result.passed).toBe(false);
      expect(result.tokenCount).toBe(1);
      expect(result.errors).toContain("Missing required token: --block-text");
    });

    it("should pass if all required tokens are present", () => {
      const style = document.createElement("style");
      style.id = "dynamic-block-theme";
      style.textContent = `
        :root {
          --block-text: var(--color-dark-midnight-blue-850);
          --block-accent: var(--color-bronze-400);
          --block-border: var(--color-ecru-200);
          --block-surface-alt: var(--color-ecru-50);
        }
      `;
      document.head.appendChild(style);

      const result = verifyThemeRuntime();
      expect(result.passed).toBe(true);
      expect(result.styleTagExists).toBe(true);
      expect(result.tokenCount).toBe(4);
      expect(result.tokens["block-text"]).toBe("var(--color-dark-midnight-blue-850)");
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("verifyThemeComputedTokens", () => {
    it("should retrieve computed values for required tokens", () => {
      const div = document.createElement("div");
      div.style.setProperty("--block-text", "var(--color-ecru-950)");
      div.style.setProperty("--block-accent", "gold");
      document.body.appendChild(div);

      const computed = verifyThemeComputedTokens(div);
      expect(computed["block-text"]).toBe("var(--color-ecru-950)");
      expect(computed["block-accent"]).toBe("gold");
      expect(computed["block-border"]).toBeUndefined(); // not set

      div.remove();
    });
  });
});
