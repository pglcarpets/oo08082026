// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  SITE_ROOT,
  isMarketingLintExempt,
  isProductDesignZone,
  isSiteDesignZone,
  mixedLayoutOwnership,
} from "../../../scripts/general/lint-ui-contract.mjs";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/general/lint-ui-contract.mjs");

describe("lint-ui-contract (name-mirror)", () => {
  it("runs the UI contract lint and reports scheme freeze status", () => {
    let stdout = "";
    let stderr = "";
    let exitCode = 0;
    try {
      stdout = execFileSync(process.execPath, [scriptPath], {
        cwd: siteRoot,
        encoding: "utf8",
        env: { ...process.env, LINT_UI_STRICT: "0" },
      });
    } catch (error) {
      const err = error as { status?: number; stdout?: string; stderr?: string };
      exitCode = err.status ?? 1;
      stdout = err.stdout ?? "";
      stderr = err.stderr ?? "";
    }

    const combined = `${stdout}\n${stderr}`;
    expect(combined).toMatch(/lint-ui-contract: (ok \(scheme freeze\)|warnings|failed)/);
    // Default non-strict mode must not hard-fail the process.
    expect(exitCode).toBe(0);
  });

  it("encodes the frozen palette and open3d/admin surfaces", () => {
    const source = fs.readFileSync(scriptPath, "utf8");
    expect(source).toContain("app/admin");
    expect(source).toContain("features/admin");
    expect(source).toContain("features/planner");
    expect(source).toContain("features/planner/workspace");
    expect(source).toContain("checkNoLucideInSite");
    expect(source).toContain("lucide-react");
    expect(source).toContain("RAW_PALETTE");
    expect(source).toContain("--strict");
  });

  it("classifies Admin/Product Studio as a Product zone", () => {
    const file = path.join(SITE_ROOT, "app/admin/product-studio/page.tsx");
    expect(isProductDesignZone(file)).toBe(true);
    expect(isSiteDesignZone(file)).toBe(false);
  });

  it("classifies Planner workspace/editor as a Product zone", () => {
    const editorFile = path.join(
      SITE_ROOT,
      "features/planner/editor/PlannerCommands.tsx",
    );
    const uiFile = path.join(SITE_ROOT, "features/planner/ui/PlannerToolbar.tsx");
    expect(isProductDesignZone(editorFile)).toBe(true);
    expect(isSiteDesignZone(editorFile)).toBe(false);
    expect(isProductDesignZone(uiFile)).toBe(true);
    expect(isSiteDesignZone(uiFile)).toBe(false);
  });

  it("classifies Site and Planner marketing as a Site zone, not Product", () => {
    const siteFile = path.join(SITE_ROOT, "app/(site)/page.tsx");
    const plannerMarketingFile = path.join(
      SITE_ROOT,
      "features/planner/landing/PlannerHero.tsx",
    );
    expect(isSiteDesignZone(siteFile)).toBe(true);
    expect(isProductDesignZone(siteFile)).toBe(false);
    expect(isSiteDesignZone(plannerMarketingFile)).toBe(true);
    expect(isProductDesignZone(plannerMarketingFile)).toBe(false);
  });

  it("does not misclassify shared semantic wrappers under components/ui as shadcn-owned zones", () => {
    const file = path.join(SITE_ROOT, "components/ui/MarketingCtaLink.tsx");
    expect(isMarketingLintExempt(file)).toBe(true);
    expect(isProductDesignZone(file)).toBe(false);
    expect(isSiteDesignZone(file)).toBe(false);
  });
});

describe("layout ownership (R30)", () => {
  it("rejects a FOCSS block class and a Tailwind layout utility on one element", () => {
    expect(
      mixedLayoutOwnership("shape-composer__top-toolbar flex flex-row items-center gap-2"),
    ).toBe("flex");
    expect(mixedLayoutOwnership("admin-page product-studio-upload min-h-0 flex-1")).toBe(
      "min-h-0",
    );
  });

  it("allows the shared token layer a shadcn primitive needs", () => {
    expect(mixedLayoutOwnership("shape-composer__hint text-muted-foreground")).toBeNull();
    expect(mixedLayoutOwnership("product-studio-toolbar__button bg-card border-border")).toBeNull();
  });

  it("does not read a FOCSS block name as a utility", () => {
    // `product-studio-flex-frame` contains "flex"; it is not the utility `flex`.
    expect(mixedLayoutOwnership("product-studio-flex-frame")).toBeNull();
    expect(mixedLayoutOwnership("admin-toolbar admin-toolbar--sticky")).toBeNull();
  });

  it("ignores utility-only elements with no FOCSS block class", () => {
    expect(mixedLayoutOwnership("flex items-center gap-2")).toBeNull();
  });
});
