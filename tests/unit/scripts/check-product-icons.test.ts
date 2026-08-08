import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { findGlyphIconViolations } from "../../../scripts/general/check-product-icons.mjs";

const ROOT = process.cwd();

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, "..", "package.json"), "utf-8"));
}

/**
 * `components.json` is the shadcn generator config. It was removed with the
 * lucide/shadcn drop, so absence satisfies the policy outright — return null
 * rather than throwing ENOENT.
 */
function readComponentsJson(): Record<string, unknown> | null {
  const path = join(ROOT, "..", "components.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

describe("product icon and theme package policy", () => {
  it("does not declare lucide-react or next-themes as dependencies", () => {
    const packageJson = readPackageJson();
    const dependencies = packageJson.dependencies as Record<string, string>;
    expect(dependencies).not.toHaveProperty("lucide-react");
    expect(dependencies).not.toHaveProperty("next-themes");
  });

  it("does not claim lucide as the components.json icon library", () => {
    const componentsJson = readComponentsJson();
    if (componentsJson === null) {
      // No shadcn config at all — nothing can declare lucide.
      expect(componentsJson).toBeNull();
      return;
    }
    expect(componentsJson.iconLibrary).not.toBe("lucide");
  });

  it("has no live site/** import of lucide-react", () => {
    const result = execFileSync(
      "node",
      [join(ROOT, "..", "scripts", "general", "check-product-icons.mjs")],
      { cwd: join(ROOT, ".."), encoding: "utf-8" },
    );
    expect(result).toMatch(/check-product-icons OK/);
  });
});

/**
 * A bare character imports nothing, so the icon-library ban above cannot see it.
 * An aria-labelled control whose whole visible content is one character is using
 * that character as an icon (R28).
 */
describe("text glyphs used as icons", () => {
  it("rejects a symbol glyph inside an aria-labelled control", () => {
    const source = [
      "<ControlButton",
      '  type="button"',
      '  aria-label="Add rectangle"',
      ">",
      "  ▭",
      "</ControlButton>",
    ].join("\n");
    expect(findGlyphIconViolations(source)).toEqual([{ line: 5, text: "▭" }]);
  });

  it("rejects a lone ASCII letter standing in for a text-tool icon", () => {
    const source = ['<ControlButton aria-label="Add text">', "  T", "</ControlButton>"].join("\n");
    expect(findGlyphIconViolations(source)).toEqual([{ line: 2, text: "T" }]);
  });

  it("rejects a glyph written inline on the opening tag line", () => {
    const source = '<ControlButton aria-label="Delete shape">×</ControlButton>';
    expect(findGlyphIconViolations(source)).toEqual([{ line: 1, text: "×" }]);
  });

  it("accepts a Phosphor icon child", () => {
    const source = [
      '<ControlButton aria-label="Add rectangle">',
      '  <Rectangle aria-hidden="true" className="size-4" />',
      "</ControlButton>",
    ].join("\n");
    expect(findGlyphIconViolations(source)).toEqual([]);
  });

  it("accepts short visible label text on a control with no accessible-name override", () => {
    expect(findGlyphIconViolations("<Button>OK</Button>")).toEqual([]);
  });

  it("ignores punctuation that is ordinary code, not JSX content", () => {
    const source = ["function f() {", "  return 1;", "}", ""].join("\n");
    expect(findGlyphIconViolations(source)).toEqual([]);
  });
});
