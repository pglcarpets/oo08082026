import { describe, it, expect } from "vitest";
import { createBlockColorResolver, resolveSvgForRaster } from "@/lib/catalog/resolveBlockColors";

describe("resolveBlockColors", () => {
  describe("createBlockColorResolver", () => {
    it("should handle empty or special tokens", () => {
      const resolver = createBlockColorResolver();
      expect(resolver(undefined)).toBe("none");
      expect(resolver("none")).toBe("none");
      expect(resolver("currentColor")).toBe("currentColor");
    });

    it("should return hex and rgb colors directly", () => {
      const resolver = createBlockColorResolver();
      expect(resolver("var(--color-white-50)")).toBe("var(--color-white-50)");
      expect(resolver("var(--color-white-50)")).toBe("var(--color-white-50)");
      expect(resolver("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(resolver("var(--hero-btn-secondary-shadow)")).toBe("var(--hero-btn-secondary-shadow)");
    });

    it("should resolve default TOKEN_COLORS when no CSS is provided", () => {
      const resolver = createBlockColorResolver();
      expect(resolver("var(--block-surface)")).toBe("var(--color-ecru-300)");
      expect(resolver("var(--block-seat)")).toBe("var(--text-muted)");
      expect(resolver("var(--non-existent, var(--color-black))")).toBe("var(--color-black)");
      expect(resolver("var(--non-existent)")).toBe("var(--text-inverse-subtle)"); // default fallback
    });

    it("should parse CSS variables and resolve from them", () => {
      const css = `
        --custom-color: #ff00ff;
        --block-surface: var(--color-dark-midnight-blue-850);
        --chained: var(--custom-color);
      `;
      const resolver = createBlockColorResolver(css);
      expect(resolver("var(--custom-color)")).toBe("#ff00ff");
      expect(resolver("var(--block-surface)")).toBe("var(--color-dark-midnight-blue-850)");
      expect(resolver("var(--chained)")).toBe("#ff00ff");
    });

    it("should guard against deep variable chains", () => {
      // Chain of depth > 24
      let css = "";
      for (let i = 0; i < 30; i++) {
        css += `--c-${i + 1}: var(--c-${i});\n`;
      }
      css += "--c-0: var(--color-dark-midnight-blue-500);\n";
      const resolver = createBlockColorResolver(css);
      // It should either return the value or not crash
      expect(typeof resolver("var(--c-29)")).toBe("string");
    });
  });

  describe("resolveSvgForRaster", () => {
    it("should replace color-mix function calls with premium-light fallback color", () => {
      const svg = `<svg stroke="color-mix(in srgb, var(--block-seat) 80%, black)"></svg>`;
      const css = `--block-seat: var(--color-dark-midnight-blue-500);`;
      const resolved = resolveSvgForRaster(svg, css);
      expect(resolved).toContain("var(--color-ecru-200)");
    });

    it("should replace CSS variables inside SVG", () => {
      const svg = `<rect fill="var(--block-seat)" stroke="var(--custom-stroke, var(--color-white-500))"></rect>`;
      const css = `
        --block-seat: var(--text-muted);
        --custom-stroke: var(--color-dark-midnight-blue-500);
      `;
      const resolved = resolveSvgForRaster(svg, css);
      expect(resolved).toContain('fill="var(--text-muted)"');
      expect(resolved).toContain('stroke="var(--color-dark-midnight-blue-500)"');
    });

    it("should fallback to default TOKEN_COLORS or general fallback in SVG variables", () => {
      const svg = `<rect fill="var(--block-surface)" stroke="var(--non-existent)"></rect>`;
      const resolved = resolveSvgForRaster(svg, "");
      expect(resolved).toContain('fill="var(--color-ecru-300)"');
      expect(resolved).toContain('stroke="var(--text-inverse-subtle)"');
    });
  });
});
