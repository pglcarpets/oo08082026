import { describe, it, expect, beforeEach } from "vitest";
import { getDemoUserId, setDemoUserId } from "@/features/crm/stores/crmDemoSeed";

describe("crmDemoSeed demo user management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getDemoUserId returns null when no user has been set", () => {
    expect(getDemoUserId()).toBeNull();
  });

  it("setDemoUserId stores the value and getDemoUserId retrieves it", () => {
    setDemoUserId("2");
    expect(getDemoUserId()).toBe("2");

    setDemoUserId("1");
    expect(getDemoUserId()).toBe("1");
  });

  it("setDemoUserId overwrites previous value", () => {
    setDemoUserId("2");
    setDemoUserId("1");
    expect(getDemoUserId()).toBe("1");
  });
});
