import { describe, it, expect } from "vitest";
import { isAppAdmin, readAppRole } from "@/lib/auth/roles";

describe("lib/auth/roles", () => {
  it("reads role from app_metadata.role", () => {
    expect(readAppRole({ app_metadata: { role: "admin" } })).toBe("admin");
  });

  it("reads admin from app_metadata.roles array", () => {
    expect(readAppRole({ app_metadata: { roles: ["admin"] } })).toBe("admin");
    expect(isAppAdmin({ app_metadata: { roles: ["admin"] } })).toBe(true);
  });

  it("ignores user_metadata.role for admin elevation", () => {
    expect(readAppRole({ user_metadata: { role: "admin" } })).toBe("member");
    expect(isAppAdmin({ user_metadata: { role: "admin" } })).toBe(false);
  });

  it("defaults to member when app_metadata is empty or role is blank", () => {
    expect(readAppRole({})).toBe("member");
    expect(readAppRole({ app_metadata: { role: "   " } })).toBe("member");
    expect(isAppAdmin({ app_metadata: { roles: ["editor"] } })).toBe(false);
  });
});
