// @vitest-environment node
/**
 * Retired: missing-components.css was a temporary FOCSS dump sheet.
 * Live site components index imports per-feature CSS under focss/site/components/.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../../../../../..");
const missingPath = resolve(
  repoRoot,
  "site/focss/site/components/missing-components.css",
);
const siteIndexPath = resolve(repoRoot, "site/focss/site/components/index.css");

describe("site components CSS package", () => {
  it("does not ship the retired missing-components.css dump", () => {
    expect(existsSync(missingPath)).toBe(false);
  });

  it("imports products and shared component styles from the live index", () => {
    const siteIndexCss = readFileSync(siteIndexPath, "utf8");
    expect(siteIndexCss).toContain('@import "./products/index.css"');
    expect(siteIndexCss).toContain('@import "./shared/index.css"');
    expect(siteIndexCss).toContain('@import "./contact/home-contact-teaser.css"');
    expect(siteIndexCss).not.toContain("missing-components.css");
  });
});
