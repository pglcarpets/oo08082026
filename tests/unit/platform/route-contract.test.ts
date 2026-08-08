// @vitest-environment node
/**
 * Contract: site/platform/route-contract.json is live route/auth product truth.
 * Assert structure used by product (planner guest cookie, protected prefixes, entry).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const monorepoRoot = path.resolve(__dirname, "../../..");
const contractPath = path.join(
  monorepoRoot,
  "site",
  "platform",
  "route-contract.json",
);

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectStringPaths(
  value: unknown,
  trail: string,
  out: Array<{ trail: string; value: string }>,
): void {
  if (typeof value === "string") {
    // Product route/API path-like strings start with /
    if (value.startsWith("/")) {
      out.push({ trail, value });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectStringPaths(item, `${trail}[${i}]`, out));
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("_") && typeof child === "string" && !child.startsWith("/")) {
        continue;
      }
      collectStringPaths(child, trail ? `${trail}.${key}` : key, out);
    }
  }
}

describe("route-contract.json", () => {
  it("exists and is valid JSON", () => {
    expect(fs.existsSync(contractPath), contractPath).toBe(true);
    const raw = fs.readFileSync(contractPath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("has required top-level product keys", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;

    const requiredKeys = [
      "version",
      "status",
      "entry",
      "planner",
      "configurator",
      "protectedPrefixes",
      "publicGuestRoutes",
      "plannerGuestCookie",
      "redirects",
      "api",
    ] as const;

    for (const key of requiredKeys) {
      expect(contract, `missing top-level key: ${key}`).toHaveProperty(key);
    }

    expect(typeof contract.version).toBe("number");
    expect(contract.version).toBeGreaterThanOrEqual(1);
    expect(typeof contract.status).toBe("string");
    expect((contract.status as string).length).toBeGreaterThan(0);
  });

  it("entry, planner, and configurator route maps use non-empty path strings", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;

    expect(isObject(contract.entry)).toBe(true);
    expect(isObject(contract.planner)).toBe(true);
    expect(isObject(contract.configurator)).toBe(true);

    const entry = contract.entry as JsonObject;
    for (const key of ["access", "chooseProduct", "dashboard"] as const) {
      expect(typeof entry[key]).toBe("string");
      expect(entry[key] as string).toMatch(/^\//);
      expect((entry[key] as string).length).toBeGreaterThan(1);
    }

    const planner = contract.planner as JsonObject;
    for (const key of [
      "landing",
      "guest",
      "help",
      "canvas",
      "dashboardRedirect",
    ] as const) {
      expect(typeof planner[key], `planner.${key}`).toBe("string");
      expect(planner[key] as string).toMatch(/^\//);
      expect((planner[key] as string).length).toBeGreaterThan(1);
    }

    // Fabric / open3d are redirects only — not live entry keys
    expect(planner.fabricGuest, "fabricGuest must not be a live planner key").toBeUndefined();
    expect(planner.fabricCanvas, "fabricCanvas must not be a live planner key").toBeUndefined();
    expect(planner.open3dPilot, "open3dPilot must not be a live planner key").toBeUndefined();

    const legacy = planner._legacyRedirects;
    expect(isObject(legacy)).toBe(true);
    expect((legacy as JsonObject)["planner-fabric"]).toBe("/ooplanner");
    expect((legacy as JsonObject)["planner-open3d"]).toBe("/ooplanner");

    const configurator = contract.configurator as JsonObject;
    for (const key of [
      "landing",
      "guest",
      "editor",
      "workspaceCompatibility",
      "dashboardRedirect",
    ] as const) {
      expect(typeof configurator[key], `configurator.${key}`).toBe("string");
      expect(configurator[key] as string).toMatch(/^\//);
      expect((configurator[key] as string).length).toBeGreaterThan(1);
    }
  });

  it("protectedPrefixes and publicGuestRoutes are non-empty string arrays", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;

    expect(Array.isArray(contract.protectedPrefixes)).toBe(true);
    expect((contract.protectedPrefixes as unknown[]).length).toBeGreaterThan(0);
    for (const prefix of contract.protectedPrefixes as unknown[]) {
      expect(typeof prefix).toBe("string");
      expect(prefix as string).toMatch(/^\//);
      expect((prefix as string).length).toBeGreaterThan(1);
    }

    expect(Array.isArray(contract.publicGuestRoutes)).toBe(true);
    expect((contract.publicGuestRoutes as unknown[]).length).toBeGreaterThan(0);
    for (const route of contract.publicGuestRoutes as unknown[]) {
      expect(typeof route).toBe("string");
      expect(route as string).toMatch(/^\//);
      expect((route as string).length).toBeGreaterThan(1);
    }
  });

  it("plannerGuestCookie has name, allowedPaths, and blockedActions", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;
    const cookie = contract.plannerGuestCookie;
    expect(isObject(cookie)).toBe(true);
    const guest = cookie as JsonObject;

    expect(typeof guest.name).toBe("string");
    expect((guest.name as string).length).toBeGreaterThan(0);

    expect(Array.isArray(guest.allowedPaths)).toBe(true);
    expect((guest.allowedPaths as unknown[]).length).toBeGreaterThan(0);
    for (const p of guest.allowedPaths as unknown[]) {
      expect(typeof p).toBe("string");
      expect(p as string).toMatch(/^\//);
      expect((p as string).length).toBeGreaterThan(1);
    }

    expect(Array.isArray(guest.blockedActions)).toBe(true);
    expect((guest.blockedActions as unknown[]).length).toBeGreaterThan(0);
    for (const action of guest.blockedActions as unknown[]) {
      expect(typeof action).toBe("string");
      expect((action as string).length).toBeGreaterThan(0);
    }
  });

  it("redirects and api path fields are non-empty strings", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;

    expect(isObject(contract.redirects)).toBe(true);
    for (const [key, value] of Object.entries(contract.redirects as JsonObject)) {
      expect(typeof value, `redirects.${key}`).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    }

    expect(isObject(contract.api)).toBe(true);
    const api = contract.api as JsonObject;
    expect(isObject(api.planner)).toBe(true);
    expect(isObject(api.theme)).toBe(true);

    const aiAdvisor = (api.planner as JsonObject).aiAdvisor as JsonObject;
    expect(typeof aiAdvisor.path).toBe("string");
    expect(aiAdvisor.path as string).toMatch(/^\/api\//);
    expect(typeof aiAdvisor.method).toBe("string");
    expect((aiAdvisor.method as string).length).toBeGreaterThan(0);

    const themeActive = (api.theme as JsonObject).active as JsonObject;
    expect(typeof themeActive.path).toBe("string");
    expect(themeActive.path as string).toMatch(/^\/api\//);
    expect(typeof themeActive.method).toBe("string");
    expect((themeActive.method as string).length).toBeGreaterThan(0);
  });

  it("no path-like string field is empty", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as unknown;
    const paths: Array<{ trail: string; value: string }> = [];
    collectStringPaths(contract, "", paths);
    expect(paths.length).toBeGreaterThan(0);
    for (const { trail, value } of paths) {
      expect(value.length, `empty path at ${trail}`).toBeGreaterThan(0);
      expect(value, `blank path at ${trail}`).not.toMatch(/^\s*$/);
    }
  });

  it("planner legacy redirects target unified /planner paths", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;
    const planner = contract.planner as JsonObject;
    const legacy = planner._legacyRedirects as JsonObject;
    expect(legacy["oando-planner"]).toBe("/planner");
    expect(legacy["buddy-planner"]).toBeUndefined();
    expect(legacy["planner-fabric"]).toBe("/ooplanner");
    expect(legacy["planner-open3d"]).toBe("/ooplanner");
    // Admin CRM/ops are protected destinations, not public marketing nav
    expect(legacy.crm).toBe("/admin/crm");
    expect(legacy.ops).toBe("/admin/customer-queries");
  });

  it("protectedPrefixes includes admin and excludes public marketing roots", () => {
    const contract = JSON.parse(
      fs.readFileSync(contractPath, "utf8"),
    ) as JsonObject;
    const prefixes = contract.protectedPrefixes as string[];
    expect(prefixes).toContain("/admin");
    expect(prefixes).toContain("/dashboard");
    expect(prefixes).toContain("/portal");
    expect(prefixes).not.toContain("/products");
    expect(prefixes).not.toContain("/solutions");
    expect(prefixes).not.toContain("/");
  });
});
