import { describe, it, expect, afterEach } from "vitest";
import {
  getMaintenanceMode,
  isMaintenanceReadonly,
  maintenanceModeLabel,
} from "@/lib/platform/maintenanceMode";

describe("maintenanceMode", () => {
  const previous = process.env.SITE_MAINTENANCE_MODE;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.SITE_MAINTENANCE_MODE;
    } else {
      process.env.SITE_MAINTENANCE_MODE = previous;
    }
  });

  it("defaults to off", () => {
    delete process.env.SITE_MAINTENANCE_MODE;
    expect(getMaintenanceMode()).toBe("off");
    expect(isMaintenanceReadonly()).toBe(false);
    expect(maintenanceModeLabel()).toBe("");
  });

  it("treats readonly aliases as readonly", () => {
    for (const value of ["readonly", "true", "1", "on", "yes"]) {
      process.env.SITE_MAINTENANCE_MODE = value;
      expect(getMaintenanceMode()).toBe("readonly");
      expect(isMaintenanceReadonly()).toBe(true);
      expect(maintenanceModeLabel()).toContain("Read-only maintenance");
    }
  });
});
