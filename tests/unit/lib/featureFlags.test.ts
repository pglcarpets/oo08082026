import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_FLAGS,
  filterAdminNavItemsByFlags,
  getAllFlagNames,
  getAllFlagsGrouped,
  getFeatureFlags,
  isAdminModuleEnabled,
  isFeatureEnabled,
  resetFeatureFlagsToDefaults,
  setFeatureFlags,
} from "@/lib/featureFlags";

describe("featureFlags", () => {
  afterEach(() => {
    resetFeatureFlagsToDefaults();
  });

  it("includes Port 01–03 and admin module flags", () => {
    const names = getAllFlagNames();
    for (const required of [
      "plannerAdvancedSnap",
      "plannerValidationPanel",
      "plannerWallGrips",
      "plannerBoqPanel",
      "plannerHandoff",
      "studioExportSvg",
      "studioExportJson",
      "studioExportPng",
      "studioExportJpg",
      "studioImportFiles",
      "studioPublishCatalog",
      "sketchToPlan",
      "adminPlans",
      "adminCatalog",
      "adminFeatureToggle",
      "adminCrm",
    ]) {
      expect(names).toContain(required);
    }
  });

  it("groups flags including Port 01–03 and Admin modules", () => {
    const groups = getAllFlagsGrouped().map((g) => g.group);
    expect(groups).toEqual(
      expect.arrayContaining([
        "Port 01 · Geometry & trust",
        "Port 02 · Commercial",
        "Port 03 · Studio catalog",
        "Admin modules",
      ]),
    );
  });

  it("filters admin nav when a module flag is off", () => {
    setFeatureFlags({ adminAnalytics: false, adminCrm: false });
    const flags = getFeatureFlags();
    const items = filterAdminNavItemsByFlags(
      [
        { href: "/admin" },
        { href: "/admin/analytics" },
        { href: "/admin/crm" },
        { href: "/admin/plans" },
      ],
      flags,
    );
    expect(items.map((i) => i.href)).toEqual(["/admin", "/admin/plans"]);
    expect(isAdminModuleEnabled("/admin/analytics", flags)).toBe(false);
    expect(isAdminModuleEnabled("/admin/plans", flags)).toBe(true);
  });

  it("setFeatureFlags and isFeatureEnabled update runtime state", () => {
    expect(isFeatureEnabled("plannerAdvancedSnap")).toBe(DEFAULT_FLAGS.plannerAdvancedSnap);
    setFeatureFlags({ plannerAdvancedSnap: false });
    expect(isFeatureEnabled("plannerAdvancedSnap")).toBe(false);
  });
});
