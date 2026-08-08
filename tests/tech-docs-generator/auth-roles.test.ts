import { describe, expect, it } from "vitest";
import { isAppAdmin, readAppRole } from "../../tech-docs-generator/src/lib/authRoles";

describe("tech-docs authRoles", () => {
  it("reads admin from app_metadata.role", () => {
    expect(readAppRole({ app_metadata: { role: "admin" } })).toBe("admin");
    expect(isAppAdmin({ app_metadata: { role: "admin" } })).toBe(true);
  });

  it("reads admin from app_metadata.roles array", () => {
    expect(isAppAdmin({ app_metadata: { roles: ["admin"] } })).toBe(true);
  });

  it("does not grant admin from user_metadata", () => {
    expect(isAppAdmin({ user_metadata: { role: "admin" } })).toBe(false);
    expect(readAppRole({ user_metadata: { role: "admin" } })).toBe("member");
  });

  it("treats signed-in members as non-admin", () => {
    expect(isAppAdmin({ app_metadata: { role: "member" } })).toBe(false);
  });
});
